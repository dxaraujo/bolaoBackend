const mongoose = require('mongoose')
const Resultado = require('./resultado')

const partidaSchema = new mongoose.Schema({
	fase: {
		type: String,
		required: true,
		enum: [
			'FASE DE GRUPOS',
			'OITAVAS DE FINAL',
			'QUARTAS DE FINAL',
			'SEMIFINAL',
			'DISPUTA DO 3º LUGAR',
			'FINAL'
		]
	},
	grupo: {
		type: String,
		required: false,
		enum: [
			'GRUPO A',
			'GRUPO B',
			'GRUPO C',
			'GRUPO D',
			'GRUPO E',
			'GRUPO F',
			'GRUPO G',
			'GRUPO H',
			''
		]
	},
	rodada: {
		type: String,
		required: false,
		enum: [
			'1ª RODADA',
			'2ª RODADA',
			'3ª RODADA',
			''
		]
	},
	liberado: {
		type: Boolean,
		required: false,
		default: false
	},
	data: {
		type: Date,
		required: true
	},
	timeA: {
		type: mongoose.Schema.ObjectId,
		required: true
	},
	timeB: {
		type: mongoose.Schema.ObjectId,
		required: true
	},
	resultado: {
		type: Resultado.schema,
		required: false
	}
})

module.exports = mongoose.model('partida', partidaSchema)