'use strict'

const mongoose = require("mongoose");
const { response } = require("express");
const Schema = mongoose.Schema;

var UsuarioSchema = Schema({

    nombre: { type: String, require: true },
    usuario: { type: String, require: true },
    password: { type: String, require: true },
    tweets: [{

        tweet: { type: String, require: true },

        numberOfRetweets: { type: Number, requiere: true, default: 0 },
        numberOfResponses: { type: Number, requiere: true, default: 0 },
        like: { type: Number, requiere: true, default: 0 },


        retweet: [{
            user: { type: String, require: true },
            tweet: { type: String, require: true },
        }],

        response: [{
            user: { type: String, require: true },
            coment: { type: String, require: true },
        }],

        usersLikes: [], //Usuarios que dieron like á este tweet
        usersRetweet: [], //Usuarios que compartieron este tweet

    }],
    followers: [{
        user: { type: String, require: true }
    }],
    following: [{
        user: { type: String, require: true }
    }],


})


module.exports = mongoose.model('users', UsuarioSchema)