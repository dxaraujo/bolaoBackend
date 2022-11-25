const schedule = require('node-schedule')
const fetch = require('node-fetch')
const moment = require('moment')
const Partida = require('./api/model/partida')
const atualizarResultados = require('./api/service/resultadoService')

const URL = 'https://www.estadao.com.br/pf/api/v3/content/fetch/esportes?query={%22params%22:{%22mode%22:%22api%22},%22requestUri%22:%22https://estadao.com.br/esportes/futebol/partidas/copa-do-mundo/2022%22}'

const obterJogos = (data) => {
	let result = []
	if (data && data.fases) {
		const fases = data.fases
		for (let i = 0; i < fases.length; i++) {
			const fase = fases[i]
			if (fase && fase.grupos) {
				const grupos = fase.grupos
				for (let j = 0; j < grupos.length; j++) {
					const grupo = grupos[j]
					if (grupo && grupo.jogos) {
						const jogos = grupo.jogos
						for (let k = 0; k < jogos.length; k++) {
							result.push(jogos[k])
						}
					}
				}
			}
		}
	}
	return result
}

schedule.gracefulShutdown().then(() => {
	schedule.scheduleJob('*/5 7-19 * * *', async () => {
		let date = moment().subtract(3, 'hours').toDate()
		console.log(`Iniciou atualização dos resultados: ${date}`)
		try {
			const response = await fetch(URL)
			const data = await response.json()
			const jogos = obterJogos(data)
			// console.log(`Encontrou ${jogos.length} jogos`)
			const partidas = await Partida.find({ data: { $lt: date } }).sort({ order: 'asc' })
			// console.log(`Encontrou ${partidas.length} partidas`)
			for (let i = 0; i < jogos.length; i++) {
				const horarioJogo = jogos[i].data
				const siglaTimeA = jogos[i].time_1 ? jogos[i].time_1.sigla : undefined
				const siglaTimeB = jogos[i].time_2 ? jogos[i].time_2.sigla : undefined
				const placarTimeA = jogos[i].time_1 ? jogos[i].time_1.gols : undefined
				const placarTimeB = jogos[i].time_2 ? jogos[i].time_2.gols : undefined
				if (placarTimeA && placarTimeA >= 0 && placarTimeB && placarTimeB >= 0) {
					// console.log(`Achou jogo com placar ${siglaTimeA} ${placarTimeA} x ${placarTimeB} ${siglaTimeB}`)
					const partida = partidas.find(partida => {
						return partida.timeA && partida.timeA.sigla == siglaTimeA 
							&& partida.timeB && partida.timeB.sigla == siglaTimeB
							&& moment(horarioJogo, 'MMM DD YYYY hh:mm:ss:SSSA').isSame(moment(partida.data, 'YYYY-MM-DDThh:mm:ss'))
					})
					if (partida != null) {
						// console.log(`Achou partida ${partida.timeA.sigla} ${partida.placarTimeA | ' '} x ${partida.placarTimeB | ' '} ${partida.timeB.sigla}`)
						if (partida.placarTimeA != placarTimeA || partida.placarTimeB != placarTimeB) {
							const partidaLog = `${partida.timeA.sigla} ${partida.placarTimeA | ' '} x ${partida.placarTimeB | ' '} ${partida.timeB.sigla}`
							const jogoLog = `${siglaTimeA} ${placarTimeA} x ${placarTimeB} ${siglaTimeB}`
							console.log(`Partida ${partidaLog} desatualizado, deveria estar ${jogoLog}`)
							const newPartida = await atualizarResultados(partida._id, { placarTimeA, placarTimeB })
							console.log(`Partida atualizada: ${partidaLog}`)
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