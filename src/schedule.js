const schedule = require('node-schedule')
const moment = require('moment')
const { JSDOM } = require('jsdom')
const Partida = require('./api/model/partida')
const atualizarResultados = require('./api/service/resultadoService')

const URL = 'https://www.uol.com.br/service.htm?type=projects/world-cup-2022/calendar/calendar-api-2022&v=6&args={"search":{"params":{"season":2022,"setDate":false}}}'

schedule.scheduleJob('* * * * *', async () => {
	console.log('chegou aqui')
	try {
		const response = await fetch(URL)
		const data = await response.json()
		console.log('O parse do dom funcionou!!!')
		const date = moment().subtract(3, 'hours').toDate()
		console.log('Data atual: ', date)
		const partidas = await Partida.find({ data: { $gt: date } }).sort({ order: 'asc' })
		console.log(`Achou ${partidas.length} partidas`)
		const jogos = data.matches
		const times = data.teams
		times.map(time => {
			if (time.abbr === 'QAT') {
				time.abbr = 'CAT'
			} else if (time.abbr === 'SAU') {
				time.abbr = 'ARA'
			} else if (time.abbr === 'COS') {
				time.abbr = 'CRC'
			} else if (time.abbr === 'CDS') {
				time.abbr = 'COR'
			} else if (time.abbr === 'SBR') {
				time.abbr = 'SER'
			}
		})
		console.log(`Acho ${jogos.length} jogos`)
		for (let i = 0; i < jogos.length; i++) {
			const horarioJogo = jogos[i].info.dateString
			const timeA = jogos[i].team1
			const timeB = jogos[i].team2
			const siglaTimeA = times.find(time => time.id === timeA.id).abbr
			const siglaTimeB = times.find(time => time.id === timeB.id).abbr
			const placarTimeA = timeA.score
			const placarTimeB = timeB.score
			console.log(`Acho jogo ${siglaTimeA} x ${siglaTimeB}`)
			if (placarTimeA && placarTimeA >= 0 && placarTimeB && placarTimeB >= 0) {
				console.log(`Acho jogo com placar ${horarioJogo} ${siglaTimeA} ${placarTimeA} x ${placarTimeB} ${siglaTimeB}`)
				console.log('Procurando partida')
				const partida = partidas.find(partida => {
					return partida.timeA && partida.timeA.sigla == siglaTimeA 
						&& partida.timeB && partida.timeB.sigla == siglaTimeB
						&& moment(horarioJogo, 'YYYY-MM-DD hh:mm').subtract(3, 'hours').isSame(moment(partida.data, 'YYYY-MM-DDThh:mm:ss'))
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
			// const resultTimeA = timeA.getElementsByClassName('result').getElementsByClassName('goal').get(0)
			// const resultTimeB = timeB.getElementsByClassName('result').getElementsByClassName('goal').get(0)
			// if (resultTimeA.css.display !== 'none' && resultTimeB.css.display !== 'none') {
			// 	const placarTimeA = resultTimeA.innerHTML
			// 	const placarTimeB = resultTimeA.innerHTML
			// 	console.log(`Acho jogo com placar $${nomeTimeA} ${placarTimeA} x ${placarTimeB} ${nomeTimeB}`)
			// } else {
			// 	console.log(`Acho jogo sem placar $${nomeTimeA} x ${nomeTimeB}`)
			// }
		}
		// const dom = await JSDOM.fromURL('https://www.uol.com.br/esporte/futebol/copa-do-mundo/tabela-da-copa')
		// console.log('O parse do dom funcionou!!!')
		// const date = moment().subtract(3, 'hours').toDate()
		// console.log('Data atual: ', date)
		// const partidas = await Partida.find({ data: { $lt: date } }).sort({ order: 'asc' })
		// console.log(`Achou ${partidas.length} partidas`)
		// const doc = dom.window.document;
		// const jogos = doc.getElementsByClassName('teams-container')
		// console.log(`Acho ${jogos.length} jogos`)
		// for (let i = 0; i < jogos.length; i++) {
		// 	const jogo = jogos.item(i)
		// 	const timeA = jogo.getElementsByClassName('team1')
		// 	const timeB = jogo.getElementsByClassName('team2')
		// 	const nomeTimeA = timeA.getElementsByClassName('name').innerHTML
		// 	const nomeTimeB = timeB.getElementsByClassName('name').innerHTML
		// 	console.log(`Acho jogo ${nomeTimeA} x ${nomeTimeB}`)
		// 	const resultTimeA = timeA.getElementsByClassName('result').getElementsByClassName('goal').get(0)
		// 	const resultTimeB = timeB.getElementsByClassName('result').getElementsByClassName('goal').get(0)
		// 	if (resultTimeA.css.display !== 'none' && resultTimeB.css.display !== 'none') {
		// 		const placarTimeA = resultTimeA.innerHTML
		// 		const placarTimeB = resultTimeA.innerHTML
		// 		console.log(`Acho jogo com placar $${nomeTimeA} ${placarTimeA} x ${placarTimeB} ${nomeTimeB}`)
		// 	} else {
		// 		console.log(`Acho jogo sem placar $${nomeTimeA} x ${nomeTimeB}`)
		// 	}


			// const nomeJogo = jogo.getElementsByClassName('titulo').item(0).firstElementChild.innerHTML
			// const horarioJogo = jogo.getElementsByClassName('titulo').item(0).lastElementChild.getAttribute('datetime')
			// if (nomeJogo == 'Copa do Mundo da FIFA™') {
			// 	const timeA = jogo.getElementsByClassName('mandante').item(0).getElementsByClassName('nome-abreviado').item(0).innerHTML
			// 	const timeB = jogo.getElementsByClassName('visitante').item(0).getElementsByClassName('nome-abreviado').item(0).innerHTML
			// 	console.log(`Acho jogo ${timeA} x ${timeB}`)
			// 	const resultado = jogo.getElementsByClassName('resultado').item(0)
			// 	if (resultado.childElementCount > 1) {
			// 		const placarTimeA = resultado.getElementsByClassName('placar-mandante').item(0).innerHTML
			// 		const placarTimeB = resultado.getElementsByClassName('placar-visitante').item(0).innerHTML
			// 		console.log(`Acho jogo com placar ${moment(horarioJogo, 'YYYY-MM-DDThh:mm:ss')} ${timeA} ${placarTimeA} x ${placarTimeB} ${timeB}`)
			// 		if (placarTimeA >= 0 && placarTimeB >= 0) {
			// 			console.log('Procurando partida')
			// 			const partida = partidas.find(partida => {
			// 				return partida.timeA.sigla == timeA &&
			// 						partida.timeB.sigla == timeB &&
			// 						moment(partida.data, 'YYYY-MM-DDThh:mm:ss').isSame(moment(horarioJogo, 'YYYY-MM-DDThh:mm:ss'))
			// 			})
			// 			if (partida != null) {
			// 				console.log(`Achou partida ${partida.timeA.sigla} ${partida.placarTimeA} x ${partida.placarTimeB} ${partida.timeB.sigla}`)
			// 				if (partida.placarTimeA != placarTimeA || partida.placarTimeB != placarTimeB) {
			// 					console.log('Achou partida com placar desatualizado')
			// 					const newPartida = await atualizarResultados(partida._id, { placarTimeA, placarTimeB })
			// 					console.log(`Partida: ${newPartida._id} - ${newPartida.timeA.sigla} ${newPartida.placarTimeA} x ${newPartida.placarTimeB} ${newPartida.timeB.sigla}`)
			// 				}
			// 			}
			// 		}	
			// 	}
			// }
		console.log('finalizou a atualização dos resultados')
	} catch(err) {
		console.log(err)
	}
});