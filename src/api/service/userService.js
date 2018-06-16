const express = require('express')
const User = require('../model/user')
const Fase = require('../model/fase')
const Palpite = require('../model/palpite')
const { respondOrErr, respondErr, respondSuccess, handlerError } = require('../../util/serviceUtils')

const router = express.Router()

router.get('/', async (req, res, next) => {
	User.find(req.query).then(async users => {
		const fases = await Fase.find({ status: 'B' })
		for (let i = 0; i < users.length; i++) {
			let palpites = await Palpite.find({ user: users[i]._id }).sort({ 'partida.order': 'asc' })
			palpites = palpites.filter(palpite => {
				let result = false
				for (let j = 0; j < fases.length; j++) {
					if (fases[j].nome === palpite.partida.fase) {
						result = true
						break
					}
				}
				return result
			})
			console.log()
			users[i].set('palpites', palpites)
		}
		respondSuccess(res, 200, { data: users })
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
		if (user) {
			const palpites = await Palpite.find({ user: user._id })
			for (let i = 0; i < palpites.length; i++) {
				const palpite = palpites[i];
				const p = await Palpite.findByIdAndRemove(palpite._id)
			}
			const data = await User.findByIdAndRemove(user._id)
			respondSuccess(res, 200, { data })
		} else {
			respondSuccess(res, 200, { data: 'Usuário não encontrado' })
		}
	}).catch(err => {
		respondErr(next, 500, err)
	})
})

router.use(handlerError)

exports = module.exports = router