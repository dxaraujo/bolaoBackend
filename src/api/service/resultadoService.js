const Partida = require('../model/partida')
const Palpite = require('../model/palpite')
const User = require('../model/user')
const { asyncForEach } = require('../../util/serviceUtils')

const atualizarResultados = async (partidaId, placares) => {

	const newPartida = await Partida.findByIdAndUpdate(partidaId, placares, { new: true })
	const partidas = await Partida.find({}).sort({ order: 'asc' })
	let users = await User.find({})

	// Montando os dados dos usuários
	await asyncForEach(users, async (user, i, users) => {
		users[i] = { _id: users[i]._id }
		users[i].totalAcumulado = 0
		users[i].classificacao = 0
		users[i].classificacaoAnterior = 0
		users[i].placarCheio = 0
		users[i].placarTimeVencedorComGol = 0
		users[i].placarTimeVencedor = 0
		users[i].placarGol = 0
		users[i].palpites = await Palpite.find({ user: users[i]._id }).sort({ 'partida.order': 'asc' })
	})

	// Calculando os pontos acertados
	for (let i = 0; i < partidas.length; i++) {
		const partida = partidas[i]
		if (partida.placarTimeA >= 0 && partida.placarTimeB >= 0) {
			for (let j = 0; j < users.length; j++) {
				let palpite = findPalpite(users[j].palpites, partida)
				if (palpite != null) {
					palpite = calcularPontuacaoPalpite(palpite, partida)
					users[j].totalAcumulado += palpite.totalPontosObitidos
					users[j].placarCheio += palpite.placarCheio ? 1 : 0
					users[j].placarTimeVencedorComGol += palpite.placarTimeVencedorComGol ? 1 : 0
					users[j].placarTimeVencedor += palpite.placarTimeVencedor ? 1 : 0
					users[j].placarGol += palpite.placarGol ? 1 : 0
					palpite.totalAcumulado = users[j].totalAcumulado
				}
			}
			users = classificar(users, i)
			for (let j = 0; j < users.length; j++) {
				let palpite = findPalpite(users[j].palpites, partida)
				if (palpite != null) {
					palpite.classificacao = users[j].classificacao
					palpite.classificacaoAnterior = users[j].classificacaoAnterior
				}
			}
		}
	}

	// Salvando os dados
	await asyncForEach(users, async (user, i, users) => {
		await asyncForEach(users[i].palpites, async (palpite, j, palpites) => {
			palpites[j] = await Palpite.findByIdAndUpdate(palpite._id, {
				totalPontosObitidos: palpites[j].totalPontosObitidos,
				totalAcumulado: palpites[j].totalAcumulado,
				classificacao: palpites[j].classificacao,
				placarCheio: palpites[j].placarCheio,
				placarTimeVencedorComGol: palpites[j].placarTimeVencedorComGol,
				placarTimeVencedor: palpites[j].placarTimeVencedor,
				placarGol: palpites[j].placarGol,
			}, { new: true })
		})
		users[i] = await User.findByIdAndUpdate(users[i]._id, {
			totalAcumulado: users[i].totalAcumulado,
			classificacao: users[i].classificacao,
			classificacaoAnterior: users[i].classificacaoAnterior,
			placarCheio: users[i].placarCheio,
			placarTimeVencedorComGol: users[i].placarTimeVencedorComGol,
			placarTimeVencedor: users[i].placarTimeVencedor,
			placarGol: users[i].placarGol,
		}, { new: true })
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

const classificar = (users, index) => {
	let cla = 1
	let mesmoplacar = 1
	users = ordenarUsuarios(users)
	for (let i = 0; i < users.length; i++) {
		if (i > 0) {
			if (compararUsuarios(users[i], users[i - 1]) === 0) {
				cla = users[i - 1].classificacao
				mesmoplacar += 1
			} else {
				cla = cla + mesmoplacar
				mesmoplacar = 1
			}
		}
		users[i].classificacaoAnterior = index > 0 ? users[i].classificacao : 0
		users[i].classificacao = cla
	}
	return users
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

const ordenarUsuarios = users => {
	return users.sort((u1, u2) => compararUsuarios(u1, u2))
}

const compararUsuarios = (u1, u2) => {
	const test0 = u2.totalAcumulado.valueOf() - u1.totalAcumulado.valueOf()
	if (test0 === 0) {
		const test1 = u2.placarCheio.valueOf() - u1.placarCheio.valueOf()
		if (test1 === 0) {
			const test2 = u2.placarTimeVencedorComGol.valueOf() - u1.placarTimeVencedorComGol.valueOf()
			if (test2 === 0) {
				const test3 = u2.placarTimeVencedor.valueOf() - u1.placarTimeVencedor.valueOf()
				if (test3 === 0) {
					return u2.placarGol.valueOf() - u1.placarGol.valueOf()
				}
				return test3
			}
			return test2
		}
		return test1
	}
	return test0
}

exports = module.exports = atualizarResultados