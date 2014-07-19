var GROUND = 300;
var sign = function(x) {
  // don't you like ternary operators?
  return x > 0 ? 1 : (x < 0 ? -1 : 0);
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

var AIR_FRICTION = 1;
var FRICTION = 1;
var ACCELERATION = 3;
var SPEED = 5;
var GRAVITY = 0.25;
var JUMP_SPEED = 6;
var MAX_FALL_SPEED = 6;

var Guy = Skrit.entity({
  image: "/pic.png",
  born: function() {
    this.xspeed = 0;
    this.yspeed = 0;
    this.hasDoubleJump = true;
  },
  render: function(drawer) {
    drawer.rect(0, 0, 30, 30);
    drawer.rect(this.x, this.y, this.width, this.height);
  },
  update: function(context) {
    var onGround = this.collide("block", this.x, this.y + 1);
    this.hasDoubleJump = this.hasDoubleJump || onGround;
    if (context.keys.pressed.up) {
      if (onGround) {
        this.yspeed = -JUMP_SPEED;
        this.hasDoubleJump = true;
      } else if (this.hasDoubleJump) {
        this.yspeed = -JUMP_SPEED;
        this.hasDoubleJump = false;
      }
    }

    if (context.keys.down && this.yspeed > -1) {
      this.yspeed = MAX_FALL_SPEED;
    }

    if (context.keys.left && !context.keys.right) {
      if (onGround) {
        this.sprite.flipped = true;
      }
      this.xspeed = approach(this.xspeed, -SPEED, ACCELERATION);
    } else if (context.keys.right && !context.keys.left) {
      if (onGround) {
        this.sprite.flipped = false;
      }
      this.xspeed = approach(this.xspeed, SPEED, ACCELERATION);
    } else {
      if (onGround) {
        this.xspeed = approach(this.xspeed, 0, FRICTION);
      } else {
        this.xspeed = approach(this.xspeed, 0, AIR_FRICTION);
      }
    }
    if (!this.collide("block", this.x + this.xspeed, this.y)) {
      this.x += this.xspeed;
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
      this.yspeed = 0;
    }
    if (!this.collide("block", this.x, this.y + 1)) {
      this.yspeed += GRAVITY;
    }
    if (!context.keys.up) {
      if (this.yspeed < 0) {
        this.yspeed += GRAVITY;
      }
      this.yspeed += GRAVITY;
    }
    if (this.y >= GROUND - this.height) {
      this.y = GROUND - this.height;
      this.yspeed = 0;
    }
    if (this.yspeed > MAX_FALL_SPEED) {
      this.yspeed = MAX_FALL_SPEED;
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

world.add(new Guy());

for (var i = 0; i < 20; i++) {
  world.add(new Block({x: i * 20, y: 200}));
}

var game = new Game();

game.start();
