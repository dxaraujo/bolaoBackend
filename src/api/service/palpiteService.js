const express = require('express')
const ObjectId = require('mongoose').mongo.ObjectId
const PalpiteModel = require('../model/palpite')
const PartidaModel = require('../model/partida')
const TimeModel = require('../model/time')
const { respondOrErr, respondErr, handlerError } = require('../../util/serviceUtils')

const router = express.Router()

router.get('/', (req, res, next) => {
	PalpiteModel.find(req.query, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.get('/:id', (req, res, next) => {
	PalpiteModel.findById(req.params.id, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	});
})

router.post('/', (req, res, next) => {
	PalpiteModel.create(req.body, (err, data) => {
		respondOrErr(res, next, 400, err, 201, { data })
	})
})

router.put('/:id', (req, res, next) => {
	PalpiteModel.findByIdAndUpdate(req.params.id, req.body, { new: true }, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.delete('/:id', (req, res, next) => {
	PalpiteModel.findByIdAndRemove(req.params.id, req.body, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.put('/:user/updatePalpites', (req, res, next) => {
	PalpiteModel.updateMany({ user: req.params.user}, req.body, { multi: true, new: true}, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.get('/:user/:fase/montarpalpites', (req, res, next) => {
	const user = req.params.user
	const fase = req.params.fase
	PalpiteModel.find({user}, (err, data) => {
		if (!err) {
			PartidaModel.find({ fase }, (err, partidas) => {
				partidas = filtrarPartidasPorFase(partidas, fase)
				TimeModel.find({}, (err, times) => {
					let palpites = []
					partidas.forEach(partida => {
						palpites.push({user, partida: partida._id})
					})
					if (data && data.length > 0) {
						const grupos = montarPalpites(data, partidas, times)
						respondOrErr(res, next, 500, err, 200, { data: grupos })		
					} else {
						PalpiteModel.insertMany(palpites, (err, palpites) => {
							const grupos = montarPalpites(palpites, partidas, times)
							respondOrErr(res, next, 500, err, 200, { data: grupos })		
						})
					}
				})
			}).sort( { grupo: 1, rodada: 1, data: 1 } )
			
		} else {
			respondErr(res, next, 500, err)
		}
	})
})

const filtrarPartidasPorFase = (partidas, fase) => {
	const part = []
	partidas.forEach(partida => {
		if (partida.fase == fase) {
			part.push(partida)
		}
	})
	return part
}

const popularTimes = (partidas, times) => {
	const part = []
	partidas.forEach(partida => {
		const timeA = times.find(time => time._id.equals(partida.timeA))
		const timeB = times.find(time => time._id.equals(partida.timeB))
		part.push({...partida._doc, timeA, timeB})
		
	})
	return part
}

const popularPartidas = (palpites, partidas, times) => {
	partidas = popularTimes(partidas, times)
	const palp = []
	palpites.forEach(palpite => {
		const partida = partidas.find(partida => partida._id.equals(palpite.partida))
		palp.push({...palpite._doc, partida})
		
	})
	return palp
}

const montarPalpites = (palpites, partidas, times) => {
	palpites = popularPartidas(palpites, partidas, times)
	let idx = 0
	let gidx = 0
	let grupo = { nome : palpites[0].partida.grupo, rodadas: [] }
	let grupos = [grupo]
	let ridx = 0
	let rodada = { nome : palpites[0].partida.rodada, palpites: [] }
	let rodadas = [rodada]
	while(idx < palpites.length) {
		let partida = palpites[idx].partida
		if (partida.grupo === grupos[gidx].nome) {
			if(partida.rodada === rodadas[ridx].nome) {
				//delete palpites[idx].partida2
				rodadas[ridx].palpites.push({...palpites[idx++]})
			} else {
				// NOVA RODADA PARA O MESMO GRUPO
				++ridx
				rodada = { nome : palpites[idx].partida.rodada, palpites: [] }
				rodadas.push(rodada)
				//delete palpites[idx].partida2
				rodadas[ridx].palpites.push({...palpites[idx++]})
			}
		} else {
			//NOVO GRUPO
			grupos[gidx].rodadas = rodadas
			++gidx
			grupo = { nome : palpites[idx].partida.grupo, rodadas: [] }
			grupos.push(grupo)
			
			
			// NOVA RODADA
			ridx = 0
			rodada = { nome : palpites[idx].partida.rodada, palpites: [] }
			rodadas = [rodada]
		}
	}
	grupos[gidx].rodadas = rodadas
	return grupos
}

router.use(handlerError)

exports = module.exports = router