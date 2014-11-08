var SPEED = 500;
var Ship = Skrit.entity({
  sprite: {
    image: "sprites/ship.png"
  },
  born: function() {
    this.xspeed = 0;
    this.y = this.world.game.height - 1600;
  },
  update: function(context) {
    if (context.keys.left) {
      this.x -= SPEED;
    } else if (context.keys.right) {
      this.x += SPEED;
    }
    if (context.keys.pressed.space) {
      this.world.add(new Bullet({x: this.x, y: this.y}));
    }
  }
});

var Bullet = Skrit.entity({
  born: function(args) {
    this.x = args.x;
    this.y = args.y;
  },
  update: function(context) {
    this.y -= 100;
  },
  render: function(ctx) {
    ctx.fillStyle = "#000";
    ctx.fillRect(this.x,this.y,1000,1000);
  }
});

var World = Skrit.world({
});

var world = new World();

var Game = Skrit.game({
  scale: 2,
  container: document.getElementById("game")
});

var game = new Game({
  world: world
});

world.add(new Ship());

game.start();
