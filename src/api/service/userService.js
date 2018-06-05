const express = require('express')
const co = require('co')
const User = require('../model/user')
const Palpite = require('../model/palpite')
const { respondOrErr, respondErr, respondSuccess, handlerError } = require('../../util/serviceUtils')

const router = express.Router()

router.get('/', (req, res, next) => {
	co(function* () {
		let users = yield User.find(req.query)
		for (let i = 0; i < users.length; i++) {
			let user = users[i];
			let palpites = yield Palpite.find({ user: user._id})
			let totalAcumulado = 0
			for (let j = 0; j < palpites.length; j++) {
				totalAcumulado+= palpites[j].totalPontosObitidos
			}
			user.totalAcumulado = totalAcumulado
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
	User.findByIdAndRemove(req.params.id, req.body, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.use(handlerError)

exports = module.exports = router