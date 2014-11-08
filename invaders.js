var Ship = Skrit.entity({
  sprite: {
    image: "sprites/ship.png"
  },
  update: function() {
    this.x += 10;
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
