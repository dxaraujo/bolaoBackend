const express = require('express')

const createService = require('../util/createService')
const { authService, userService } = require('../api')

/*
 * Rotas abertas
 */
const oapi = express.Router()
oapi.post('/login', authService.login)
oapi.post('/signup', authService.signup)
oapi.post('/validateToken', authService.validateToken)

/**
 * Rotas seguras
 */
const api = express.Router()
api.use(authService.auth)
api.use('/time', createService(Time))
api.use('/partida', createService(Partida))
api.use('/user', userService)

module.exports = { api, oapi }