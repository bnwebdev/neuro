const {Router} = require('express')

const router = Router()

router.get('/examples', (req, res)=>{})
router.post('/examples/add', (req, res)=>{})
router.post('/examples/delete', (req, res)=>{})

router.get('/neuro', (req, res)=>{})
router.get('/neuro/query', (req, res)=>{})
router.post('/neuro/save', (req, res)=>{})
router.post('/neuro/clear', (req, res)=>{})
router.post('/neuro/learn', (req, res)=>{})



module.exports = router