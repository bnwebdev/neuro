const path = require('path')
const express = require('express')
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')
const Matrix = require('./lib/matrix/matrix')
const Brain = require('./neuro')
const Db = require('./models/db')
const getNeuralRouter = require('./src/routes/neuro-router')
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
    handlerToLoad: data=>data? JSON.parse(data).map(([inp, out])=>{
        return [Matrix.from(inp), Matrix.from(out)]
    }): []
})
const neuralRouter = getNeuralRouter({ neurodb, examplesdb })


const app = express()

// set template hbs
const hbs = exphbs.create({extname: 'hbs'})
app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')

// set body-parser
app.use(bodyParser.urlencoded({extended: false}))

// routing
app.get('/', (req, res)=>res.render('home'))

app.use(neuralRouter)

// static folder
app.use(express.static(path.join(__dirname, 'public')))

app.listen(8080, ()=>console.log(`Server has been started`))