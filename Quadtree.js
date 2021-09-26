class rect {
    position
    dimensions
    constructor(x, y, w, h, canDraw) {
        this.position = new Vector2(x, y)
        this.dimensions = new Vector2(w, h)
        //this.draw()
        if (canDraw) {
            this.draw()
        }
    }

    draw() {
        this.box = new PIXI.Graphics()
        this.box.lineStyle(3, 0xffffff)
        this.box.drawRect(0, 0, this.dimensions.x, this.dimensions.y)
        viewport.addChild(this.box)
        //this.box.zIndex = 20
        this.box.position.set(this.position.x, this.position.y)
    }
    containsPoint(point) {
        return ((point.position.x >= this.position.x) && (point.position.x <= this.position.x + this.dimensions.x) && (point.position.y >= this.position.y) && (point.position.y <= this.position.y + this.dimensions.y))
    }
    intersectsRect(other) {
        return !(other.position.x > this.position.x + this.dimensions.x ||
            other.position.x + other.dimensions.x < this.position.x ||
            other.position.y > this.position.y + this.dimensions.y ||
            other.position.y + other.dimensions.y < this.position.y)
    }
    // intersectsLine(start, end) {
    //     if ((start.x <= this.position.x && end.x <= this.position.x) ||
    //         (start.y <= this.position.y && end.y <= this.position.y) ||
    //         (start.x >= this.position.x + this.dimensions.x && end.x >= this.position.x + this.dimensions.x) ||
    //         (start.y >= this.position.y + this.dimensions.y && end.y >= this.position.y + this.dimensions.y))
    //         return false

    //     let m = (end.y - start.y) / (end.x - start.x)
    //     let y = m * (this.position.x - start.x) + start.y

    //     if (y > this.position.y && y < this.position.y + this.dimensions.y) return true;

    //     y = m * (this.position.x + this.dimensions.x - start.x) + start.y;
    //     if (y > this.position.y && y < this.position.y + this.dimensions.y) return true;

    //     let x = (this.position.y - start.y) / m + start.x;
    //     if (x > this.position.x && x < this.position.x + this.dimensions.x) return true;

    //     x = (this.position.y + this.dimensions.y - start.y) / m + start.x;
    //     if (x > this.position.x && x < this.position.x + this.dimensions.x) return true;

    //     return false;
    // }

    intersectsLine(start, end) {

        let x1 = start.x
        let y1 = start.y
        let x2 = end.x
        let y2 = end.y
        // check if the line has hit any of the rectangle's sides
        // uses the Line/Line function below
        let left = rect.lineLineCollision(x1, y1, x2, y2, this.position.x, this.position.y, this.position.x, this.position.y + this.dimensions.y);
        let right = rect.lineLineCollision(x1, y1, x2, y2, this.position.x + this.dimensions.x, this.position.y, this.position.x + this.dimensions.x, this.position.y + this.dimensions.y);
        let top = rect.lineLineCollision(x1, y1, x2, y2, this.position.x, this.position.y, this.position.x + this.dimensions.x, this.position.y);
        let bottom = rect.lineLineCollision(x1, y1, x2, y2, this.position.x, this.position.y + this.dimensions.y, this.position.x + this.dimensions.x, this.position.y + this.dimensions.y);

        // if ANY of the above are true, the line
        // has hit the rectangle
        if (left || right || top || bottom) {
            return true;
        }
        return false;
    }

    intersectsCircle(circle) {
        let distX = Math.abs(circle.position.x - (this.position.x + this.dimensions.x / 2))
        let distY = Math.abs(circle.position.y - (this.position.y + this.dimensions.y / 2))
        if (distX > (this.dimensions.x / 2 + circle.r)) return false
        if (distY > (this.dimensions.y / 2 + circle.r)) return false
        if (distX <= (this.dimensions.x / 2)) return true
        if (distY <= (this.dimensions.y / 2)) return true

        let dx = distX - this.dimensions.x / 2
        let dy = distY - this.dimensions.y / 2
        return (dx * dx + dy * dy <= (circle.r * circle.r))
    }

    static lineLineCollision(x1, y1, x2, y2, x3, y3, x4, y4) {
        let uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
        let uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

        if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
            return true;
        }
        return false;
    }
}

class radius {
    position
    constructor(x, y, r) {
        this.position = new Vector2(x, y)
        this.r = r
    }
    within(point) {
        let dist = Math.sqrt(Math.pow((point.position.x - this.position.x), 2) + Math.pow((point.position.y - this.position.y), 2))
        return dist <= (point.size + this.r)
    }
}

class QuadTree {
    constructor(rect, n, max_depth, depth) {
        this.bounds = rect
        this.size = n
        this.max_depth = max_depth
        this.depth = depth
        this.objects = []
    }

    split() {
        let rectTL = new Box(new Vector2(this.bounds.position.x, this.bounds.position.y), this.bounds.width / 2, this.bounds.height / 2)
        let rectTR = new Box(new Vector2(this.bounds.position.x + this.bounds.width / 2, this.bounds.position.y), this.bounds.width / 2, this.bounds.height / 2)
        let rectBL = new Box(new Vector2(this.bounds.position.x, this.bounds.position.y + this.bounds.height / 2), this.bounds.width / 2, this.bounds.height / 2)
        let rectBR = new Box(new Vector2(this.bounds.position.x + this.bounds.width / 2, this.bounds.position.y + this.bounds.height / 2), this.bounds.width / 2, this.bounds.height / 2)
        this.boxTL = new QuadTree(rectTL, this.size, this.max_depth, this.depth + 1)
        this.boxTR = new QuadTree(rectTR, this.size, this.max_depth, this.depth + 1)
        this.boxBL = new QuadTree(rectBL, this.size, this.max_depth, this.depth + 1)
        this.boxBR = new QuadTree(rectBR, this.size, this.max_depth, this.depth + 1)
        for (let o of this.objects) {
            this.boxTL.append(o)
            this.boxTR.append(o)
            this.boxBL.append(o)
            this.boxBR.append(o)
        }
        this.objects = []
    }

    append(object) {
        if (!object.bounds) {
            return false
        }
        if (!this.bounds.intersectsRect(object.bounds)) {
            //console.log(object)
            return false
        }
        if (this.objects.length < this.size && !this.isSplit) {
            this.objects.push(object)
        } else {
            if (!this.isSplit && this.depth < this.max_depth) {
                this.split()
                this.isSplit = true
            } else {
                this.objects.push(object)
                //console.log(this.objects)
                return
            }
            this.boxTL.append(object)
            this.boxTR.append(object)
            this.boxBL.append(object)
            this.boxBR.append(object)
        }
    }
    query(range, type = null) {
        let result = []
        if (!this.bounds.intersectsRect(range)) return result


        for (let o of this.objects) {
            if (range.intersectsRect(o.bounds)) {
                if (type) {
                    if (type == "Bot") {
                        if (o instanceof Bot) {
                            result.push(o)
                        }
                    }
                } else {
                    result.push(o)
                }
            }
        }
        if (!this.isSplit) return result

        result = result.concat(this.boxTL.query(range))
        result = result.concat(this.boxTR.query(range))
        result = result.concat(this.boxBL.query(range))
        result = result.concat(this.boxBR.query(range))
        // let tl = this.boxTL.query(range)
        // let tr = this.boxTR.query(range)
        // let bl = this.boxBL.query(range)
        // let br = this.boxBR.query(range)
        // tl.forEach(result.add, result)
        // tr.forEach(result.add, result)
        // bl.forEach(result.add, result)
        // br.forEach(result.add, result)
        return result
    }

    clear() {
        this.objects = [];
        if (this.isSplit) {
            this.boxTL.clear()
            this.boxTR.clear()
            this.boxBL.clear()
            this.boxBR.clear()
        }
        this.boxTL = undefined
        this.boxTR = undefined
        this.boxBL = undefined
        this.boxBR = undefined
        this.isSplit = false
    }
}