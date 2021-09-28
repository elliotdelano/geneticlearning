document.body.appendChild(view);

stage.addChild(viewport)

viewport
    .drag()
    .wheel()

//Global Simulation Object for storing all global Variables and Functions
const Sim = {};

Sim.psize = 50;
Sim.population = []

Sim.maxFood = 100;
Sim.food = []

Sim.world_size = new Box(new Vector2(), renderer.width, renderer.height, true)
Sim.TREE = new QuadTree(Sim.world_size, 3, 10, 0)

Sim.newpopulation = () => {
    let new_pop = []
    for (let i = 0; i < Sim.psize; i++) {
        new_pop.push(new Bot(new DNA(), rand_int(0, renderer.width), rand_int(0, renderer.height)))
    }
    return new_pop
}

function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

function rand_int(lower, upper) {
    return Math.round((Math.random() * (upper - lower)) + lower)
}

var randomProperty = function (obj) {
    var keys = Object.keys(obj);
    return obj[keys[keys.length * Math.random() << 0]];
};

let debug = new PIXI.Graphics()
viewport.addChild(debug)
ticker.stop()
ticker.add(() => {
    Sim.TREE.clear()

    for (let bot of Sim.population) {
        bot.update()
        //GLOBAL_TREE.append(bot)
    }
    for (let object of Sim.food) {
        Sim.TREE.append(object)
    }
    debug.clear()
    debug.lineStyle(4, 0xffffff)
    for (let bot of Sim.population) {
        let range = new Box(bot.position.copy().sub(120, 120), 240, 240)
        let others = Sim.TREE.query(range)
        if (others.length <= 0) {
            //bot.applyForce(bot.wonder())
            continue
        }
        for (let o of others) {
            if (bot != o) {
                if (o instanceof Mine) {
                    bot.applyForce(bot.seek(o))
                }
            }
        }
    }
})

Sim.start = () => {

    //let spawns = setup_map()
    Sim.population = Sim.newpopulation()
    console.log("Game Start")
    ticker.start()
}