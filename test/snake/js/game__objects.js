const gobjs = (function(){
    const Squer = bengine.Squer
    const Point = bengine.Point
    
    class TargetSquer extends Squer{
        constructor(target, ...options){
            super(...options)
            this.target = target
        }
    }

    class GameSquer extends bengine.GameObject {
        constructor({x, y, width = 10, height = 10} = {}){
            super()
            this.point = new Point({x, y})
            this.width = width
            this.height = height
        }
        getCircuit(){
            return new TargetSquer(this, this)
        }
    }

    class SnakeCell extends GameSquer {
        type = 'snake__cell'
        constructor(options = {}, onDestroyed = ()=>{}){
            super(options)
            this.onDestroyed = onDestroyed || nulp;
            this.direction = options.direction
            this.stepLength = options.stepLength
            this.isDestroyed = false
            this.newDirection = this.direction
            this.hasMeal = false
        }
        destroy(){
            if(this.isDestroyed) return;
            this.isDestroyed = true
            this.onDestroyed(this)
        }
        setDirection(newDirection){
            if(this.direction === [2, 3, 0, 1][newDirection]) return;
            this.newDirection = newDirection
        }
        updateDirection(){
            this.direction = this.newDirection
        }
        async update(dt){
            if(this.isDestroyed) return;
            this.beforeUpdateDirection = this.direction
            this.updateDirection()
            let dx = 0
            let dy = 0
            switch(this.direction){
                case 0: dx = -this.stepLength; break;
                case 1: dy = -this.stepLength; break;
                case 2: dx = this.stepLength; break;
                case 3: dy = this.stepLength; break;
            }
            this.point.x += dx
            this.point.y += dy
        }
    }
    class SnakeHead extends SnakeCell {
        type = 'snake__head'
        eat(obj){
            if(this.isDestroyed) return;
            obj.destroy()
            this.hasMeal = true
        }
    }
    class SnakeBody extends SnakeCell {
        type = 'snake__body'
    }
    class Snake extends bengine.GameObject {
        type = 'snake'
        constructor(options, onDestroyed){
            super()
            this.head = new SnakeHead(options, this.destroy.bind(this))
            this.body = []
            this.head.hasMeal = true
            this.newCell = null
            this.onDestroyed = onDestroyed || function(){}
            this.counterStepsWithoutMeal = 0
            this.countSteps = 0
            this.onBeforeUpdate = async ()=>{}

        }
        get direction(){
            return this.head.direction
        }
        setDirection(newDirection){
            return this.head.setDirection(newDirection)
        }
        destroy(){
            this.isDestroyed = true
            this.onDestroyed(this)
        }
        getCircuit(){
            return [this.head.getCircuit(), ...this.body.map(obj=>obj.getCircuit())]
        }
        async update(dt){
            if(this.isDestroyed) return;
            if(this.counterStepsWithoutMeal >= getMaxEatedStep(this.allCells.length)){
                if(this.lastCell.hasMeal){
                    this.lastCell.hasMeal = false
                } else if(this.allCells.length > 1){
                    this.body.pop()
                    this.counterStepsWithoutMeal = 0
                } else {
                    this.destroy()
                }
            }
            if(this.isDestroyed) return;
            await this.onBeforeUpdate()
            this.countSteps++
            this.checkMeal()
            await this.head.update(dt)
            await Promise.all(this.body.map(cell=>cell.update(dt)));
            if(this.newCell){
                this.body.push(this.newCell)
                this.newCell = null
            }
            this.allCells.forEach((cell, it, arr)=>{
                if(it === 0) return;
                cell.setDirection(arr[it - 1].direction)
            })
            this.counterStepsWithoutMeal++
        }
        get allCells(){
            return [this.head].concat(this.body)
        }
        get lastCell(){
            return this.allCells.slice(-1)[0]
        }
        createNewCell(){
            const cell = this.lastCell
            const { x, y } = cell.point
            const onDestroyed = cell.onDestroyed
            const { width, height, stepLength, direction } = cell
            return new SnakeBody({x, y, width, height, stepLength, direction}, onDestroyed)
        }
        checkMeal(){
            this.allCells.reverse().forEach((cell, it, arr)=>{
                if(!cell.hasMeal) return;
                cell.hasMeal = false

                if(it === 0){
                    this.counterStepsWithoutMeal = 0
                    this.newCell = this.createNewCell()
                    return;
                }

                arr[it - 1].hasMeal = true  
            })
        }
    }
    class Apple extends GameSquer {
        type = 'apple'
        constructor(options, onDestroyed){
            super(options)
            this.onDestroyed = onDestroyed || function(){}
        }
        async update(dt){}
        destroy(){
            this.isDestroyed = true
            this.onDestroyed(this)
        }
    }
    class Wall extends GameSquer {
        type = 'wall'
        constructor(options, onDestroyed){
            super(options)
            this.onDestroyed = onDestroyed || function(){}
        }
        async update(dt){}
        destroy(){
            this.isDestroyed = true
            this.onDestroyed(this)
        }
    }
    return { Snake, SnakeCell, SnakeHead, SnakeBody, GameSquer, Apple, Wall }
})()