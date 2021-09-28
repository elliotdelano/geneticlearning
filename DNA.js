class DNA {
    static mutationRate = 0.02;
    constructor(genesIn) {
        this.genes = genesIn || [2.0, 0.1, 100]
    }
    static mitosis(old) {
        let childA = DNA.mutate([].concat(old.genes))
        let childB = DNA.mutate([].concat(old.genes))
        
        return { a: new DNA(childA), b: new DNA(childB) }
    }
    static mutate(genesIn) {
        let genesOut = []
        for(let gene of genesIn) {
            if(Math.random() > 1-DNA.mutationRate) {
                genesOut.push(gene + gene*0.1*rand_int(-1, 1))
            }
        }
        return genesOut
    }
    getFitness() {
        return sigmoid(this.genes[0]) + sigmoid(this.genes[1]) + sigmoid(this.genes[2])
    }
}