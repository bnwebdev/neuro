const $ = selector=>document.querySelector(selector)
const $$ = selector=>Array.from(document.querySelectorAll(selector))

const WIDTH = 300
const HEIGHT = 300
const DPI_HEIGHT = HEIGHT * 2
const DPI_WIDTH = WIDTH * 2
const COUNT_CELL = 30
const STEP_X = DPI_WIDTH / COUNT_CELL
const STEP_Y = DPI_HEIGHT / COUNT_CELL
const COUNT_APPLES = 20
const MAX_EATED_STEP = Math.ceil(Math.max(COUNT_CELL / 5, COUNT_CELL * COUNT_CELL / COUNT_APPLES / 3))

const $canvas = $('#canvas')
$canvas.width = DPI_WIDTH
$canvas.height = DPI_HEIGHT
$canvas.style.width = WIDTH + 'px'
$canvas.style.height = HEIGHT + 'px'
$canvas.style.border = "2px solid grey";

const ctx = $canvas.getContext('2d')

const MODIFY_CHANCE = 4 // persent
const MIN_CHANGE = 0.001
const MAX_CHANGE = 0.1
const SIZE_INPUT = 7
const INPUT_HEIGHT = SIZE_INPUT * SIZE_INPUT * 2 // an area around and 4 directions  

const maxStepsSnakeByGeneration = []

// CHART 
/*
function drawChart(){
    $('#chart').innerHTML = '<div>Y - max-steps, X - generation</div>'
    const max_x = Math.max(2, maxStepsSnakeByGeneration.length)
    const max_y = Math.max(2, ...maxStepsSnakeByGeneration.map(p=>p.y))
    const chart = new Chart('#chart', {
        width: 400, 
        height: 200, 
        limits: {
            x: {
                min: 0,
                max: max_x + 10
            }, 
            y: {
                min: 0,
                max: max_y + 10
            }
        },
        axis: {
            color: 'red',
            x: 0,
            y: 0,
            lineWidth: 1,
            step: {
                x: {
                    main: Math.max(Math.round(max_x / 10), 1)
                },
                y: {
                    main: Math.max(Math.round(max_y / 10), 1)
                }
            }
        }
    })
    const place = chart.createPointPlace('gen-steps', {type:'text'})
    maxStepsSnakeByGeneration.forEach(place.add.bind(place))
}
*/
// END CHART

function isTrueInRandom(chance){
    return utils.rand(0, 100) > (100 - chance)
}
// SETTING FUNCTION FOR MUTATION
function handlerMatrixModifyEvolutionProccess(value){
    if(isTrueInRandom(MODIFY_CHANCE)){
        return value + value * utils.rand(MIN_CHANGE, MAX_CHANGE) * (isTrueInRandom(50)? -1: 1)
    }
    return value
}
// SET RULES FOR SNAKE STEP-DIE
function getMaxEatedStep(bodyLength){
    return MAX_EATED_STEP + bodyLength * 2
}

const db = new Dexie('brain-db')
db.version(1).stores({
    brains: '++id, brain, generation',
    bests: 'id, generation, info'
})

function createBrainForSnake(baseBrain){
    // OUTPUT === 3, becouse inputs always are prepared to a head direction,
    // so a snake can turn to the left, to the right or stay in the direction
    if(!baseBrain) return new Brain(0.5, INPUT_HEIGHT, 16, 3)
    
    const brain = new Brain(0.5, 1, 1, 1)
    brain.layers = brain.layers.map((_, it)=>{
        return baseBrain.layers[it].copy().modify(handlerMatrixModifyEvolutionProccess)
    })
    return brain
}
function reproductionSnakesBrain(brain1, brain2){
    const brain = new Brain(brainDb1.brain.alpha, 0)
    brain.layers = brain1.layers.map((matrix, it)=>{
        return matrix.copy().modify((value, i, j)=>isTrueInRandom(50)? value: brain2.layers[it][i][j])
    })
    return brain
}

// fns draw
function drawPlace( ctx ){

    ctx.clearRect(0,0,DPI_WIDTH,DPI_HEIGHT)

    let step = STEP_X
    for(let i = 1; i <= COUNT_CELL - 1; i++){
        ctx.beginPath()
        ctx.lineTo(step * i, 0)
        ctx.lineTo(step * i, DPI_HEIGHT)
        ctx.stroke()
        ctx.closePath()
    }

    step = STEP_Y
    for(let i = 1; i <= COUNT_CELL - 1; i++){
        ctx.beginPath()
        ctx.lineTo(0, step * i)
        ctx.lineTo(DPI_WIDTH, step * i)
        ctx.stroke()
        ctx.closePath()
    }
}
function drawGameOver(){
    //drawPlace(ctx);
    ctx.font = `${70}px Verdana`;
    // Create gradient
    var gradient = ctx.createLinearGradient(0, 0, DPI_WIDTH, 0);
    gradient.addColorStop("0", "magenta");
    gradient.addColorStop("0.5", "blue");
    gradient.addColorStop("1.0", "red");
    // Fill with gradient
    ctx.fillStyle = gradient;
    ctx.textAlign = 'center'

    ctx.fillText("GAME OVER!", DPI_WIDTH / 2, DPI_HEIGHT / 2);
}

function getMap(snake, apples, walls){
    const count = COUNT_CELL
    const map = new Matrix(count, count)
    const types = {
        snake__head: 'h',
        snake__body: 'b',
        wall: 'w',
        apple: 'a'
    }
    let matrixValues = [snake.head, ...snake.body, ...apples, ...walls].map(cell=>{
        let {x, y} = cell.point
        const {width, height} = cell
        x = Math.round(x/width)
        y = Math.round(y/height)
        return {
            value: types[cell.type],
            x, y
        }
    })
    return map.modify((_, i, j)=>{
        const candidate = matrixValues.find(({x, y})=>j === x && i === y)
        return candidate? candidate.value : '.'
    })
}

function cutMapWithHeadSnakeInCenter(map, size){
    if(size % 2 === 0) 
        throw new Error(`Head snake will not replace in center with ${size}x${size} map`)
    
    let i, j
    map.each((value, _i, _j)=>{
        if(value === 'h'){
            i = _i
            j = _j
        }
    })
    if(i === undefined || j === undefined){
        return null
    }
    const [imap, jmap] = map.size()
    const shortMap = new Matrix(size, size).modify((_, _i, _j)=>{
        const nI = i - (size - 1) / 2 + _i
        const nJ = j - (size - 1) / 2 + _j
        const result = nI < 0 || nJ < 0 || nI >= imap || nJ >= jmap? '.': map[nI][nJ]
        return result
    })
    return shortMap
}

function turnMapWithHeadDirection(map, direction){
    const objModify = {
        left: (_, i, j)=>map[SIZE_INPUT - j - 1][i],
        up: v=>v,
        right: (_, i, j)=>map[j][SIZE_INPUT - i - 1],
        down: (_, i, j)=>map[SIZE_INPUT - i - 1][SIZE_INPUT - j - 1]
    }
    const dir = ['left', 'up', 'right', 'down']
    return map.copy().modify(objModify[dir[direction]])
}

function getInput(snake, apples, walls){
    let map = cutMapWithHeadSnakeInCenter(getMap(snake, apples, walls), SIZE_INPUT)
    if(!map) return null
    
    map = turnMapWithHeadDirection(map, snake.direction)
    const appleCoster = v=>v === 'a'? 0.99: 0
    const bodyAndWallCoster = v=>v === 'b' || v === 'w' || v === 'h'? 0.99: 0.01

    let input = map.copy().modify(appleCoster)
    let input2 = map.copy().modify(bodyAndWallCoster)
    
    const resultInput = new Matrix(1, INPUT_HEIGHT)
    
    resultInput[0] = [].concat(...input).concat(...input2)
    return resultInput.transpose()
}

const objAbort = { value: ()=>{} }
const startAsyncInterval = ()=>objAbort.value = utils.setAsyncInterval(stepGame, 1000 / 10)

async function openWaitingRing(){
    document.body.classList.add('waiting')
}
function closeWaitingRing(){
    document.body.classList.remove('waiting')
}

const renderer = new bengine.Renderer()
renderer.register(gobjs.SnakeCell, function(obj){
    if(obj.isDestroyed) return;
    ctx.fillStyle = '#faa'
    let { x, y } = obj.point
    let {width, height} = obj
    if(obj.hasMeal){
        x -= 2
        y -= 2
        width += 4
        height += 4
    }
    ctx.fillRect(x, y, width, height)
})
renderer.register(bengine.Scene, function(scene){
    const {x, y} = scene.rect.point
    const {width, height} = scene.rect
    ctx.fillStyle = 'white'
    ctx.fillRect(x, y, width, height)
})
renderer.register(gobjs.Snake, function(snake){
    if(snake.isDestroyed) return;
    renderer.draw(snake.head, ...snake.body)
})
renderer.register(gobjs.Apple, function(apple){
    if(apple.isDestroyed) return;
    const {x, y} = apple.point
    const {width, height} = apple
    ctx.fillStyle = 'red'
    ctx.fillRect(x, y, width, height)
})
renderer.register(gobjs.Wall, function(wall){
    if(wall.isDestroyed) return;
    const {x, y} = wall.point
    const {width, height} = wall
    ctx.fillStyle = 'black'
    ctx.fillRect(x, y, width, height)
})

const collisioner = new bengine.Collisioner(8)

const isAnyDestroyedOrIntersected = (obj1, obj2)=>{
    return obj1.isDestroyed || obj2.isDestroyed || !obj1.getCircuit().intersect(obj2.getCircuit())
}
const snakeHeadEatReactHandler = function(obj1, obj2){
    if( isAnyDestroyedOrIntersected(obj1, obj2) ) return;
    const [head, other] = utils.getPairWithFirstClass(gobjs.SnakeHead, obj1, obj2)
    head.eat(other)
}

const collideReactor = new bengine.CollideReactor()
collideReactor.register(gobjs.SnakeHead, gobjs.SnakeBody, snakeHeadEatReactHandler)
collideReactor.register(gobjs.SnakeHead, gobjs.Apple, snakeHeadEatReactHandler)
collideReactor.register(gobjs.SnakeHead, gobjs.Wall, function(obj1, obj2){
  if( isAnyDestroyedOrIntersected(obj1, obj2) ) return;
  const [head, _] = utils.getPairWithFirstClass(gobjs.SnakeHead, obj1, obj2)
  head.destroy()
})

function getCreateAndPushApple(scene){
    return function createAndPushApple(){
        const x = utils.randUint(COUNT_CELL - 3) * STEP_X + STEP_X
        const y = utils.randUint(COUNT_CELL - 3) * STEP_Y  + STEP_Y
        scene.push(
            new gobjs.Apple({x, y, width: STEP_X, height: STEP_Y}, createAndPushApple)
        )
    }
}
const gameObjectFactory = {
    create(id, x, y, scene){
        return this[id](x, y, scene)
    },
    s: (x, y)=>new gobjs.Snake({
        direction: 2, 
        stepLength: STEP_X, 
        width: STEP_X - 6, 
        height: STEP_X - 6, 
        x: x * STEP_X + 3, 
        y: y * STEP_Y + 3
    }),
    w: (x, y)=>new gobjs.Wall({
        width: STEP_X - 6, 
        height: STEP_X - 6, 
        x: x * STEP_X + 3, 
        y: y * STEP_Y + 3
    }),
    a: (x, y, scene)=>new gobjs.Apple({
        width: STEP_X - 6, 
        height: STEP_X - 6, 
        x: x * STEP_X + 3, 
        y: y * STEP_Y + 3
    }, getCreateAndPushApple(scene))
}

function createScene(){
    return new bengine.Scene(
        new Squer({point: new Point({x: 0, y: 0}), width: $canvas.width, height: $canvas.height})
    )
}
function prepareMapToMatrix(map){
    map = map.trim().split('\n').map(str=>str.trim().split(/[ ]+/))
    map = new Matrix(map.length, map[0].length).modify((_, i, j)=>map[i][j])
    console.log(map)
    return map
}
function addTemplateToScene(scene, map, gameObjectFactory, emptyChar = '.'){
    prepareMapToMatrix(map).each((v, x, y)=>{
        if(v === emptyChar) return;
        scene.push(gameObjectFactory.create(v, x, y, scene))
    })
}

function getRowChar(size = COUNT_CELL, char){
    return new Array(size).fill(char).join(' ')
}
function getEmptyRow(size = COUNT_CELL){
    return getRowChar(size, '.')
}
function getRowWithRightLeftWall(size = COUNT_CELL){
    const row = getEmptyRow(size)
    return `w${row.slice(1, -1)}w`
}
function getRowWithWall(size = COUNT_CELL){
    return getRowChar(size, 'w')
}
function replaceCharToRow(row, idx, char){
    return row.slice(0, idx) + char + row.slice(idx + 1)
}



const gameProcess = bengine.createGameProcess(renderer, collisioner, collideReactor)

const game = async (scene) => {
    await gameProcess(scene)
}

closeWaitingRing()