class DNA {
    static mutationRate = 0.2;
    static mutations = [0.1, 0.005, 10]
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
        for (let i = 0; i < genesIn.length; i++) {
            if (Math.random() > 1 - DNA.mutationRate) {
                let p = Math.random() > 0.5 ? -1 : 1
                genesOut.push(genesIn[i] + DNA.mutations[i] * p)
            } else {
                genesOut.push(genesIn[i])
            }
        }
        return genesOut
    }
    getFitness() {
        return sigmoid(this.genes[0] / 0.5) + sigmoid(this.genes[1] / 0.01) + sigmoid(this.genes[2] / 100)
        //return this.genes[0] + this.genes[1] + this.genes[2]
    }
}