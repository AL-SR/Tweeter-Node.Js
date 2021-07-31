"use strict";

const express = require("express");
const app = express();
const bodyParser = require("body-parser");

var user_routes = require("./src/routes/user-routes");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use((req, res, next) => {
    res.header("Acces-Control-Allow-Origin", "*");
    res.header("Acces-Control-Allow-Headers", "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Acces-Control-Allow-Request-Method");
    res.header("Acces-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
    next();
});

//Routes 
app.use('/api', user_routes)

module.exports = app;