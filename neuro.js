const Matrix = require('./lib/matrix/matrix')

function rand(min, max){
  return min + Math.random()*(max - min)
}
function initLayersByArray(layers){
  let prev, result = []
  for(let i = 0; i < layers.length; i++){
    if(i !== 0){
      result.push(new Matrix(layers[i], prev).modify(()=>rand(-0.5, 0.5)))
    }
    prev = layers[i]
  }
  return result
}
class Brain {
  constructor(alpha, ...layers){
    this.alpha = alpha
    this.activate = function(x){
      return 1 / (1 + Math.pow(Math.E, -x))
    }
    this.layers = initLayersByArray(layers)
  }
  learn(input, output){
    const inputs = []
    const outputs = []
    let errors = []
    let f = true
    for(let w of this.layers){
      if(f){
        inputs.push(input)
	f = false
      } else {
        inputs.push(outputs[outputs.length - 1])
      }
      const inp = inputs[inputs.length - 1]
      outputs.push(w.mult(inp).modify(activate))
    }
    f = true
    for(let i = this.layers.length - 1; i >= 0; --i){
      if(f){
        errors.push(output.sub(outputs[i]))
	f = false
      } else {
        errors.push(this.layers[i + 1].transpose().mult(errors[errors.length - 1]))
      }
    }
    errors = errors.reverse()
    for(let i = 0; i < this.layers.length; i++){
      update(this.alpha, inputs[i], this.layers[i], outputs[i], errors[i])
    }
    return errors[errors.length - 1]
  }
  query(input){
    const activate = this.activate
    return this.layers.reduce(function(inp, weight){
      return weight.mult(inp).modify(activate)    
    }, input)
  }
}

function fillOnes(){return 1}

function update(k, input, weight, output, errors){
  const tinp = input.transpose()
  const dw = output.copy().modify(function(out, i, j){
    return errors[i][j] * out * (1 - out)
  }).mult(tinp).modifyMult(k)
  weight.modifyAdd(dw)
}

module.exports = Brain
