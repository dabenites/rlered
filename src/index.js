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

// console.log(__dirname);
// console.log(process.cwd());
// Middlewares

app.use(session({
  secret: 'faztmysqlnodemysql',
  resave: false,
  saveUninitialized: true,
  store: new MySQLStore(database)
}));

// console.log(session());

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

//RUTAS Librerias externas dentro del codigo. 
app.use('/bootstrap', express.static(path.join(process.cwd(), 'node_modules/bootstrap/dist/')));
app.use('/buttons-bs', express.static(path.join(process.cwd(), 'node_modules/datatables.net-buttons-bs/')));
app.use('/buttons-Fixers', express.static(path.join(process.cwd(), 'node_modules/datatables.net-fixedheader-bs/')));
app.use('/buttons-Responsive', express.static(path.join(process.cwd(), 'node_modules/datatables.net-responsive-bs/')));
app.use('/buttons-scroller', express.static(path.join(process.cwd(), 'node_modules/datatables.net-scroller-bs/')));
app.use('/datatables-bootstrap', express.static(path.join(process.cwd(), 'node_modules/datatables.net-bs/')));

app.use('/markers', express.static(path.join(process.cwd(), 'node_modules/node-js-marker-clusterer/src/')));


app.use('/maps', express.static(path.join(process.cwd(), 'src/servicios/')));
app.use('/views', express.static(path.join(process.cwd(), 'src/views/')));


// JS
app.use('/jquery', express.static(path.join(process.cwd(), 'node_modules/jquery/dist/')))

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
app.use('/reporteria', require('./routes/reporteria'));
app.use('/alertas', require('./routes/alertas'));
//app.use('/mantenedores/usuario', require('./routes/mantenedores'));
app.use('/presupuesto', require('./routes/presupuesto')); 
app.use('/finanzas', require('./routes/finanzas'));

app.use('/revit', require('./routes/revit'));

//app.use('/imagenes', require('./images'));






//Archivos publicos 
// app.use(express.static(path.join("netoffice.herokuapp.com", 'public')));
app.use(express.static(path.join(__dirname, 'public')));


//Satart servidor 
app.listen(app.get('port'), () => {
  console.log('Server on port', app.get('port'));
});

