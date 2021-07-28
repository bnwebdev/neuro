const db = (function(){
    const db = new Dexie('hand-written-analiser-db')
    db.version(1).stores({
        examples: '++id, img, value'
    })
    class dbWrapper extends EventTarget {
        emit(event = 'db:change'){
            this.dispatchEvent(new Event(event))
        }
        async add(img, value){
            const id = await db.examples.add({img, value})
            this.emit()
            return id 
        }
        async delete(id){
            await db.examples.where({id}).delete()
            this.emit()
        }
        async each(callback){
            await db.examples.each(callback)
        }
        async get(offset, count){
            return await db.examples.offset(offset).limit(count).toArray()
        }
        async count(){
            return await db.count()
        }
    }
    return new dbWrapper()
})()