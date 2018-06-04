const mongoose = require('mongoose')

// 1.DESABILITADO, 2.ABERTO PARA PREENCHIMENTO DE PALPITES 3.BLOQUEADO PARA ALTERAÇÃO DOS PALPITES
const faseSchema = new mongoose.Schema({
	nome: {
		type: String,
		required: true
	},
	status: {
		type: String,
		required: true,
		enum: ['D', 'A', 'B'],
		default: 'D'
	}
})

module.exports = mongoose.model('fase', faseSchema)