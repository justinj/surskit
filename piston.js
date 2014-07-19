var GRID_SIZE = 40;
var HEAD_SIZE = 10;

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

var angles = {
  "right": 0,
  "down": Math.PI / 2,
  "left": Math.PI,
  "up": Math.PI * 3/2
}

var directions = {
  "right": {x: 1, y: 0},
  "left": {x: -1, y: 0},
  "up": {x: 0, y: -1},
  "down": {x: 0, y: 1}
}

var Piston = Skrit.entity({
  born: function(args) {
    this.x = (args.x || 0) * GRID_SIZE;
    this.y = (args.y || 0) * GRID_SIZE;

    this.width = GRID_SIZE;
    this.height = GRID_SIZE;

    this.callback = args.callback;

    this.direction = args.direction;
    this.angle = angles[args.direction];
    this.activated = false;
    this.extendedAmount = 0;

    this.blocks = [];
  },
  render: function(context) {

    var tweenedExtended = Math.pow(this.extendedAmount, 2);

    context.save();
    var size = GRID_SIZE - 2;
    context.translate(this.x + this.width / 2 + 1, this.y + this.height / 2 + 1);
    context.rotate(this.angle);
    context.translate(-this.width / 2, -this.height / 2);
    // body
    context.rect(0, 0, size - HEAD_SIZE, size);
    // neck
    context.rect(size - HEAD_SIZE, size/2 - 12, size * tweenedExtended, 24);
    // head
    context.rect(size - HEAD_SIZE + size * tweenedExtended, 0, 12, size);

    context.closePath();

    context.restore();
  },
  startPushing: function(block) {
    this.blocks.push(block);
  },
  update: function(context) {
    var block;
    var self = this;
    if (context.mouse.clicked) {
      if (context.mouse.x > this.x && context.mouse.x < this.x + this.width) {
        if (context.mouse.y > this.y && context.mouse.y < this.y + this.height) {
          this.callback(this, this.x / GRID_SIZE, this.y / GRID_SIZE, this.direction);
        }
      }
    }

    this.extendedAmount = approach(this.extendedAmount, this.activated ? 1 : 0, 0.15);
    var animProgress = this.activated ? 1 - this.extendedAmount : this.extendedAmount;
    this.blocks.forEach(function(b) {
      b.updateProgress(animProgress);
    });
    if (this.extendedAmount === 0 || this.extendedAmount === 1) {
      this.blocks.forEach(function(b) {
        b.finishAnimating();
      });
      this.blocks = [];
    }
  },
  swap: function() {
    this.activated = !this.activated;
  }
});

var Block = Skrit.entity({
  born: function(args) {
    this.x = args.x * GRID_SIZE;
    this.y = args.y * GRID_SIZE;

    this.startX = this.x;
    this.startY = this.y;
    this.colour = args.colour;
    this.animationProgress = 0;
  },
  render: function(context) {
    context.save();
    var x = this.startX * this.animationProgress + this.x * (1 - this.animationProgress);
    var y = this.startY * this.animationProgress + this.y * (1 - this.animationProgress);
    context.translate(x + 1, y + 1);
    context.fillStyle = this.colour;
    context.fillRect(0, 0, GRID_SIZE, GRID_SIZE);
    context.restore();
},
  push: function(x, y) {
    this.x += x * GRID_SIZE;
    this.y += y * GRID_SIZE;
  },
  updateProgress: function(progress) {
    this.animationProgress = progress;
  },
  finishAnimating: function() {
    this.startX = this.x;
    this.startY = this.y;
    this.animationProgress = 0;
  },
  getPos: function() {
    return {
      x: this.x / GRID_SIZE,
      y: this.y / GRID_SIZE
    };
  }
});

var colours = {
  "blu": "blue",
  "red": "red",
  "yel": "yellow",
  "gre": "green"
};

var GameController = Skrit.entity({
  born: function(context) {
    var self = this;

    this.blocks = {};
    [[1,1,"blu"],[2,1,"blu"],[3,1,"red"],[4,1,"red"],
     [1,2,"blu"],                        [4,2,"red"],
     [1,3,"gre"],                        [4,3,"yel"],
     [1,4,"gre"],[2,4,"gre"],[3,4,"yel"],[4,4,"yel"]].forEach(function(block) {
      self.addBlock(block[0],block[1],block[2]);
     });

    var pistons = [
      { x: 1, y: 0, direction: "down" },
      { x: 2, y: 0, direction: "down" },
      { x: 3, y: 0, direction: "down" },
      { x: 4, y: 0, direction: "down" },
      { x: 0, y: 1, direction: "right" },
      { x: 0, y: 2, direction: "right" },
      { x: 0, y: 3, direction: "right" },
      { x: 0, y: 4, direction: "right" },
      { x: 5, y: 1, direction: "left" },
      { x: 5, y: 2, direction: "left" },
      { x: 5, y: 3, direction: "left" },
      { x: 5, y: 4, direction: "left" },
      { x: 1, y: 5, direction: "up" },
      { x: 2, y: 5, direction: "up" },
      { x: 3, y: 5, direction: "up" },
      { x: 4, y: 5, direction: "up" }
    ];

    this.pistons = {};

    pistons.forEach(function(p) {
      p.callback = self.handlePistonClick.bind(self);
      var piston = new Piston(p);
      self.world.add(piston);
      self.pistons[p.x + "," + p.y] = piston;
    });

    this.blocked = {};
  },
  handlePistonClick: function(piston, x, y, direction) {
    var offsets = directions[direction];
    var location = {};
    if (piston.activated) {
      location.x = x + offsets.x * 2;
      location.y = y + offsets.y * 2;
      this.blocked[(x + offsets.x) + "," + (y + offsets.y)] = false;
      offsets = {
        x: offsets.x * -1,
        y: offsets.y * -1
      };
    } else {
      location.x = x + offsets.x;
      location.y = y + offsets.y;
      if (this.isBlocked(location.x, location.y)) {
        return false;
      }
    }
    var affectedBlock = this.blockAt(location.x, location.y);
    var successful = true;
    if (affectedBlock) {
      successful = this.pushBlock(affectedBlock, offsets.x, offsets.y, piston);
    }
    if (successful) {
      piston.swap();
      if (piston.activated) {
        this.blocked[location.x + "," + location.y] = true;
      }
    }
  },
  blockAt: function(x, y) {
    return this.blocks[x + "," + y];
  },
  isBlocked: function(x, y) {
    return this.blocked[x + "," + y] || this.pistonAt(x, y);
  },
  pistonAt: function(x, y) {
    return this.pistons[x + "," + y];
  },
  pushBlock: function(block, xx, yy, piston) {
    var pos = block.getPos();
    var newPos = {
      x: pos.x + xx,
      y: pos.y + yy
    };
    var nextBlock = this.blockAt(newPos.x, newPos.y);
    if (this.isBlocked(newPos.x, newPos.y)) {
      return false;
    }
    var pushedSuccessfully = true;
    if (nextBlock) {
      pushedSuccessfully = this.pushBlock(nextBlock, xx, yy, piston);
    }
    if (pushedSuccessfully) {
      delete this.blocks[pos.x + "," + pos.y];
      block.push(xx, yy);
      piston.startPushing(block);
      pos = block.getPos();
      this.blocks[pos.x + "," + pos.y] = block;
    }
    return pushedSuccessfully;
  },
  addBlock: function(x, y, colour) {
    var block = new Block({
      x: x,
      y: y,
      colour: colours[colour]
    });
    this.blocks[x + "," + y] = block;
    this.world.add(block);
  }
});

var World = Skrit.world({
  blockAt: function(x, y) {
    var result;
    // ew, improve this
    this.entities.forEach(function(ent) {
      if (ent instanceof Block) {
        if (ent.x == x * GRID_SIZE && ent.y == y * GRID_SIZE) {
          result = ent;
        }
      }
    });
    return result;
  }
});

var world = new World();

var Game = Skrit.game({
  world: world,
  container: document.getElementById("game")
});

var game = new Game();

game.start()

world.add(new GameController());
