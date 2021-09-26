const shader = PIXI.Shader.from(`

    precision mediump float;
    attribute vec2 aVertexPosition;

    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;

    void main() {
        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    }`,

    `precision mediump float;

    void main() {
        gl_FragColor = vec4(0.5, .2, .2, 1.0);
    }

`);

let create2DArray = (width, height) => {
    let array = new Array(width)
    for (let i = 0; i < width; i++) {
        array[i] = new Array(height)
    }
    return array
}

class World {
    static CHUNK_WIDTH = 16;
    static CHUNK_HEIGHT = 16;
    static TILE_SIZE = 32;

    static WORLD_WIDTH = 16;
    static WORLD_HEIGHT = 16;

    constructor(noise_map) {
        this.noise_map = noise_map
        this.width = World.WORLD_WIDTH * World.CHUNK_WIDTH
        this.height = World.WORLD_HEIGHT * World.CHUNK_HEIGHT
        this.map = create2DArray(this.width, this.height)
    }

    region = class {
        constructor(points, parent) {
            this.points = points
            this.edges = []
            this.connections = []
            this.size = this.points.length
            this.center = { x: 0, y: 0 }
            this.isLargest = false
            this.isAccessible = false

            for (let pt of this.points) {
                this.center.x += pt.x
                this.center.y += pt.y
                if (parent.isEdge(pt)) {
                    this.edges.push(pt)
                }
            }
            this.center.x /= this.size
            this.center.y /= this.size
        }

        static ConnectRooms(a, b) {
            if (a.isAccessible) {
                b.setAccessable()
            } else if (b.isAccessible) {
                a.setAccessable()
            }
            a.connections.push(b)
            b.connections.push(a)
        }
        hasConnection(other) {
            return this.connections.includes(other)
        }
        setAccessable() {
            if (!this.isAccessible) {
                this.isAccessible = true
                for (let room of this.connections) {
                    room.setAccessable()
                }
            }
        }
    }

    createNoiseMap() {
        for (let x = 0; x < this.map.length; x++) {
            for (let y = 0; y < this.map[x].length; y++) {
                let n = this.noise_map.noise2D(x / 10, y / 10)

                n = x < World.CHUNK_WIDTH ? n += 3 * ((World.CHUNK_WIDTH - x) / World.CHUNK_WIDTH) : n
                n = y < World.CHUNK_HEIGHT ? n += 3 * ((World.CHUNK_HEIGHT - y) / World.CHUNK_HEIGHT) : n
                n = x > this.width - World.CHUNK_WIDTH ? n += 3 * ((x - (this.width - World.CHUNK_WIDTH)) / World.CHUNK_WIDTH) : n
                n = y > this.height - World.CHUNK_HEIGHT ? n += 3 * ((y - (this.height - World.CHUNK_HEIGHT)) / World.CHUNK_HEIGHT) : n

                let density = x > this.width / 2 ? (Math.abs(x - this.width) / (this.width / 2)) / 2 : x / (this.width / 2) / 2
                density += y > this.height / 2 ? (Math.abs(y - this.height) / (this.height / 2)) / 2 : y / (this.height / 2) / 2
                if (n > density) {
                    this.map[x][y] = { x: x, y: y, value: 1 }
                } else {
                    this.map[x][y] = { x: x, y: y, value: 0 }
                }
            }
        }
    }

    getPoint(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false
        return this.map[x][y]
    }

    getAdjacent(point) {
        let adj = []
        let north = this.getPoint(point.x, point.y + 1)
        let east = this.getPoint(point.x + 1, point.y)
        let south = this.getPoint(point.x, point.y - 1)
        let west = this.getPoint(point.x - 1, point.y)
        if (north) if (north.value == 0) {
            adj.push(north)
        }
        if (east) if (east.value == 0) {
            adj.push(east)
        }
        if (south) if (south.value == 0) {
            adj.push(south)
        }
        if (west) if (west.value == 0) {
            adj.push(west)
        }
        return adj
    }

    isEdge(point) {
        let north = this.getPoint(point.x, point.y + 1)
        let east = this.getPoint(point.x + 1, point.y)
        let south = this.getPoint(point.x, point.y - 1)
        let west = this.getPoint(point.x - 1, point.y)
        if (north) if (north.value == 1) return true
        if (east) if (east.value == 1) return true
        if (south) if (south.value == 1) return true
        if (west) if (west.value == 1) return true
        return false
    }

    defineRegions() {
        this.areas = []
        for (let x = 0; x < this.map.length; x += 1) {
            for (let y = 0; y < this.map[x].length; y += 1) {
                if (this.map[x][y].value == 0) {
                    if (this.areas.length > 0) if (this.areas.some(area => { if (area.points) return area.points.includes(this.map[x][y]) })) {
                        continue
                    }
                    this.areas.push(new this.region(this.findRegion(this.map[x][y]), this))
                }
            }
        }
        // let debug = new PIXI.Graphics()
        //debug.beginFill(0x00ff00)
        this.areas.sort((elm1, elm2) => elm2.size - elm1.size)
        this.areas[0].isLargest = true
        this.areas[0].isAccessible = true

        for (let i = this.areas.length - 1; i >= 0; i--) {

            if (this.areas[i].size < 200) {
                for (let pt of this.areas[i].points) {
                    this.map[pt.x][pt.y].value = 1
                }
                this.areas.splice(i, 1)
            }
        }
        //debug.endFill()
        // debug.lineStyle(4, 0x00ff00)
        for (let area of this.areas) {
            let dist = 1000000000000
            let bestA
            let bestB
            let connectRegion
            for (let a of this.areas) {
                if (area == a) { continue }
                if (area.hasConnection(a)) { continue }
                for (let etA of area.edges) {
                    for (let etB of a.edges) {
                        let td = fast_dist(etA.x, etA.y, etB.x, etB.y)
                        //td -= a.size / Math.pow(td, 2)
                        if (td < dist) {
                            dist = td
                            bestA = etA
                            bestB = etB
                            connectRegion = a
                        }
                    }
                }
            }
            if (connectRegion) this.region.ConnectRooms(area, connectRegion)
            if (bestA && bestB) {
                // debug.moveTo(bestA.x * World.TILE_SIZE, bestA.y * World.TILE_SIZE)
                // debug.lineTo(bestB.x * World.TILE_SIZE, bestB.y * World.TILE_SIZE)

                let line = this.createLine(bestA, bestB)

                for (let point of line) {
                    this.clearRadius(point.x, point.y, 5)
                }
            }
        }

        // viewport.sortableChildren = true
        // debug.zIndex = 10
        // viewport.addChild(debug)
        //console.log(this.areas)
    }
    findRegion(point) {
        let queue = []
        let used = []

        queue.push(point)
        used.push(point)

        while (queue.length > 0) {
            let rel_queue = []
            for (let pt of queue) {
                let adj = this.getAdjacent(pt)
                for (let a of adj) {
                    if (!used.includes(a)) {
                        rel_queue.push(a)
                        used.push(a)
                    }
                }
            }
            queue = rel_queue
        }
        //console.log(used)
        if (queue.length < 1) return used

    }
    createLine(start, end) {
        let result = []
        let x = start.x
        let y = start.y
        let dx = end.x - start.x
        let dy = end.y - start.y

        let inverted = false
        let step = Math.sign(dx)
        let gradientStep = Math.sign(dy)

        let longest = Math.abs(dx)
        let shortest = Math.abs(dy)

        if (longest < shortest) {
            inverted = true
            longest = Math.abs(dy)
            shortest = Math.abs(dx)

            step = Math.sign(dy)
            gradientStep = Math.sign(dx)
        }
        let gradientAccumulation = longest / 2
        for (let i = 0; i < longest; i++) {
            result.push({ x: x, y: y })
            if (inverted) {
                y += step
            } else {
                x += step
            }

            gradientAccumulation += shortest
            if (gradientAccumulation >= longest) {
                if (inverted) {
                    x += gradientStep
                } else {
                    y += gradientStep
                }
                gradientAccumulation -= longest
            }
        }
        return result
    }
    clearRadius(x, y, radius) {
        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j < radius; j++) {
                if (i * i + j * j <= radius * radius) {
                    let point = this.getPoint(x + i, y + j)
                    if (point) {
                        this.map[point.x][point.y].value = 0
                    }
                }
            }
        }
    }
    searchRadius(x, y, radius) {
        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j < radius; j++) {
                if (i * i + j * j <= radius * radius) {
                    let point = this.getPoint(x + i, y + j)
                    if (point) if (point.value == 1) {
                        return false
                    }
                }
            }
        }
        return true
    }
    findSpawnPoints(radius) {
        let result = []
        for (let x = 0; x < this.width; x += radius * 2) {
            for (let y = 0; y < this.height; y += radius * 2) {
                let pt = this.getPoint(x, y)
                if (pt.value == 0) {
                    if (this.searchRadius(x, y, radius)) {
                        result.push(pt)
                    }
                }
            }
        }
        return result
    }
}

class chunk {
    constructor(x, y, world) {
        this.chunkX = x;
        this.chunkY = y;
        this.chunk = new PIXI.Container();
        this.chunk.position.x = World.CHUNK_WIDTH * x * World.TILE_SIZE;
        this.chunk.position.y = World.CHUNK_HEIGHT * y * World.TILE_SIZE;
        this.bounds = new Box(new Vector2(this.chunk.position.x, this.chunk.position.y), World.CHUNK_WIDTH * World.TILE_SIZE, World.CHUNK_HEIGHT * World.TILE_SIZE)

        this.points = create2DArray(World.CHUNK_WIDTH, World.CHUNK_HEIGHT);
        this.geos = [];
        this.hitbox = [];

        this.debug = new PIXI.Graphics();

        for (let i = 0; i < World.CHUNK_WIDTH; i++) {
            for (let j = 0; j < World.CHUNK_HEIGHT; j++) {
                let xO = i + (x * World.CHUNK_WIDTH)
                let yO = j + (y * World.CHUNK_HEIGHT)
                this.points[i][j] = { x: i, y: j, value: world.map[xO][yO].value }
            }
        }
    }

    show() {
        viewport.addChild(this.chunk);
    }
    hide() {
        viewport.removeChild(this.chunk);
    }
    clean() {
        this.hide()
        if (this.colliders) {
            if (this.colliders.length > 0) {
                for (let box of this.colliders) {
                    viewport.removeChild(box.graphic)
                }
            }
        }
    }

    generateGeometry() {
        this.chunk.removeChild(this.m);
        this.geos = [];
        this.hitbox = [];

        for (let x = 0; x < this.points.length; x++) {
            for (let y = 0; y < this.points[x].length; y++) {
                var posX = this.points[x][y].x * World.TILE_SIZE;
                var posY = this.points[x][y].y * World.TILE_SIZE;
                var a = [posX, posY - World.TILE_SIZE / 2];
                var b = [posX + World.TILE_SIZE / 2, posY - World.TILE_SIZE];
                var c = [posX + World.TILE_SIZE, posY - World.TILE_SIZE / 2];
                var d = [posX + World.TILE_SIZE / 2, posY];

                var p2 = this.getPoint(this.points[x][y].x, this.points[x][y].y - 1);
                var p3 = this.getPoint(this.points[x][y].x + 1, this.points[x][y].y - 1);
                var p4 = this.getPoint(this.points[x][y].x + 1, this.points[x][y].y);

                var mode = getTileState(this.points[x][y].value, p2.value, p3.value, p4.value);

                switch (mode) {
                    //1
                    case 8:
                        var g = new PIXI.Geometry()
                            .addAttribute('aVertexPosition', [
                                posX, posY, a[0], a[1], d[0], d[1]
                            ]);
                        this.geos.push(g);
                        //console.log(mode);
                        this.hitbox.push(a);
                        this.hitbox.push(d);
                        break;

                    //2
                    case 4:
                        var g = new PIXI.Geometry()
                            .addAttribute('aVertexPosition', [
                                a[0], a[1], posX, posY - World.TILE_SIZE, b[0], b[1]
                            ]);
                        this.geos.push(g);
                        this.hitbox.push(a);
                        this.hitbox.push(b);
                        //console.log(mode);
                        break;

                    //3
                    case 12:
                        var g = new PIXI.Geometry()
                            .addAttribute('aVertexPosition', [
                                posX, posY, posX, posY - World.TILE_SIZE, b[0], b[1],
                                posX, posY, d[0], d[1], b[0], b[1]
                            ]);
                        this.geos.push(g);
                        this.hitbox.push(b);
                        this.hitbox.push(d);
                        //console.log(mode);
                        break;

                    //4
                    case 2:
                        var g = new PIXI.Geometry()
                            .addAttribute('aVertexPosition', [
                                b[0], b[1], posX + World.TILE_SIZE, posY - World.TILE_SIZE, c[0], c[1]
                            ]);
                        this.geos.push(g);
                        this.hitbox.push(b);
                        this.hitbox.push(c);
                        //console.log(mode);
                        break;

                    //5
                    case 10:
                        var g = new PIXI.Geometry()
                            .addAttribute('aVertexPosition', [
                                posX, posY, a[0], a[1], b[0], b[1],
                                posX, posY, b[0], b[1], posX + World.TILE_SIZE, posY - World.TILE_SIZE,
                                posX, posY, d[0], d[1], posX + World.TILE_SIZE, posY - World.TILE_SIZE,
                                d[0], d[1], c[0], c[1], posX + World.TILE_SIZE, posY - World.TILE_SIZE
                            ]);
                        this.geos.push(g);
                        this.hitbox.push(a);
                        this.hitbox.push(b);
                        this.hitbox.push(c);
                        this.hitbox.push(d);
                        //console.log(mode);
                        break;

                    //6
                    case 6:
                        var g = new PIXI.Geometry()
                            .addAttribute('aVertexPosition', [
                                a[0], a[1], posX, posY - World.TILE_SIZE, posX + World.TILE_SIZE, posY - World.TILE_SIZE,
                                a[0], a[1], c[0], c[1], posX + World.TILE_SIZE, posY - World.TILE_SIZE
                            ]);
                        this.geos.push(g);
                        this.hitbox.push(a);
                        this.hitbox.push(c);
                        //console.log(mode);
                        break;

                    //7
                    case 14:
                        var g = new PIXI.Geometry()
                            .addAttribute('aVertexPosition', [
                                posX, posY, posX, posY - World.TILE_SIZE, d[0], d[1],
                                c[0], c[1], posX, posY - World.TILE_SIZE, d[0], d[1],
                                posX, posY - World.TILE_SIZE, posX + World.TILE_SIZE, posY - World.TILE_SIZE, c[0], c[1]
                            ]);
                        this.geos.push(g);
                        this.hitbox.push(c);
                        this.hitbox.push(d);
                        //console.log(mode);
                        break;

                    //8
                    case 1:
                        var g = new PIXI.Geometry()
                            .addAttribute('aVertexPosition', [
                                d[0], d[1], c[0], c[1], posX + World.TILE_SIZE, posY
                            ]);
                        this.geos.push(g);
                        this.hitbox.push(c);
                        this.hitbox.push(d);
                        //console.log(mode);
                        break;

                    //9
                    case 9:
                        var g = new PIXI.Geometry()
                            .addAttribute('aVertexPosition', [
                                posX, posY, a[0], a[1], posX + World.TILE_SIZE, posY,
                                c[0], c[1], a[0], a[1], posX + World.TILE_SIZE, posY
                            ]);
                        this.geos.push(g);
                        this.hitbox.push(a);
                        this.hitbox.push(c);
                        //console.log(mode);
                        break;

                    //10
                    case 5:
                        var g = new PIXI.Geometry()
                            .addAttribute('aVertexPosition', [
                                a[0], a[1], d[0], d[1], posX + World.TILE_SIZE, posY,
                                a[0], a[1], posX, posY - World.TILE_SIZE, posX + World.TILE_SIZE, posY,
                                posX, posY - World.TILE_SIZE, posX + World.TILE_SIZE, posY, c[0], c[1],
                                posX, posY - World.TILE_SIZE, b[0], b[1], c[0], c[1]
                            ]);
                        this.geos.push(g);

                        this.hitbox.push(b);
                        this.hitbox.push(c);
                        this.hitbox.push(a);
                        this.hitbox.push(d);
                        //console.log(mode);
                        break;
                    //11
                    case 13:
                        var g = new PIXI.Geometry()
                            .addAttribute('aVertexPosition', [
                                posX, posY, posX, posY - World.TILE_SIZE, b[0], b[1],
                                c[0], c[1], posX, posY, b[0], b[1],
                                posX, posY, posX + World.TILE_SIZE, posY, c[0], c[1]
                            ]);
                        this.geos.push(g);
                        this.hitbox.push(b);
                        this.hitbox.push(c);
                        //console.log(mode);
                        break;

                    //12
                    case 3:
                        var g = new PIXI.Geometry()
                            .addAttribute('aVertexPosition', [
                                d[0], d[1], b[0], b[1], posX + World.TILE_SIZE, posY - World.TILE_SIZE,
                                d[0], d[1], posX + World.TILE_SIZE, posY, posX + World.TILE_SIZE, posY - World.TILE_SIZE
                            ]);
                        this.geos.push(g);
                        this.hitbox.push(b);
                        this.hitbox.push(d);
                        //console.log(mode);
                        break;

                    //13
                    case 11:
                        var g = new PIXI.Geometry()
                            .addAttribute('aVertexPosition', [
                                posX, posY, a[0], a[1], posX + World.TILE_SIZE, posY,
                                a[0], a[1], b[0], b[1], posX + World.TILE_SIZE, posY,
                                b[0], b[1], posX + World.TILE_SIZE, posY - World.TILE_SIZE, posX + World.TILE_SIZE, posY
                            ]);
                        this.geos.push(g);
                        this.hitbox.push(a);
                        this.hitbox.push(b);
                        //console.log(mode);
                        break;

                    //14
                    case 7:
                        var g = new PIXI.Geometry()
                            .addAttribute('aVertexPosition', [
                                a[0], a[1], posX, posY - World.TILE_SIZE, posX + World.TILE_SIZE, posY - World.TILE_SIZE,
                                a[0], a[1], d[0], d[1], posX + World.TILE_SIZE, posY - World.TILE_SIZE,
                                posX + World.TILE_SIZE, posY, d[0], d[1], posX + World.TILE_SIZE, posY - World.TILE_SIZE
                            ]);
                        this.geos.push(g);
                        this.hitbox.push(a);
                        this.hitbox.push(d);
                        //console.log(mode);
                        break;

                    case 15:
                        var g = new PIXI.Geometry()
                            .addAttribute('aVertexPosition', [
                                posX, posY, posX, posY - World.TILE_SIZE, posX + World.TILE_SIZE, posY - World.TILE_SIZE, posX + World.TILE_SIZE, posY, posX, posY, posX + World.TILE_SIZE, posY - World.TILE_SIZE
                            ]);
                        this.geos.push(g);
                        //console.log(mode);
                        break;

                } // end of switch
            } //end of y for loop
        } // end of x for loop
        if (this.geos.length < 1) return
        this.Geometry = PIXI.Geometry.merge(this.geos);
        this.m = new PIXI.Mesh(this.Geometry, shader);
        this.chunk.addChild(this.m);

        this.colliders = []
        for (let i = 0; i < this.hitbox.length; i += 2) {
            if (i >= this.hitbox.length - 1) continue
            //let y = this.hitbox[i][1] < this.hitbox[i + 1][1] ? this.hitbox[i][1] : this.hitbox[i + 1][1]
            //let x = this.hitbox[i][0] < this.hitbox[i + 1][0] ? this.hitbox[i][0] : this.hitbox[i + 1][0]
            this.colliders.push(new Polygon(new Vector2(this.hitbox[i][0] + this.chunk.position.x, this.hitbox[i][1] + this.chunk.position.y), [new Vector2(), new Vector2(this.hitbox[i + 1][0], this.hitbox[i + 1][1]).sub(new Vector2(this.hitbox[i][0], this.hitbox[i][1]))], null, null, true))
        }

        // collider debug
        // this.debug.clear();
        // this.debug.lineStyle(1, 0xffffff);

        // for (var i = 0; i < this.hitbox.length; i += 2) {
        //     this.debug.moveTo(this.hitbox[i][0], this.hitbox[i][1]);
        //     if (i < this.hitbox.length - 1) {
        //         this.debug.lineTo(this.hitbox[i + 1][0], this.hitbox[i + 1][1]);
        //     }
        // }
        // this.chunk.addChild(this.debug);
        // end collider debug
    }

    getPoint(x, y) {
        if (x >= World.CHUNK_WIDTH) {
            let c = getChunkFromPos(this.chunkX + 1, this.chunkY)
            if (c) {
                return c.getPoint(0, y);
            }
        }
        if (y < 0) {
            let c = getChunkFromPos(this.chunkX, this.chunkY - 1)
            if (c) {
                return c.getPoint(x, World.CHUNK_HEIGHT - 1);
            }
        }
        if (x < 0 || y < 0) { return { x: 0, y: 0, value: 0 } }
        if (!this.points[x]) {
            return { x: 0, y: 0, value: 0 }
        }
        //console.log(this.points)
        let p = this.points[x][y]
        if (p) {
            //console.log(p);
            return p;
        } //else
        return { x: 0, y: 0, value: 0 }
    }
}

function setup_map() {
    if (chunks.length > 0) {
        for (let x = 0; x < chunks.length; x++) {
            for (let y = 0; y < chunks[x].length; y++) {
                chunks[x][y].clean()
            }
        }
        chunks = []
    }
    const simplex = new SimplexNoise()
    const world_map = new World(simplex)
    world_map.createNoiseMap()
    world_map.defineRegions()


    // let gizmo = new PIXI.Graphics()
    // gizmo.beginFill(0x00ff00)
    // for (let pt of spawns) {
    //     gizmo.drawCircle(pt.x * World.TILE_SIZE, pt.y * World.TILE_SIZE, 3)
    // }
    // viewport.addChild(gizmo)

    chunks = create2DArray(World.WORLD_WIDTH, World.WORLD_HEIGHT)
    for (let x = 0; x < World.WORLD_WIDTH; x++) {
        for (let y = 0; y < World.WORLD_HEIGHT; y++) {
            chunks[x][y] = new chunk(x, y, world_map);
        }
    }

    for (let x = 0; x < chunks.length; x++) {
        for (let y = 0; y < chunks[x].length; y++) {
            chunks[x][y].show()
            chunks[x][y].generateGeometry();
        }
    }
    return world_map.findSpawnPoints(3)
}

function getChunkFromPos(x, y) {
    if (x < 0 || y < 0 || x >= World.WORLD_WIDTH || y >= World.WORLD_WIDTH) return false
    return chunks[x][y]
}

function getTileState(a, b, c, d) {
    return a * 8 + b * 4 + c * 2 + d * 1;
}

function distance(x1, y1, x2, y2) {
    return Math.hypot((x1 - x2), (y1 - y2));
}

function fast_dist(x1, y1, x2, y2) {
    return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)
}