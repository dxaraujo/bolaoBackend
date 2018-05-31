const mongoose = require('mongoose')
const Palpite = require('./palpite')
const Pontuacao = require('./pontuacao')

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	username: {
		type: String,
		required: true
	},
	password: {
		type: String,
		min: 6,
		max: 20,
		required: true
	},
	avatar: {
		type: String,
		required: false
	},
	pontuacao: {
		type: Pontuacao.schema,
		required: true,
		default: {
			total: 0,
			placarCheio: 0,
			placarTimeVencedorComGol: 0,
			placarTimeVencedor: 0,
			placarGol: 0
		}
	},
	facebookId: {
		type: String,
		required: false
	},
	isAdmin: {
		type: Boolean,
		required: true,
		default: false
	}
})

module.exports = mongoose.model('user', userSchema)