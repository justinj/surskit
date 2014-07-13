Skrit = (function() {
    var bindAll = function(obj) {
        for (var fn in obj) {
            if (obj.hasOwnProperty(fn)) {
                if (typeof obj[fn] === "function") {
                    obj[fn] = obj[fn].bind(obj);
                }
            }
        }
    };
    // shallowly copy all the properties on b onto a
    var extend = function(a, b) {
        for (var prop in b) {
            if (b.hasOwnProperty(prop)) {
                a[prop] = b[prop];
            }
        }
    };
    return {
        // Create a singleton representing a game.
        createGame: function(spec) {
            // The currently active world in the game
            var activeWorld;

            var stage;
            var renderer;

            var stage = new PIXI.Stage(spec.backgroundColor);
            var renderer = new PIXI.CanvasRenderer(spec.width, spec.height);
            spec.container.appendChild(renderer.view);
            requestAnimFrame(animate);


            function animate() {
                requestAnimFrame(animate);
                renderer.render(stage);
                activeWorld.update();
                activeWorld.render();
            }

            // inputty stuff

            var keys = [];
            spec.container.addEventListener("keydown", function(e) {
                keys[e.keyCode] = true;
            });
            spec.container.addEventListener("keyup", function(e) {
                keys[e.keyCode] = false;
            });

            return {
                clearChildren: function(e) {
                    for (var i = 0; i < stage.children.length; i++) {
                        stage.removeChild(stage.children[i]);
                    }
                },
                addChild: function(e) { stage.addChild(e); },
                setActiveWorld: function(world) {
                    activeWorld = world;
                    world.game = this;
                },
                Input: {
                    // who uses other keys
                    // TODO add other keys
                    LEFT: 37,
                    UP:  38,
                    RIGHT: 39,
                    DOWN: 40,
                },
                keys: keys
            };
        },
        createWorld: function(spec) {
            var World = function () {
                this.entities = [];
            }
            World.prototype.add = function(ent) {
                this.entities.push(ent);
                ent.world = this;
                ent.game = this.game;
                ent._born();
                if (ent.born) ent.born();
            };
            // Called when the world is set to the active world in a game.
            World.prototype._birth = function() {
            };
            // Called every frame of the game.
            World.prototype._update = function(ent) {
                for (var i = 0; i < this.entities.length; i++) {
                    this.entities[i].update();
                }
            };
            // If you override me you have to tell me to update the entities...
            World.prototype.update = World.prototype._update;
            World.prototype._render = function() {
                var entity;
                // efficiency? we don't need efficiency where we're going.
                // there is probably a better library for this approach, but
                // yolo for now
                this.game.clearChildren();
                for (var i = 0; i < this.entities.length; i++) {
                    entity = this.entities[i];
                    entity.sprite.x = entity.x;
                    entity.sprite.y = entity.y;
                    this.game.addChild(this.entities[i].sprite);
                }
            };
            World.prototype.render = World.prototype._render;
            extend(World.prototype, spec);
            return World;
        },
        createEntity: function(spec) {
            var Ent = function () {}
            Ent.prototype._born = function() {
                this.texture = PIXI.Texture.fromImage(spec.image);
                this.sprite = new PIXI.Sprite(this.texture);
                this.x = 0;
                this.y = 0;
            };
            extend(Ent.prototype, spec);
            return Ent;
        }
    }
})();
