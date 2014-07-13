var game = Skrit.createGame({
  container: document.body,
  backgroundColor: 0xFFFFFF,
  width: 400,
  height: 300
});

var MyWorld = Skrit.createWorld({
});

var world = new MyWorld();
game.setActiveWorld(world);

var Guy = Skrit.createEntity({
  update: function() {
    if (this.game.keys[this.game.Input.UP]) {
      this.y -= 2;
    }
    if (this.game.keys[this.game.Input.DOWN]) {
      this.y += 2;
    }
    if (this.game.keys[this.game.Input.RIGHT]) {
      console.log('fuk');
      this.x += 2;
    }
  },
  born: function() {
    var self = this;
    onkeydown = function() {
      // console.log("down");
      self.x -= 2;
    };
  },
  image: "pic.png"
});

var guy = new Guy();
world.add(guy);
