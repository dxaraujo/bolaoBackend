const express = require('express')
const Partida = require('../model/partida')
const atualizarResultados = require('./resultadoService')
const moment = require('moment')
const { respondOrErr, respondSuccess, respondErr, handlerError } = require('../../util/serviceUtils')

const router = express.Router()

router.get('/', (req, res, next) => {
	Partida.find(req.query).sort({ data: 'asc', order: 'asc' }).then(partidas => {
		respondSuccess(res, 200, { data: partidas })
	}).catch(err => {
		respondErr(next, 500, err)
	})
})

router.get('/resultado', async (req, res, next) => {
	const date = moment().subtract(3, 'hours').toDate()
	Partida.find({ data: { $lt: date } }).sort({ data: 'asc', order: 'asc' }).then(partidas => {
		respondSuccess(res, 200, { data: partidas })
	}).catch(err => {
		respondErr(next, 500, err)
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

router.put('/:id/updateResultado', async (req, res, next) => {
	try {
		const newPartida = await atualizarResultados(req.params.id, req.body)
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

router.use(handlerError)
exports = module.exports = router