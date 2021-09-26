

document.body.appendChild(view);

stage.addChild(viewport)

viewport
    .drag()
    .wheel()

let psize = 50
let population
let projectiles = []
let best = []

let chunks = [];

let world_size = new Box(new Vector2(), World.WORLD_WIDTH * World.CHUNK_WIDTH * World.TILE_SIZE, World.WORLD_HEIGHT * World.CHUNK_HEIGHT * World.TILE_SIZE)
const GLOBAL_TREE = new QuadTree(world_size, 3, 10, 0)

let mix_pool = (best) => {
    let options = best.slice()
    let idx = Math.floor(Math.random() * options.length)
    let dna1 = options.splice(idx, 1)[0]
    idx = Math.floor(Math.random() * options.length)
    let dna2 = options.splice(idx, 1)[0]
    return DNA.crossover(dna1, dna2)
}

let newpopulation = (best, spawn_points) => {
    let new_pop = []
    if (best.length < 1) {
        for (let i = 0; i < psize; i++) {
            let rand = Math.floor(Math.random() * spawn_points.length)
            new_pop.push(new Bot(new DNA(), spawn_points[rand].x * World.TILE_SIZE, spawn_points[rand].y * World.TILE_SIZE))
            spawn_points.splice(rand, 1)
        }
        return new_pop
    }
    //new_pop = new_pop.concat(best)
    for (let i = 0; i < psize; i++) {
        let rand = Math.floor(Math.random() * spawn_points.length)
        if (i < best.length - 1) {
            new_pop.push(new Bot(best[i], spawn_points[rand].x * World.TILE_SIZE, spawn_points[rand].y * World.TILE_SIZE))
            spawn_points.splice(rand, 1)
        } else {
            new_pop.push(new Bot(mix_pool(best), spawn_points[rand].x * World.TILE_SIZE, spawn_points[rand].y * World.TILE_SIZE))
            spawn_points.splice(rand, 1)
        }
    }
    return new_pop
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
    GLOBAL_TREE.clear()

    for (let bot of population) {
        bot.update()
        GLOBAL_TREE.append(bot)
    }
    for (let x = 0; x < chunks.length; x++) {
        for (let y = 0; y < chunks[x].length; y++) {
            GLOBAL_TREE.append(chunks[x][y])
        }
    }
    for (let proj of projectiles) {
        GLOBAL_TREE.append(proj)
    }
    debug.clear()
    debug.lineStyle(4, 0xffffff)
    for (let bot of population) {
        let range = new Box(bot.position.copy().sub(120, 120), 240, 240)
        let others = GLOBAL_TREE.query(range)
        if (others.length <= 0) {
            //bot.applyForce(bot.wonder())
            continue
        }
        for (let o of others) {
            if (bot != o) {
                if (o instanceof Bot) {
                    bot.applyForce(bot.evade(o))
                }
                if (o instanceof chunk) {
                    if (o.colliders) for (let c of o.colliders) {
                        let response = new Response()
                        if (testPolygonPolygon(bot.bounds, c, response)) {
                            bot.collideWith(c)
                            break
                        }
                        if (testPolygonPolygon(bot.view, c)) {
                            bot.applyForce(bot.flee(c.position))
                        }
                    }
                }
                if (o instanceof Mine) {
                    if (testPolygonPolygon(bot.bounds, o.bounds)) {
                        bot.collideWith(o)
                    } else if (bot.position.dist(o.position) < 100) {
                        o.position.lerp(bot.position, 0.02)
                        o.bounds.position.set(o.position.x, o.position.y)
                        o.graphic.position.set(o.position.x, o.position.y)
                    } else if (bot.position.dist(o.position) < 5) {
                        bot.collideWith(o)
                    }
                }
            }
        }
    }
    if (population.length < 6) {
        game_end()

        game_start()
    }
})

function game_end() {
    ticker.stop()
    best = []
    if (population.length > 0) {
        for (let i = 0; i < population.length; i++) {
            best.push(population[i].DNA.clone())
        }
        //best.concat(population)
    }
    //console.log(population)
    for (let i = population.length - 1; i >= 0; i--) {
        population[i].destroy()
    }

    console.log("Game End")
    console.log(population)
}

function game_start() {

    let spawns = setup_map()
    population = newpopulation(best, spawns)
    console.log("Game Start")
    ticker.start()
}