const express = require('express')
const co = require('co')
const moment = require('moment')
const Partida = require('../model/partida')
const Palpite = require('../model/palpite')
const User = require('../model/user')
const { respondOrErr, respondSuccess, respondErr, handlerError, asyncForEach } = require('../../util/serviceUtils')

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
	try {

		const newPartida = Partida.findByIdAndUpdate(req.params.id, req.body, { new: true })
		const partidas = await Partida.find({}).sort({ 'data': 'asc' })
		const users = await User.find({})
		let mapPalpites = []

		console.log('1')
		asyncForEach(users, async user => {
			let palpites = await Palpite.find({ user: user._id })
			mapPalpites[user._id] = palpites
			autalizarTotalAcumulado(user, partidas, palpites)
			user = await User.findByIdAndUpdate(user._id, { totalAcumulado: user.totalAcumulado })
		})
		console.log(mapPalpites)

		console.log('2')
		await partidas.forEachAsync(async partida => {
			let palpites = users.map(user => findPalpite(mapPalpites[user._id], partida))
			await classificarUsuarios(partida, palpites)
		})

		console.log('3')
		respondSuccess(res, 200, { data: newPartida })
	} catch (err) {
		respondErr(next, 500, err)
	}
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
	const palpite = palpites.find(palpite => {
		return palpite.partida.fase === partida.fase &&
			palpite.partida.grupo === partida.grupo &&
			palpite.partida.rodada === partida.rodada &&
			palpite.partida.timeA.nome === partida.timeA.nome &&
			palpite.partida.timeB.nome === partida.timeB.nome
	})
	return palpite
}

const autalizarTotalAcumulado = (user, partidas, palpites) => {
	user.totalAcumulado = 0
	partidas.forEach(async partida => {
		if (partida.placarTimeA && partida.placarTimeB) {
			let palpite = findPalpite(palpites, partida)
			palpite = calcularPontuacaoPalpite(palpite, partida)
			user.totalAcumulado += palpite.totalPontosObitidos
			palpite.totalAcumulado = user.totalAcumulado
		}
	})
}

const classificarUsuarios = async (partida, palpites) => {
	if (partida.placarTimeA && partida.placarTimeB) {
		palpites = palpites.sort((p1, p2) => p1.totalAcumulado < p2.totalAcumulado)
		for (let i = 0; i < palpites.length; i++) {
			palpites[i].classificacao = i + 1
			palpites[i] = await Palpite.findByIdAndUpdate(palpites[i]._id, palpites[i])
		}
	}
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