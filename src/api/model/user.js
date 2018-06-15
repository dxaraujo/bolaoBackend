const mongoose = require('mongoose')

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
	facebookId: {
		type: String,
		required: false
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
	isAdmin: {
		type: Boolean,
		required: true,
		default: false
	}
}, { strict: false })

module.exports = mongoose.model('user', userSchema)