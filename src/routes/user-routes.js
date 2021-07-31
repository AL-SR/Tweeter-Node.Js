var express = require("express");
const multiparty = require('connect-multiparty')
const md_auth = require("../middlewares/authenticated")
var controller_commands = require("../controllers/Controller-commands");

//Routes
var api = express.Router();

api.post("/comando", md_auth.ensureAuth, controller_commands.commands);

module.exports = api;