const express = require('express')
const Partida = require('../model/partida')
const Palpite = require('../model/palpite')
const User = require('../model/user')
const { respondOrErr, respondSuccess, respondErr, handlerError, asyncForEach } = require('../../util/serviceUtils')

const router = express.Router()

router.get('/', (req, res, next) => {
	Partida.find(req.query).sort({ 'data': 'asc' }).then(partidas => {
		respondSuccess(res, 200, { data: partidas })
	}).catch(err => {
		respondErr(next, 500, err)
	})
})

router.get('/resultado', async (req, res, next) => {
	try {
		const partidas = await Partida.find({ data: { $lt: new Date() } }).sort({ data: 'asc' })
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

		const newPartida = await Partida.findByIdAndUpdate(req.params.id, req.body, { new: true })
		const partidas = await Partida.find({}).sort({ 'data': 'asc' })
		const users = await User.find({})
		let mapPalpites = []

		// Atualizado o total de ponto acumulados
		await asyncForEach(users, async user => {
			let palpites = await Palpite.find({ user: user._id })
			mapPalpites[user._id] = autalizarTotalAcumulado(partidas, palpites)
		})

		// Atualizado a classificação dos usuários
		await asyncForEach(partidas, async partida => {
			if (partida.placarTimeA >= 0 && partida.placarTimeB >= 0) {
				let palpites = users.map(user => findPalpite(mapPalpites[user._id], partida))
				palpites = await classificarPalpites(palpites)
			}
		})

		// Atualizado os dados dos usuários
		await asyncForEach(users, async user => {
			if (mapPalpites[user._id]) {
				let classificacao = null
				let totalAcumulado = null
				const palpites = mapPalpites[user._id]
				for (let i = palpites.length - 1; i >= 0; i--) {
					const palpite = palpites[i];
					if (palpite.totalAcumulado >= 0 && palpite.classificacao >= 0) {
						classificacao = palpite.classificacao
						totalAcumulado = palpite.totalAcumulado
						break
					}
				}
				if (classificacao !== null && totalAcumulado !== null) {
					user = await User.findByIdAndUpdate(user._id, { classificacao, totalAcumulado }, { new: true })
				}
			}
		})

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
	return palpites.find(palpite => {
		return palpite.partida.fase === partida.fase &&
			palpite.partida.grupo === partida.grupo &&
			palpite.partida.rodada === partida.rodada &&
			palpite.partida.timeA.nome === partida.timeA.nome &&
			palpite.partida.timeB.nome === partida.timeB.nome
	})
}

const autalizarTotalAcumulado = (partidas, palpites) => {
	let totalAcumulado = 0
	partidas.forEach(partida => {
		if (partida.placarTimeA >= 0 && partida.placarTimeB >= 0) {
			let palpite = findPalpite(palpites, partida)
			if (palpite != null) {
				palpite = calcularPontuacaoPalpite(palpite, partida)
				totalAcumulado += palpite.totalPontosObitidos
				palpite.totalAcumulado = totalAcumulado
			}
		}
	})
	return palpites
}

const classificarPalpites = async (palpites) => {
	let cla = 1
	let mesmoplacar = 1
	palpites = palpites.filter(palpite => palpite)
	palpites = palpites.sort((p1, p2) => p2.totalAcumulado - p1.totalAcumulado)
	for (let i = 0; i < palpites.length; i++) {
		if (i > 0) {
			if (palpites[i].totalAcumulado === palpites[i - 1].totalAcumulado) {
				cla = palpites[i - 1].classificacao
				mesmoplacar += 1
			} else {
				cla = cla + mesmoplacar
				mesmoplacar = 1
			}
		}
		palpites[i].classificacao = cla
		palpites[i] = await Palpite.findByIdAndUpdate(palpites[i]._id, palpites[i], { new: true })
	}
	return palpites
}

const calcularPontuacaoPalpite = (palpite, partida) => {
	if (palpite.placarTimeA >= 0 && palpite.placarTimeB >= 0) {
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
		} else {
			palpite.totalPontosObitidos = 0
			palpite.placarCheio = false
			palpite.placarTimeVencedorComGol = false
			palpite.placarTimeVencedor = false
			palpite.placarGol = false
		}
	}
	return palpite
}

router.use(handlerError)
exports = module.exports = router