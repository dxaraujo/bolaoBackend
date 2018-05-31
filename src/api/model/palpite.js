const mongoose = require('mongoose')
const Pontuacao = require('./pontuacao')

const palpiteSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.ObjectId,
		required: true
	},
	partida: {
		type: mongoose.Schema.ObjectId,
		required: true
	},
	placarTimeA: {
		type: Number,
		required: false
	},
	placarTimeB: {
		type: Number,
		required: false
	},
	resultadoPartida: {
		type: String,
		required: false
	},
	pontuacao: {
		type: Pontuacao.schema,
		required: false,
		default: {
			total: 0,
			placarCheio: 0,
			placarTimeVencedorComGol: 0,
			placarTimeVencedor: 0,
			placarGol: 0
		}
	}
})

module.exports = mongoose.model('palpite', palpiteSchema)