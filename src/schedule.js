const schedule = require('node-schedule')
const moment = require('moment')
const { JSDOM } = require('jsdom')
const Partida = require('./api/model/partida')
const atualizarResultados = require('./api/service/resultadoService')

schedule.scheduleJob('*/5 12-20 * * *', async () => {
	console.log('chegou aqui')
	try {
		const dom = await JSDOM.fromURL('https://globoesporte.globo.com/placar-ge/hoje/jogos.ghtml')
		console.log('O parse do dom funcionou!!!')
		const date = moment().subtract(3, 'hours').toDate()
		console.log('Data atual: ', date)
		const partidas = await Partida.find({ data: { $lt: date } }).sort({ order: 'asc' })
		console.log(`Achou ${partidas.length} partidas`)
		const doc = dom.window.document;
		const jogos = doc.getElementsByClassName('card-jogo')
		console.log(`Acho ${jogos.length} jogos`)
		for (let i = 0; i < jogos.length; i++) {
			const jogo = jogos.item(i)
			const nomeJogo = jogo.getElementsByClassName('titulo').item(0).firstElementChild.innerHTML
			const horarioJogo = jogo.getElementsByClassName('titulo').item(0).lastElementChild.getAttribute('datetime')
			if (nomeJogo == 'Copa do Mundo da FIFA™') {
				const timeA = jogo.getElementsByClassName('mandante').item(0).getElementsByClassName('nome-abreviado').item(0).innerHTML
				const timeB = jogo.getElementsByClassName('visitante').item(0).getElementsByClassName('nome-abreviado').item(0).innerHTML
				console.log(`Acho jogo ${timeA} x ${timeB}`)
				const resultado = jogo.getElementsByClassName('resultado').item(0)
				if (resultado.childElementCount > 1) {
					const placarTimeA = resultado.getElementsByClassName('placar-mandante').item(0).innerHTML
					const placarTimeB = resultado.getElementsByClassName('placar-visitante').item(0).innerHTML
					console.log(`Acho jogo com placar ${moment(horarioJogo, 'YYYY-MM-DDThh:mm:ss')} ${timeA} ${placarTimeA} x ${placarTimeB} ${timeB}`)
					if (placarTimeA >= 0 && placarTimeB >= 0) {
						console.log('Procurando partida')
						const partida = partidas.find(partida => {
							return partida.timeA.sigla == timeA &&
									partida.timeB.sigla == timeB &&
									moment(partida.data, 'YYYY-MM-DDThh:mm:ss').isSame(moment(horarioJogo, 'YYYY-MM-DDThh:mm:ss'))
						})
						if (partida != null) {
							console.log(`Achou partida ${partida.timeA.sigla} ${partida.placarTimeA} x ${partida.placarTimeB} ${partida.timeB.sigla}`)
							if (partida.placarTimeA != placarTimeA || partida.placarTimeB != placarTimeB) {
								console.log('Achou partida com placar desatualizado')
								const newPartida = await atualizarResultados(partida._id, { placarTimeA, placarTimeB })
								console.log(`Partida: ${newPartida._id} - ${newPartida.timeA.sigla} ${newPartida.placarTimeA} x ${newPartida.placarTimeB} ${newPartida.timeB.sigla}`)
							}
						}
					}	
				}
			}
		}
		console.log('finalizou a atualização dos resultados')
	} catch(err) {
		console.log(err)
	}
});