const schedule = require('node-schedule')
const fetch = require('node-fetch')
const moment = require('moment')
const Partida = require('./api/model/partida')
const atualizarResultados = require('./api/service/resultadoService')

const URL = 'https://www.uol.com.br/service.htm?type=projects/world-cup-2022/calendar/calendar-api-2022&v=6&args={"search":{"params":{"season":2022,"setDate":false}}}'

schedule.scheduleJob('*/5 7-19 * * *', async () => {
	console.log('iniciou a atualização dos resultados')
	try {
		const response = await fetch(URL)
		const data = await response.json()
		const date = moment().subtract(3, 'hours').toDate()
		console.log('Data atual: ', date)
		const partidas = await Partida.find({ data: { $lt: date } }).sort({ order: 'asc' })
		// console.log(`Encontrou ${partidas.length} partidas`)
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
		// console.log(`Encontrou ${jogos.length} jogos`)
		for (let i = 0; i < jogos.length; i++) {
			const horarioJogo = jogos[i].info.dateString
			const timeA = jogos[i].team1
			const timeB = jogos[i].team2
			const siglaTimeA = times.find(time => time.id === timeA.id).abbr
			const siglaTimeB = times.find(time => time.id === timeB.id).abbr
			const placarTimeA = timeA.score
			const placarTimeB = timeB.score
			if (placarTimeA && placarTimeA >= 0 && placarTimeB && placarTimeB >= 0) {
				const partida = partidas.find(partida => {
					return partida.timeA && partida.timeA.sigla == siglaTimeA 
						&& partida.timeB && partida.timeB.sigla == siglaTimeB
						&& moment(horarioJogo, 'YYYY-MM-DD hh:mm').subtract(3, 'hours').isSame(moment(partida.data, 'YYYY-MM-DDThh:mm:ss'))
				})
				if (partida != null) {
					// console.log(`Achou partida ${partida.timeA.sigla} ${partida.placarTimeA | ' '} x ${partida.placarTimeB | ' '} ${partida.timeB.sigla}`)
					if (partida.placarTimeA != placarTimeA || partida.placarTimeB != placarTimeB) {
						// console.log(`Partida: ${partida.timeA.sigla} ${partida.placarTimeA | ' '} x ${partida.placarTimeB | ' '} ${partida.timeB.sigla} com placar desatualizado`)
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