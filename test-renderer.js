var GROUND = 300;
var sign = function(x) {
  // don't you like ternary operators?
  return x > 0 ? 1 : (x < 0 ? -1 : 0);
}
var exponentialApproach = function(val, target, factor) {
  return (factor*val + target) / (1 + factor);
}
var approach = function(val, target, speed) {
  // errr I am very tired, there must be a cleaner way of writing this...
  var direction = sign(target - val);
  var newVal = val + speed * direction;
  if (direction === 1 && newVal > target ||
      direction === -1 && newVal < target) {
    newVal = target;
  }
  return newVal;
}

// https://docs.google.com/spreadsheet/ccc?key=0ApT3mKrcXjEhdHpDWTB3UllaeFFDVDdISGViaGg5Qmc&authkey=CN7nm-UD&hl=en&authkey=CN7nm-UD#gid=0
var DASH_INITIAL_VELOCITY = 200;
var DASH_ACCELERATION_A = 200;
var DASH_ACCELERATION_B = 10;
var DASH_ACCELERATION_C = 50;
var DASH_TERMINAL_VELOCITY = 300;

var DIVE_SPEED = 600;

var SPEED = 3;
var GRAVITY = 50;
var JUMP_SPEED = 700;
var MAX_FALL_SPEED = 1500;
var DASH_SPEED = 1000;
var DIVE_VERTICAL_ACCEL = 50;

var FACTOR = 100;

var JUMP_KEY = "z";
var DIVE_KEY = "x";

var NORMAL = "normal";
var DIVING = "diving";
var BOUNCING = "bouncing";
var SLIDING = "sliding";
var ATTACKING = "attacking";
var DASHING = "dashing";
var LANDING = "landing";

var Guy = Skrit.entity({
  sprite: {
    image: "wario.png",
    rows: 2,
    columns: 4,
    animations: {
      run: {
        frames: [0, 1, 2, 3],
        delay: 0.05
      },
      stand: {
        frames: [2]
      },
      jump: {
        frames: [4]
      },
      dive: {
        frames: [5]
      },
      slide: {
        frames: [6]
      },
      attack: {
        frames: [6, 5],
        delay: 0.15
      }
    }
  },
  born: function() {
    this.x = 50;
    this.y = 50;
    this.xspeed = 0;
    this.yspeed = 0;
    this.hasJump = true;
    this.width = 30;
    this.height = 30;
    this.hitboxOffsetLeft = 0;
    this.hitboxOffsetTop = 2;
    this.facingLeft = false;
    this.running = false;
    this.mode = "normal";

    this.dashdir = {x: 0, y: 0};

    this.playAnimation("stand");
  },
  render: function(drawer) {
    // drawer.rect(this.x + this.hitboxOffsetLeft, this.y + this.hitboxOffsetTop, this.width, this.height);
  },

  direction: function() {
    return this.facingLeft ? -1 : 1;
  },

  update: function(context) {

    this.world.camera.x = Math.max(0, this.x - this.world.game.width / this.world.game.scale / 2);

    var onGround = this.collide("block", this.x, this.y + 1);
    if (context.keys.pressed[DIVE_KEY] && !this.collide("block", this.x, this.y + 1)) {
      if (this.mode === NORMAL) {
        this.mode = DASHING;
        this.dashdir = {x: this.direction(), y: 0};

        if (context.keys["up"]) {
          this.dashdir.y = -Math.SQRT1_2;
          this.dashdir.x *= Math.SQRT1_2;
        }
        if (context.keys["down"]) {
          this.dashdir.y = Math.SQRT1_2;
          this.dashdir.x *= Math.SQRT1_2;
        }

        var self = this;
        this.addAlarm(0.15, function() {
          if (self.mode === DASHING) {
            self.mode = NORMAL;
            self.xspeed /= 2;
          }
        });
      }
    }

    if (this.mode === DASHING) {
      this.xspeed = this.dashdir.x * DASH_SPEED;
      this.spawnDust();
      this.yspeed = DASH_SPEED * this.dashdir.y;
    }

    if (this.mode === LANDING) {
      if (!this.collide("block", this.x, this.y + 1)) {
        this.mode = NORMAL;
      }
      this.xspeed = Math.floor(0.9 * this.xspeed);
      // no-op?
    } else if (this.mode === SLIDING) {
      this.xspeed *= 0.9;
      if (Math.abs(this.xspeed) < 1) {
        this.mode = NORMAL;
      }
      if (!this.collide("block", this.x, this.y+1)) {
        this.mode = NORMAL;
      }
    } else {
      this.hasJump = this.hasJump || onGround;
      if (context.keys.pressed[JUMP_KEY]) {
        if (this.hasJump) {
          this.yspeed = -JUMP_SPEED;
          this.hasJump = false;
        }
      }

      this.sprite.flipped = this.facingLeft;
      if (context.keys.left && !context.keys.right) {

        if (this.xspeed > -DASH_INITIAL_VELOCITY) {
          this.xspeed -= DASH_ACCELERATION_C;
        } else {
          if (this.xspeed < -DASH_TERMINAL_VELOCITY) {
            this.spawnDust();
            this.xspeed += DASH_ACCELERATION_B;
            if (this.xspeed > -DASH_TERMINAL_VELOCITY) {
              this.sepeed = -DASH_TERMINAL_VELOCITY;
            }
          } else if (this.xspeed > -DASH_TERMINAL_VELOCITY) {
            this.xspeed -= DASH_ACCELERATION_A;
          }
        }

        this.facingLeft = true;
      } else if (context.keys.right && !context.keys.left) {

        if (this.xspeed < DASH_INITIAL_VELOCITY) {
          this.xspeed += DASH_ACCELERATION_C;
        } else {
          if (this.xspeed > DASH_TERMINAL_VELOCITY) {
            this.spawnDust();
            this.xspeed -= DASH_ACCELERATION_B;
            if (this.xspeed < DASH_TERMINAL_VELOCITY) {
              this.sepeed = DASH_TERMINAL_VELOCITY;
            }
          } else if (this.xspeed < DASH_TERMINAL_VELOCITY) {
            this.xspeed += DASH_ACCELERATION_A;
          }
        }

        this.facingLeft = false;
      } else {
        this.xspeed = approach(this.xspeed, 0, DASH_ACCELERATION_B);
      }
    }


    if (!this.collide("block", this.x + this.xspeed / FACTOR, this.y)) {
      this.x += this.xspeed / FACTOR;
    } else {
      while (!this.collide("block", this.x + sign(this.xspeed), this.y)) {
        this.x += sign(this.xspeed);
      }
      this.xspeed = 0;
    }
    if (!this.collide("block", this.x, this.y + this.yspeed / FACTOR)) {
      this.y += this.yspeed / FACTOR;
    } else if (this.yspeed !== 0) {
      while (!this.collide("block", this.x, this.y + sign(this.yspeed))) {
        this.y += sign(this.yspeed);
      }
      this.y = Math.ceil(this.y);
      this.yspeed = 0;
    }
    if (!this.collide("block", this.x, this.y + 1)) {
      this.yspeed += GRAVITY;
    }
    if (this.y >= GROUND - this.height) {
      this.y = GROUND - this.height;
      this.yspeed = 0;
    }

    if (this.yspeed > MAX_FALL_SPEED) {
      this.yspeed = MAX_FALL_SPEED;
    }

    if (this.collide("block", this.x, this.y+1) && this.mode === DIVING) {
      this.mode = SLIDING;
      this.yspeed = 0;
    }


    if (this.mode === ATTACKING) {
      this.playAnimation("attack");
    } else if (this.mode === DIVING) {
      this.playAnimation("dive");
    } else if (!this.collide("block", this.x, this.y + 1)) {
      this.playAnimation("jump");
    } else if (this.xspeed === 0) {
      this.playAnimation("stand");
    } else {
      this.playAnimation("run");
    }
  },
  spawnDust: function() {
    this.world.add(new Dust({
      x: this.x + Math.random() * this.width,
      y: this.y + this.height,
      speed: -this.xspeed
    }));
  }
});

var Block = Skrit.entity({
  born: function(args) {
    this.x = args.x;
    this.y = args.y;
    this.width = 20;
    this.height = 20;
    this.setCollisionType("block");
  },

  render: function(drawer) {
    drawer.rect(this.x, this.y, this.width, this.height);
  }
});

var World = Skrit.world({
});

var world = new World();

var Game = Skrit.game({
  scale: 2,
  world: world,
  container: document.getElementById("game")
});

var DUST_SIZE = 5;
var Dust = Skrit.entity({
  born: function(args) {
    this.x = args.x;
    this.y = args.y;
    this.speed = args.speed;
    this.alpha = 1;
  },
  update: function() {
    this.y -= 1;
    this.x += this.speed / FACTOR / 10;
    this.alpha -= 0.05;
    if (this.alpha <= 0) {
      this.world.remove(this);
    }
  },
  render: function(drawer) {
    drawer.globalAlpha = this.alpha;
    drawer.fillStyle = "#EEE";
    drawer.fillRect(this.x + ((1-this.alpha)*DUST_SIZE / 2),
                    this.y + ((1-this.alpha)*DUST_SIZE / 2),
                    this.alpha * DUST_SIZE,
                    this.alpha * DUST_SIZE);
    drawer.globalAlpha = 1;
  }
});

var level =
  "x                                  x\n" +
  "x                                  x\n" +
  "x                                  x\n" +
  "x                                  x\n" +
  "x                                  x\n" +
  "xxxxxxxxxxx                        x\n" +
  "x      xxxxx                       x\n" +
  "x                                  x\n" +
  "x                                  x\n" +
  "x                  x               x\n" +
  "x     xxxxxxxx     x        x      x\n" +
  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n";


var GRID_SIZE = 20;

var xx = 0;
var yy = 0;
for (var i = 0; i < level.length; i++) {
  if (level[i] === "x") {
    world.add(new Block({x: xx, y: yy}));
  } else if (level[i] === "\n") {
    yy += GRID_SIZE;
    xx = -GRID_SIZE;
  }
  xx += GRID_SIZE;
}

world.add(new Guy());

var game = new Game();

game.start();
