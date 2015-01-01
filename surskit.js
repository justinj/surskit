var Surskit = {};

(function() {
// TODO: Add more of these
var KEYS = {
  32: "space",
  37: "left",
  38: "up",
  39: "right",
  40: "down"
};
var toKeyname = function(keycode) { return KEYS[keycode]; };

// I think the default for RAF
var FPS = 60;

// This might be a controversial thing... I think it's a nice way to do it though
var PIXELS_PER_UNIT = 100;

var unitsToPixels = function(units) { return units / PIXELS_PER_UNIT; };
var pixelsToUnits = function(pixels) { return pixels * PIXELS_PER_UNIT; };

for (var i = 65; i < 91; i++) {
  KEYS[i] = String.fromCharCode(i).toLowerCase();
}

// nop -> no-op -> no operation
var nop = function() {};

// Shallowly copies all the properties from source to target.
var extend = function(target, source) {
  var properties = Object.keys(source);
  properties.forEach(function(prop) {
    if (target[prop]) {
      // should be a safe way to get around this, look into
      console.warn("You are overwriting a built-in method with " + prop)
    }
    target[prop] = source[prop];
  });
}

Surskit.entity = function(spec) {
  var constructor = function() {
    var self = this;

    // the sprite idea is sort of half-baked atm, should figure out exactly how
    // this should work
    var sprite = self.sprite = {
      flipped: false,
      // Default animation should just be to show the first frame
      animation: { frames: [0] },
      currentFrame: 0,
      delayToNextFrame: null
    };

    var specSprite = spec.sprite;

    self.hitboxLeft = 0;
    self.hitboxTop = 0;
    self.width = 0;
    self.height = 0;

    self._collisionTypes = [];

    if (specSprite) {
      sprite.rows = specSprite.rows || 1;
      sprite.columns = specSprite.columns || 1;
      sprite.animations = specSprite.animations || [];
      if (specSprite.image) {
        self.image = new Image();
        self.image.onload = function() {
          self.width = self.width || pixelsToUnits(this.width);
          self.height = self.height || pixelsToUnits(this.height);
        };
        self.image.src = specSprite.image;
      }
    }

    // If the user didn't specify these just do nothing
    self.update = (spec.update || nop).bind(self);
    var constructorArgs = arguments;
    self.born = function() {
      (spec.born || nop).apply(self, constructorArgs);
    };
    self.render = (spec.render || nop).bind(self);

    self.x = spec.x || 0;
    self.y = spec.y || 0;
  };

  var proto = constructor.prototype;

  proto.playAnimation = function(name) {
    var self = this;
    var animation = self.sprite.animations[name];
    // Might want to add an option to replay the animation if it's already playing (like flashpunk
    // has)
    if (animation === self.sprite.animation) {
      return;
    }
    self.sprite.animation = animation;
    self.sprite.currentFrame = 0;
    self.sprite.delayToNextFrame = animation.delay;
  };

  // I'm a little concerned about the implications of allowing callbacks, but let's try it for now
  proto.addAlarm = function(delay, callback) {
    // In reality, we should do this ourselves, so that the alarms are synced with the framerate of
    // the game. This will do for now.
    setTimeout(callback, delay * 1000);
  };

  proto.setCollisionType = function(type) {
    this.world.setCollisionType(this, type);
  };

  proto._update = function(context) {
    this.update(context);
  };

  proto._render = function(canvasContext) {
    var self = this;
    canvasContext.save()
    if (self.image) {
      var x = unitsToPixels(self.x);
      var y = unitsToPixels(self.y);
      var w = self.image.width / self.sprite.columns;
      var h = self.image.height / self.sprite.rows;
      var sprite = self.sprite;
      var animation = sprite.animation;
      var dw = w;
      var dh = h;
      // ewww I suspect this is going to be super slow
      if (sprite.flipped) {
        canvasContext.scale(-1, 1);
        w = -w;
        x = -x;
      }
      var frameX = animation.frames[sprite.currentFrame] % sprite.columns;
      var frameY = Math.floor(animation.frames[sprite.currentFrame] / sprite.columns);
      if (animation.frames.length > 1) {
        sprite.delayToNextFrame -= 1/FPS;
        if (sprite.delayToNextFrame <= 0) {
          sprite.currentFrame += 1;
          sprite.delayToNextFrame = animation.delay;
          sprite.currentFrame %= animation.frames.length;
        }
      }
      canvasContext.drawImage(self.image, dw * frameX, dh * frameY,
                    dw, dh, x | 0, y | 0, w, h);
    }
    canvasContext.scale(1/PIXELS_PER_UNIT, 1/PIXELS_PER_UNIT);
    self.render(canvasContext);
    canvasContext.restore();
  };

  proto.collide = function(type, x, y) {
    var self = this;
    var collidables = self.world.collidables[type] || [];
    x += self.hitboxLeft;
    y += self.hitboxTop;
    for (var i = 0; i < collidables.length; i++) {
      var c = collidables[i];
      if (x < c.x + c.width && x + self.width > c.x) {
        if (y < c.y + c.height && y + self.height > c.y) {
          return c;
        }
      }
    }
    return false;
  };

  extend(proto, spec);

  return constructor;
};

var removeFromArray = function(arr, elem) {
  var index = arr.indexOf(elem);
  if (index > -1) {
    arr.splice(index, 1);
  }
}

Surskit.world = function(spec) {
  var constructor = function() {
    var self = this;
    self.entities = [];
    self.collidables = {};
    self.camera = { x: 0, y: 0 };
    self.spec = spec;
  };

  constructor.prototype.add = function(entity) {
    this.entities.push(entity);
    entity.world = this;
    entity.born();
  };

  constructor.prototype.remove = function(entity) {
    var entities = this.entities;
    // naive but simple
    for (var i = 0; i < entities.length; i++) {
      if (entity === entities[i]) {
        entities.splice(i,1);
        return;
      }
    }
    throw new Error("Removed entity that was not in the world!");
  };

  // kinda funkily overloaded, things should be able to belong to multiple types, so we can pass
  // either a string or an array of strings
  constructor.prototype.setCollisionType = function(entity, type) {
    // ehhhhh I'm not sold
    if ((typeof type) == "string") {
      type = [type];
    }

    var self = this;
    for (var i = 0; i < entity._collisionTypes.length; i++) {
      if (self.collidables[entity._collisionTypes[i]]) {
        removeFromArray(self.collidables[entity._collisionTypes[i]], entity);
      }
    }
    entity._collisionTypes = type;
    for (var i = 0; i < entity._collisionTypes.length; i++) {
      self.collidables[type[i]] = self.collidables[type[i]] || [];
      self.collidables[type[i]].push(entity);
    }
  };

  constructor.prototype.animate = function(context) {
    var self = this;
    context.world = self;
    self.entities.forEach(function(entity) {
      entity._update(context);
    });

    // these are only recognized for a single frame
    context.keys.pressed = {};

    // clears the context
    context.canvas.width = context.canvas.width;

    // these let scaled up pixel art draw crisply
    // might be slow to assign these every time, maybe should be just set once,
    // but assigning the width to clear the canvas above resets the context
    var canvasContext = context.canvasContext;
    canvasContext.imageSmoothingEnabled = false;
    canvasContext.webkitImageSmoothingEnabled = false;
    var scale = self.game.scale;
    canvasContext.scale(scale, scale);

    canvasContext.fillStyle = "#099";
    canvasContext.fillRect(0, 0, context.game.width, context.game.height);
    canvasContext.translate(-self.camera.x, -self.camera.y);
    self.entities.forEach(function(entity) {
      entity._render(canvasContext);
    });
    canvasContext.stroke();
  };

  extend(constructor.prototype, spec);

  return constructor;
};

Surskit.game = function(spec) {
  var constructor = function(args) {
    var self = this;
    self.currentWorld = args.world;
    self.currentWorld.game = self;

    var canvas = document.createElement("canvas");

    self.mouse = {};
    self.scale = spec.scale;
    var w = spec.width || 640;
    var h = spec.height || 480;
    canvas.width = w * spec.scale
    canvas.height = h * spec.scale
    self.width = pixelsToUnits(w);
    self.height = pixelsToUnits(h);
    self.canvas = canvas;
    self.canvasContext = canvas.getContext("2d");

    spec.container.appendChild(canvas);
  };

  constructor.prototype._animate = function() {
    var gamepad = navigator.getGamepads()[0];
    if (gamepad) {
      for (var i = 0; i < gamepad.buttons.length; i++) {
        if (!this.buttons[i] && gamepad.buttons[i].pressed) {
          this.buttons.pressed[i] = true;
        } else {
          this.buttons.pressed[i] = false;
        }
        this.buttons[i] = gamepad.buttons[i].pressed;
      }
      this.axes = gamepad.axes;
    } else {
      this.buttons = null;
    }
    this.currentWorld.animate({
      canvas: this.canvas,
      canvasContext: this.canvasContext,
      keys: this.keys,
      gamepad: {
        buttons: this.buttons,
        axes: this.axes
      },
      game: this,
      mouse: this.mouse
    });
    requestAnimationFrame(this._animate.bind(this));

    this.mouse.clicked = false;
  };

  constructor.prototype.start = function() {
    // keep track of all the keys
    var self = this;
    var d = document;
    var addEventListener = d.addEventListener.bind(d);
    var mouse = this.mouse;

    self.keys = {};
    self.keys.pressed = {};
    self.buttons = {};
    self.buttons.pressed = {};
    addEventListener("keydown", function(e) {
      var keyName = toKeyname(e.keyCode);
      // keydown is fired a bunch of times, so check if we were already holding
      // it down.
      if (!self.keys[keyName]) {
        self.keys.pressed[keyName] = true;
      }
      self.keys[toKeyname(e.keyCode)] = true;
    });

    addEventListener("keyup", function(e) {
      self.keys[toKeyname(e.keyCode)] = false;
    });

    addEventListener("mousedown", function(e) {
      mouse.clicked = true;
    });

    addEventListener("mousemove", function(e) {
      mouse.x = e.x - e.toElement.offsetLeft;
      mouse.y = e.y - e.toElement.offsetTop;
    });

    requestAnimationFrame(self._animate.bind(self));
  };

  return constructor;
};
})();
