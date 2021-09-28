document.body.appendChild(view);

stage.addChild(viewport)

viewport
    .drag()
    .wheel()

//Global Simulation Object for storing all global Variables and Functions
const Sim = {};

Sim.psize = 25;
Sim.population = []

Sim.foodRate = 10;
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

Sim.avgFitnessCalc = () => {
    let avg = 0
    for (let bot of Sim.population) {
        avg += bot.DNA.getFitness()
    }
    avg /= Sim.population.length
    console.log(avg)

    for (let i = 0; i < Sim.foodRate; i++) {
        Sim.food.push(new Food(new Vector2(rand_int(0, renderer.width), rand_int(0, renderer.height))))
    }
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
    // if (Sim.food.length < Sim.maxFood) {
    //     let dif = Sim.maxFood - Sim.food.length
    //     for (let i = 0; i < dif; i++) {
    //         Sim.food.push(new Food(new Vector2(rand_int(0, renderer.width), rand_int(0, renderer.height))))
    //     }
    // }
    //let avgFitness = 0;
    for (let bot of Sim.population) {
        let range = new Box(bot.position.copy().sub(120, 120), 240, 240)
        let others = Sim.TREE.query(range)
        if (others.length <= 0) {
            //bot.applyForce(bot.wonder())
            continue
        }
        let closestFood
        let closestDist = 100000
        for (let o of others) {
            if (bot != o) {
                if (o instanceof Food) {
                    if (Math.abs(bot.position.dist(o.position)) < closestDist) {
                        closestFood = o;
                    }
                    if (testPolygonPolygon(bot.bounds, o.bounds)) {
                        bot.eat()
                        o.delete()
                    }
                }
            }
        }
        bot.applyForce(bot.seek(closestFood.position))

        //avgFitness += bot.DNA.getFitness()
    }
    //avgFitness /= Sim.population.length
    //console.log(avgFitness)
})

Sim.start = () => {

    //let spawns = setup_map()
    Sim.population = Sim.newpopulation()
    console.log("Game Start")
    ticker.start()

    setInterval(Sim.avgFitnessCalc, 1000)
}