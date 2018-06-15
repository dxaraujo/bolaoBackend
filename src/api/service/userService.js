const express = require('express')
const User = require('../model/user')
const Fase = require('../model/fase')
const Palpite = require('../model/palpite')
const { respondOrErr, respondErr, respondSuccess, handlerError, asyncForEach } = require('../../util/serviceUtils')

const router = express.Router()

router.get('/', async (req, res, next) => {
	User.find(req.query).sort({ totalAcumulado: 'desc' }).then(async users => {
		const fases = Fase.find({ status: 'B' })
		for (let i = 0; i < users.length; i++) {
			users[i] = {
				_id: users[i]._id,
				name: users[i].name,
				username: users[i].username,
				avatar: users[i].avatar,
				facebookId: users[i].facebookId,
				totalAcumulado: users[i].totalAcumulado,
				classificacao: users[i].classificacao,
				isAdmin: users[i].isAdmin
			}
			let palpites = await Palpite.find({ user: users[i]._id }).sort({ 'partida.data': 'asc' })
			palpites = palpites.filter(palpite => {
				let result = false
				for (let j = 0; j < fases.length; j++) {
					if (fases[j].nome.equals(palpite.partida.fase)) {
						result = true
						break
					}
				}
				return result
			})
			users[i].palpites = palpites
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
			console.log('Achou usuário', user)
			const palpites = await Palpite.find({ user: user._id })
			console.log('Achou palpites', palpites.length)
			for (let i = 0; i < palpites.length; i++) {
				const palpite = palpites[i];
				console.log('Apagando palpite', palpite._id)
				console.log(`placarTimeA: ${palpite.placarTimeA}, placarTimeB: ${palpite.placarTimeB}`)
				const p = await Palpite.findByIdAndRemove(palpite._id)
				console.log('Palpite apagado', p._id)
			}
			console.log('Apagando usuário', user._id)
			const data = await User.findByIdAndRemove(user._id)
			console.log('Usuário apagado', data._id)
			respondSuccess(res, 200, { data })
		}
		respondSuccess(res, 200, { data: 'Usuário não encontrado' })
	}).catch(err => {
		respondErr(next, 500, err)
	})
})

router.use(handlerError)

exports = module.exports = router