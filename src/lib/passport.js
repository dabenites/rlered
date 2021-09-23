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
  const rows = await pool.query('SELECT * FROM sys_usuario as t0 , sys_password as t1 WHERE  t0.idUsuario = t1.idUsuario AND  login = ?', [username]);
  if (rows.length > 0) {
    const user = rows[0];
    const validPassword = await helpers.matchPassword(password, user.password)
    if (validPassword) { //SI LA CONTRASEÑA A COINCIDIDO DE MANERA CORRECTA
      return done(null, user, req.flash('success', 'Welcome ' + user.login)); //LE PASO UN NULL COMO UN ERROR, YA QUE LA CONTRASEÑA A SIDO CORRECTA, SE LE PASA EL USUARIO OBTENIDO PARA QUE LO SERIALIZE Y LOS DESERIALIZE
    } 
    else {
      return done(null, false, req.flash('message', 'Incorrect Password'));//MSJ CONTRASEÑA INVALIDA 
    }
  } else {
    return done(null, false, req.flash('message', 'The Username does not exists.'));//MSJ USUARIO NO ENCONTRADO
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.idUsuario);
});

passport.deserializeUser(async (id, done) => {

  // Buscar la información solo de los modulos que esten operativos. 

  const rows = await pool.query('SELECT * FROM sys_usuario WHERE idUsuario = ?', [id]);
  const modulos = await pool.query('SELECT ' +
                                          't1.* , t2.Nombre as grupoNombre , '+
                                          ' t2.icon as grupoIcon ' +
                                  ' FROM ' +
                                          ' sys_modulo as t1, ' +
                                          ' sys_grupo_modulo as t2 ,' +
                                          ' sys_permiso AS t3 ' +
                                  ' WHERE ' +
                                          ' t1.idGrupo = t2.idGrupo ' +
                                  ' AND ' +
                                          " t1.operativo = 'Y' " +
                                  ' AND ' +
                                          ' t3.idModulo = t1.idModulo' + 
                                  ' AND ' +
                                          ' t3.idUsuario = ?',[id]);
  const modulosHTML = {};
  modulos.forEach(function(elemento, indice, array) {
      if (modulosHTML[elemento.grupoNombre] === undefined)
      {
          modulosHTML[elemento.grupoNombre] = [];
          modulosHTML[elemento.grupoNombre]["grupo"] = elemento.grupoNombre;
          modulosHTML[elemento.grupoNombre]["icono"] = elemento.grupoIcon;
      }
      if (modulosHTML[elemento.grupoNombre]["modulos"] === undefined)
      {
          modulosHTML[elemento.grupoNombre]["modulos"] = [];
      }

      const unMudulo ={ //Se gurdaran en un nuevo objeto
          nombre : elemento.Nombre ,
          icon : elemento.icon ,
          aref : elemento.aref
                      };

      
      modulosHTML[elemento.grupoNombre]["modulos"].push(unMudulo);
  });
  rows[0]["modulos"] = modulosHTML;
  //console.log(rows[0]);
  done(null, rows[0]);
});