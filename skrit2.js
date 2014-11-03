var Skrit = {};

var KEYS = {
  32: "space",
  37: "left",
  38: "up",
  39: "right",
  40: "down"
};

// I think the default for RAF
var FPS = 60;

for (var i = 65; i < 91; i++) {
  KEYS[i] = String.fromCharCode(i).toLowerCase();
}

// nop -> no-op -> no operation
var nop = function() {};

var toKeyname = function(keycode) {
  return KEYS[keycode];
};

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

Skrit.entity = function(spec) {
  var constructor = function() {
    var self = this;

    // the sprite idea is sort of half-baked atm, should figure out exactly how
    // this should work
    this.sprite = {
      flipped: false,
      currentAnimation: null,
      currentFrame: 0,
      delayToNextFrame: null
    };

    this.hitboxOffsetLeft = 0;
    this.hitboxOffsetTop = 0;
    this.width = null;
    this.height = null;

    if (spec.sprite) {
      this.sprite.rows = spec.sprite.rows || 1;
      this.sprite.columns = spec.sprite.columns || 1;
      this.sprite.animations = spec.sprite.animations || [];
      if (spec.sprite.image) {
        this.image = new Image();
        this.image.onload = function() {
          if (self.width == null) {
            self.width = this.width;
          }
          if (self.height == null) {
            self.height = this.height;
          }
        };
        this.image.src = spec.sprite.image;
      }
    }

    // If the user didn't specify these just do nothing
    this.update = (spec.update || nop).bind(this);
    var constructorArgs = arguments;
    this.born = function() {
      (spec.born || nop).apply(self, constructorArgs);
    };
    this.render = (spec.render || nop).bind(this);

    // Might want to add an option to replay the animation if it's already playing (like flashpunk
    // has)
    this.playAnimation = function(name) {
      var animation = this.sprite.animations[name];
      // Might want to add an option to replay the animation if it's already playing (like flashpunk
      // has)
      if (animation == this.sprite.currentAnimation) {
        return;
      }
      this.sprite.currentAnimation = animation;
      this.sprite.currentFrame = 0;
      this.sprite.delayToNextFrame = animation.delay;
    };

    this.x = spec.x || 0;
    this.y = spec.y || 0;
  };

  constructor.prototype.setCollisionType = function(type) {
    this.world.setCollisionType(this, type);
  }

  constructor.prototype._update = function(context) {
    this.update(context);
  };

  constructor.prototype._render = function(ctx) {
    if (this.image) {
      var x = this.x;
      var w = this.image.width / this.sprite.columns;
      var h = this.image.height / this.sprite.rows;
      ctx.save()
      var dw = w;
      var dh = h;
      // ewww I suspect this is going to be super slow
      if (this.sprite.flipped) {
        ctx.scale(-1, 1);
        w = -w;
        x = -x;
      }
      var frameX = this.sprite.currentAnimation.frames[this.sprite.currentFrame] % this.sprite.columns;
      var frameY = Math.floor(this.sprite.currentAnimation.frames[this.sprite.currentFrame] / this.sprite.columns);
      if (this.sprite.currentAnimation.frames.length > 1) {
        this.sprite.delayToNextFrame -= 1/FPS;
        if (this.sprite.delayToNextFrame <= 0) {
          this.sprite.currentFrame+=1;
          this.sprite.delayToNextFrame = this.sprite.currentAnimation.delay;
          this.sprite.currentFrame %= this.sprite.currentAnimation.frames.length;
        }
      }
      //
      ctx.drawImage(this.image, dw * frameX, 0,
                    dw, dh, x | 0, this.y | 0, w, h);
      //
      ctx.restore()
      //
    }
    this.render(ctx);
  };

  constructor.prototype.collide = function(type, x, y) {
    var i;
    var collidables = this.world.collidables[type] || [];
    x += this.hitboxOffsetLeft;
    y += this.hitboxOffsetTop;
    for (i = 0; i < collidables.length; i++) {
      var c = collidables[i];
      if (x < c.x + c.width && x + this.width > c.x) {
        if (y < c.y + c.height && y + this.height > c.y) {
          return true;
        }
      }
    }
    return false;
  };

  extend(constructor.prototype, spec);

  return constructor;
};

var removeFromArray = function(arr, elem) {
  var index = arr.indexOf(elem);
  if (index > -1) {
    arr.splice(index, 1);
  }
}

Skrit.world = function(spec) {
  var constructor = function() {
    this.entities = [];
    this.collidables = {};
  };

  constructor.prototype.add = function(entity) {
    // see if we actually need this whole object in the future
    this.entities.push(entity);
    // :/ a bit ew-ish
    entity.world = this;
    entity.born();
  };

  constructor.prototype.remove = function(entity) {
    // naive but simple
    for (var i = 0; i < this.entities.length; i++) {
      if (entity == this.entities[i]) {
        this.entities.splice(i,1);
        return;
      }
    }
    throw new Error("Removed entity that was not in the world!");
  };

  constructor.prototype.setCollisionType = function(entity, type) {
    if (entity._collisionType && this.collidables[entity._collisionType]) {
      removeFromArray(this.collidables[entity._collisionType], entity);
    }
    entity._collisionType = type;
    this.collidables[type] = this.collidables[type] || [];
    this.collidables[type].push(entity);
  };

  constructor.prototype.animate = function(context) {
    context.world = this;
    this.entities.forEach(function(entity) {
      entity._update(context);
    });

    // these are only recognized for a single frame
    context.keys.pressed = {};

    // clears the context
    context.canvas.width = context.canvas.width;

    // might be slow to assign these every time, maybe should be just set once,
    // but assigning the width to clear the canvas above resets the context
    // these let scaled up pixel art draw crisply
    context.canvasContext.imageSmoothingEnabled = false;
    context.canvasContext.webkitImageSmoothingEnabled = false;
    context.canvasContext.scale(this.game.scale, this.game.scale);

    context.canvasContext.fillStyle = "#099";
    context.canvasContext.fillRect(0, 0, context.game.width, context.game.height);
    this.entities.forEach(function(entity) {
      entity._render(context.canvasContext);
    });
    context.canvasContext.stroke();
  };

  extend(constructor.prototype, spec);

  return constructor;
};

Skrit.game = function(spec) {
  var constructor = function() {
    this.currentWorld = spec.world;
    this.currentWorld.game = this;

    var canvas = document.createElement("canvas");

    this.mouse = {};
    this.width = canvas.width = spec.width || 640;
    this.height = canvas.height = spec.height || 480;
    this.scale = spec.scale;
    this.canvas = canvas;
    this.canvasContext = canvas.getContext("2d");

    spec.container.appendChild(canvas);
  };

  constructor.prototype._animate = function() {
    this.canvasContext.imageSmoothingEnabled = false;
    this.canvasContext.webkitImageSmoothingEnabled = false;

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

    this.keys = {};
    this.keys.pressed = {};
    document.addEventListener("keydown", function(e) {
      var keyName = toKeyname(e.keyCode);
      // keydown is fired a bunch of times, so check if we were already holding
      // it down.
      if (!self.keys[keyName]) {
        self.keys.pressed[keyName] = true;
      }
      self.keys[toKeyname(e.keyCode)] = true;
    });

    document.addEventListener("keyup", function(e) {
      self.keys[toKeyname(e.keyCode)] = false;
    });

    document.addEventListener("mousedown", function(e) {
      self.mouse.clicked = true;
    });

    document.addEventListener("mousemove", function(e) {
      self.mouse.x = e.x - e.toElement.offsetLeft;
      self.mouse.y = e.y - e.toElement.offsetTop;
    });

    requestAnimationFrame(this._animate.bind(this));
  };

  return constructor;
};
