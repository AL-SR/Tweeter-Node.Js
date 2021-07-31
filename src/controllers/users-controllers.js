'use strict'

const bcrypt = require("bcrypt-nodejs");
const jwt = require("../services/jwt")
const Users = require('../models/user');
const { check } = require("yargs");
const user = require("../models/user");
const { json } = require("body-parser");
const { text } = require("express");
const { findOne } = require("../models/user");



function register_user(name, user, password, res) {
    var users = new Users();

    if (name, user && password) {
        users.usuario = user
        users.nombre = name
        Users.find({ $or: [{ usuario: users.usuario }] }).exec((err, usuarios) => {
            if (err) return res.status(500).send({ message: 'request error' })

            if (usuarios && usuarios.length >= 1) {
                return res.status(500).send({ message: `user '${user}' already exists...` })
            } else {
                bcrypt.hash(password, null, null, (err, hash) => {
                    users.password = hash;

                    users.save((err, usuarioGuardado) => {
                        if (err) res.status(500).send({ message: '¡Error! saving user...' })

                        if (usuarioGuardado) {
                            res.status(200).send({ Usuario_Ingresado: usuarioGuardado })
                        } else {
                            res.status(404).send({ message: 'Could not save user...' })
                        }
                    })
                })
            }
        })
    } else {
        res.status(200).send({ message: 'Fill in all required fields...' })
    }
}

function login(user, password, token, req, res) {
    let params = req.body;

    Users.findOne({ usuario: user }, (err, check) => {
        if (err) res.status(500).send({ message: 'request error...' })
        if (check) {
            bcrypt.compare(password, check.password, (err, passwordOk) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        err: { message: `wrong password compare'${password}'` }
                    });
                } else if (passwordOk) {
                    if (token = true) {
                        res.send({ token: jwt.createToken(check), user: check.user });
                    } else {
                        res.send({ message: 'Error...server error!' })
                    }
                } else {
                    res.send({ message: `Error en el password ${password}' ` });
                }
            })
        } else {
            res.send({ message: `Error en el users.. '${user}' ` });
        }
    })
}

/**
 *  SEE MY PROFILE....
 */

function my_profile(user, req, res) {
    let usuario_payload = req.usuario_p.usuario
    if (usuario_payload != user) {
        res.status(500).json({
            ok: false,
            err: { message: `You do not have permission to access ${user}... (No posee permiso para acceder) ` }
        });
    } else {
        Users.findOne({ usuario: user }, (err, profile) => {

            if (err)
                res.status(500).json({
                    ok: false,
                    err: { message: 'request error' }
                });
            if (!profile) {
                res.status(404).json({ message: 'No Existe este usuario' });
            }
            if (profile) {
                res.status(200).send({
                    usuario: profile.usuario,
                    nombre: profile.nombre,
                    tweets: profile.tweets.length,
                    following: profile.following.length,
                    followers: profile.followers.length
                })
            }
        })
    }
}

/**
 *  ADD TWEET....
 */

function add_tweet(description, req, res) {

    let usuario_payload = req.usuario_p.sub

    Users.findById(usuario_payload, (err, users) => {
        if (err) { res.status(500).json({ ok: false, err: { message: 'request error' } }) }

        if (!users) { res.status(404).send({ message: 'Error.... users not logged' }) } else if (description.trim() === '') { return res.status(404).send({ message: 'En nesesario agregar informacion al tweet' }) } else {
            if (users) {
                Users.findByIdAndUpdate(usuario_payload, { $push: { tweets: { tweet: description.trim() } } }, { new: true }, (err, check_tweet) => {
                    if (err) { return res.status(500).json({ ok: false, err: { message: 'Error... adding tweet' } }) }
                    if (check_tweet) res.status(200).send({ message: check_tweet })
                })
            }
        }
    })
}


/**
 *  DELETE TWEET....
 */

function tweet_delete(id, req, res) {

    var usuario_payload = req.usuario_p.sub

    Users.findById(usuario_payload, (err, users) => {

        if (err) { res.status(500).json({ ok: false, err: { message: 'request error' } }) }
        if (!users) { res.status(404).send({ message: 'Error.... users not logged' }) }
        if (users) {
            Users.findOneAndUpdate({ 'tweets._id': id }, { $pull: { tweets: { _id: id } } }, { new: true }, (err, delete_tweet) => {
                if (err) res.status(500).send({ message: 'Fatal Error! server error, please try again' })
                if (!delete_tweet) { return res.status(404).send({ message: 'Error...does not have any tweet ó delete tweet failed' }) }
                if (delete_tweet) {
                    res.status(200).send({ delete_tweet })
                }
            })
        }
    })
}

/**
 * EDIT_TWEET
 */

function tweet_edit(id_tweet, description, req, res) {

    var usuario_payload = req.usuario_p.sub
    if (description.trim() === '') { return res.status(404).send({ message: 'En nesesario agregar informacion al tweet para modificarlo' }) } else {
        Users.findOneAndUpdate({ _id: usuario_payload, 'tweets._id': id_tweet }, { 'tweets.$.tweet': description.trim() }, { new: true }, (err, edit_tweet) => {
            if (err) return res.status(500).send({ message: 'Fatal Error! server error, please try again' })
            if (!edit_tweet) { return res.status(404).send({ message: 'Error ... does not have any tweet  ó edit tweet failed ' }) }
            if (edit_tweet) { res.status(200).send({ edit_tweet }) }
        })
    }
}


/**
 * FOLLOW USERS
 */

let follow_user = async(follow_user, req, res) => {

    let usuario_id = req.usuario_p.sub
    let usuario_follow = req.usuario_p.usuario

    await Users.findById(usuario_id, (err, users) => {
        if (err) { throw new Error('request error') }
        if (!users) { res.status(404).send({ message: 'Error.... users not logged - Error user you want to follow' }) }
        if (users) {

            Users.findOne({ usuario: { $in: follow_user } }, (err, check_user) => {
                if (err) { throw new Error('request error') } else if (!check_user) {
                    res.status(404).send({ message: `The user '${follow_user}' you want to follow does not exist in the DB ` })
                } else if (check_user.usuario === usuario_follow) {
                    res.status(404).send({ message: 'you can only follow other users not yourself - sólo puede seguir a los demás usuarios no así mismo' })
                } else if (check_user.usuario != usuario_follow) {

                    Users.findById(usuario_id, { following: { $elemMatch: { user: follow_user } } }, (err, check_following) => {
                        if (err) { throw new Error('request error') } else if (check_following.following.length >= 1) {
                            res.status(404).send({ message: ` ya sigue esta cuenta '${follow_user}' ` })
                        }
                        if (check_following.following.length === 0) {
                            Users.findByIdAndUpdate(usuario_id, { $push: { following: { user: follow_user } } }, { new: true }, (err, my_profile) => {
                                if (err) res.status(400).json({
                                    ok: false,
                                    err: { message: `Error error following user ${follow_user}` }

                                })
                                console.log(my_profile, 'following');
                                if (my_profile) {
                                    Users.findOneAndUpdate({ 'usuario': follow_user }, { $push: { followers: { user: usuario_follow } } }, (err, followers) => {
                                        if (err) { throw new Error('request error') }
                                    })
                                    res.status(200).send({ my_profile, })
                                }
                            })
                        }
                    })
                }
            })
        }
    })
}


/**
 * UNFOLLOW USERS
 */

function unfollow_user(unfollow_user, req, res) {

    let usuario_payload = req.usuario_p.sub
    let usuario_follow = req.usuario_p.usuario

    Users.findOne({ '_id': usuario_payload }, { following: { $elemMatch: { user: unfollow_user } } }, (err, users) => {
        if (err) {
            res.status(500).json({
                ok: false,
                err: { message: 'request error' }
            });
        }
        if (users.following.length === 0) { res.status(404).send({ message: `Error.... Don't follow this account - ( No sigue esta cuenta '${unfollow_user}')` }) } else if (users.following.length === 1) {
            Users.findOneAndUpdate({ '_id': usuario_payload }, { $pull: { following: { user: unfollow_user } } }, { new: true }, (err, delete_following) => {
                if (err) res.status(404).send({ message: 'Fatal Error! server error, please try again - Error al dejar de seguir usuario' })
                if (delete_following) {
                    Users.findOneAndUpdate({ 'usuario': unfollow_user }, { $pull: { followers: { user: usuario_follow } } }, { new: true }, (err, unfollowers) => {
                        if (err) res.status(500).send({ message: 'Error request error!....' })
                    })
                    return res.status(200).send({ my_profile: delete_following })
                }
            })
        }
    })
}

/**
 * VIEW_TWEETS
 * 
 */

function view_tweet(user_view, req, res) {
    let usuario_payload = req.usuario_p.sub
    let usuario_follow = req.usuario_p.usuario
    if (usuario_follow != user_view) {

        Users.findOne({ '_id': usuario_payload }, { following: { $elemMatch: { user: user_view } } }, (err, users) => {
            if (err) {
                res.status(500).json({
                    ok: false,
                    err: { message: 'request error' }
                });
            } else if (users.following.length === 0) { res.status(403).send({ message: ` Usted no tiene permiso para acceder a ver tweets de '${user_view}' ( ' Solo usuario que siga o su mismo usuario' )` }) } else if (users.following.length === 1) {

                Users.findOne({ usuario: user_view }, (err, usuario) => {

                    Users.findOne({ usuario: user_view }, { usuario: { $elemMatch: { user_view } } }, { 'tweets$': 1 }, (err, users_data) => {
                        if (err) return res.status(500).send({ message: 'reques error' })
                        if (!users_data) return res.status(404).send({ message: 'Error' })



                        if (err) {
                            res.status(500).json({
                                ok: false,
                                err: { message: 'request error' }
                            });
                        }
                        if (!usuario) {
                            res.status(404).send({ message: 'Error seeing tweet' })
                        } else if (usuario.tweets.length === 0) {
                            res.status(404).send({ message: `El usuario  '${user_view}' No tiene tweet agregados` })
                        } else if (usuario.tweets != 0) {


                            return res.status(200).send({
                                nombre: usuario.nombre,
                                usuario: usuario.usuario,
                                tweets: usuario.tweets
                            })

                        }
                    })
                })
            }
        })
    } else {
        Users.findOne({ usuario: user_view }, (err, Myprofile) => {

            if (err) res.status(500).json({ ok: false, err: { message: 'request error' } })
            if (!Myprofile) { return res.status(404).json({ message: `Error al ver sus twets '${user_view}'` }) } else if (Myprofile.tweets.length === 0) { return res.status(404).send({ message: `El Usuario ${user_view} no posee tweets` }) }
            if (Myprofile) { res.status(200).send({ usuario: Myprofile.usuario, nombre: Myprofile.nombre, tweets: Myprofile.tweets }) }
        })
    }
}


let Like = async(id_tweet, req, res) => {

    Users.findOneAndUpdate({ 'tweets._id': id_tweet }, { $push: { 'tweets.$.usersLikes': req.usuario_p.usuario } }, { new: true }, (err, users_check) => {

        if (err) return new Error({ message: 'request error 4' })
        if (!users_check) return new Error({ message: `Error you can't like the tweet 1` })

        Users.findOneAndUpdate({ 'tweets._id': id_tweet }, { $inc: { 'tweets.$.like': 1 } }, { new: true }, (err, tweet) => {
            if (err) return new Error('request error 3')
            if (!tweet) return new Error(`Error you can't like the tweet`)
            if (tweet) {

                return res.status(200).send(tweet.tweets)


            }
        })
    })
}

let Dislike = async(id_tweet, req, res) => {

    Users.findOneAndUpdate({ 'tweets._id': id_tweet }, { $pull: { 'tweets.$.usersLikes': req.usuario_p.usuario } }, { new: true }, (err, users_check) => {

        if (err) return new Error('request error 4')
        if (!users_check) return new Error({ message: `Error you can't like the tweet 1` })

        Users.findOneAndUpdate({ 'tweets._id': id_tweet }, { $inc: { 'tweets.$.like': -1 } }, { new: true }, (err, tweet) => {
            if (err) return new Error('request error 3')
            if (!tweet) return new Error(`Error you can't like the tweet`)
            if (tweet) {


                return res.status(200).send(tweet.tweets)

            }
        })
    })
}


function simplify_find(parameter1, parameter2) {

    var userLike = false;

    for (let i = 0; i < parameter1.length; i++) {

        if (parameter1[i] === parameter2) {
            userLike = true;
            i = parameter1.length
        }
    }

    return userLike;

}


/*  Like Tweet 
 */

let myLikes = async(id_tweet, req, res) => {

    let usuario_payload = req.usuario_p.sub


    Users.findById(usuario_payload, (err, users) => {
        if (err) { return res.status(500).send('request error 1') }
        if (!users) { return res.status(404).send({ message: 'Error.... users not logged' }) }

        if (users) {

            Users.findOne({ 'tweets._id': id_tweet }, (err, check_tweet) => {
                if (err) return res.status(500).send({ message: 'request error 2' })
                if (!check_tweet) return res.status(404).send({ message: 'tweet no existe' })
                if (check_tweet) {

                    Users.findOne({ '_id': usuario_payload }, { following: { $elemMatch: { user: check_tweet.usuario } } }, (err, users) => {

                        if (err) {
                            return res.status(404).send({ message: 'Error general' })
                        } else if (users.following.length === 0) { return res.status(404).send({ message: ` Usted no tiene permiso para dar like al tweet de '${check_tweet.usuario}' solo seguidores` }) } else if (users.following.length === 1) {

                            Users.findOne({ 'tweets._id': id_tweet }, { tweets: { $elemMatch: { _id: id_tweet } } }, { "tweets.$.usersLikes": 1 }, (err, chek_users) => {
                                if (err) return res.status(500).send({ message: 'request error 5' })
                                if (!check_tweet) return res.status(404).send({ message: 'tweet no existe' })

                                else if (simplify_find(chek_users.tweets[0].usersLikes, req.usuario_p.usuario) === true) {
                                    Dislike(id_tweet, req, res)
                                } else if (simplify_find(chek_users.tweets[0].usersLikes, req.usuario_p.usuario) === false) {
                                    Like(id_tweet, req, res);
                                }
                            })
                        }
                    })
                }
            })
        }
    })
}

/*  Comentar el Tweet  
 */
let respond = (id_tweet, text, req, res) => {

    let usuario_payload = req.usuario_p.sub

    Users.findById(usuario_payload, (err, users) => {
        if (err) { return res.status(500).send('request error 1') }
        if (!users) { return res.status(404).send({ message: 'Error.... users not logged' }) }
        if (users) {

            Users.findOne({ 'tweets._id': id_tweet }, (err, check_tweet) => {
                if (err) return res.status(500).send({ message: 'request error 2' })
                if (!check_tweet) return res.status(404).send({ message: 'tweet no existe' })
                if (check_tweet) {

                    Users.findOne({ 'tweets._id': id_tweet }, { tweets: { $elemMatch: { _id: id_tweet } } }, { "tweets.$.response": 1 }, (err, chek_users) => {
                        if (err) return res.status(500).send({ message: 'request error 5' })
                        if (!check_tweet) return res.status(404).send({ message: 'tweet no existe' })

                        Users.findOne({ '_id': usuario_payload }, { following: { $elemMatch: { user: check_tweet.usuario } } }, (err, users) => {

                            if (err) {
                                return res.status(404).send({ message: 'Error general' })
                            } else if (users.following.length === 0) { return res.status(404).send({ message: ` Usted no tiene permiso para comentar el tweet '${chek_users.tweets[0].tweet}'  de '${check_tweet.usuario}' solo seguidores` }) } else if (users.following.length === 1) {

                                if (text.trim() === '') { return res.status(404).send({ message: 'En nesesario agregar texto al comentario ' }) } else {

                                    Users.findOneAndUpdate({ 'tweets._id': id_tweet }, { $inc: { 'tweets.$.numberOfResponses': 1 } }, { new: true }, (err, numberOF) => {
                                        if (err) return res.status(500).send({ message: 'request error 5' })
                                        if (!numberOF) return res.status(404).send({ message: `Error server OFnumber` })

                                        Users.findOneAndUpdate({ 'tweets._id': id_tweet }, { $push: { 'tweets.$.response': { user: req.usuario_p.usuario, coment: text.trim() } } }, { new: true }, (err, users_check) => {
                                            if (err) return res.status(500).send({ message: 'request error 4' })
                                            if (!users_check) return res.status(404).send({ message: `Error you can't like the tweet 1` })

                                            return res.status(200).send(users_check.tweets)

                                        })
                                    })
                                }
                            }
                        })
                    })
                }
            })
        }
    })
}


/* 
 Retweet 
 */
function Retweet(id_tweet, text, req, res) {

    var usuarioPayload = req.usuario_p.sub


    Users.findOne({ 'tweets._id': id_tweet }, (err, findOne_tweetUsuario) => {
        if (err) return res.status(500).send({ message: 'request error' })
        if (!findOne_tweetUsuario) return res.status(404).send({ message: 'tweet no existe' })

        Users.findOne({ 'tweets._id': id_tweet }, { 'tweets.$.tweet[0]': 1 }, (err, findOne_tweet) => {
            if (err) return res.status(500).send({ message: 'request error 1' })
            if (!findOne_tweet) return res.status(404).send({ message: 'tweet no existe' })

            var tweetOriginy = findOne_tweet.tweets[0].tweet;
            var Idtweet = findOne_tweet.tweets[0]._id;
            var usersTweet = findOne_tweetUsuario.usuario;

            //console.log(findOne_tweet);

            Users.findOne({ '_id': usuarioPayload }, { following: { $elemMatch: { user: usersTweet } } }, (err, usersFollowing) => {
                if (err) return res.status(500).send({ message: 'request error access' })
                else if (usersFollowing.following.length === 0) {
                    return res.status(404).send({ message: ` Usted no tiene acceso para retwittear el tweet '${tweetOriginy}'  de '${usersTweet}' solo seguidores` })
                } else if (usersFollowing.following.length === 1) {

                    Users.findOne({ 'tweets._id': id_tweet }, { tweets: { $elemMatch: { _id: id_tweet } } }, { "tweets.$.usersRetweet": 1 }, (err, chek_users) => {
                        if (err) return res.status(500).send({ message: 'request error 2' })
                        if (!findOne_tweet) return res.status(404).send({ message: 'tweet no existe en la busquedad' })
                            //console.log(chek_users.tweets[0].usersRetweet.length, '<Undefine >');

                        else if (simplify_find(chek_users.tweets[0].usersRetweet, req.usuario_p.usuario) === true) {

                            Users.findOneAndUpdate({ 'tweets._id': id_tweet }, { $pull: { 'tweets.$.usersRetweet': req.usuario_p.usuario } }, { new: true }, (err, delete_usersRetwees) => {
                                if (err) return res.status(500).send({ message: 'request error' })
                                if (!delete_usersRetwees) return res.status(500).send({ message: 'Error server' })

                                Users.findOneAndUpdate({ 'tweets._id': id_tweet }, { $inc: { 'tweets.$.numberOfRetweets': -1 } }, (err, numberOFRetweet_1) => {
                                    if (err) return res.status(500).send({ message: 'Error request numberOfRetweet' })
                                    if (!numberOFRetweet_1) return res.status(404).send({ message: 'Error cannot be subtract NumberOfRetweet' })
                                        //console.log(delete_usersRetwees.tweets, 'PULL ELIMINADO');

                                    Users.findOne({ '_id': usuarioPayload, }, (err, busquedad) => {
                                        if (err) return res.status(500).send({ message: 'Error reques' })
                                        if (!busquedad) return res.status(404).send({ message: 'Erros Busquedad' })
                                            //console.log(busquedad);

                                        let i = busquedad.tweets.indexOf(busquedad.tweets.find(item => {
                                            return item.retweet[0]._id == id_tweet;
                                        }))

                                        var id_retwet = busquedad.tweets[i]._id

                                        Users.findOneAndUpdate({ 'tweets._id': id_retwet }, { $pull: { tweets: { _id: id_retwet } } }, { new: true }, (err, DeleteTweet) => {
                                            if (err) return res.status(500).send({ message: 'Error reques delete retweet' })
                                            if (!DeleteTweet) return res.status(404).send({ message: 'Erros delete retweet' })
                                            return res.status(200).send(DeleteTweet)
                                        })
                                    })
                                })
                            })


                        } else if (simplify_find(chek_users.tweets[0].usersRetweet, req.usuario_p.usuario) === false) {

                            Users.findOneAndUpdate({ 'tweets._id': id_tweet }, { $push: { 'tweets.$.usersRetweet': req.usuario_p.usuario } }, { new: true }, (err, add_usersRetweet) => {
                                //console.log(add_usersRetweet.tweets, 'PUSH AGREGADO');
                                if (err) return res.status(500).send({ message: 'request error' })
                                if (!add_usersRetweet) return res.status(500).send({ message: 'Error server' })

                                Users.findOneAndUpdate({ 'tweets._id': id_tweet }, { $inc: { 'tweets.$.numberOfRetweets': 1 } }, (err, numberOFRetweet) => {
                                    if (err) return res.status(500).send({ message: 'Error request numberOfRetweet' })
                                    if (!numberOFRetweet) return res.status(404).send({ message: 'Error cannot be added NumberOfRetweet' })

                                    if (text.trim() === '') {

                                        Users.findByIdAndUpdate(usuarioPayload, { $push: { tweets: { retweet: { user: usersTweet, tweet: tweetOriginy, _id: Idtweet } } } }, { new: true }, (err, push_Retweet) => {
                                            if (err) return res.status(500).send({ message: 'reques error add retweet' })
                                            if (!push_Retweet) return res.status(404).send({ message: 'Erros in add retweet' })
                                            return res.status(200).send(push_Retweet)
                                        })

                                    } else {

                                        Users.findByIdAndUpdate(usuarioPayload, { $push: { tweets: { tweet: text.trim(), retweet: { user: usersTweet, tweet: tweetOriginy, _id: Idtweet } } } }, { new: true }, (err, push_Retweet) => {
                                            if (err) return res.status(500).send({ message: 'reques error add retweet' })
                                            if (!push_Retweet) return res.status(404).send({ message: 'Erros in add retweet' })
                                            return res.status(200).send(push_Retweet)
                                        })

                                    }
                                })
                            })
                        }
                    })
                }
            })
        })
    })
}



module.exports = {
    register_user,
    login,
    my_profile,
    add_tweet,
    tweet_delete,
    tweet_edit,
    follow_user,
    unfollow_user,
    view_tweet,
    myLikes,
    respond,
    Retweet

}