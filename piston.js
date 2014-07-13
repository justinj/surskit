var GRID_SIZE = 40;

var Piston = Skrit.entity({
  born: function(args) {
    this.x = args.x || 0;
    this.y = args.y || 0;

    this.width = GRID_SIZE;
    this.height = GRID_SIZE;
  },
  render: function(context) {
    context.rect(this.x, this.y, this.width, this.height);

    if (this.activated) {
      context.rect(this.x + this.width, this.y, 12, this.height);
    } else {
      context.rect(this.x + this.width, this.y + this.height/2 - 12, this.width - 12, 24);
      context.rect(this.x + this.width * 2 - 12, this.y, 12, this.height);
    }
    context.closePath();
  },
  update: function(context) {
    if (context.mouse.clicked) {
      if (context.mouse.x > this.x && context.mouse.x < this.x + this.width) {
        if (context.mouse.y > this.y && context.mouse.y < this.y + this.height) {
          this.activated = !this.activated;
        }
      }
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

var game = new Game();

game.start()

world.add(new Piston({
  x: 20,
  y: 20
}));
