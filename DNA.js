class DNA {
    static DirectionalGenes = "IJ"
    constructor(genesIn) {

        this.adjacency = [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }]
        this.used = [{ x: 0, y: 0 }]
        this.genes = genesIn || this.rand_struct()
        console.log(this.genes)
    }
    static crossover(a, b) {
        let length = a.genes.length > b.genes.length ? a.genes.length : b.genes.length
        let new_genome = ""
        for (let i = 0; i < length; i++) {
            if (i == 0) { new_genome += "A"; continue }
            let geneA = a.genes.charAt(i)
            let geneB = b.genes.charAt(i)
            if (Math.random() > 0.97) {
                new_genome += randomProperty(AttachmentPool).code
            } else {
                if (Math.random() > 0.5) {
                    if (geneA) new_genome += geneA
                } else {
                    if (geneB) new_genome += geneB
                }
            }
        }
        let rnd = Math.random()
        if (rnd > 0.75) {
            new_genome += randomProperty(AttachmentPool).code
        } else if (rnd > 0.5) {
            new_genome = new_genome.slice(0, new_genome.length - 2)
        }
        return new DNA(new_genome)
    }
    // rand_struct() {
    //     let length = rand_int(3, 10)
    //     let dna_strand = "&A$0,0"
    //     for (let i = 0; i < length; i++) {
    //         dna_strand = dna_strand + this.rand_struct_genome()
    //     }
    //     return dna_strand
    // }
    // rand_struct_genome() {
    //     let p = this.rand_adj()
    //     let pos = "$" + p.x + ',' + p.y
    //     return "&" + randomProperty(AttachmentPool).code + pos
    // }
    rand_struct() {
        let length = rand_int(3, 20)
        let dna_strand = "A"
        for (let i = 0; i < length; i++) {
            dna_strand = dna_strand + this.rand_struct_genome()
        }
        return dna_strand
    }
    rand_struct_genome() {
        return randomProperty(AttachmentPool).code
    }
    rand_adj() {
        let pos = this.adjacency.splice(Math.floor(Math.random() * this.adjacency.length), 1)[0]
        let neighbors = [{ x: pos.x, y: pos.y + 1 }, { x: pos.x + 1, y: pos.y }, { x: pos.x, y: pos.y - 1 }, { x: pos.x - 1, y: pos.y }]
        this.used.push(pos)
        for (let n of neighbors) {
            if (!this.used.some(item => (item.x === n.x && item.y === n.y))) {
                this.adjacency.push(n)
            }
        }
        return pos
    }
    clone() {
        return new DNA(this.genes)
    }
}


const Attachments = {
    A: {
        code: "A",
        name: "core",
        health: 20,
        color: 0xffff00
    },
    B: {
        code: "B",
        name: "wheel",
        health: 5,
        color: 0xff0000
    },
    C: {
        code: "C",
        name: "engine",
        health: 5,
        color: 0xff00ff
    },
    D: {
        code: "D",
        name: "steel",
        health: 30,
        color: 0xffffff
    },
    E: {
        code: "E",
        name: "pewpew",
        health: 5,
        color: 0xD35000
    },

    //directional genes
    I: {
        code: "I"
    },
    J: {
        code: "J"
    }
}

let AttachmentPool = JSON.parse(JSON.stringify(Attachments))
delete AttachmentPool.A