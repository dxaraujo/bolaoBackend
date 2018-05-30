const express = require('express')
const Palpite = require('../model/palpite')
const Partidas = require('../model/partida')
const { respondOrErr, respondErr, handlerError } = require('../../util/serviceUtils')

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

router.get('/:userId/:fase/montarpalpites', (req, res, next) => {
	Palpite.find({ 'user._id': userId, 'partida.fase': fase  }, (err, palpites) => {
		if (!err) {
			if (palpites && palpites.length > 0) {
				respondOrErr(res, next, 500, err, 200, { data: palpites })
			} else {
				respondOrErr(res, next, 500, err, 200, { data: palpites })
			}
		} else {
			respondErr(res, next, 500, err)
		}
	})
})

const montarPalpites = (partidas) => {
	console.log('Chegou')
}

router.use(handlerError)

exports = module.exports = router