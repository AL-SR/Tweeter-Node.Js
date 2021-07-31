'use strict'

let usuario_controller = require('./users-controllers');
const { retweet } = require('./users-controllers');
const argv = require('yargs').command('register', 'Ingresar un nuevo usuario')
    .argv;

module.exports.commands = (req, res) => {
    var command = argv._[0];
    var params = req.body;
    command = params.commands;
    var command_body = params.commands
    var array = command_body.split(" ");
    var commands_body = array[0].toLowerCase(); //accept uppercase commands..
    var a, b, c;
    [a, b, c] = [array[1], array[2], array[3]];

    switch (commands_body) {
        case 'register':
            usuario_controller.register_user(a, b, c, res) // nombre, usuario, contraseña...
            break;
        case 'login':
            usuario_controller.login(a, b, c, req, res)
            break;
        case 'profile':
            usuario_controller.my_profile(a, req, res) // usuario...
            break;
        case 'add_tweet': //... descripción
            function removeItemFromSplit(arr, item) {
                var x = arr.indexOf(item);
                if (x !== -1) {
                    arr.splice(x, 1);
                }
            }
            removeItemFromSplit(array, 'add_tweet'.toLowerCase());

            var description = array.join(' ')
            usuario_controller.add_tweet(description, req, res)
            break;

        case 'edit_tweet': // _id / tweet text modify..
            var id_tweet = a;
            removeItemFromSplit = (arr, item) => {
                var x = arr.indexOf(item);
                if (x !== -1) {
                    arr.splice(x, 1);
                }
            }
            removeItemFromSplit(array, 'edit_tweet'.toLowerCase());

            array.shift(0, 1) // removing the first element in an array...

            var description = array.join(' ')
            usuario_controller.tweet_edit(id_tweet, description, req, res)
            break;
        case 'delete_tweet':
            usuario_controller.tweet_delete(a, req, res) // ._id tweet...
            break;
        case 'follow':
            usuario_controller.follow_user(a, req, res) // usuario a seguir..
            break;
        case 'unfollow':
            usuario_controller.unfollow_user(a, req, res) // usuario de dejar de seguir....
            break;
        case 'view_tweets':
            usuario_controller.view_tweet(a, req, res) // usuario
            break;
        case 'like_tweet':
            usuario_controller.myLikes(a, req, res) //_id tweet => Nota: esta funcion sirve como Like Tweet & Dislike Tweet
            break;
        case 'reply_tweet':
            var id_tweet = a;
            removeItemFromSplit = (arr, item) => {
                var x = arr.indexOf(item);
                if (x !== -1) {
                    arr.splice(x, 1);
                }
            }
            removeItemFromSplit(array, 'reply_tweet'.toLowerCase());

            array.shift(0, 1) // removing the first element in an array...

            var text = array.join(' ')
            usuario_controller.respond(id_tweet, text, req, res)
            break;
        case 'retweet':
            var id_tweet = a;
            removeItemFromSplit = (arr, item) => {
                var x = arr.indexOf(item);
                if (x !== -1) {
                    arr.splice(x, 1);
                }
            }
            removeItemFromSplit(array, 'retweet'.toLowerCase());

            array.shift(0, 1) // removing the first element in an array...

            var text = array.join(' ')

            usuario_controller.Retweet(id_tweet, text, req, res)
            break;
        default:
            res.status(404).send({ message: ` Command error '${commands_body}'  does not exist` })

    }

}