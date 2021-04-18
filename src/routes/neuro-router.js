const {Router} = require('express')
const path = require('path')
const Brain = require(path.join(module.parent.path, 'neuro'))
const Matrix = require(path.join(module.parent.path, 'lib/matrix/matrix'))

module.exports = function createRouter({
    examplesdb,
    neurodb,
    parseExampleFromRequest = req=>{
        return [
            Matrix.from([JSON.parse(req.input)]).transpose(),
            Matrix.from([JSON.parse(req.output)]).transpose()
        ]
    },
    parseInputFromRequest = req=>{
        return Matrix.from([JSON.parse(req.input)]).transpose()
    },
    parseQueryOutputToResponse = out=>out.toString(),
    parseExamplesToResponse = JSON.stringify,
    parseNeuroToResponse = JSON.stringify,
    parseConfigFromRequest = req=>{
        return {alpha: +req.body.alpha, layouts: JSON.parse(req.body.layouts)}
    },
    createBrainFromConfig = config=>{
        return new Brain(config.alpha, ...config.layouts)
    }
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
router.get('/neuro/config', (req, res)=>{
    res.render('config')
})
router.post('/neuro/config', async (req, res)=>{
    const config =  parseConfigFromRequest(req)
    const brain = createBrainFromConfig(config)
    try {
        neurodb.save('current', brain)
        res.send('ok')
    } catch (e) {
        res.send(e)
    }

})

return router

}