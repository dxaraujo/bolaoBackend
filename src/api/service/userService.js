//const fetch = require('node-fetch');
//const fileType = require('file-type');
const express = require('express')
const moment = require('moment')
const User = require('../model/user')
const Fase = require('../model/fase')
const Palpite = require('../model/palpite')
const { respondOrErr, respondErr, respondSuccess, handlerError } = require('../../util/serviceUtils')

const router = express.Router()

router.get('/', async (req, res, next) => {
	User.find(req.query).then(async users => {
		const fases = await Fase.find({ status: 'B' })
		for (let i = 0; i < users.length; i++) {
			if (users[i].ativo) {
				console.log('###########################################################################')
				console.log(`APOSTAS DE ${users[i].name}`)
				console.log('###########################################################################')
				let palpites = await Palpite.find({ user: users[i]._id }).sort({ 'partida.order': 'asc' })
				palpites = palpites.filter(palpite => {
					let result = false
					for (let j = 0; j < fases.length; j++) {
						if (fases[j].nome === palpite.partida.fase) {
							result = true
							break
						}
					}
					return result
				})
				let fase = ''
				palpites.forEach(palpite => {
					if (palpite.partida.fase !== fase) {
						console.log('---------------------------------------------------------------------------')
						console.log(`${palpite.partida.fase}`)
						console.log('---------------------------------------------------------------------------')
						console.log('Data                 Seleção 1            Placar           Seleção 2')
						fase = palpite.partida.fase
					}
					console.log(`${moment(palpite.partida.data).add(3, 'hours').format('DD/MM/YYYY hh:mm').padEnd(20)} ${palpite.partida.timeA.nome.padEnd(20)} ${palpite.placarTimeA != null ? palpite.placarTimeA : ' '} x ${palpite.placarTimeB != null ? palpite.placarTimeB : ' '}            ${palpite.partida.timeB.nome}`)
				})
				users[i].set('palpites', palpites)
			}
		}
		respondSuccess(res, 200, { data: users })
	}).catch(err => {
		respondErr(next, 500, err)
	});
})

router.get('/:id', (req, res, next) => {
	User.findById(req.params.id, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	});
})

router.post('/', (req, res, next) => {
	User.create(req.body, (err, data) => {
		respondOrErr(res, next, 400, err, 201, { data })
	})
})

router.put('/:id', (req, res, next) => {
	User.findByIdAndUpdate(req.params.id, { isAdmin: req.body.isAdmin, ativo: req.body.ativo }, { new: true }, (err, data) => {
		respondOrErr(res, next, 500, err, 200, { data })
	})
})

router.delete('/:id', (req, res, next) => {
	User.findById(req.params.id).then(async user => {
		if (user) {
			const palpites = await Palpite.find({ user: user._id })
			for (let i = 0; i < palpites.length; i++) {
				const palpite = palpites[i];
				const p = await Palpite.findByIdAndRemove(palpite._id)
			}
			const data = await User.findByIdAndRemove(user._id)
			respondSuccess(res, 200, { data })
		} else {
			respondSuccess(res, 200, { data: 'Usuário não encontrado' })
		}
	}).catch(err => {
		respondErr(next, 500, err)
	})
})

router.use(handlerError)

exports = module.exports = router