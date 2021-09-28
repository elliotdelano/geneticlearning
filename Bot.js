class Food {
    constructor(position) {
        this.position = position
    }
    display() {
        this.graphic = new PIXI.Graphics()
        this.graphic.beginFill(0x00ff00)
        this.graphic.drawCircle(0, 0, 10)
        this.graphic.endFill()
        this.graphic.position.set(this.position.x, this.position.y)
        viewport.addChild(this.graphic)

        this.bounds = new Polygon(this.position.copy(), [new Vector2(-10, -10), new Vector2(10, -10), new Vector2(10, 10), new Vector2(-10, 10)], 20, 20)
    }
    delete() {
        for (let i = 0; i < projectiles.length; i++) {
            if (projectiles[i] == this) {
                projectiles.splice(i, 1)
                break
            }
        }
        viewport.removeChild(this.graphic)
    }
}

class Bot {
    position = new Vector2()
    velocity = new Vector2(Math.random(), Math.random())
    acceleration = new Vector2()
    maxSpeed = 0
    maxForce = 0.00
    viewrange = 0

    food = 1000
    static maxFood = 3000

    constructor(DNA, x, y) {
        this.position.set(x, y)
        this.DNA = DNA
        this.display()
        this.setup()
    }
    
    display() {
        this.graphic = new PIXI.Graphics()
        this.graphic.beginFill(0xff0000)
        this.graphic.drawPolygon(new PIXI.Point(0, 4), new PIXI.Point(8, 0), new PIXI.Point(0, -4))
        this.graphic.position.set(this.position.x - this.width / 2, this.position.y - this.height / 2)
        viewport.addChild(this.graphic)
    }
    setup() {
        this.maxSpeed = this.DNA.genes[0]
        this.maxForce = this.DNA.genes[1]
        this.viewrange = this.DNA.genes[2]
    }
    wonder() {
        let dir = this.velocity.copy().normalize()
        let center = this.position.copy().add(dir.mult(10))
        let wdelta = rand_int(-5, 5)
        let offset = new Vector2(Math.cos(wdelta), Math.sin(wdelta))
        //let rp = this.position.copy().add(this.velocity.copy().add(cp))
        return this.seek(center.add(offset))
    }
    evade(bot) {
        return this.pursue(bot).mult(-1)
    }
    pursue(bot) {
        let target = bot.position.copy()
        let future = bot.velocity.copy().mult(10)
        target.add(future)
        return this.seek(target)
    }
    flee(target) {
        return this.seek(target).mult(-1)
    }
    seek(target) {
        let desired = new Vector2(target.x - this.position.x, target.y - this.position.y)
                        .setMag(this.maxSpeed)
                        .sub(this.velocity)
                        .limit(this.maxForce)
        //desired.setMag(this.maxSpeed)
        //desired.sub(this.velocity)
        //desired.limit(this.maxForce)
        return desired
    }
    applyForce(force) {
        this.acceleration.add(force)
    }
    checkState() {
        if(this.food > Bot.maxFood) {
            this.reproduce()
        }
        if(this.food <= 0) {
            this.destroy()
        }
    }
    reproduce() {
        let children = DNA.mitosis(this.DNA)
        let c1 = new Bot(children[0], this.position.x, this.position.y)
        let c2 = new Bot(children[0], this.position.x, this.position.y)
        c1.velocity = this.velocity.copy()
        c2.velocity = this.velocity.copy().mult(-1)
        this.destroy()
        Sim.population.push(c1)
        Sim.population.push(c2)
    }
    destroy() {
        if (this.bounds.draw) {
            viewport.removeChild(this.bounds.graphic)
        }
        viewport.removeChild(this.graphic)
        for (let i = 0; i < population.length; i++) {
            if (population[i] == this) {
                population.splice(i, 1)
            }
        }
    }
    update() {
        this.checkState()
        this.food--
        if (this.position.x > Sim.world_size.width) {
            this.position.x = 0
        }
        if (this.position.x < 0) {
            this.position.x = Sim.world_size.width
        }
        if (this.position.y > Sim.world_size.height) {
            this.position.y = 0
        }
        if (this.position.y < 0) {
            this.position.y = Sim.world_size.height
        }
        let rot = this.velocity.headingRads()

        this.velocity.add(this.acceleration)
        this.velocity.limit(this.maxSpeed)
        this.position.add(this.velocity)

        // this.bounds.position.set(this.position.x, this.position.y)
        // this.bounds.rotate(rot)
        // if (this.bounds.graphic) {
        //     this.bounds.graphic.position.set(this.position.x, this.position.y)
        //     this.bounds.graphic.rotation = rot
        // }


        this.graphic.position.set(this.position.x, this.position.y)
        this.graphic.rotation = rot

        //this.view.position.set(this.position.x, this.position.y)
        //this.view.rotate(rot)
        //this.view.graphic.position.set(this.position.x, this.position.y)
        //this.view.graphic.rotation = rot

        this.acceleration.mult(0)
    }
}

