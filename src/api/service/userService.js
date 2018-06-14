const express = require('express')
const User = require('../model/user')
const Palpite = require('../model/palpite')
const { respondOrErr, respondErr, respondSuccess, handlerError } = require('../../util/serviceUtils')

const router = express.Router()

router.get('/', async (req, res, next) => {
	User.find(req.query).sort({ totalAcumulado: 'desc' }).then(data => {
		respondSuccess(res, 200, { data })
	}).catch(err => {
		respondErr(next, 500, err)
	});
})

router.get('/:id', (req, res, next) => {
	User.findById(req.params.id, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	});
})

router.post('/', (req, res, next) => {
	User.create(req.body, (err, data) => {
		respondOrErr(res, next, 400, err, 201, { data })
	})
})

router.put('/:id', (req, res, next) => {
	User.findByIdAndUpdate(req.params.id, { isAdmin: req.body.isAdmin }, { new: true }, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.delete('/:id', (req, res, next) => {
	User.findById(req.params.id).then(async user => {
		console.log('Achou usuário', user)
		const palpites = await Palpite.find({ user: user._id })
		console.log('Achou palpites', palpites.length)
		for (let i = 0; i < palpites.length; i++) {
			const palpite = palpites[i];
			console.log('Apagando palpite', palpite._id)
			console.log(`placarTimeA: ${palpite.placarTimeA}, placarTimeB: ${palpite.placarTimeB}`)
			const p = await Palpite.findByIdAndRemove(palpite._id, { select: true })
			console.log('Palpite apagado', p)
		}
		console.log('Apagando usuário', user._id)
		const data = await User.findByIdAndRemove(user._id, { select: true })
		console.log('Usuário apagado', u)
		respondOrErr(res, next, 500, err, 200, { data })
	}).catch(err => {
		respondErr(next, 500, err)
	})
})

router.use(handlerError)

exports = module.exports = router