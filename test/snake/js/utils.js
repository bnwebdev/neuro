const utils = {}

utils.getPairWithFirstClass = function(Class, obj1, obj2){ 
    return obj1 instanceof Class? [obj1, obj2]: [obj2, obj1]
},
utils.rand = function(min, max){
    return min + Math.random() * (max - min)
},
utils.randUint = function(value){
    return Math.floor(utils.rand(0, value + 1))
},
utils.delay = function(timeout){
    return new Promise(resolve=>setTimeout(resolve, timeout))
}

utils.setAsyncInterval = function(fn, interval){
    let useAbort = null
    async function __setAsyncInterval(fn, interval){
        if(useAbort) return useAbort()

        const prevTime = Date.now()
        await fn()
        if(useAbort) return useAbort()

        const dt = Date.now() - prevTime
        const nextDelays = interval - dt
        await utils.delay(nextDelays < 0? 0: nextDelays)
        if(useAbort) return useAbort()

        __setAsyncInterval(fn, interval)
    }

    __setAsyncInterval(fn, interval)

    return function abort(){
        return new Promise((res, rej)=>{
            useAbort = res
        })
    }
}