var GRID_SIZE = 2000;

var DASH_BOOST = 400;
var ACCEL = 50;
var AIR_ACCEL = 25;
var DECCEL = 50;

var clamp = function(val, low, high) {
  if (val < low) return low;
  if (val > high) return high;
  return val;
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

var PIXEL = 100;
var pixelize = function(x) {
  return PIXEL * Math.floor(x / PIXEL);
};

var sign = function(x) {
  if (x > 0) return 1;
  if (x < 0) return -1;
  return 0;
}

var BOARD_WIDTH = 6;
var BOARD_HEIGHT = 14;

var Cursor = Skrit.entity({
  sprite: {
    image: "sprites/cursor.png",
    rows: 2,
    columns: 1,
    animations: {
      normal: {
        frames: [0, 1],
        delay: 0.3
      },
      squeeze: {
        frames: [1]
      }
    }
  },
  born: function() {
    this.playAnimation("normal");
    this.width = GRID_SIZE * 2;
    this.height = GRID_SIZE;

    this.gx = 0;
    this.gy = 0;
    
    this.leftKey = "left";
    this.rightKey = "right";
    this.upKey = "up";
    this.downKey = "down";
    this.flipKey = "space";
    this.boardLeft = this.world.game.width / 2 - GRID_SIZE * (BOARD_WIDTH / 2);
    this.boardTop = 0;
  },

  normalizePosition: function() {
    // restrict these...
    this.gx = clamp(this.gx, 0, BOARD_WIDTH - 2);
    this.gy = clamp(this.gy, 0, BOARD_HEIGHT);
    this.x = this.boardLeft + this.gx * GRID_SIZE;
    this.y = this.boardTop + this.gy * GRID_SIZE;
  },

  update: function(context) { 
    if (context.keys.pressed[this.leftKey]) {
      this.gx -= 1;
    }
    if (context.keys.pressed[this.rightKey]) {
      this.gx += 1;
    }
    if (context.keys.pressed[this.upKey]) {
      this.gy -= 1;
    }
    if (context.keys.pressed[this.downKey]) {
      this.gy += 1;
    }

    this.playAnimation("normal");
    if (context.keys[this.flipKey]) {
      this.playAnimation("squeeze");
    }

    this.normalizePosition();
  }
});

var World = Skrit.world({
});

var world = new World();

var Game = Skrit.game({
  scale: 2,
  width: 320,
  height: 320,
  container: document.getElementById("game")
});

var game = new Game({
  world: world
});

world.add(new Cursor());

game.start();
