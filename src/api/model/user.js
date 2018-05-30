const mongoose = require('mongoose')
const Palpite = require('./palpite')
const Pontuacao = require('./pontuacao')

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	email: {
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
		data: Buffer,
		contentType: String
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
	}
})

module.exports = mongoose.model('user', userSchema)