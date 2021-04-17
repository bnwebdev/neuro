const {Router} = require('express')

module.exports = function createRouter({
    examplesdb,
    neurodb,
    parseExampleFromRequest,
    parseInputFromRequest,
    parseQueryOutputToResponse,
    parseExamplesToResponse,
    parseNeuroToResponse,
    parseConfigFromRequest,
    createBrainFromConfig
}){

const router = Router()


router.get('/examples', async (req, res)=>{
    try {
        const examples = await examplesdb.load('current')
        res.send(parseExamplesToResponse(examples))    
    } catch (e) {
        res.send(e)
    }
})
router.get('/neuro', async (req, res)=>{
    try {
        const brain = await neurodb.load('current')
        res.send(parseNeuroToResponse(brain))    
    } catch (e) {
        res.send(e)
    }
})
router.get('/neuro/query', async (req, res)=>{
    try {
        const brain = await neurodb.load('current')
        const output = brain.query(parseInputFromRequest(req))
        res.send(parseQueryOutputToResponse(output))
    } catch (e) {
        res.send(e)
    }
})

router.post('/examples/add', async (req, res)=>{
    try {
        const examples = await examplesdb.load('current')
        examples.push(parseExampleFromRequest(req))
        await examplesdb.save('current', examples)
        res.send('ok')
    } catch (e) {
        res.send(e)
    }
    
})
router.post('/examples/delete/:id', async (req, res)=>{
    try {
        let examples = await examplesdb.load('current')
        examples = examples.filter(ex=>ex.id !== req.params.id)     
        await examplesdb.save('current', examples)
        res.send('ok')
    } catch (e) {
        res.send(e)
    }
})
router.post('/neuro/save/:id', async (req, res)=>{
    try {
        const brain = await neurodb.load('current')
        await neurodb.save(req.params.id, brain)
        res.send('ok')
    } catch (e) {
        res.send(e)
    }
})
router.post('/examples/save/:id', async (req, res)=>{
    try {
        const examples = await examplesdb.load('current')
        await examplesdb.save(req.params.id, examples)
        res.send('ok')
    } catch (e) {
        res.send(e)
    }
})
router.post('/neuro/checkout/:id', async (req, res)=>{
    try {  
      const brain = await neurodb.load(req.params.id)
      await neurodb.save('current', brain)
      res.send('ok')
    } catch (e) {
        res.send(e)
    }
  })
router.post('/examples/checkout/:id', async (req, res)=>{
    try {  
        const examples = await examplesdb.load(req.params.id)
        await examplesdb.save('current', examples)
        res.send('ok')
    } catch (e) {
        res.send(e)
    }
})
router.post('/neuro/learn', async (req, res)=>{
    try {
        const brain = await neurodb.load('current')
        const examples = await examplesdb.load('current')
        for(let [inp, out] of examples){
            brain.learn(inp, out)
        }
        await neurodb.save('current', brain)
        res.send('ok')
    } catch (e) {
        res.send(e)
    }
})
router.post('neuro/config', async (req, res)=>{
    const config = parseConfigFromRequest(req)
    const brain = createBrainFromConfig(config)
    try {
        neurodb.save('current', brain)
        res.send('ok')
    } catch (e) {
        res.send(e)
    }

})

}