class Brain {
    static async create(alpha, layouts){
        layouts = JSON.stringify(layouts)
        const result = await $.post('/neuro/config', {alpha, layouts})
        return Brain.checkResult(result)
    }
    static async save(byId = 'current'){
        const result = await $.post(`/neuro/save/${byId}`)
        return Brain.checkResult(result)
    }
    static async checkout(id){
        const result = await $.post(`/neuro/checkout/${id}`)
        return Brain.checkResult(result)
    }
    static async neuro(){
        return await $.get(`/neuro`)
    }
    static checkResult(result){
        if(result !== 'ok'){
            throw result
        }
        return result
    }
}
class ThenCatchLogger {
    constructor(obj){this.obj = obj}
    try(key, ...args){
        this.obj[key](...args).then(console.log).catch(console.error)
    }
}
const tcbrain = new ThenCatchLogger(Brain)