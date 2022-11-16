const express = require('express')
const { authService, faseService, palpiteService, partidaService, timeService, userService, healthService } = require('../api')

/*
 * Rotas abertas
 */
const oapi = express.Router()

oapi.get('/healthcheck', healthService.healthcheck)
oapi.post('/registerGoogleUser', authService.registerGoogleUser)

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

module.exports = { api, oapi }