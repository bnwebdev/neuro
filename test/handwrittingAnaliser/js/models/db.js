const db = (function(){
    const db = new Dexie('hand-written-analiser-db')
    db.version(1).stores({
        examples: '++id, size, img, value',
        brains: '++id, inputSize, alpha, layers'
    })
    class dbWrapper extends EventTarget {
        constructor(storageName){
            super()
            this.storageName = storageName
        }
        get __storage(){
            return db[this.storageName]
        }
        emit(event = 'change'){
            this.dispatchEvent(new Event(`db:${this.storageName}::${event}`))
        }
        async each(callback){
            await this.__storage.each(callback)
        }
        
        async get(offset = 0, limit = 50){
            return await this.__storage.offset(offset).limit(limit).toArray()
        }
        async count(){
            return await this.__storage.count()
        }
        async add(item){
            const id = await db.__storage.add(item)
            this.emit()
            return id
        }
        async delete(id){
            await this.__storage.where({id}).delete()
            this.emit()
        }
    }
    return {
        examples: new dbWrapper('examples'),
        brains: new dbWrapper('brains')
    }
})()