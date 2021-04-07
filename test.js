const Brain = require('./neuro.js')
const Matrix = require('./lib/matrix/matrix')

const n = new Brain(0.4, 4, 3, 2)
const result = n.query(new Matrix(4, 1).modify(p=>1))
console.log(result.toString())
