class Mine {
    constructor(position) {
        this.position = position

        setTimeout(() => {
            this.display()
            projectiles.push(this)
        }, 2000)
        setTimeout(() => {
            this.delete()
        }, 30000)
    }
    display() {
        this.graphic = new PIXI.Graphics()
        this.graphic.beginFill(0xff0000)
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
    position = new Vector2(0, 0)
    velocity = new Vector2(Math.random(), Math.random())
    acceleration = new Vector2(0, 0)
    weight = 0
    maxSpeed = 0
    maxForce = 0.00
    mineCooldown = 8000

    constructor(DNA, x, y) {
        this.position.set(x, y)
        this.DNA = DNA
        this.structure = {}
        this.unpack()
        this.display()
    }
    // unpack() {
    //     let genes = this.DNA.genes.split('&')
    //     let genes2 = []
    //     for (let gene of genes) {
    //         genes2.push(gene.split('$'))
    //     }
    //     genes2.splice(0, 1)
    //     for (let i = 0; i < genes2.length; i++) {
    //         let pos = genes2[i][1].split(',')
    //         this.structure[genes2[i][1]] = {
    //             code: genes2[i][0],
    //             x: parseInt(pos[0]),
    //             y: parseInt(pos[1])
    //         }
    //         switch (genes2[i][0]) {
    //             case "A":
    //                 this.weight += 1
    //                 break

    //             case "B":
    //                 this.weight += 1
    //                 this.maxForce += 0.1
    //                 break

    //             case "C":
    //                 this.weight += 1
    //                 this.maxSpeed += 0.5
    //                 break

    //             case "D":
    //                 this.weight += 1
    //                 break

    //             case "E":
    //                 this.weight += 1
    //                 this.mineCooldown -= 500
    //                 break

    //         }
    //     }
    //     let bot = this
    //     this.mineInterval = setInterval(this.dropMine, this.mineCooldown, bot)
    // }
    unpack() {
        this.used = []
        let pos = new Vector2(0, 0)
        let dir = new Vector2(1, 0)
        for (let gene of this.DNA.genes) {
            if (DNA.DirectionalGenes.includes(gene)) {
                switch (gene) {
                    case "I":
                        dir.rotate2(90)
                        break
                    case "J":
                        dir.rotate2(-90)
                        break
                }
            } else {
                this.structure[pos.x + ',' + pos.y] = {
                    code: gene,
                    x: pos.x,
                    y: pos.y
                }
                this.used.push(pos.copy())
                pos.add(this.findNextInLength(pos.copy(), dir.copy()))
                switch (gene) {
                    case "A":
                        this.weight += 1
                        break

                    case "B":
                        this.weight += 1
                        this.maxForce += 0.1
                        break

                    case "C":
                        this.weight += 1
                        this.maxSpeed += 0.5
                        break

                    case "D":
                        this.weight += 1
                        break

                    case "E":
                        this.weight += 1
                        this.mineCooldown -= 500
                        break

                }
            }
        }
        let bot = this
        this.mineInterval = setInterval(this.dropMine, this.mineCooldown, bot)
    }
    findNextInLength(pos, dir) {
        let possible = pos.add(dir)
        if (this.used.some(elm => elm.x === possible.x && elm.x === possible.y)) {
            return this.findNextInLength(pos, dir.add(dir))
        } else {
            return dir
        }
    }
    display() {
        let max_x = -10000, max_y = -10000, min_x = 10000, min_y = 10000
        this.graphic = new PIXI.Graphics()
        for (let key in this.structure) {
            this.graphic.beginFill(Attachments[this.structure[key].code].color)
            this.graphic.drawRect(this.structure[key].x * 10, this.structure[key].y * 10, 10, 10)
            this.graphic.endFill()
            max_x = this.structure[key].x * 10 > max_x ? this.structure[key].x * 10 : max_x
            max_y = this.structure[key].y * 10 > max_y ? this.structure[key].y * 10 : max_y
            min_x = this.structure[key].x * 10 < min_x ? this.structure[key].x * 10 : min_x
            min_y = this.structure[key].y * 10 < min_y ? this.structure[key].y * 10 : min_y
        }
        max_y += 10
        max_x += 10
        this.width = max_x - min_x
        this.height = max_y - min_y
        //this.width = this.width > this.height ? this.width : this.height
        //this.height = this.height > this.width ? this.height : this.width
        this.bounds = new Polygon(this.position.copy(), [new Vector2(min_x, min_y), new Vector2(max_x, min_y), new Vector2(max_x, max_y), new Vector2(min_x, max_y)], this.width, this.height, true)
        //this.bounds.translate(-this.width / 2, -this.height / 2)
        //this.bounds.graphic.pivot.x -= this.width / 2
        //this.bounds.graphic.pivot.y -= this.height / 2

        this.view = new Polygon(this.position, [new Vector2(0, this.height), new Vector2(250, this.height), new Vector2(250, -this.height), new Vector2(0, -this.height)], null, null, false)
        //this.view.rotate(Math.PI / 2)
        this.graphic.position.set(this.position.x - this.width / 2, this.position.y - this.height / 2)
        viewport.addChild(this.graphic)
    }
    restructure() {
        let max_x = -10000, max_y = -10000, min_x = 10000, min_y = 10000
        this.graphic.clear()
        for (let key in this.structure) {
            this.graphic.beginFill(Attachments[this.structure[key].code].color)
            this.graphic.drawRect(this.structure[key].x * 10, this.structure[key].y * 10, 10, 10)
            this.graphic.endFill()
            max_x = this.structure[key].x * 10 > max_x ? this.structure[key].x * 10 : max_x
            max_y = this.structure[key].y * 10 > max_y ? this.structure[key].y * 10 : max_y
            min_x = this.structure[key].x * 10 < min_x ? this.structure[key].x * 10 : min_x
            min_y = this.structure[key].y * 10 < min_y ? this.structure[key].y * 10 : min_y
        }
        max_y += 10
        max_x += 10
        this.width = max_x - min_x
        this.height = max_y - min_y
        this.bounds.setPoints([new Vector2(min_x, min_y), new Vector2(max_x, min_y), new Vector2(max_x, max_y), new Vector2(min_x, max_y)])
    }
    dropMine(bot) {
        new Mine(bot.position.copy())
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
        let desired = new Vector2(target.x - this.position.x, target.y - this.position.y).setMag(this.maxSpeed).sub(this.velocity).limit(this.maxForce)
        //desired.setMag(this.maxSpeed)
        //desired.sub(this.velocity)
        //desired.limit(this.maxForce)
        return desired
    }
    collideWith(other) {
        if (other instanceof Mine) {
            let dist = other.position.copy().sub(this.position)
            let bestDist = Number.MAX_VALUE
            let bestTile
            for (let key in this.structure) {
                let tile_vector = new Vector2(this.structure[key].x, this.structure[key].y)
                tile_vector.setRotation(this.velocity.headingRads())
                let d = dist.dist(tile_vector)
                if (d < bestDist) {
                    bestDist = d
                    bestTile = key
                }
            }
            if (!bestTile) {
                other.delete()
                return
            }
            switch (this.structure[bestTile].code) {
                case "A":
                    this.destroy()
                    break

                case "B":
                    this.weight -= 1
                    this.maxForce -= 0.1
                    break

                case "C":
                    this.weight -= 1
                    this.maxSpeed -= 0.5
                    break

                case "D":
                    this.weight -= 1
                    break

                case "E":
                    this.weight -= 1
                    this.mineCooldown += 500
                    break
            }
            delete this.structure[bestTile]
            this.restructure()
            other.delete()
            return
        }
        if (this.justCollided) {
            this.justCollided = false
            return
        }
        this.position.sub(this.velocity.copy().mult(10))
        this.velocity.mult(-1)
        //this.acceleration.mult(0)
        this.justCollided = true
    }
    applyForce(force) {
        this.acceleration.add(force.div(this.weight))
    }
    destroy() {
        if (this.bounds.draw) {
            viewport.removeChild(this.bounds.graphic)
        }
        viewport.removeChild(this.graphic)
        clearInterval(this.mineInterval)
        for (let i = 0; i < population.length; i++) {
            if (population[i] == this) {
                population.splice(i, 1)
            }
        }
    }
    update() {
        if (this.position.x > world_size.width) {
            this.position.x = world_size.width / 2
        }
        if (this.position.x < 0) {
            this.position.x = world_size.width / 2
        }
        if (this.position.y > world_size.height) {
            this.position.y = world_size.height / 2
        }
        if (this.position.y < 0) {
            this.position.y = world_size.height / 2
        }
        let rot = this.velocity.headingRads()

        this.velocity.add(this.acceleration)
        this.velocity.limit(this.maxSpeed)
        this.position.add(this.velocity)

        this.bounds.position.set(this.position.x, this.position.y)
        this.bounds.rotate(rot)
        if (this.bounds.graphic) {
            this.bounds.graphic.position.set(this.position.x, this.position.y)
            this.bounds.graphic.rotation = rot
        }


        this.graphic.position.set(this.position.x, this.position.y)
        this.graphic.rotation = rot

        this.view.position.set(this.position.x, this.position.y)
        this.view.rotate(rot)
        //this.view.graphic.position.set(this.position.x, this.position.y)
        //this.view.graphic.rotation = rot

        this.acceleration.mult(0)
    }
}

