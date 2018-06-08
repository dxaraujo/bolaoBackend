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
		users = users.map(async user => {
			let palpites = await Palpite.find({ user: user._id })
			console.log('palpites')
			console.log(palpites)
			user.totalAcumulado = 0
			partidas.forEach(async partida => {
				if (partida.placarTimeA && partida.placarTimeB) {
					let palpite = findPalpite(palpites, partida)
					console.log('palpite')
					console.log(palpite)
					palpite = calcularPontuacaoPalpite(palpite, partida)
					user.totalAcumulado += palpite.totalPontosObitidos
					palpite.totalAcumulado = user.totalAcumulado
					console.log('calculado')
					console.log(palpite)
				}
			})
			return await User.findByIdAndUpdate(user._id, { totalAcumulado: user.totalAcumulado })
		})
		console.log('chegou antes que devia')
		partidas.forEach(async partida => {
			if (partida.placarTimeA && partida.placarTimeB) {
				let palpites = users.map(user => findPalpite(user.palpites, partida))
				console.log('palpites')
				console.log(palpites)
				palpites = palpites.sort((p1, p2) => p1.totalAcumulado < p2.totalAcumulado)
				console.log('sort')
				console.log(palpites)
				for (let i = 0; i < palpites.length; i++) {
					if (palpites[i]) {
						let palpite = palpites[i]
						palpite.classificacao = i + 1
						await Palpite.findByIdAndUpdate(palpite._id, palpite)
					}
				}
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

const findPalpite = (palpites, partida) => {
	palpites.find(palpite => {
		return palpite.partida.fase === partida.fase &&
			palpite.partida.grupo === partida.grupo &&
			palpite.partida.rodada === partida.rodada &&
			palpite.partida.timeA.nome === partida.timeA.nome &&
			palpite.partida.timeA.nome === partida.timeA.nome &&
			palpite.partida.data === partida.data
	})
}

const calcularPontuacaoPalpite = (palpite, partida) => {
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
	return palpite
}

router.use(handlerError)
exports = module.exports = router