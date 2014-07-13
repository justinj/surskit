var Skrit = {};

var KEYS = {
  37: "left",
  38: "up",
  39: "right",
  40: "down"
};

// nop -> no-op -> no operation
var nop = function() {};

var toKeyname = function(keycode) {
  return KEYS[keycode];
};

Skrit.entity = function(spec) {
  var constructor = function() {
    var self = this;

    this.width = 0;
    this.height = 0;
    if (spec.image) {
      this.image = new Image();
      this.image.onload = function() {
        self.width = this.width;
        self.height = this.height;
      };
      this.image.src = spec.image;
    }

    // If the user didn't specify these just do nothing
    this.userUpdate = (spec.update || nop).bind(this);
    var constructorArgs = arguments;
    this.born = function() {
      (spec.born || nop).apply(self, constructorArgs);
    };
    this.userRender = (spec.render || nop).bind(this);

    this.x = spec.x || 0;
    this.y = spec.y || 0;
  };

  constructor.prototype.update = function(context) {
    this.userUpdate(context);
  };

  constructor.prototype.render = function(ctx) {
    if (this.image) {
      var w = this.image.width;
      var h = this.image.height;
      ctx.drawImage(this.image, 0, 0, w, h, this.x, this.y, w, h);
    }
    this.userRender(ctx);
  };

  return constructor;
};

Skrit.world = function(spec) {
  var constructor = function() {
    this.entities = [];
  };

  constructor.prototype.add = function(entity) {
    this.entities.push(entity);
    entity.born();
  };

  constructor.prototype.animate = function(context) {
    this.entities.forEach(function(entity) {
      entity.update(context);
    });

    context.canvas.width = context.canvas.width;
    // context.canvasContext.clearRect(0, 0, context.game.width, context.game.height);
    this.entities.forEach(function(entity) {
      entity.render(context.canvasContext);
    });
    context.canvasContext.stroke();
  };

  return constructor;
};

Skrit.game = function(spec) {
  var constructor = function() {
    this.currentWorld = spec.world;

    var canvas = document.createElement("canvas");

    this.mouse = {};
    this.width = canvas.width = spec.width || 640;
    this.height = canvas.height = spec.height || 480;
    this.canvas = canvas;
    this.canvasContext = canvas.getContext("2d");
    spec.container.appendChild(canvas);
  };

  constructor.prototype._animate = function() {
    this.currentWorld.animate({
      canvas: this.canvas,
      canvasContext: this.canvasContext,
      keys: this.keys,
      game: this,
      mouse: this.mouse
    });
    requestAnimationFrame(this._animate.bind(this));

    this.mouse.clicked = false;
  };

  constructor.prototype.start = function() {
    // keep track of all the keys
    var self = this;

    this.keys = [];
    document.addEventListener("keydown", function(e) {
      self.keys[toKeyname(e.keyCode)] = true;
    });

    document.addEventListener("keyup", function(e) {
      self.keys[toKeyname(e.keyCode)] = false;
    });

    document.addEventListener("mousedown", function(e) {
      self.mouse.clicked = true;
    });

    document.addEventListener("mousemove", function(e) {
      self.mouse.x = e.x;
      self.mouse.y = e.y;
    });

    requestAnimationFrame(this._animate.bind(this));
  };

  return constructor;
};
