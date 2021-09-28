class DNA {
    static mutationRate = 0.9;
    constructor(genesIn) {
        this.genes = genesIn || [0.5, 0.01, 100]
    }
    static mitosis(old) {
        let childA = DNA.mutate([].concat(old.genes))
        let childB = DNA.mutate([].concat(old.genes))

        return { a: new DNA(childA), b: new DNA(childB) }
    }
    static mutate(genesIn) {
        let genesOut = []
        for (let gene of genesIn) {
            if (Math.random() > 1 - DNA.mutationRate) {
                let p = Math.random() > 0.5 ? -1 : 1
                genesOut.push(gene + gene * 0.1 * p)
            } else {
                genesOut.push(gene)
            }
        }
        return genesOut
    }
    getFitness() {
        return sigmoid(this.genes[0]) + sigmoid(this.genes[1]) + sigmoid(this.genes[2])
        //return this.genes[0] + this.genes[1] + this.genes[2]
    }
}