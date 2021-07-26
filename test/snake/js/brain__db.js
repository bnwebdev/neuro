const brainDB = (function(){
    const db = new Dexie('brain-db')
    db.version(1).stores({
        brains: '++id, brain, generation, info',
        bests: 'id'
    })

    async function load(id){
        const fromDB = await getDBBrainItem(id)
        if(!fromDB) return null;
        const brainJson = fromDB.brain
        const brain = JSON.parse(brainJson)
        const result = new Brain(brain.alpha)
        result.layers = brain.layers.map(Matrix.from)
        return result
    }
    async function save({brain, generation = null, id, info = ''} = {}){
        await db.brains.put({id, brain: JSON.stringify(brain), generation, info})
    }
    async function getDBBrainItem(id){
        return await db.brains.where({id}).first()
    }
    async function softClear(){
        const bestIds = await getBestIds()
        await db.brains.where('id').noneOf(bestIds).delete()
    }
    async function hardClear(){
        await db.brains.clear()
        await db.bests.clear()
    }
    async function getBestIds(){
        return (await getBests()).map(o=>o.id)
    }
    function getBests(){
        return db.bests.toArray()
    }
    async function saveAsBest(id){
        const candidate = await load(id)
        if(!candidate) throw new Error(`Candidate undefined`)
        await db.bests.put({id})
    }
    async function writeInfo(id, info){
        const item = await getDBBrainItem(id)
        if(!item) throw new Error(`Item undefined`)
        item.info = info
        await save(item)
    }
    return { load, save, getDBBrainItem, softClear, hardClear, getBestIds, writeInfo, saveAsBest }
})()
