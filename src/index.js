const express = require('express'); 
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path   = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore = require('express-mysql-session');

const {database} = require('./keys');
const { render } = require('timeago.js');
// inicializamos el proyecto 

const app = express(); // variable  que manejara la aplicación 

// Configuraciones 
app.set('port', process.env.PORT || 4000); 
app.set('views', path.join(__dirname,'views'));
app.engine('.hbs',exphbs({
    defaultLayout : 'main',
    layoutsDir : path.join(app.get('views'), 'layouts'),
    partialsDir : path.join(app.get('views'), 'partials'),
    extname : '.hbs',
    helpers : require('./lib/handlebars')
}));
app.set('view engine' , '.hbs');

app.use(session({
    secret: 'faztmysqlnodemysql',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database)
  }));
app.use(flash());
app.use(morgan('dev')); // muestra por consulo lo que llega por servidor.
app.use(express.urlencoded({extended : false}));
app.use(express.json());


// Variables Globales
app.use((req,res,next) => {
    app.locals.success = req.flash('success');
    next();
});

// RUTAS URLS DE NUESTRO SERVIDOR 
app.use(require('./routes'));
app.use(require('./routes/authentication'));
app.use('/links', require('./routes/links')); // precede una ruta con el prefijo links


// ARCHIVOS PUBLICOS PUBLIC 
app.use(express.static(path.join(__dirname, 'public')));


// COMENZAR EL SERVIDOR
app.listen(app.get('port'), ()=> console.log('SERVER ON PORT' , app.get('port')));


