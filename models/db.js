const path = require('path')
const fs = require('fs')

module.exports = class Db {
    constructor({basepath, handlerToSave = data=>data, handlerToLoad = data=>data}){
        this.basepath = basepath
        this.handlerToLoad = handlerToLoad
        this.handlerToSave = handlerToSave
    }
    load(from){
        return new Promise((res, rej)=>{
            fs.readFile(path.join(this.basepath, from), 'utf-8', (err, data)=>{
                if(err){
                    rej(err)
                } else {
                    res(this.handlerToLoad(data))
                }
            })
        })
    }
    save(to, data){
        return new Promise((res, rej)=>{
            fs.writeFile(path.join(this.basepath, to), this.handlerToSave(data), (err)=>{
                if(err){
                    rej(err)
                } else {
                    res()
                }
            })
        })
    }
}