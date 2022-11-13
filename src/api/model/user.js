const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	picture: {
		type: String,
		required: true
	},
	placarCheio: {
		type: Number,
		required: true,
		default: 0
	},
	placarTimeVencedorComGol: {
		type: Number,
		required: true,
		default: 0
	},
	placarTimeVencedor: {
		type: Number,
		required: true,
		default: 0
	},
	placarGol: {
		type: Number,
		required: true,
		default: 0
	},
	totalAcumulado: {
		type: Number,
		required: true,
		default: 0
	},
	classificacao: {
		type: Number,
		required: true,
		default: 0
	},
	classificacaoAnterior: {
		type: Number,
		required: true,
		default: 0
	},
	isAdmin: {
		type: Boolean,
		required: true,
		default: false
	},
	ativo: {
		type: Boolean,
		required: true,
		default: false
	}
}, { strict: false })

module.exports = mongoose.model('user', userSchema)