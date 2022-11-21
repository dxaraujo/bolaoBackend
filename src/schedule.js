const schedule = require('node-schedule')
const fetch = require('node-fetch')
const moment = require('moment')
const Partida = require('./api/model/partida')
const atualizarResultados = require('./api/service/resultadoService')

const URL = 'https://www.estadao.com.br/pf/api/v3/content/fetch/esportes?query={"params":{"mode":"api"},"requestUri":"https://estadao.com.br/esportes/futebol/partidas/copa-do-mundo/2022"}&d=302&_website=estadao'

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

schedule.scheduleJob('* 7-19 * * *', async () => {
	console.log('iniciou a atualização dos resultados')
	try {
		const response = await fetch(URL)
		const data = await response.json()
		const date = moment().subtract(3, 'hours').toDate()
		console.log('Data atual: ', date)
		const partidas = await Partida.find({ data: { $lt: date } }).sort({ order: 'asc' })
		console.log(`Encontrou ${partidas.length} partidas`)
		const jogos = obterJogos(data)
		console.log(`Encontrou ${jogos.length} jogos`)
		for (let i = 0; i < jogos.length; i++) {
			const horarioJogo = jogos[i].data
			const siglaTimeA = jogos[i].time_1 ? jogos[i].time_1.sigla : undefined
			const siglaTimeB = jogos[i].time_2 ? jogos[i].time_2.sigla : undefined
			const placarTimeA = jogos[i].time_1 ? jogos[i].time_1.gols : undefined
			const placarTimeB = jogos[i].time_2 ? jogos[i].time_2.gols : undefined
			if (placarTimeA && placarTimeA >= 0 && placarTimeB && placarTimeB >= 0) {
				const partida = partidas.find(partida => {
					console.log(moment(horarioJogo, 'MMM DD YYYY hh:mm:ss:SSSA').subtract(3, 'hours'))
					console.log(moment(partida.data, 'YYYY-MM-DDThh:mm:ss'))
					console.log(moment(horarioJogo, 'MMM DD YYYY hh:mm:ss:SSSA').subtract(3, 'hours').isSame(moment(partida.data, 'YYYY-MM-DDThh:mm:ss')))
					return partida.timeA && partida.timeA.sigla == siglaTimeA 
						&& partida.timeB && partida.timeB.sigla == siglaTimeB
						&& moment(horarioJogo, 'MMM DD YYYY hh:mm:ss:SSSA').subtract(3, 'hours').isSame(moment(partida.data, 'YYYY-MM-DDThh:mm:ss'))
				})
				if (partida != null) {
					if (partida.placarTimeA != placarTimeA || partida.placarTimeB != placarTimeB) {
						console.log(`Partida: ${partida.timeA.sigla} ${partida.placarTimeA} x ${partida.placarTimeB} ${partida.timeB.sigla} com placar desatualizado`)
						const newPartida = await atualizarResultados(partida._id, { placarTimeA, placarTimeB })
						console.log(`Partida: ${newPartida.timeA.sigla} ${newPartida.placarTimeA} x ${newPartida.placarTimeB} ${newPartida.timeB.sigla} atualizada`)
					}
				}
			}
		}
		console.log('finalizou a atualização dos resultados')
	} catch(err) {
		console.log(err)
	}
});