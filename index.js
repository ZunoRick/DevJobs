const mongoose = require('mongoose');
require('./config/db');
const express = require('express');
const {engine} = require('express-handlebars');
const path = require('path');
const router = require('./routes');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');

require('dotenv').config({ path: 'variables.env'});

const app = express();

//Habilitar body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//Habilitar handlebars como view
app.engine('handlebars', 
    engine({
        handlebars: allowInsecurePrototypeAccess(handlebars),
        defaultLayout: 'layout',
        helpers: require('./helpers/handlebars')
    })
);
app.set('view engine', 'handlebars');

//Static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());

app.use(session({
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({mongoUrl: process.env.DATABASE})
}));

app.use('/', router());

app.listen(process.env.PUERTO);