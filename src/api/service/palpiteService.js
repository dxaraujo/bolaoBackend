const express = require('express')
const Palpite = require('../model/palpite')
const Partida = require('../model/partida')
const { respondOrErr, respondSuccess, respondErr, handlerError } = require('../../util/serviceUtils')

const router = express.Router()

router.get('/', (req, res, next) => {
	Palpite.find(req.query, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
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

router.put('/:user/updatePalpites', (req, res, next) => {
	try {
		let palpites = []
		req.body.forEach(async palpite => {
			const palpite = await Palpite.findByIdAndUpdate({ _id: palpite._id }, { placarTimeA: palpite.placarTimeA, placarTimeB: palpite.placarTimeB }, { new: true })
			palpites.push(palpite)
		})
		respondSuccess(res, 200, { data: palpites })
	} catch (err) {
		respondErr(next, 500, err)
	}
})

router.get('/:user/:fase/montarpalpites', (req, res, next) => {
	const user = req.params.user
	const fase = req.params.fase
	Palpite.find({ user }).then(async palpites => {
		let partidas = await Partida.find({ fase }).sort({ 'data': 'asc' })
		if (!palpites.length) {
			partidas.forEach(partida => {
				delete partida.placarTimeA
				delete partida.placarTimeB
				palpites.push({ user, partida })
			})
			palpites = await Palpite.insertMany(palpites)
		}
		const grupos = montarPalpites(palpites)
		respondSuccess(res, 200, { data: grupos })
	}).catch(err => {
		respondErr(next, 500, err)
	})
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
				return p1.partida.data - p2.partida.data
			}
			return test1
		}
		return test
	})
	return palpites
}

router.use(handlerError)
exports = module.exports = router