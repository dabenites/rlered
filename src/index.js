const express = require('express');
const morgan  = require('morgan');
const path    = require('path');
const exphbs  = require('express-handlebars');
const session = require('express-session');

//const validator = require('express-validator');
const passport = require('passport');
const flash = require('connect-flash');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');

const { database } = require('./keys');


//Inicialización 
const app = express();
require('./lib/passport');

// Settings
app.set('port', process.env.PORT || 4000);
// app.set('views', path.join("netoffice.herokuapp.com", 'views'));
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
  defaultLayout: 'main',
  layoutsDir: path.join(app.get('views'), 'layouts'),
  partialsDir: path.join(app.get('views'), 'partials'),
  extname: '.hbs',
  helpers: require('./lib/handlebars')
}))
app.set('view engine', '.hbs');


// Middlewares
app.use(session({
  secret: 'faztmysqlnodemysql',
  resave: false,
  saveUninitialized: false,
  store: new MySQLStore(database)
}));
app.use(flash());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());


//Variables globales 
app.use((req, res, next) => {
  app.locals.success = req.flash('success');
  app.locals.message = req.flash('message');
  app.locals.user = req.user;
  app.locals.modulos = req.modulos;
  next();
});

//Rutas
app.use(require('./routes/index'));
app.use(require('./routes/authentication'));
app.use('/links', require('./routes/links'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/mantenedores', require('./routes/mantenedores'));
app.use('/costos', require('./routes/costos')); 
app.use('/proveedor', require('./routes/proveedor'));
app.use('/solicitudes', require('./routes/solicitudes'));
app.use('/facturacion', require('./routes/facturacion'));
app.use('/contacto', require('./routes/contacto'));
app.use('/ploter', require('./routes/ploter'));
app.use('/bitacora', require('./routes/bitacora'));
app.use('/proyecto', require('./routes/proyecto'));
//app.use('/mantenedores/usuario', require('./routes/mantenedores'));

//Archivos publicos 
// app.use(express.static(path.join("netoffice.herokuapp.com", 'public')));
app.use(express.static(path.join(__dirname, 'public')));

//Satart servidor 
app.listen(app.get('port'), () => {
  //console.log('Server on port', app.get('port'));
});

