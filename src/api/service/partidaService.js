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
			mapPalpites[user._id] = palpites
			user = await autalizarTotalAcumulado(user, partidas, palpites)
		})

		// Atualizado a classificação dos usuários
		await asyncForEach(partidas, async partida => {
			let palpites = users.map(user => findPalpite(mapPalpites[user._id], partida))
			palpites = await classificarPalpites(palpites)
		})

		// Atualizado os dados dos usuários
		await asyncForEach(users, async user => {
			const palpites = mapPalpites[user._id]
			if (palpites.length > 0) {
				const palpite = palpites[palpites.length - 1]
				user = await User.findByIdAndUpdate(user._id, { classificacao: palpite.classificacao }, { new: true })
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
	const palpite = palpites.find(palpite => {
		return palpite.partida.fase === partida.fase &&
			palpite.partida.grupo === partida.grupo &&
			palpite.partida.rodada === partida.rodada &&
			palpite.partida.timeA.nome === partida.timeA.nome &&
			palpite.partida.timeB.nome === partida.timeB.nome
	})
	return palpite
}

const autalizarTotalAcumulado = async (user, partidas, palpites) => {
	user.totalAcumulado = 0
	partidas.forEach(partida => {
		if (partida.placarTimeA >= 0 && partida.placarTimeB >= 0 && palpites) {
			let palpite = findPalpite(palpites, partida)
			if (palpite != null) {
				palpite = calcularPontuacaoPalpite(palpite, partida)
				user.totalAcumulado += palpite.totalPontosObitidos
				palpite.totalAcumulado = user.totalAcumulado
			}
		}
	})
	return await User.findByIdAndUpdate(user._id, { totalAcumulado: user.totalAcumulado }, { new: true })
}

const classificarPalpites = async (palpites) => {
	let cla = 1
	let mesmoplacar = 0
	console.log('Palpite', palpites.length)
	palpites = palpites.filter(palpite => palpite)
	console.log('Palpite filter', palpites.length)
	palpites = palpites.sort((p1, p2) => p1.totalAcumulado < p2.totalAcumulado)
	console.log('Palpite sort', palpites.length)
	for (let i = 0; i < palpites.length; i++) {
		console.log('Palpite', palpites[i].totalAcumulado)
		if (i > 0) {
			if (palpites[i].totalAcumulado === palpites[i - 1].totalAcumulado) {
				cla = palpites[i - 1].classificacao
				mesmoplacar += 1
				console.log('Palpite mesma classificacao anterior', cla)
			} else {
				cla = clas + mesmoplacar
				mesmoplacar = 1
				console.log('Palpite com classificacao diferente da anteriro', cla)
			}
		}
		palpites[i].classificacao = cla
		palpites[i] = await Palpite.findByIdAndUpdate(palpites[i]._id, palpites[i], { new: true })
	}
	return palpites
}

const calcularPontuacaoPalpite = (palpite, partida) => {
	const palpiteTimeVencedor = palpite.placarTimeA > palpite.placarTimeB ? 'A' : palpite.placarTimeB > palpite.placarTimeA ? 'B' : 'E'
	const partidaTimeVencedor = partida.placarTimeA > partida.placarTimeB ? 'A' : partida.placarTimeB > partida.placarTimeA ? 'B' : 'E'
	if (palpite.placarTimeA === partida.placarTimeA && palpite.placarTimeB === partida.placarTimeB) {
		palpite.totalPontosObitidos = 5
		palpite.placarCheio = true
	} else if (palpiteTimeVencedor === partidaTimeVencedor && palpite.placarTimeA >= 0 && palpite.placarTimeB >= 0) {
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