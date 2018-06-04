const express = require('express')
const moment = require('moment')
const Partida = require('../model/partida')
const Palpite = require('../model/palpite')
const User = require('../model/user')
const { respondOrErr, handlerError } = require('../../util/serviceUtils')

const router = express.Router()

router.get('/', (req, res, next) => {
	Partida.find(req.query, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.get('/resultado', (req, res, next) => {
	Partida.find({}, req.body, (err, data) => {
		/* 		let partidas = []
				if (data) {
					data.forEach(partida => {
						if (moment(partida.data, 'YYYY-MM-DDThh:mm:ss').isBefore(new Date())) {
							partidas.push(partida)
						}
					})
				}
				respondOrErr(res, next, 500, err, 200, { data: partidas }) */
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.get('/:id', (req, res, next) => {
	Partida.findById(req.params.id, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	});
})

router.post('/', (req, res, next) => {
	Partida.create(req.body, (err, data) => {
		respondOrErr(res, next, 400, err, 201, { data })
	})
})

router.put('/:id/updateResultado', (req, res, next) => {
	Partida.findByIdAndUpdate(req.params.id, req.body, { new: true }, (err, data) => {
		if (data) {
			atualizarPontuacao(data);
		}
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.put('/:id', (req, res, next) => {
	Partida.findByIdAndUpdate(req.params.id, req.body, { new: true }, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.delete('/:id', (req, res, next) => {
	Partida.findByIdAndRemove(req.params.id, req.body, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.use(handlerError)

const atualizarPontuacao = partida => {
	User.find({}, (err, users) => {
		users.forEach(user => {
			Palpite.findOne({ user: user._id, partida: partida._id }, (err, palpite) => {
				const palpiteTimeVencedor = palpite.placarTimeA > palpite.placarTimeB ? 'A' : palpite.placarTimeB > palpite.placarTimeA ? 'B' : 'E'
				const partidaTimeVencedor = partida.placarTimeA > partida.placarTimeB ? 'A' : partida.placarTimeB > partida.placarTimeA ? 'B' : 'E'
				if (palpite.placarTimeA === partida.placarTimeA && palpite.placarTimeB === partida.placarTimeB) {
					palpite.totalPontosObitidos = 5
					palpite.placarCheio = true
				} else if (palpiteTimeVencedor === partidaTimeVencedor) {
					if (palpite.placarTimeA === partida.placarTimeA || palpite.placarTimeB === partida.placarTimeB) {
						palpite.totalPontosObitidos = 3
						palpite.placarTimeVencedorComGol = true
					} else {
						palpite.totalPontosObitidos = 2
						palpite.placarTimeVencedor = true
					}
				} else if (palpite.placarTimeA === partida.placarTimeA || palpite.placarTimeB === partida.placarTimeB) {
					palpite.totalPontosObitidos = 1
					palpite.placarGol = true
				}
				user.totalAcumulado = user.totalAcumulado + palpite.totalPontosObitidos
				Palpite.findByIdAndUpdate(palpite._id, palpite, (err, data) => {
				})
			})
		})
		users = users.sort((u1, u2) => u1.totalAcumulado > u2.totalAcumulado)
		for (let i = 0; i < users.length; i++) {
			users[i].classificacao = i + 1
			User.findByIdAndUpdate(users[i]._id, users[i], (err, data) => {
			})
		}
	})
}

exports = module.exports = router