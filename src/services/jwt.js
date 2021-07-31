/**
 * 
 */
'use strict'

const jwt = require("jwt-simple")
const moment = require('moment')
const key = 'DRgvxf8P'

exports.createToken = (user) => {
    var payload = {
        sub: user._id,
        usuario: user.usuario,
        iat: moment().unix(),
        exp: moment().day(30, 'days').unix() //expires in 30 days
    }

    return jwt.encode(payload, key)
}