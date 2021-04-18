const express = require('express')
const exphbs = require('express-handlebars')
const getNeuralRouter = require('./src/routes/neuro-router')
const Brain = require('./neuro')
const Db = require('./models/db')
const neurodb = new Db({
    basepath: './data/neuro', 
    handlerToSave: JSON.stringify, 
    handlerToLoad: data=>{
        const br = JSON.parse(data)
        const brain = new Brain(br.alpha, 1, 1)
        brain.layouts = br.layouts
        return brain
    }
})
const examplesdb = new Db({
    basepath : '/data/examples', 
    handlerToSave: JSON.stringify, 
    handlerToLoad: data=>data? JSON.parse(data): []
})

const app = express()

// set template hbs
const hbs = exphbs.create({extname: 'hbs'})
app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')

// routing
app.get('/', (req, res)=>res.render('home'))

const neuralRouter = getNeuralRouter({
    neurodb, examplesdb, 
    parseConfigFromRequest: req=>{
        console.log(req.body, req.params, req.baseurl)
        return {alpha: 0.3, layouts: [5,21,1]}
    },
    parseExampleFromRequest: req=>{

    },
    parseInputFromRequest: req=>{
        
    },
    parseExamplesToResponse: JSON.stringify,
    parseNeuroToResponse: JSON.stringify,
    createBrainFromConfig: config=>{
        return new Brain(config.alpha, ...config.layouts)
    },
    parseQueryOutputToResponse: out=>out.toString()
})
app.use(neuralRouter)

app.listen(8080, ()=>console.log(`Server has been started`))