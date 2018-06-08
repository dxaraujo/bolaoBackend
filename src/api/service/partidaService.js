const express = require('express')
const co = require('co')
const moment = require('moment')
const Partida = require('../model/partida')
const Palpite = require('../model/palpite')
const User = require('../model/user')
const { respondOrErr, respondSuccess, respondErr, handlerError } = require('../../util/serviceUtils')

const router = express.Router()

router.get('/', (req, res, next) => {
	Partida.find(req.query, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.get('/resultado', async (req, res, next) => {
	try {
		const partidas = await Partida.find({}).sort({ data: 'asc' })
		respondSuccess(res, 200, { data: partidas })
	} catch (err) {
		respondErr(next, 500, err)
	}
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

router.put('/:id/updateResultado', async (req, res, next) => {
	Partida.findByIdAndUpdate(req.params.id, req.body, { new: true }).then(async newPartida => {
		const partidas = await Partida.find({}).sort({ 'data': 'asc' })
		const users = await User.find({})
		users.forEach(async user => {
			user.palpites = []
			user.totalAcumulado = 0
			partidas.forEach(async partida => {
				let palpite = await Palpite.findOne({ user: user._id, partida: partida._id })
				if (palpite) {
					palpite = calcularPontuacaoPalpite(palpite, partida)
					palpite.partida = partida
					user.totalAcumulado += palpite.totalPontosObitidos
					palpite.totalAcumulado = user.totalAcumulado
					user.palpites.push(palpite)
				}
			})
		})
		partidas.forEach(async partida => {
			let palpites = users.map(user => user.palpites.find(palpite => palpite.partida._id === partida._id))
			palpites = palpites.sort((p1, p2) => p1.totalAcumulado < p2.totalAcumulado)
			for (let i = 0; i < palpites.length; i++) {
				let palpite = palpites[i]
				palpite.classificacao = i + 1
				await Palpite.findByIdAndUpdate(palpite._id, palpite)
			}
		})
		respondSuccess(res, 200, { data: newPartida })
	}).catch(err => {
		respondErr(next, 500, err)
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

const calcularPontuacaoPalpite = (palpite, partida) => {
	if (partida.placarTimeA && partida.placarTimeB) {
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
	}
	return palpite
}

router.use(handlerError)
exports = module.exports = router