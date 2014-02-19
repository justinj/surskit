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
        createGame: function(constructor) {
            // The currently active world in the game
            var activeWorld;

            var stage;
            var renderer;

            var stage = new PIXI.Stage(constructor.backgroundColor);
            var renderer = new PIXI.WebGLRenderer(constructor.width, constructor.height);
            constructor.container.appendChild(renderer.view);
            requestAnimFrame(animate);


            function animate() {
                requestAnimFrame( animate );
                renderer.render(stage);
                if (activeWorld.update) activeWorld.update();
            }

            return {
                addChild: function(e) { stage.addChild(e) },
                setActiveWorld: function(world) {
                    activeWorld = world;
                }
            };
        },
        createWorld: function(constructor) {
            var World = function () {
                this.entities = [];
            }
            World.prototype.add = function(ent) {
                this.entities.push(ent);
            };
            World.prototype._update = function(ent) {
                for (var i = 0; i < this.entities.length; i++) {
                    this.entities[i].update();
                }
            };
            World.prototype.update = World.prototype._update;
            extend(World.prototype, constructor);
            return World;
        },
        createEntity: function(constructor) {
            var Ent = function () {}
            extend(Ent.prototype, constructor);
            return Ent;
        }
    }
})();
