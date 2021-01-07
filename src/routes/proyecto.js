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




//AGREGAR UN PROYECTO

router.get('/iproyecto', isLoggedIn, async (req, res) => {
  // const proyectos = await pool.query("SELECT * FROM pro_proyectos as t1, proyecto_tipo as t2 WHERE t1.Tipo = t2.Descripcion");
  
  const estado = await pool.query("SELECT * FROM pro_costo_externo_estado");
  const usuarios = await pool.query("SELECT * FROM sys_usuario");
  const pais = await pool.query("SELECT * FROM pais");
  const tipo = await pool.query("SELECT * FROM proyecto_tipo");
  const categoria = await pool.query("SELECT * FROM categorias");
  const proye = await pool.query("SELECT * FROM pro_proyectos_copy");
  const contacto = await pool.query("SELECT * FROM contacto");
  const proyectos = await pool.query("SELECT * FROM pro_proyectos_copy as t1 ORDER BY year DESC, code DESC");


  res.render('proyecto/iproyecto', { req, usuarios, pais, tipo, categoria, proye, contacto, proyectos,estado, layout: 'template' });
});


router.post('/addProyecto', async (req, res) => {
  const { nombre, year,code, id_Tipo,id_Estado, id_complejidad, SuperficiePPTO, SuperficieAPC, id_Pais, Ciudad,
    Ubicacion, Npisos, Nsubterraneo, id_Director_Proyecto, id_Jefe_Proyecto, ValorMC, Zona, Suelo, FechaIni, FechaEnt,
    FechaTer, id_Cliente, id_Arquitectura, id_Constructora, id_Revisor, Nplanos, id_Servicio } = req.body; //Obtener datos title,url,description



  const newProyecto = { //Se gurdaran en un nuevo objeto
   // Nproyecto : Nproyecto, nombre : proyecto[0].year + "-" +proyecto[0].code + " " + proyecto[0].nombre,
    nombre: nombre,
    year: year,
    code:code,
    id_Tipo: id_Tipo,
    id_Estado: id_Estado,
    id_complejidad: id_complejidad,
    SuperficiePPTO: SuperficiePPTO,
    SuperficieAPC: SuperficieAPC,
    id_Pais: id_Pais,
    Ciudad: Ciudad,
    Ubicacion: Ubicacion,
    Npisos: Npisos,
    Nsubterraneo: Nsubterraneo,
    id_Director_Proyecto: id_Director_Proyecto,
    id_Jefe_Proyecto: id_Jefe_Proyecto,
    ValorMC: ValorMC,
    Zona: Zona,
    Suelo: Suelo,
    FechaIni: FechaIni,
    FechaEnt: FechaEnt,
    FechaTer: FechaTer,
    id_Cliente: id_Cliente,
    id_Arquitectura: id_Arquitectura,
    id_Constructora: id_Constructora,
    id_Revisor: id_Revisor,
    Nplanos: Nplanos,
    id_Servicio: id_Servicio


  };
  //Guardar datos en la BD     
  //console.log(req.body);
  const result = await pool.query('INSERT INTO pro_proyectos_copy set ?', [newProyecto]);//Inserción


  console.log(result);
  const proye = await pool.query('SELECT * FROM pro_proyectos_copy');



  res.render('proyecto/iproyecto', { req, proye, layout: 'template' });

})




//BUSCADOR inicial bd

router.get('/buscador', isLoggedIn, async (req, res) => {
  const estado = await pool.query("SELECT * FROM pro_costo_externo_estado");
  const buscadores = await pool.query("SELECT * FROM pro_proyectos_copy");
  const tipo = await pool.query("SELECT * FROM proyecto_tipo");
  const usuarios = await pool.query("SELECT * FROM sys_usuario");
  const contacto = await pool.query("SELECT * FROM contacto");
  const paises = await pool.query("SELECT * FROM pais");


  res.render('proyecto/buscador', { req, buscadores, tipo, usuarios, contacto,estado,paises, layout: 'template' });
});




//LISTAR PROYECTOS


router.post('/listPro', isLoggedIn, async (req, res) => {
  console.log(req);
  // const buscadores = await pool.query("SELECT * FROM pro_proyectos");
  // const tipo = await pool.query("SELECT * FROM proyecto_tipo");
  // const usuarios = await pool.query("SELECT * FROM sys_usuario");
  // const contacto = await pool.query("SELECT * FROM contacto");


  var a = req.body.nombre;
  var b = req.body.year;
  var c = req.body.id_Tipo;
  var co = req.body.code;
  /*var d = req.body.id_Estado;
  var e = req.body.id_complejidad;
  var f = req.body.SuperficiePPTO;
  var g = req.body.SuperficieAPC;
  var h = req.body.id_Pais;
  var i = req.body.Ciudad;
  var k = req.body.Npisos;
  var l = req.body.Nsubterraneo;
  var m = req.body.id_Director_Proyecto;
  var n = req.body.id_Jefe_Proyecto;
  var o = req.body.ValorMC;*/
  var p = req.body.Zona;
  var q = req.body.Suelo;
  /*var r = req.body.FechaIni;
  var s = req.body.FechaEnt;
  var t = req.body.FechaTer;
  var u = req.body.id_Cliente;
  var v = req.body.id_Arquitectura;
  var w = req.body.id_Constructora;
  var x = req.body.id_Revisor;
  var y = req.body.Nplanos;
  var z = req.body.id_Servicio;*/


  //const buscadores = await pool.query("SELECT * FROM pro_proyectos_copy AS t1 " +
    //" WHERE " +
    //" t1.nombre=? OR t1.year=? OR t1.id_Tipo=? OR t1.id_Estado=? OR t1.id_complejidad=? OR t1.SuperficiePPTO=? OR t1.SuperficieAPC=? OR t1.id_Pais=? OR t1.Ciudad=?  OR t1.Npisos=? OR t1.Nsubterraneo=? OR t1.id_Director_Proyecto=? OR t1.id_Jefe_Proyecto=? OR t1.ValorMC=? OR t1.Zona=? OR t1.Suelo=? OR t1.FechaIni=? OR t1.FechaEnt=? OR t1.FechaTer=? OR t1.id_Cliente=? OR t1.id_Arquitectura=? OR t1.id_Constructora=? OR t1.id_Revisor=? OR t1.Nplanos=?  OR t1.id_Servicio=?", [a, b, c, d, e, f, g, h, i, k, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z]);


  // console.log(a + "///" + b);


  const buscadores = await pool.query("SELECT * FROM pro_proyectos_copy AS t1 " +
    " WHERE " +
    " t1.nombre=? OR t1.year=? OR t1.id_Tipo=? OR t1.code=? OR t1.Zona=? OR t1.Zona=? ", [a,b,c,co,p,q]);



  res.render('proyecto/listPro', { req, buscadores, layout: 'template' });
});



router.get('/buscador/edit/:id', async (req, res) => {
  const { id } = req.params;

  const buscadores = await pool.query("SELECT * FROM pro_proyectos_copy ");
  const buscador = await pool.query("SELECT * FROM pro_proyectos_copy as t1 WHERE t1.id = ?", [id]);



  res.render('proyecto/editProyecto', {
    buscadores, buscador: buscador[0], req, layout: 'template'//, helpers: {
      //if_equal: isEqualHelperHandlerbar
    //}
  });
});



router.post('/editBusca', async (req, res) => {
  const { id,nombre, year,code, id_Tipo,id_Estado, id_complejidad, SuperficiePPTO, SuperficieAPC, id_Pais, Ciudad,
    Ubicacion, Npisos, Nsubterraneo, id_Director_Proyecto, id_Jefe_Proyecto, ValorMC, Zona, Suelo, FechaIni, FechaEnt,
    FechaTer, id_Cliente, id_Arquitectura, id_Constructora, id_Revisor, Nplanos, id_Servicio } = req.body; //Obtener datos title,url,description

  const newBuscador = { //Se gurdaran en un nuevo objeto
  
    
    nombre: nombre,
    year: year,
    code:code,
    id_Tipo: id_Tipo,
    id_Estado: id_Estado,
    id_complejidad: id_complejidad,
    SuperficiePPTO: SuperficiePPTO,
    SuperficieAPC: SuperficieAPC,
    id_Pais: id_Pais,
    Ciudad: Ciudad,
    Ubicacion: Ubicacion,
    Npisos: Npisos,
    Nsubterraneo: Nsubterraneo,
    id_Director_Proyecto: id_Director_Proyecto,
    id_Jefe_Proyecto: id_Jefe_Proyecto,
    ValorMC: ValorMC,
    Zona: Zona,
    Suelo: Suelo,
    FechaIni: FechaIni,
    FechaEnt: FechaEnt,
    FechaTer: FechaTer,
    id_Cliente: id_Cliente,
    id_Arquitectura: id_Arquitectura,
    id_Constructora: id_Constructora,
    id_Revisor: id_Revisor,
    Nplanos: Nplanos,
    id_Servicio: id_Servicio
  };
  //Guardar datos en la BD     
  await pool.query('UPDATE pro_proyectos_copy set ? WHERE id = ?', [newBuscador, id]);
  res.redirect('/proyecto/editProyecto');

});


router.post('/edit', async (req, res) => {
  const { id,nombre, year,code, id_Tipo,id_Estado, id_complejidad, SuperficiePPTO, SuperficieAPC, id_Pais, Ciudad,
    Ubicacion, Npisos, Nsubterraneo, id_Director_Proyecto, id_Jefe_Proyecto, ValorMC, Zona, Suelo, FechaIni, FechaEnt,
    FechaTer, id_Cliente, id_Arquitectura, id_Constructora, id_Revisor, Nplanos, id_Servicio } = req.body; //Obtener datos title,url,description

  const newBuscador = { //Se gurdaran en un nuevo objeto
  
    id:id,
    nombre: nombre,
    year: year,
    code:code,
    id_Tipo: id_Tipo,
    id_Estado: id_Estado,
    id_complejidad: id_complejidad,
    SuperficiePPTO: SuperficiePPTO,
    SuperficieAPC: SuperficieAPC,
    id_Pais: id_Pais,
    Ciudad: Ciudad,
    Ubicacion: Ubicacion,
    Npisos: Npisos,
    Nsubterraneo: Nsubterraneo,
    id_Director_Proyecto: id_Director_Proyecto,
    id_Jefe_Proyecto: id_Jefe_Proyecto,
    ValorMC: ValorMC,
    Zona: Zona,
    Suelo: Suelo,
    FechaIni: FechaIni,
    FechaEnt: FechaEnt,
    FechaTer: FechaTer,
    id_Cliente: id_Cliente,
    id_Arquitectura: id_Arquitectura,
    id_Constructora: id_Constructora,
    id_Revisor: id_Revisor,
    Nplanos: Nplanos,
    id_Servicio: id_Servicio
  };
  //Guardar datos en la BD     
  //await pool.query('UPDATE pro_proyectos_copy set nombre =  ? WHERE id = ?', [nombre, id]);
  //res.redirect('./proyecto/listPro');

  //res.send("ppp");

//console.log(nombre+"ind"+id);

const Pedit = await pool.query('UPDATE pro_proyectos_copy set nombre =  ? , code =  ?,  SuperficiePPTO =  ?,  SuperficieAPC =  ?, Ciudad =  ?, Ubicacion =  ?,Npisos =  ?,Nsubterraneo =  ?,ValorMC =  ?,Zona =  ?,Suelo =  ?,Nplanos = ? WHERE id = ?', [nombre,code,SuperficiePPTO,SuperficieAPC,Ciudad,Ubicacion,Npisos, Nsubterraneo,ValorMC,Zona,Suelo,Nplanos,id] );
 // console.log(nombre);
  //res.send("ppp");

 //const ep = await pool.query('SELECT * FROM pro_proyectos_copy');

  res.redirect('/proyecto/buscador');

});



router.get('/buscador/delete/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM pro_proyectos_copy WHERE id = ?', [id]);


  res.redirect('/proyecto/buscador');


});























module.exports = router;