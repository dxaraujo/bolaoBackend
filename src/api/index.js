const Time = require('./model/time')
const Partida = require('./model/partida')
const User = require('./model/user')

const authService = require('./service/authService')

module.exports = { Time, Partida, User, authService }