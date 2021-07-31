const jwt = require("jwt-simple");
const moment = require("moment");
const key = 'DRgvxf8P';
const Users = require('../models/user');

exports.ensureAuth = (req, res, next) => {
    var params = req.body;
    var command = params.commands.split(' ')[0];
    if (command) {
        if (String(command.toLowerCase()) == 'login'.toLowerCase() || String(command.toLowerCase()) == 'register'.toLowerCase()) {
            next();
        } else if (!req.headers.authorization) {
            return res.status(403).send({ message: 'unauthorized reques.. require authentication' })
        } else {
            var token = req.headers.authorization.replace(/['"]+/g, '')
            try {
                var payload = jwt.decode(token, key);
                if (payload.exp <= moment().unix()) {
                    return res.status(400).json({
                        ok: false,
                        err: { message: 'token has expired....' }
                    });
                }
            } catch (ex) {
                return res.status(404).send({ message: 'Error..... Invalid Token' })
            }

            req.usuario_p = payload;

            next();
        }
    }
}