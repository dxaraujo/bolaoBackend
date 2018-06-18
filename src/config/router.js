const express = require('express')
const { authService, faseService, palpiteService, partidaService, timeService, userService, resultadoService } = require('../api')

/*
 * Rotas abertas
 */
const oapi = express.Router()
oapi.post('/login', authService.login)
oapi.post('/signup', authService.signup)
oapi.post('/validateToken', authService.validateToken)
oapi.post('/registerfacebookuser', authService.registerFacebookUser)

/**
 * Rotas seguras
 */
const api = express.Router()
api.use(authService.auth)
api.use('/fase', faseService)
api.use('/palpite', palpiteService)
api.use('/partida', partidaService)
api.use('/time', timeService)
api.use('/user', userService)
api.use('/atualizarresultados', resultadoService)

module.exports = { api, oapi }