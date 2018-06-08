const mongoose = require('mongoose')
const Partida = require('./partida')

const palpiteSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.ObjectId,
		required: true
	},
	partida: {
		type: Partida.schema,
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
	totalPontosObitidos: {
		type: Number,
		required: false,
		enum: [0, 1, 2, 3, 5],
		default: 0
	},
	placarCheio: {
		type: Boolean,
		required: true,
		default: false
	},
	placarTimeVencedorComGol: {
		type: Boolean,
		required: true,
		default: false
	},
	placarTimeVencedor: {
		type: Boolean,
		required: true,
		default: false
	},
	placarGol: {
		type: Boolean,
		required: true,
		default: false
	},
	classificacao: {
		type: Number,
		required: false
	},
	totalAcumulado: {
		type: Number,
		required: false
	}
})

module.exports = mongoose.model('palpite', palpiteSchema)