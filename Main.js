document.body.appendChild(view);

stage.addChild(viewport)

// viewport
//     .drag()
//     .wheel()

//Global Simulation Object for storing all global Variables and Functions
const Sim = {};

Sim.isRunning = false
Sim.runTime = 0

Sim.psize = 25;
Sim.population = []

Sim.foodRate = 10;
Sim.food = []

Sim.world_size = new Box(new Vector2(), renderer.width, renderer.height)
Sim.TREE = new QuadTree(Sim.world_size, 3, 10, 0)

Sim.labels = []
Sim.data = {
    labels: Sim.labels,
    datasets:[{
        label: 'Average Fitness',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        data: [],
    }]
}
Sim.config = {
    type: 'line',
    data: Sim.data
}

Sim.graph = new Chart(
    document.getElementById('chart').getContext('2d'),
    Sim.config
)

Sim.newpopulation = () => {
    let new_pop = []
    for (let i = 0; i < Sim.psize; i++) {
        new_pop.push(new Bot(new DNA(), rand_int(0, renderer.width), rand_int(0, renderer.height)))
    }
    return new_pop
}

Sim.avgFitnessCalc = () => {
    if(!Sim.isRunning) return
    let avg = 0
    for (let bot of Sim.population) {
        avg += bot.DNA.getFitness()
    }
    avg /= Sim.population.length
    console.log(avg)

    for (let i = 0; i < Sim.foodRate; i++) {
        if(Sim.food.length >= 1000) break
        Sim.food.push(new Food(new Vector2(rand_int(0, renderer.width), rand_int(0, renderer.height))))
    }

    Sim.runTime++

    Sim.graph.data.labels.push(Sim.runTime)
    Sim.graph.data.datasets[0].data.push(avg)
    Sim.graph.update()
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

//ticker.stop()
ticker.add(() => {
    if(!Sim.isRunning) return
    Sim.TREE.clear()

    for (let bot of Sim.population) {
        bot.update()
        //GLOBAL_TREE.append(bot)
    }
    for (let object of Sim.food) {
        Sim.TREE.append(object)
    }
    for (let bot of Sim.population) {
        let range = new Box(bot.position.copy().sub(bot.viewrange/2, bot.viewrange/2), bot.viewrange, bot.viewrange)
        let others = Sim.TREE.query(range)
        if (others.length <= 0) {
            bot.applyForce(bot.wonder())
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
    Sim.psize = document.getElementById("populationInput").value
    Sim.foodRate = document.getElementById("foodInput").value
    if(Sim.population.length <= 0) {
        Sim.population = Sim.newpopulation()
    }
    
    console.log("Game Start")
    Sim.isRunning = true
    if(!Sim.foodInterval) {
        Sim.foodInterval = setInterval(Sim.avgFitnessCalc, 1000)
    }
}

Sim.pause = () => {
    Sim.isRunning = false
}

Sim.end = () => {
    for(let i = Sim.population.length -1; i >= 0; i--) {
        Sim.population[i].destroy();
    }
    for(let i = Sim.food.length - 1; i >= 0; i--) {
        Sim.food[i].delete()
    }
    Sim.isRunning = false
}