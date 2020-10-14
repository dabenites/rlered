const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('./helpers');

//SIGNIN
passport.use('local.signin', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, username, password, done) => {
  const rows = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  if (rows.length > 0) {
    const user = rows[0];
    const validPassword = await helpers.matchPassword(password, user.password)
    if (validPassword) { //SI LA CONTRASEÑA A COINCIDIDO DE MANERA CORRECTA
      return done(null, user, req.flash('success', 'Welcome ' + user.username)); //LE PASO UN NULL COMO UN ERROR, YA QUE LA CONTRASEÑA A SIDO CORRECTA, SE LE PASA EL USUARIO OBTENIDO PARA QUE LO SERIALIZE Y LOS DESERIALIZE
    } 
    else {
      return done(null, false, req.flash('message', 'Incorrect Password'));//MSJ CONTRASEÑA INVALIDA 
    }
  } else {
    return done(null, false, req.flash('message', 'The Username does not exists.'));//MSJ USUARIO NO ENCONTRADO
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const rows = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  done(null, rows[0]);
});