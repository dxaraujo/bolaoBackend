const express = require('express')
const Fase = require('../model/fase')
const Palpite = require('../model/palpite')
const Partida = require('../model/partida')
const { respondOrErr, respondSuccess, respondErr, handlerError } = require('../../util/serviceUtils')

const router = express.Router()

router.get('/', async (req, res, next) => {
	try {
		const palpites = await Palpite.find(req.query).sort({ 'partida.order': 'asc' })
		respondSuccess(res, 200, { data: palpites })
	} catch (err) {
		respondErr(next, 500, err)
	}
})

router.get('/:id', (req, res, next) => {
	Palpite.findById(req.params.id, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	});
})

router.post('/', (req, res, next) => {
	Palpite.create(req.body, (err, data) => {
		respondOrErr(res, next, 400, err, 201, { data })
	})
})

router.put('/:id', (req, res, next) => {
	Palpite.findByIdAndUpdate(req.params.id, req.body, { new: true }, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.delete('/:id', (req, res, next) => {
	Palpite.findByIdAndRemove(req.params.id, req.body, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.put('/:user/updatePalpites', async (req, res, next) => {
	try {
		let palpites = []
		for (let i = 0; i < req.body.length; i++) {
			let palpite = req.body[i]
			palpite = await Palpite.findByIdAndUpdate(palpite._id, { placarTimeA: palpite.placarTimeA, placarTimeB: palpite.placarTimeB }, { new: true })
			palpites.push(palpite)
		}
		respondSuccess(res, 200, { data: montarPalpites(palpites) })
	} catch (err) {
		respondErr(next, 500, err)
	}
})

router.get('/:user/:fase/montarpalpites', async (req, res, next) => {
	const user = req.params.user
	const faseId = req.params.fase
	try {
		const fase = await Fase.findById(faseId);
		let partidas = await Partida.find({ fase: fase.nome }).sort({ order: 'asc' })
		let palpites = await Palpite.find({ user, 'partida.fase': fase.nome })
		if (palpites.length === 0) {
			partidas.forEach(partida => {
				delete partida.placarTimeA
				delete partida.placarTimeB
				palpites.push({ user, partida })
			})
			palpites = await Palpite.insertMany(palpites)
		}
		respondSuccess(res, 200, { data: montarPalpites(palpites) })
	} catch (err) {
		respondErr(next, 500, err)
	}
})

const montarPalpites = (palpites) => {
	palpites = ordernarPalpites(palpites)
	let idx = 0
	let gidx = 0
	let grupo = { nome: palpites[0].partida.grupo, rodadas: [] }
	let grupos = [grupo]
	let ridx = 0
	let rodada = { nome: palpites[0].partida.rodada, palpites: [] }
	let rodadas = [rodada]
	while (idx < palpites.length) {
		let partida = palpites[idx].partida
		if (partida.grupo === grupos[gidx].nome) {
			if (partida.rodada === rodadas[ridx].nome) {
				rodadas[ridx].palpites.push(palpites[idx++])
			} else {
				// NOVA RODADA PARA O MESMO GRUPO
				++ridx
				rodada = { nome: palpites[idx].partida.rodada, palpites: [] }
				rodadas.push(rodada)
				rodadas[ridx].palpites.push(palpites[idx++])
			}
		} else {
			//NOVO GRUPO
			grupos[gidx].rodadas = rodadas
			++gidx
			grupo = { nome: palpites[idx].partida.grupo, rodadas: [] }
			grupos.push(grupo)


			// NOVA RODADA
			ridx = 0
			rodada = { nome: palpites[idx].partida.rodada, palpites: [] }
			rodadas = [rodada]
		}
	}
	grupos[gidx].rodadas = rodadas
	return grupos
}

const ordernarPalpites = (palpites) => {
	palpites = palpites.sort((p1, p2) => {
		const test = p1.partida.grupo.localeCompare(p2.partida.grupo)
		if (test === 0) {
			const test1 = p1.partida.rodada.localeCompare(p2.partida.rodada)
			if (test1 === 0) {
				return p1.partida.order - p2.partida.order
			}
			return test1
		}
		return test
	})
	return palpites
}

router.use(handlerError)
exports = module.exports = router