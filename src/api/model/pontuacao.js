const mongoose = require('mongoose')

const pontuacaoSchema = new mongoose.Schema({
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
})

module.exports = mongoose.model('pontuacao', pontuacaoSchema)