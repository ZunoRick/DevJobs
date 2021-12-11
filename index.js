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
const flash = require('connect-flash');
const createError = require('http-errors');
const passport = require('./config/passport');

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

//Inicializar Passport
app.use(passport.initialize());
app.use(passport. session());

//Alertas y flash messeges
app. use(flash());

//Crear nuestro middleware
app.use((req, res, next) => {
    res.locals.mensajes = req.flash();
    next();
});

app.use('/', router());

//404 página no existente
app.use((req, res, next) => {
    next(createError(404, 'No Encontrado'));
});

//Administración de los errores
app.use((error, req, res, next) => {
    res.locals.mensaje = error.message;
    const status = error.status || 500;
    res.locals.status = status;
    res.status(status);
    res.render('error');
});

//Heroku asigne el puerto a la aplicación
const host = '0.0.0.0';
const port = process.env.PORT;

app.listen(port, host, () => {
    console.log('El servidor está funcionando');
});