const schedule = require('node-schedule')
const fetch = require('node-fetch')
const moment = require('moment')
const Partida = require('./api/model/partida')
const atualizarResultados = require('./api/service/resultadoService')

const URL = 'https://www.estadao.com.br/pf/api/v3/content/fetch/content-api-copa-2022?query={"origin":"proximos-jogos"}&d=320&_website=estadao'

schedule.gracefulShutdown().then(() => {
	schedule.scheduleJob('*/5 7-20 * * *', async () => {
		let date = moment().subtract(3, 'hours').toDate()
		console.log(`Iniciou atualização dos resultados: ${date}`)
		try {
			const response = await fetch(URL)
			const jogos = await response.json()
			console.log(`Encontrou ${jogos.length} jogos`)
			const partidas = await Partida.find({ data: { $lt: date } }).sort({ order: 'asc' })
			console.log(`Encontrou ${partidas.length} partidas`)
			for (let i = 0; i < jogos.length; i++) {
				const horarioJogo = jogos[i].data
				const siglaTimeA = jogos[i].time1_nome_min
				const siglaTimeB = jogos[i].time2_nome_min
				const placarTimeA = Number(jogos[i].time1_gols)
				const placarTimeB = Number(jogos[i].time2_gols)
				if (placarTimeA && placarTimeA >= 0 && placarTimeB && placarTimeB >= 0) {
					console.log(`Achou jogo com placar ${siglaTimeA} ${placarTimeA} x ${placarTimeB} ${siglaTimeB}`)
					const partida = partidas.find(partida => {
						console.log(moment(horarioJogo).subtract(3, 'hours'))
						console.log(moment(partida.data, 'YYYY-MM-DDThh:mm:ss'))
						console.log(moment(horarioJogo).isSame(moment(partida.data, 'YYYY-MM-DDThh:mm:ss')))
						return partida.timeA && partida.timeA.sigla == siglaTimeA 
							&& partida.timeB && partida.timeB.sigla == siglaTimeB
							&& moment(horarioJogo).subtract(3, 'hours').isSame(moment(partida.data, 'YYYY-MM-DDThh:mm:ss').add(3, 'hours'))
					})
					if (partida != null) {
						console.log(`Achou partida ${partida.timeA.sigla} ${partida.placarTimeA | ' '} x ${partida.placarTimeB | ' '} ${partida.timeB.sigla}`)
						if (partida.placarTimeA != placarTimeA || partida.placarTimeB != placarTimeB) {
							const partidaLog = `${partida.timeA.sigla} ${partida.placarTimeA | ' '} x ${partida.placarTimeB | ' '} ${partida.timeB.sigla}`
							const jogoLog = `${siglaTimeA} ${placarTimeA} x ${placarTimeB} ${siglaTimeB}`
							console.log(`Partida ${partidaLog} desatualizado, deveria estar ${jogoLog}`)
							const newPartida = await atualizarResultados(partida._id, { placarTimeA, placarTimeB })
							console.log(`Partida atualizada: ${newPartida.timeA.sigla} ${newPartida.placarTimeA} x ${newPartida.placarTimeB} ${newPartida.timeB.sigla}`)
						}
					}
				}
			}
			date = moment().subtract(3, 'hours').toDate()
			console.log(`Finalizou atualização dos resultados: ${date}`)
		} catch(err) {
			console.log(err)
		}
	})
})

process.on('SIGINT', function () { 
	schedule.gracefulShutdown().then(() => process.exit(0))
})