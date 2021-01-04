const express = require('express');
const { render } = require('timeago.js');
const router = express.Router();
const bodyParser = require('body-parser');
var util = require("util");

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { chdir } = require('process');
const { Console } = require('console');






router.get('/iproyecto', isLoggedIn, async (req, res) => {
  // const proyectos = await pool.query("SELECT * FROM pro_proyectos as t1, proyecto_tipo as t2 WHERE t1.Tipo = t2.Descripcion");

  const usuarios = await pool.query("SELECT * FROM sys_usuario");
  const pais = await pool.query("SELECT * FROM pais");
  const tipo = await pool.query("SELECT * FROM proyecto_tipo");
  const categoria = await pool.query("SELECT * FROM categorias");
  const proye = await pool.query("SELECT * FROM pro_proyectos");
  const contacto = await pool.query("SELECT * FROM contacto");
  const proyectos = await pool.query("SELECT * FROM pro_proyectos as t1 ORDER BY year DESC, code DESC");


  res.render('proyecto/iproyecto', { req, usuarios, pais, tipo, categoria, proye, contacto, proyectos, layout: 'template' });
});


router.post('/addProyecto', async (req, res) => {
  const { nombre, year, Tipo,/*Nproyecto*/Estado, Complejidad, SuperficiePPTO, SuperficieAPC, pais, Ciudad,
    Ubicacion, Npisos, Nsubterraneo, DP, JP, ValorMC, Zona, Suelo, FechaIni, FechaEnt,
    FechaTer, Cliente, Arquitectura, Constructora, Revisor, Nplanos, Servicio } = req.body; //Obtener datos title,url,description



  const newProyecto = { //Se gurdaran en un nuevo objeto
    //Nproyecto : Nproyecto, nombre : proyecto[0].year + "-" +proyecto[0].code + " " + proyecto[0].nombre,
    nombre: nombre,
    year: year,
    Tipo: Tipo,
    Estado: Estado,
    Complejidad: Complejidad,
    SuperficiePPTO: SuperficiePPTO,
    SuperficieAPC: SuperficieAPC,
    pais: pais,
    Ciudad: Ciudad,
    Ubicacion: Ubicacion,
    Npisos: Npisos,
    Nsubterraneo: Nsubterraneo,
    DP: DP,
    JP: JP,
    ValorMC: ValorMC,
    Zona: Zona,
    Suelo: Suelo,
    FechaIni: FechaIni,
    FechaEnt: FechaEnt,
    FechaTer: FechaTer,
    Cliente: Cliente,
    Arquitectura: Arquitectura,
    Constructora: Constructora,
    Revisor: Revisor,
    Nplanos: Nplanos,
    Servicio: Servicio


  };
  //Guardar datos en la BD     
  //console.log(req.body);
  const result = await pool.query('INSERT INTO pro_proyectos set ?', [newProyecto]);//Inserción


  console.log(result);
  const proye = await pool.query('SELECT * FROM pro_proyectos');



  res.render('proyecto/iproyecto', { req, proye, layout: 'template' });

})




//BUSCADOR

router.get('/buscador', isLoggedIn, async (req, res) => {
  const buscadores = await pool.query("SELECT * FROM pro_proyectos");
  const tipo = await pool.query("SELECT * FROM proyecto_tipo");
  const usuarios = await pool.query("SELECT * FROM sys_usuario");
  const contacto = await pool.query("SELECT * FROM contacto");


  res.render('proyecto/buscador', { req, buscadores, tipo, usuarios, contacto, layout: 'template' });
});


/*router.post('/editBusca', async (req, res) => {
  const { id, nombre, year, Tipo, Estado, Complejidad, SuperficiePPTO, SuperficieAPC, Pais, Ciudad,
    Ubicacion, Npisos, Nsubterraneo, DP, JP, ValorMC, Zona, Suelo, FechaIni, FechaEnt,
    FechaTer, Cliente, Arquitectura, Constructora, Revisor, Nplanos, Servicio } = req.body; //Obtener datos title,url,description

  const newBuscador = { //Se gurdaran en un nuevo objeto
    //Nproyecto : Nproyecto, nombre : proyecto[0].year + "-" +proyecto[0].code + " " + proyecto[0].nombre,
    nombre: nombre,
    year: year,
    Tipo: Tipo,
    Estado: Estado,
    Complejidad: Complejidad,
    SuperficiePPTO: SuperficiePPTO,
    SuperficieAPC: SuperficieAPC,
    Pais: Pais,
    Ciudad: Ciudad,
    Ubicacion: Ubicacion,
    Npisos: Npisos,
    Nsubterraneo: Nsubterraneo,
    DP: DP,
    JP: JP,
    ValorMC: ValorMC,
    Zona: Zona,
    Suelo: Suelo,
    FechaIni: FechaIni,
    FechaEnt: FechaEnt,
    FechaTer: FechaTer,
    Cliente: Cliente,
    Arquitectura: Arquitectura,
    Constructora: Constructora,
    Revisor: Revisor,
    Nplanos: Nplanos,
    Servicio: Servicio
  };
  //Guardar datos en la BD     
  await pool.query('UPDATE pro_proyectos set ? WHERE id = ?', [newBuscador, id]);
  res.redirect('../proyecto/buscador');

});*/


/*router.get('/buscador/delete/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM pro_proyectos WHERE id = ?', [id]);


  res.redirect('/proyecto/buscador');


});*/






//LISTAR

router.post('/listPro', isLoggedIn, async (req, res) => {
  console.log(req);
  // const buscadores = await pool.query("SELECT * FROM pro_proyectos");
  // const tipo = await pool.query("SELECT * FROM proyecto_tipo");
  // const usuarios = await pool.query("SELECT * FROM sys_usuario");
  // const contacto = await pool.query("SELECT * FROM contacto");


  var a = req.body.nombre;
  var b = req.body.year;
  var c = req.body.Tipo;
  var d = req.body.Estado;
  var e = req.body.Complejidad;
  var f = req.body.SuperficiePPTO;
  var g = req.body.SuperficieAPC;
  var h = req.body.Pais;
  var i = req.body.Ciudad;
  var k = req.body.Npisos;
  var l = req.body.Nsubterraneo;
  var m = req.body.DP;
  var n = req.body.JP;
  var o = req.body.ValorMC;
  var p = req.body.Zona;
  var q = req.body.Suelo;
  var r = req.body.FechaIni;
  var s = req.body.FechaEnt;
  var t = req.body.FechaTer;
  var u = req.body.Cliente;
  var v = req.body.Arquitectura;
  var w = req.body.Constructora;
  var x = req.body.Revisor;
  var y = req.body.Nplanos;
  var z = req.body.Servicio;


  const buscadores = await pool.query("SELECT * FROM pro_proyectos AS t1 " +
    " WHERE " +
    " t1.nombre=? OR t1.year=? OR t1.Tipo=? OR t1.Estado=? OR t1.Complejidad=? OR t1.SuperficiePPTO=? OR t1.SuperficieAPC=? OR t1.Pais=? OR t1.Ciudad=?  OR t1.Npisos=? OR t1.Nsubterraneo=? OR t1.DP=? OR t1.JP=? OR t1.ValorMC=? OR t1.Zona=? OR t1.Suelo=? OR t1.FechaIni=? OR t1.FechaEnt=? OR t1.FechaTer=? OR t1.Cliente=? OR t1.Arquitectura=? OR t1.Constructora=? OR t1.Revisor=? OR t1.Nplanos=?  OR t1.Servicio=?", [a, b, c, d, e, f, g, h, i, k, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z]);


  // console.log(a + "///" + b);


  res.render('proyecto/listPro', { req, buscadores, layout: 'template' });
});


router.post('/editBusca', async (req, res) => {
  const { id, nombre, year, Tipo, Estado, Complejidad, SuperficiePPTO, SuperficieAPC, Pais, Ciudad,
    Ubicacion, Npisos, Nsubterraneo, DP, JP, ValorMC, Zona, Suelo, FechaIni, FechaEnt,
    FechaTer, Cliente, Arquitectura, Constructora, Revisor, Nplanos, Servicio } = req.body; //Obtener datos title,url,description

  const newBuscador = { //Se gurdaran en un nuevo objeto
    //Nproyecto : Nproyecto, nombre : proyecto[0].year + "-" +proyecto[0].code + " " + proyecto[0].nombre,
    nombre: nombre,
    year: year,
    Tipo: Tipo,
    Estado: Estado,
    Complejidad: Complejidad,
    SuperficiePPTO: SuperficiePPTO,
    SuperficieAPC: SuperficieAPC,
    Pais: Pais,
    Ciudad: Ciudad,
    Ubicacion: Ubicacion,
    Npisos: Npisos,
    Nsubterraneo: Nsubterraneo,
    DP: DP,
    JP: JP,
    ValorMC: ValorMC,
    Zona: Zona,
    Suelo: Suelo,
    FechaIni: FechaIni,
    FechaEnt: FechaEnt,
    FechaTer: FechaTer,
    Cliente: Cliente,
    Arquitectura: Arquitectura,
    Constructora: Constructora,
    Revisor: Revisor,
    Nplanos: Nplanos,
    Servicio: Servicio
  };
  //Guardar datos en la BD     
  await pool.query('UPDATE pro_proyectos set ? WHERE id = ?', [newBuscador, id]);
  res.redirect('../proyecto/listPro');

});


router.get('/buscador/edit/:id', async (req, res) => {
  const { id } = req.params;

  const buscadores = await pool.query("SELECT * FROM pro_proyectos ");
  const buscador = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ?", [id]);

  //const isEqualHelperHandlerbar = function (a, b, opts) {
    //if (a == b) {
      //return true
    ////return false
    //}
  //};



  res.render('proyecto/editProyecto', {
    buscadores, buscador: buscador[0], req, layout: 'template'//, helpers: {
      //if_equal: isEqualHelperHandlerbar
    //}
  });
});

/*router.post('/buscador/edit/:id', async (req, res) => {
  const { id } = req.params;

  const buscadores = await pool.query("SELECT * FROM pro_proyectos ");
  const buscador = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ?", [id]);

  const isEqualHelperHandlerbar = function(a, b, opts) {
    if (a == b) {
        return true
    } else { 
        return false
    } 
};
console.log(usuario);

res.send("sadads");

  //res.render('proyecto/editProyecto', { buscadores, buscador: buscador[0], req, layout: 'template', helpers : {
  //  if_equal : isEqualHelperHandlerbar }});
});*/




router.get('/buscador/delete/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM pro_proyectos WHERE id = ?', [id]);


  res.redirect('/proyecto/buscador');


});














module.exports = router;