const express = require('express')
const moment = require('moment')
const Partida = require('../model/partida')
const { respondOrErr, handlerError } = require('../../util/serviceUtils')

const router = express.Router()

router.get('/', (req, res, next) => {
	Partida.find(req.query, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.get('/resultado', (req, res, next) => {
	Partida.find({}, req.body, (err, data) => {
		if (data) {
			let partidas = []
			data.forEach(partida => {
				if (moment(partida.data, 'YYYY-MM-DDThh:mm:ss').isBefore(new Date())) {
					partidas.push(partida)
				}
			})
		}
		respondOrErr(res, next, 500, err, 200, { partidas })
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