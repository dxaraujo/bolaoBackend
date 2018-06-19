const Partida = require('../model/partida')
const Palpite = require('../model/palpite')
const User = require('../model/user')
const { asyncForEach } = require('../../util/serviceUtils')

const atualizarResultados = async (partidaId, placares) => {
	const newPartida = await Partida.findByIdAndUpdate(partidaId, placares, { new: true })
	const partidas = await Partida.find({}).sort({ order: 'asc' })
	const users = await User.find({})
	let mapPalpites = []

	// Atualizado o total de ponto acumulados
	await asyncForEach(users, async user => {
		let palpites = await Palpite.find({ user: user._id }).sort({ 'partida.order': 'asc' })
		mapPalpites[user._id] = autalizarTotalAcumulado(partidas, palpites)
	})

	// Atualizado a classificação dos usuários
	await asyncForEach(partidas, async partida => {
		if (partida.placarTimeA >= 0 && partida.placarTimeB >= 0) {
			let palpites = users.map(user => findPalpite(mapPalpites[user._id], partida))
			palpites = await classificarPalpites(palpites)
		}
	})

	// Atualizado os dados dos usuários
	await asyncForEach(users, async user => {
		if (mapPalpites[user._id]) {
			let indexUltimoPalpite = null
			let placarCheio = 0
			let placarTimeVencedorComGol = 0
			let placarTimeVencedor = 0
			let placarGol = 0
			const palpites = mapPalpites[user._id]
			for (let i = palpites.length - 1; i >= 0; i--) {
				const palpite = palpites[i];
				placarCheio += palpite.placarCheio ? 1 : 0
				placarTimeVencedorComGol += palpite.placarTimeVencedorComGol ? 1 : 0
				placarTimeVencedor += palpite.placarTimeVencedor ? 1 : 0
				placarGol += palpite.placarGol ? 1 : 0
				if (palpite.totalAcumulado >= 0 && palpite.classificacao >= 0) {
					if (indexUltimoPalpite == null) {
						indexUltimoPalpite = i
					}
				}
			}
			if (indexUltimoPalpite != null) {
				let classificacao = palpites[indexUltimoPalpite].classificacao
				let classificacaoAnterior = indexUltimoPalpite > 0 ? palpites[indexUltimoPalpite - 1].classificacao : 0
				let totalAcumulado = palpites[indexUltimoPalpite].totalAcumulado
				user = await User.findByIdAndUpdate(user._id, { classificacao, classificacaoAnterior, totalAcumulado, placarCheio, placarTimeVencedorComGol, placarTimeVencedor, placarGol }, { new: true })
			}
		}
	})
	return newPartida
}

const findPalpite = (palpites, partida) => {
	return palpites.find(palpite => {
		return palpite.partida.fase === partida.fase &&
			palpite.partida.grupo === partida.grupo &&
			palpite.partida.rodada === partida.rodada &&
			palpite.partida.timeA.nome === partida.timeA.nome &&
			palpite.partida.timeB.nome === partida.timeB.nome
	})
}

const autalizarTotalAcumulado = (partidas, palpites) => {
	let totalAcumulado = 0
	partidas.forEach(partida => {
		if (partida.placarTimeA >= 0 && partida.placarTimeB >= 0) {
			let palpite = findPalpite(palpites, partida)
			if (palpite != null) {
				palpite = calcularPontuacaoPalpite(palpite, partida)
				totalAcumulado += palpite.totalPontosObitidos
				palpite.totalAcumulado = totalAcumulado
			}
		}
	})
	return palpites
}

const classificarPalpites = async (palpites) => {
	let cla = 1
	let mesmoplacar = 1
	palpites = palpites.filter(palpite => palpite)
	palpites = palpites.sort((p1, p2) => p2.totalAcumulado - p1.totalAcumulado)
	for (let i = 0; i < palpites.length; i++) {
		if (i > 0) {
			if (palpites[i].totalAcumulado === palpites[i - 1].totalAcumulado) {
				cla = palpites[i - 1].classificacao
				mesmoplacar += 1
			} else {
				cla = cla + mesmoplacar
				mesmoplacar = 1
			}
		}
		palpites[i].classificacao = cla
		palpites[i] = await Palpite.findByIdAndUpdate(palpites[i]._id, palpites[i], { new: true })
	}
	return palpites
}

const calcularPontuacaoPalpite = (palpite, partida) => {
	if (palpite.placarTimeA >= 0 && palpite.placarTimeB >= 0) {
		const palpiteTimeVencedor = palpite.placarTimeA > palpite.placarTimeB ? 'A' : palpite.placarTimeB > palpite.placarTimeA ? 'B' : 'E'
		const partidaTimeVencedor = partida.placarTimeA > partida.placarTimeB ? 'A' : partida.placarTimeB > partida.placarTimeA ? 'B' : 'E'
		if (palpite.placarTimeA === partida.placarTimeA && palpite.placarTimeB === partida.placarTimeB) {
			palpite.totalPontosObitidos = 5
			palpite.placarCheio = true
			palpite.placarTimeVencedorComGol = false
			palpite.placarTimeVencedor = false
			palpite.placarGol = false
		} else if (palpiteTimeVencedor === partidaTimeVencedor) {
			if (palpite.placarTimeA === partida.placarTimeA || palpite.placarTimeB === partida.placarTimeB) {
				palpite.totalPontosObitidos = 3
				palpite.placarCheio = false
				palpite.placarTimeVencedorComGol = true
				palpite.placarTimeVencedor = false
				palpite.placarGol = false
			} else {
				palpite.totalPontosObitidos = 2
				palpite.placarCheio = false
				palpite.placarTimeVencedorComGol = false
				palpite.placarTimeVencedor = true
				palpite.placarGol = false
			}
		} else if (palpite.placarTimeA === partida.placarTimeA || palpite.placarTimeB === partida.placarTimeB) {
			palpite.totalPontosObitidos = 1
			palpite.placarCheio = false
			palpite.placarTimeVencedorComGol = false
			palpite.placarTimeVencedor = false
			palpite.placarGol = true
		} else {
			palpite.totalPontosObitidos = 0
			palpite.placarCheio = false
			palpite.placarTimeVencedorComGol = false
			palpite.placarTimeVencedor = false
			palpite.placarGol = false
		}
	}
	return palpite
}

exports = module.exports = atualizarResultados