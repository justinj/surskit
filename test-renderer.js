var GROUND = 300;
var sign = function(x) {
  // don't you like ternary operators?
  return x > 0 ? 1 : (x < 0 ? -1 : 0);
}
var approach = function(val, target, speed) {
  // errr I am very tired, there must be a cleaner way of writing this...
  var direction = sign(target - speed);
  var newVal = val + speed * direction;
  if (direction === 1 && newVal > target ||
      direction === -1 && newVal < target) {
    newVal = target;
  }
  return newVal;
}

var AIR_FRICTION = 0.1;
var FRICTION = 2;
var ACCELERATION = 3;
var SPEED = 4;
var GRAVITY = 1;
var JUMP_SPEED = 10;

var Guy = Skrit.entity({
  image: "/pic.png",
  born: function() {
    this.xspeed = 0;
    this.yspeed = 0;
  },
  update: function(context) {
    var onGround = this.y >= GROUND - this.height;
    if (context.keys.up && onGround) {
      this.yspeed = -JUMP_SPEED;
    }

    if (context.keys.left && !context.keys.right) {
      this.xspeed = approach(this.xspeed, -SPEED, ACCELERATION);
    } else if (context.keys.right && !context.keys.left) {
      this.xspeed = approach(this.xspeed, SPEED, ACCELERATION);
    } else {
      if (onGround) {
        this.xspeed = approach(this.xspeed, 0, FRICTION);
      } else {
        this.xspeed = approach(this.xspeed, 0, AIR_FRICTION);
      }
    }
    this.x += this.xspeed;
    this.y += this.yspeed;
    this.yspeed += GRAVITY;
    if (this.y >= GROUND - this.height) {
      this.y = GROUND - this.height;
      this.yspeed = 0;
    }
  }
});

var World = Skrit.world({
});

var world = new World();

var Game = Skrit.game({
  world: world,
  container: document.getElementById("game")
});

world.add(new Guy());

var game = new Game();

game.start();
