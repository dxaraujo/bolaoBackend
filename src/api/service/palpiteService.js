const express = require('express')
const ObjectId = require('mongoose').mongo.ObjectId
const Palpite = require('../model/palpite')
const Partida = require('../model/partida')
const Time = require('../model/time')
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
	const palpites = montarPalpiteUpdate(req.body)
	palpites.forEach(palpite => {
		Palpite.findByIdAndUpdate({ _id: palpite._id }, palpite, { new: true }, (err, palp) => {
			console.log('chamou')
		})
	})
	res.status(200).json({ data: 'OK' });
})

router.get('/:user/:fase/montarpalpites', (req, res, next) => {
	const user = req.params.user
	const fase = req.params.fase
	Palpite.find({ user }, (err, data) => {
		if (!err) {
			Partida.find({ fase }, (err, partidas) => {
				const parts = ordernarPartidas(partidas)
				Time.find({}, (err, times) => {
					let palpites = []
					parts.forEach(partida => {
						palpites.push({ user, partida: partida._id })
					})
					if (data && data.length > 0) {
						const grupos = montarPalpites(data, parts, times)
						respondOrErr(res, next, 500, err, 200, { data: grupos })
					} else {
						Palpite.insertMany(palpites, (err, palpites) => {
							const grupos = montarPalpites(palpites, parts, times)
							respondOrErr(res, next, 500, err, 200, { data: grupos })
						})
					}
				})
			})
		} else {
			respondErr(res, next, 500, err)
		}
	})
})

const montarPalpiteUpdate = (palpites) => {
	const palp = []
	palpites.forEach(palpite => {
		palp.push({ _id: palpite._id, placarTimeA: palpite.placarTimeA, placarTimeB: palpite.placarTimeB })
	})
	return palp
}

const ordernarPartidas = (partidas) => {
	const parts = partidas.sort((p1, p2) => {
		const test = p1.grupo.localeCompare(p2.grupo)
		if (test === 0) {
			const test1 = p1.rodada.localeCompare(p2.rodada)
			if (test1 === 0) {
				return p1.data - p2.data
			}
			return test1
		}
		return test
	})
	return parts
}

const ordernarPalpites = (palpites) => {
	const palps = palpites.sort((p1, p2) => {
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
	return palps
}

const popularTimes = (partidas, times) => {
	const part = []
	partidas.forEach(partida => {
		const timeA = times.find(time => time._id.equals(partida.timeA))
		const timeB = times.find(time => time._id.equals(partida.timeB))
		part.push({ ...partida._doc, timeA, timeB })

	})
	return part
}

const popularPartidas = (palpites, partidas, times) => {
	partidas = popularTimes(partidas, times)
	const palp = []
	palpites.forEach(palpite => {
		const partida = partidas.find(partida => partida._id.equals(palpite.partida))
		palp.push({ ...palpite._doc, partida })

	})
	return palp
}

const montarPalpites = (palpites, partidas, times) => {
	palpites = popularPartidas(palpites, partidas, times)
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
				rodadas[ridx].palpites.push({ ...palpites[idx++] })
			} else {
				// NOVA RODADA PARA O MESMO GRUPO
				++ridx
				rodada = { nome: palpites[idx].partida.rodada, palpites: [] }
				rodadas.push(rodada)
				rodadas[ridx].palpites.push({ ...palpites[idx++] })
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

router.use(handlerError)

exports = module.exports = router


/*
	Teste  da funcção de comentário
*/
router.get('/:user/:fase/montarpalpites2', async (req, res, next) => {

	const user = req.params.user
	const fase = req.params.fase

	let times;
	let partidas;

	Promise.all([
		Time.find({}),
		Partida.find({ fase }).sort({ 'data': 'asc' }),
		Palpite.find({ user })
	]).then(([ts, parts, palpites]) => {
		times = ts
		partidas = parts
		if (palpites && palpites.length > 0) {
			return palpites
		} else {
			partidas.forEach(partida => { palpites.push({ user, partida: partida._id }) })
			return Palpite.insertMany(palpites)
		}
	}).then(([palpites, times]) => {
		const grupos = montarPalpites(palpites, partidas, times)
		respondSuccess(res, 200, { data: grupos })
	}).catch(err => {
		respondErr(next, 500, { errors: err })
	});
})