const mongoose = require('mongoose')

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
	classificacao: {
		type: Number,
		required: true,
		default: 0
	},
	totalAcumulado: {
		type: Number,
		required: true,
		default: 0
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
	}
})

module.exports = mongoose.model('palpite', palpiteSchema)