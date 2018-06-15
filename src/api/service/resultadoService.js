const express = require('express')
const moment = require('moment')
const Partida = require('../model/partida')
const { JSDOM } = require('jsdom')
const { respondErr, respondSuccess, handlerError } = require('../../util/serviceUtils')

const router = express.Router()

router.get('/', (req, res, next) => {
	try {
		JSDOM.fromURL('https://globoesporte.globo.com/placar-ge/hoje/jogos.ghtml').then(async dom => {

			const document = dom.window.document
			const jogos = document.getElementsByClassName('card-jogo')

			const partidas = await Partida.find({ data: { $lt: moment.utc(new Date()).add(3, 'hours').toDate() } }).sort({ data: 'asc' })

			for (let i = 0; i < jogos.length; i++) {
				const nomeJogo = jogos.item(i).getElementsByClassName('titulo').item(0).firstElementChild.innerHTML
				const dataHoraJogo = jogos.item(i).getElementsByClassName('titulo').item(0).getElementsByClassName('hora-local').item(0).getAttribute('content')
				if (nomeJogo == 'Copa do Mundo da FIFA™') {

					const nomeTimeA = jogos.item(i).getElementsByClassName('mandante').item(0).getElementsByClassName('nome-completo').item(0).innerHTML
					const nomeTimeB = jogos.item(i).getElementsByClassName('visitante').item(0).getElementsByClassName('nome-completo').item(0).innerHTML

					const resultado = jogos.item(i).getElementsByClassName('resultado')
					const placarTimeA = resultado.item(0).getElementsByClassName('placar-mandante').item(0).innerHTML
					const placarTimeB = resultado.item(0).getElementsByClassName('placar-visitante').item(0).innerHTML

					console.log(dataHoraJogo)
					console.log(nomeTimeA)
					console.log(nomeTimeB)
					partidas.forEach(async partida => {
						if (partida.timeA.nome == nomeTimeA &&
							partida.timeB.nome == nomeTimeB &&
							moment(partida.data).isSame(moment(dataHoraJogo, 'YYYY-MM-DDThh:mm:ss'))) {
							console.log('achou partida')
							console.log(partida)
							console.log(placarTimeA)
							console.log(placarTimeB)
							partida = await Partida.findByIdAndUpdate(partida._id, { placarTimeA, placarTimeB }, { new: true })
						}
					});
					respondSuccess(res, 200, { data: 'Só sucesso' })
				}
			}
		})
	} catch (err) {
		respondErr(next, 500, err)
	}
})

router.use(handlerError)

exports = module.exports = router