document.body.appendChild(view);

stage.addChild(viewport)

// viewport
//     .drag()
//     .wheel()

//Global Simulation Object for storing all global Variables and Functions
const Sim = {};

Sim.isRunning = false
Sim.endTime = Number.POSITIVE_INFINITY
Sim.runTime = 0
Sim.frameRate = 60

Sim.preySize = 5
Sim.predatorSize = 0
Sim.population = []
Sim.reproductionQuantity = 2000
Sim.lossPerTick = 1
Sim.foodRate = 10;

Sim.food = []

Sim.data = []

Sim.world_size = new Box(new Vector2(), renderer.width, renderer.height)
Sim.TREE = new QuadTree(Sim.world_size, 3, 10, 0)

Sim.Flabels = []
Sim.Fdata = {
    labels: Sim.Flabels,
    datasets: [{
        label: 'Average Fitness',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        data: [],
    }]
}
Sim.Plabels = []
Sim.Pdata = {
    labels: Sim.Flabels,
    datasets: [{
        label: 'Prey',
        backgroundColor: 'rgb(0, 0, 255)',
        borderColor: 'rgb(0, 0, 255)',
        data: [],
    }, {
        label: 'Predator',
        backgroundColor: 'rgb(255, 0, 0)',
        borderColor: 'rgb(255, 0, 0)',
        data: [],
    }]
}
Sim.Fconfig = {
    type: 'line',
    data: Sim.Fdata
}
Sim.Pconfig = {
    type: 'line',
    data: Sim.Pdata
}

// Sim.fitnessGraph = new Chart(
//     document.getElementById('fitnessChart').getContext('2d'),
//     Sim.Fconfig
// )
// Sim.populationGraph = new Chart(
//     document.getElementById('populationChart').getContext('2d'),
//     Sim.Pconfig
// )

Sim.newpopulation = () => {
    let new_pop = []
    for (let i = 0; i < Sim.preySize; i++) {
        new_pop.push(new Prey(new DNA(), rand_int(0, renderer.width), rand_int(0, renderer.height)))
    }
    for (let i = 0; i < Sim.predatorSize; i++) {
        new_pop.push(new Predator(new DNA(), rand_int(0, renderer.width), rand_int(0, renderer.height)))
    }
    return new_pop
}

Sim.secondTicker = () => {
    if (!Sim.isRunning) return
    for (let i = 0; i < Sim.foodRate; i++) {
        if (Sim.food.length >= 1000) break
        Sim.food.push(new Food(new Vector2(rand_int(0, renderer.width), rand_int(0, renderer.height))))
    }

    Sim.runTime++

    if (Sim.runTime % 5 == 0) Sim.avgFitnessCalc()
}

Sim.avgFitnessCalc = () => {
    if (!Sim.isRunning) return
    let avg = 0
    for (let bot of Sim.population) {
        avg += bot.DNA.getFitness()
    }
    avg /= Sim.population.length

    let preyCount = 0
    let predatorCount = 0
    for (let i = 0; i < Sim.population.length; i++) {
        if (Sim.population[i] instanceof Prey) {
            preyCount++
        } else {
            predatorCount++
        }
    }

    Sim.data.push([avg, Math.round((Date.now()-Sim.startTime)/1000) * 1000])

    // Sim.fitnessGraph.data.labels.push(Sim.runTime)
    // Sim.fitnessGraph.data.datasets[0].data.push(avg)
    // Sim.fitnessGraph.update()

    // Sim.populationGraph.data.labels.push(Sim.runTime)
    // Sim.populationGraph.data.datasets[0].data.push(preyCount)
    // Sim.populationGraph.data.datasets[1].data.push(predatorCount)
    // Sim.populationGraph.update()
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

Sim.beginLoop = function () {
    Sim.fpsInterval = 1000 / Sim.frameRate;
    Sim.lastDrawTime = performance.now();
    //this.lastSampleTime = lastDrawTime;
    Sim.frameCount = 0;

    Sim.loop();
},
Sim.loop = function (now) {
    Sim.requestID = requestAnimationFrame(Sim.loop);

    let elapsed = now - Sim.lastDrawTime;

    // if enough time has elapsed draw the next frame
    if (elapsed > Sim.fpsInterval) {
        Sim.lastDrawTime = now - (elapsed % Sim.fpsInterval);
        ///////////Do Stuff//////////
        
        if(Sim.isRunning) {
            if (Date.now() > Sim.endTime) {
                Sim.pause()
                return
            }
            Sim.TREE.clear()
        
            for (let bot of Sim.population) {
                bot.update()
                Sim.TREE.append(bot)
            }
            for (let object of Sim.food) {
                Sim.TREE.append(object)
            }
            for (let bot of Sim.population) {
                let range = new Box(bot.position.copy().sub(bot.viewrange / 2, bot.viewrange / 2), bot.viewrange, bot.viewrange)
                let others = Sim.TREE.query(range)
                if (others.length <= 0) {
                    bot.applyForce(bot.wonder())
                    continue
                }
                for (let o of others) {
                    if (bot != o) {
                        bot.addTarget(o)
                        if (testPolygonPolygon(bot.bounds, o.bounds)) {
                            bot.collideWith(o)
                        }
                    }
                }
            }
        }


        //////////Stop Stuff/////////
        Sim.frameCount++;
    }
},
Sim.endLoop = function () {
    cancelAnimationFrame(Sim.requestID)
}

Sim.start = () => {
    let current = Date.now()
    if (Sim.pauseTime) {
        let pauseDuration = Date.now() - Sim.pauseTime
        current -= pauseDuration
        Sim.endTime += pauseDuration
        Sim.pauseTime = undefined
    }
    Sim.startTime = current
    if (Date.now() > Sim.endTime) return
    //let spawns = setup_map()
    Sim.preySize = parseInt(document.getElementById("preyInput").value)
    Sim.predatorSize = parseInt(document.getElementById("predatorInput").value)
    Sim.foodRate = parseInt(document.getElementById("foodQuantityInput").value)
    let reproVal = parseInt(document.getElementById("reproductionInput").value)
    Sim.reproductionQuantity = reproVal < 1500 ? 1500 : reproVal
    Sim.lossPerTick = parseInt(document.getElementById("energyLossInput").value)
    Sim.endTime = (parseInt(document.getElementById("durationInput").value) * 60000 + Date.now()) || Number.POSITIVE_INFINITY
    if (Sim.population.length <= 0) {
        Sim.population = Sim.newpopulation()
    }

    console.log("Game Start")
    Sim.isRunning = true
    Sim.beginLoop()
    let foodTime = parseInt(document.getElementById("foodRateInput").value) * 1000 || 1000
    console.log(foodTime)
    if (!Sim.foodInterval) {
        Sim.foodInterval = setInterval(Sim.secondTicker, foodTime)
    }
}

Sim.pause = () => {
    Sim.pauseTime = Date.now()
    Sim.endLoop()
    Sim.isRunning = false
}

Sim.end = () => {
    for (let i = Sim.population.length - 1; i >= 0; i--) {
        Sim.population[i].destroy();
    }
    for (let i = Sim.food.length - 1; i >= 0; i--) {
        Sim.food[i].delete()
    }
    clearInterval(Sim.foodInterval)
    Sim.endLoop()
    Sim.foodInterval = undefined
    Sim.endTime = Number.POSITIVE_INFINITY
    Sim.pauseTime = undefined
    Sim.isRunning = false
}

Sim.download = () => {
    let content = "data:text/csv;charset=utf-8,";

    let csv = Sim.data.map(row=>row.join(',')).join('\n')

    content = content + csv
    window.open(encodeURI(content))
}