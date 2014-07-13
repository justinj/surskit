var Skrit = {};

var KEYS = {
  37: "left",
  38: "up",
  39: "right",
  40: "down"
};

var toKeyname = function(keycode) {
  return KEYS[keycode];
};

Skrit.entity = function(spec) {
  var constructor = function() {
    var self = this;
    this.image = new Image();
    this.image.src = spec.image;

    this.userUpdate = spec.update.bind(this);
    this.born = spec.born.bind(this);

    this.x = spec.x || 0;
    this.y = spec.y || 0;
  };

  constructor.prototype.update = function(context) {
    this.userUpdate(context);
  };

  constructor.prototype.render = function(ctx) {
    var w = this.image.width;
    var h = this.image.height;
    ctx.drawImage(this.image, 0, 0, w, h, this.x, this.y, w, h);
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
      entity.update({
        keys: context.keys
      });
    });

    context.canvasContext.clearRect(0, 0, context.game.width, context.game.height);
    this.entities.forEach(function(entity) {
      entity.render(context.canvasContext);
    });
  };

  return constructor;
};

Skrit.game = function(spec) {
  var constructor = function() {
    this.currentWorld = spec.world;

    var canvas = document.createElement("canvas");

    this.width = canvas.width = spec.width || 640;
    this.height = canvas.height = spec.height || 480;
    this.canvasContext = canvas.getContext("2d");
    spec.container.appendChild(canvas);
  };

  constructor.prototype._animate = function() {
    this.currentWorld.animate({
      canvasContext: this.canvasContext,
      keys: this.keys,
      game: this
    });
    requestAnimationFrame(this._animate.bind(this));
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

    requestAnimationFrame(this._animate.bind(this));
  };

  return constructor;
};
