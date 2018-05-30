const mongoose = require('mongoose')
const Palpite = require('./palpite')

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
		data: Buffer,
		contentType: String	
	},
	palpites: {
		type: [Palpite.schema],
		required: true,
		default: []
	},
	pontuacao: {
		total: {
			type: Number,
			required: true
		},
		placarCheio: {
			type: Number,
			required: true
		},
		placarTimeVencedorComGol: {
			type: Number,
			required: true
		},
		placarTimeVencedor: {
			type: Number,
			required: true
		},
		placarGol: {
			type: Number,
			required: true
		}
	}
})

module.exports = mongoose.model('user', userSchema)