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
var DASH_ACCELERATION_A = 150;
var DASH_ACCELERATION_B = 5;
var DASH_TERMINAL_VELOCITY = 250;

var SPEED = 3;
var GRAVITY = 0.5;
var JUMP_SPEED = 7;
var MAX_FALL_SPEED = 15;

var FACTOR = 100;

var JUMP_KEY = "z";

var Guy = Skrit.entity({
  sprite: {
    image: "wario.png",
    rows: 2,
    columns: 4,
    animations: {
      run: {
        frames: [0, 1, 2, 3],
        delay: 0.1
      },
      stand: {
        frames: [2]
      },
      jump: {
        frames: [4]
      }
    }
  },
  born: function() {
    this.xspeed = 0;
    this.yspeed = 0;
    this.hasJump = true;
    this.width = 30;
    this.height = 30;
    this.hitboxOffsetLeft = 0;
    this.hitboxOffsetTop = 2;
    this.facingLeft = false;
    this.running = false;

    this.playAnimation("stand");
  },
  render: function(drawer) {
    // drawer.rect(this.x + this.hitboxOffsetLeft, this.y + this.hitboxOffsetTop, this.width, this.height);
  },

  update: function(context) {
    var onGround = this.collide("block", this.x, this.y + 1);
    this.hasJump = this.hasJump || onGround;
    if (context.keys.pressed[JUMP_KEY]) {
      if (this.hasJump) {
        this.yspeed = -JUMP_SPEED;
        this.hasJump = false;
      }
    }

    if (!context.keys[JUMP_KEY]) {
      if (this.yspeed < 0) {
        this.yspeed = 0;
      }
    }

    this.sprite.flipped = this.facingLeft;
    if (context.keys.left && !context.keys.right) {

      if (this.xspeed > DASH_INITIAL_VELOCITY) {
        this.xspeed = -DASH_TERMINAL_VELOCITY - DASH_ACCELERATION_A;
      } else if (this.xspeed > -DASH_INITIAL_VELOCITY) {
        this.xspeed = -DASH_INITIAL_VELOCITY;
      } else {
        if (this.xspeed < -DASH_TERMINAL_VELOCITY) {
          this.spawnDust();
          this.xspeed += DASH_ACCELERATION_B;
        } else if (this.xspeed > -DASH_TERMINAL_VELOCITY) {
          this.xspeed -= DASH_ACCELERATION_A;
        }
      }

      this.facingLeft = true;
    } else if (context.keys.right && !context.keys.left) {

      if (this.xspeed < -DASH_INITIAL_VELOCITY) {
        this.xspeed = DASH_TERMINAL_VELOCITY + DASH_ACCELERATION_A;
      } else if (this.xspeed < DASH_INITIAL_VELOCITY) {
        this.xspeed = DASH_INITIAL_VELOCITY;
      } else {
        if (this.xspeed > DASH_TERMINAL_VELOCITY) {
          this.spawnDust();
          this.xspeed -= DASH_ACCELERATION_B;
        } else if (this.xspeed < DASH_TERMINAL_VELOCITY) {
          this.xspeed += DASH_ACCELERATION_A;
        }
      }

      this.facingLeft = false;
    } else {
      this.xspeed = 0;
    }

    if (!this.collide("block", this.x + this.xspeed / FACTOR, this.y)) {
      this.x += this.xspeed / FACTOR;
    } else {
      while (!this.collide("block", this.x + sign(this.xspeed), this.y)) {
        this.x += sign(this.xspeed);
      }
      this.xspeed = 0;
    }
    if (!this.collide("block", this.x, this.y + this.yspeed)) {
      this.y += this.yspeed;
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

    if (!this.collide("block", this.x, this.y + 1)) {
      this.playAnimation("jump");
    } else if (this.xspeed == 0) {
      this.playAnimation("stand");
    } else {
      this.playAnimation("run");
    }
  },
  spawnDust: function() {
    if (this.collide("block", this.x, this.y + 1)) {
      this.world.add(new Dust({
        x: this.x + Math.random() * this.width,
        y: this.y + this.height,
        speed: -this.xspeed
      }));
    }
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

world.add(new Guy());

for (var i = 0; i < 20; i++) {
  world.add(new Block({x: i * 20, y: 200}));
}

world.add(new Block({x: 0, y: 150}));

var game = new Game();

game.start();
