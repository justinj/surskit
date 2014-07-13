var Guy = Skrit.entity({
  image: "/pic.png",
  born: function() {
    this.xspeed = 0;
    this.yspeed = 0;
  },
  update: function(context) {
    if (context.keys.up) {
      this.yspeed = -5;
    }

    if (context.keys.left && !context.keys.right) {
      this.xspeed = -2;
    } else if (context.keys.right && !context.keys.left) {
      this.xspeed = 2;
    } else {
      this.xspeed = 0;
    }
    this.x += this.xspeed;
    this.y += this.yspeed;
    this.yspeed += 0.5;
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
