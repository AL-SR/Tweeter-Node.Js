'use strict'
const moongose = require("mongoose");
const app = require("./app");
moongose.set('useFindAndModify', false);

moongose.Promise = global.Promise;
moongose.connect('mongodb://localhost:27017/Proyecto_3B', { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
        console.log("You are connected to the database");
        app.set("port", process.env.PORT || 3000);
        app.listen(app.get("port"), () => {
            console.log(`the app is runing on port ${app.get("port")}`);
        });
    })
    .catch(err => console.log(err));