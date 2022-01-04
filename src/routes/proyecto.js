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

var dateFormat = require('dateformat');
const { isEmptyObject } = require('jquery');

var url = require('url');

const mensajeria = require('../mensajeria/mail');

//AGREGAR UN PROYECTO

router.get('/iproyecto', isLoggedIn, async (req, res) => {
  // const proyectos = await pool.query("SELECT * FROM pro_proyectos as t1, proyecto_tipo as t2 WHERE t1.Tipo = t2.Descripcion");
  
  const estado = await pool.query("SELECT * FROM pro_costo_externo_estado");
  const usuarios = await pool.query("SELECT * FROM sys_usuario");
  const pais = await pool.query("SELECT * FROM pais");
  const tipo = await pool.query("SELECT * FROM proyecto_tipo");
  const categoria = await pool.query("SELECT * FROM sys_categoria");
  const proye = await pool.query("SELECT * FROM pro_proyectos");
  const contacto = await pool.query("SELECT * FROM contacto");
  const proyectos = await pool.query("SELECT * FROM pro_proyectos as t1 ORDER BY year DESC, code DESC");


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
  const result = await pool.query('INSERT INTO pro_proyectos set ?', [newProyecto]);//Inserción


  //console.log(result);
  const proye = await pool.query('SELECT * FROM pro_proyectos');



  res.render('proyecto/buscador', { req, proye, layout: 'template' });

});




//BUSCADOR inicial bd

router.get('/buscador', isLoggedIn, async (req, res) => {
  const estado = await pool.query("SELECT * FROM pro_costo_externo_estado");
  const buscadores = await pool.query("SELECT * FROM pro_proyectos");
  const tipo = await pool.query("SELECT * FROM proyecto_tipo");
  const usuarios = await pool.query("SELECT * FROM sys_usuario");
  const contacto = await pool.query("SELECT * FROM contacto");
  const paises = await pool.query("SELECT * FROM pais");


  res.render('proyecto/buscador', { req, buscadores, tipo, usuarios, contacto,estado,paises, layout: 'template' });
});




//LISTAR PROYECTOS


router.post('/listPro', isLoggedIn, async (req, res) => {
  //console.log(req);
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


  
    //" WHERE " +
    //" t1.nombre=? OR t1.year=? OR t1.id_Tipo=? OR t1.id_Estado=? OR t1.id_complejidad=? OR t1.SuperficiePPTO=? OR t1.SuperficieAPC=? OR t1.id_Pais=? OR t1.Ciudad=?  OR t1.Npisos=? OR t1.Nsubterraneo=? OR t1.id_Director_Proyecto=? OR t1.id_Jefe_Proyecto=? OR t1.ValorMC=? OR t1.Zona=? OR t1.Suelo=? OR t1.FechaIni=? OR t1.FechaEnt=? OR t1.FechaTer=? OR t1.id_Cliente=? OR t1.id_Arquitectura=? OR t1.id_Constructora=? OR t1.id_Revisor=? OR t1.Nplanos=?  OR t1.id_Servicio=?", [a, b, c, d, e, f, g, h, i, k, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z]);


  // console.log(a + "///" + b);


  const buscadores = await pool.query("SELECT * FROM pro_proyectos AS t1 " +
    " WHERE " +
    " t1.nombre=? OR t1.year=? OR t1.id_Tipo=? OR t1.code=? OR t1.Zona=? OR t1.Zona=? ", [a,b,c,co,p,q]);

    res.json({ 
      anObject: { item1: "item1val", item2: "item2val" }, 
      anArray: ["item1", "item2"], 
      another: "item"
    });

  //res.render('proyecto/listPro', { req, buscadores, layout: 'template' });
});



router.get('/buscador/edit/:id', async (req, res) => {
  const { id } = req.params;

  const buscadores = await pool.query("SELECT * FROM pro_proyectos ");
  const buscador = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ?", [id]);



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
  await pool.query('UPDATE pro_proyectos set ? WHERE id = ?', [newBuscador, id]);
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
  //res.redirect('./proyecto/listPro');

  //res.send("ppp");

//console.log(nombre+"ind"+id);

const Pedit = await pool.query('UPDATE pro_proyectos set nombre =  ? , code =  ?,  SuperficiePPTO =  ?,  SuperficieAPC =  ?, Ciudad =  ?, Ubicacion =  ?,Npisos =  ?,Nsubterraneo =  ?,ValorMC =  ?,Zona =  ?,Suelo =  ?,Nplanos = ? WHERE id = ?', [nombre,code,SuperficiePPTO,SuperficieAPC,Ciudad,Ubicacion,Npisos, Nsubterraneo,ValorMC,Zona,Suelo,Nplanos,id] );
 // console.log(nombre);
  //res.send("ppp");



  res.redirect('/proyecto/buscador');

});



router.get('/buscador/delete/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM pro_proyectos WHERE id = ?', [id]);


  res.redirect('/proyecto/buscador');


});


// addPro
router.get('/addPro', async (req, res) => {

  const tipo = await pool.query("SELECT * FROM proyecto_tipo");
  const estado = await pool.query("SELECT * FROM proyecto_estado");
  const servicio = await pool.query("SELECT * FROM proyecto_servicio");  
  // // 

  res.render('proyecto/addProyecto', {servicio, tipo,estado, req, layout: 'template' });
  
});



// listado
router.get('/listado', async (req, res) => {

  
  // Filtrar segun la categoria de la persona. 
  // JP // Director  // ING A // ING B
 // ING A 21
 // ING B 22
 // JP 24
 // DIRECTORES 26 // 27 // 40 // 41 // 42 // 46
 // Todos los demas pueden ver todo. 
  //console.log(req.user);
  var sql = ""
  switch(req.user.idCategoria)
  {
    case 21:
    case 22:
    case 24:
    case 26:
    case 27:
    case 40:
    case 41:
    case 42:
    case 46:
      sql = " SELECT t3.Nombre AS nomJefe, t4.Nombre AS nomDir, t2.name AS nomCli, t1.*  FROM pro_proyectos AS t1 " +
            " LEFT JOIN contacto AS t2 ON t1.id_cliente = t2.id " +
            " LEFT JOIN sys_usuario AS t3 ON t1.id_jefe = t3.idUsuario " + 
            " LEFT JOIN sys_usuario AS t4 ON t1.id_director = t4.idUsuario " + 
            " WHERE t1.id_jefe = "+req.user.idUsuario +" OR t1.id_director = "+req.user.idUsuario +" ORDER BY t1.year ASC, t1.code ASC";
    break;
    default:
      sql = "SELECT t3.Nombre AS nomJefe, t4.Nombre AS nomDir, t2.name AS nomCli, t1.* FROM pro_proyectos AS t1 "+ 
            "LEFT JOIN contacto AS t2 ON t1.id_cliente = t2.id " +
            " LEFT JOIN sys_usuario AS t3 ON t1.id_jefe = t3.idUsuario " + 
            " LEFT JOIN sys_usuario AS t4 ON t1.id_director = t4.idUsuario" +
            " ORDER BY t1.id";
    break;
  }

  //console.log(sql);


  const proyectos = await pool.query(sql);

  

  if (req.query.a === undefined)
    {
      res.render('proyecto/listado', { proyectos, req, layout: 'template' });
    }
    else
        {
            var verToask = {};
            switch(req.query.a)
            {
                case 1: // Crear
                case "1":
                    verToask= {
                    titulo : "Mensaje",
                    body   : "Proyecto agregado correctamente.",
                    tipo   : "Crear"
                        };

                        res.render('proyecto/listado', { verToask, proyectos, req, layout: 'template' });      
                break;
                case 2: // Actualizado
                case "2":
                    verToask = {
                    titulo : "Mensaje",
                    body   : "Proyecto actualizado correctamente.",
                    tipo   : "Editar"
                        };

                        res.render('proyecto/listado', { verToask, proyectos, req, layout: 'template' });
                break;
                case 3: // Actualizado
                case "3":
                    verToask = {
                    titulo : "Mensaje",
                    body   : "Proyecto se ha eliminado correctamente.",
                    tipo   : "Eliminar"
                        };

                        res.render('proyecto/listado', { verToask, proyectos, req, layout: 'template' });
                break;
            }
        }

});
//buscarPais

router.get('/facturar/:id', async (req, res) => {
  const { id } = req.params;
 
  //______ cargar template. 
  const proyectos = await pool.query("SELECT * FROM pro_proyectos AS t1  WHERE t1.id = "+id+"");

  const facturacion =  await pool.query("SELECT " +
                                                    " *, " +
                                                    " t1.id as idFacturacion," +
                                                    " t2.nombre As nomPro ," +
                                                    " DATE_FORMAT(t1.fecha_solicitud, '%Y-%m-%d') as fechaSolicitante ," +
                                                    " t5.descripcion As estadoDes," +
                                                    " t6.descripcion As tipoCobroDes" +
                                          " FROM " +
                                                      "fact_facturas as t1 LEFT JOIN  sys_usuario as t4 ON t1.id_solicitante = t4.idUsuario, " +
                                                      "pro_proyectos as t2, "+ 
                                                      "moneda_tipo as t3, "+ 
                                                      "fact_estados as t5, "+ 
                                                      "fact_tipo_cobro as t6 "+
                                        " WHERE " + 
                                                    " t1.id_proyecto = t2.id"+
                                        " AND " + 
                                                    " t1.id_tipo_moneda = t3.id_moneda"+
                                        " AND " + 
                                                    " t5.id = t1.id_estado"+
                                        " AND " + 
                                                    " t1.id_proyecto = "+id+""+
                                        " AND " + 
                                                    " t6.id = t1.id_tipo_cobro"+
                                        " ORDER BY fechaSolicitante DESC");

  
                                      
  const { nombre,year, code,id_tipo_proyecto,id_tipo_servicio,id_estado,id_director,id_jefe,id_mandante,id_cliente,id_arquitecto,
    id_revisor,id_complejidad,latitud,altitud,direccion,superficie_ppto,superficie,valor_proyecto,valor_metro_cuadrado,fecha_inicio,
    fecha_entrega,fecha_termino,num_pisos,num_subterraneo,zona,suelo,num_plano_estimado} = proyectos[0];

  // console.log(nombre);

  const monedas = await pool.query("SELECT * FROM moneda_tipo AS t1 WHERE t1.factura = 'Y'");
  const tipoCobro = await pool.query("SELECT * FROM fact_tipo_cobro");

  var  estado  = true;

  // validaciones del equipo 
  if (id_jefe === 0 || id_jefe === null || id_jefe === undefined)  estado = false;

  if (estado)
  res.render('proyecto/facturar', { factura:true,facturacion,monedas,tipoCobro, proyecto: proyectos[0], req, layout: 'template' });
  else
  res.render('proyecto/facturar', { facturacion,monedas,tipoCobro, proyecto: proyectos[0], req, layout: 'template' });
});

router.get('/editar/:id', async (req, res) => {
  const { id } = req.params;
 
  const tipo = await pool.query("SELECT * FROM proyecto_tipo");

  const servicio = await pool.query("SELECT * FROM proyecto_servicio");

  const complejidad = await pool.query("SELECT * FROM proyecto_complejidad");

  const estado = await pool.query("SELECT * FROM proyecto_estado");

  const monedas = await pool.query("SELECT * FROM moneda_tipo as t1 WHERE t1.factura = 'Y'");
  
  // // 

  const proyectos = await pool.query("SELECT * , t1.id as idPro, " +
                                    " t1a.idUsuario AS idDir, " +
                                     " t1a.Nombre AS nomDir, " +
                                     " t1.id_pais AS id_pais, " +
                                     " t1.zona AS zona, " +
                                     " t1.suelo AS suelo, " +
                                     " t1.categoria AS categoria, " +
                                     " t1b.idUsuario AS idJefe, t1b.Nombre AS nomJefe, " +
                                     " t1c.id AS idMan , t1c.name nomMan, " +
                                     " t1d.id AS idCli , t1d.name nomCli, " +
                                     " t1e.id AS idArq , t1e.name nomArq, " +
                                     " t1f.id AS idRev , t1f.name nomRev, " +
                                     " t1p.simbolo AS simbolo," +
                                     " CONCAT(t1p.simbolo,' /', 'm <sup> 2</sup>')  AS sm2" +
                                     " FROM pro_proyectos AS t1 " +
                                     " LEFT JOIN sys_usuario AS t1a ON t1.id_director = t1a.idUsuario " +
                                     " LEFT JOIN sys_usuario AS t1b ON t1.id_jefe = t1b.idUsuario " +
                                     " LEFT JOIN contacto AS t1c ON t1.id_mandante = t1c.id " +
                                     " LEFT JOIN contacto AS t1d ON t1.id_cliente = t1d.id " +
                                     " LEFT JOIN contacto AS t1e ON t1.id_arquitecto = t1e.id " +
                                     " LEFT JOIN contacto AS t1f ON t1.id_revisor = t1f.id " +
                                     " LEFT JOIN moneda_tipo AS t1p ON t1.id_tipo_moneda = t1p.id_moneda " +
                                     " WHERE t1.id = ?",[id]);

  const zonas = await pool.query("SELECT * FROM proyecto_parametro_pais_valor AS t1 WHERE t1.id_pais = "+proyectos[0].id_pais+" AND t1.id_parametro = 1 UNION SELECT 1,1,1,'N/A' FROM proyecto_parametro_pais_valor AS t1 WHERE t1.id = 1");
  const suelo = await pool.query("SELECT * FROM proyecto_parametro_pais_valor AS t1 WHERE t1.id_pais = "+proyectos[0].id_pais+" AND t1.id_parametro = 2 UNION SELECT 1,1,1,'N/A' FROM proyecto_parametro_pais_valor AS t1 WHERE t1.id = 1");
  const categoria = await pool.query("SELECT * FROM proyecto_parametro_pais_valor AS t1 WHERE t1.id_pais = "+proyectos[0].id_pais+" AND t1.id_parametro = 3 UNION SELECT 1,1,1,'N/A' FROM proyecto_parametro_pais_valor AS t1 WHERE t1.id = 1");

  const isEqualHelperHandlerbar = function(a, b, opts) {
          if (a == b) {
              return true
          } else { 
              return false
          } 
      };


  res.render('proyecto/uptProyecto', {monedas,zonas, suelo,categoria, proyecto:proyectos[0], tipo, complejidad, servicio, estado, req, layout: 'template' , helpers : { if_equal : isEqualHelperHandlerbar}});


});

router.get('/buscarDirector/:find', async (req, res) => {
  
  // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const directores =  await pool.query("SELECT t1.idUsuario AS id, t1.Nombre AS value FROM sys_usuario AS t1"+
                                       " WHERE t1.Nombre LIKE '%"+nombre+"%'" +
                                       " AND t1.id_estado = 1" + 
                                       " AND (t1.idCategoria IN (25,26,28,1,42,27,41) OR t1.idUsuario IN (39,24) )");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(directores);

});

router.get('/buscarJefe/:find', async (req, res) => {
  
  // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const jefes =  await pool.query("SELECT t1.idUsuario AS id, t1.Nombre AS value FROM sys_usuario AS t1 " +
                                  " WHERE t1.Nombre LIKE '%"+nombre+"%'" +
                                  " AND t1.id_estado = 1"+
                                  " AND t1.idCategoria IN (25,26,28,1,24,22)");

  res.setHeader('Content-Type', 'application/json');
  res.json(jefes);

});

router.get('/buscarMandante/:find', async (req, res) => {
  
  // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const jefes =  await pool.query("SELECT t1.id AS id, t1.name AS value FROM contacto AS t1 WHERE t1.name LIKE '%"+nombre+"%'");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(jefes);

});

router.get('/buscarMandante/:find', async (req, res) => {
  
  // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const mandantes =  await pool.query("SELECT t1.id AS id, t1.name AS value FROM contacto AS t1 WHERE t1.name LIKE '%"+nombre+"%'");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(mandantes);

});

router.get('/buscarCliente/:find', async (req, res) => {
  
  // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const clientes =  await pool.query("SELECT t1.id AS id, t1.name AS value FROM contacto AS t1 WHERE t1.name LIKE '%"+nombre+"%'");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(clientes);

});

router.get('/buscarArquitecto/:find', async (req, res) => {
  
  // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const arquitectos =  await pool.query("SELECT t1.id AS id, t1.name AS value FROM contacto AS t1 WHERE t1.name LIKE '%"+nombre+"%'");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(arquitectos);

});
router.get('/buscarRevisor/:find', async (req, res) => {
  
  // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const revisores =  await pool.query("SELECT t1.id AS id, t1.name AS value FROM contacto AS t1 WHERE t1.name LIKE '%"+nombre+"%'");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(revisores);

});

//cargarFactura
router.post('/cargarFactura', async (req, res) => {

  const {numPpto,monto,porc_presupuesto,esroc,numroc,fecha_cobro,comentario,tipoCobro,tipoMoneda,id_proyecto} = req.body;

  var fecha_ingreso = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");

  const newFactura = { //Se gurdaran en un nuevo objeto
    // Nproyecto : Nproyecto, nombre : proyecto[0].year + "-" +proyecto[0].code + " " + proyecto[0].nombre,
    fecha_solicitud: fecha_ingreso,
    id_proyecto: id_proyecto,
    id_tipo_moneda:tipoMoneda,
    id_estado: 0,
    id_tipo_cobro: tipoCobro,
    num_ppto: numPpto,
    monto_a_facturar: monto,
    porc_ppto: porc_presupuesto,
    id_solicitante: req.user.idUsuario,
    fecha_cobro: fecha_cobro,
    es_roc: esroc,
    roc: numroc,
    comentarios :comentario };


    
//const resultFactura = await pool.query('INSERT INTO fact_facturas set ?', [newFactura]);

  
res.redirect('/proyecto/facturar/'+id_proyecto);

});


// CARGAR PROYECTO 20/10/2021
//cargarProyecto
//router.post()
router.post('/cargarProyecto', async (req, res) => {

  const { year,code, nombre,id_tipo_proyecto,id_servicio,id_Estado,valor_x_m2,valor_proyecto,superficie_pre,id_director,id_jefe,
    id_mandante,id_cliente,id_arquitecto,loc_lat,loc_long,direccion,id_Complejidad,id_revisor,superficie_apl,
    fecha_inicio,fecha_entrega,fecha_termino,num_pisos,num_subte,zona,suelo,categoria,num_planos_estimado,id_tipo_cobro,id_pais} = req.body;

    //console.log(req.body);

    const newProyecto = { //Se gurdaran en un nuevo objeto
      // Nproyecto : Nproyecto, nombre : proyecto[0].year + "-" +proyecto[0].code + " " + proyecto[0].nombre,
       nombre: nombre,
       year: year,
       code:code,
       id_tipo_moneda : id_tipo_cobro,
       id_tipo_proyecto: id_tipo_proyecto,
       id_tipo_servicio: id_servicio,
       id_estado: id_Estado,
       id_director: id_director,
       id_jefe: id_jefe,
       id_mandante: id_mandante,
       id_cliente: id_cliente,
       id_arquitecto: id_arquitecto,
       id_revisor: id_revisor,
       latitud :loc_lat,
       altitud : loc_long,
       direccion : direccion,
       id_complejidad : id_Complejidad,
       id_pais : id_pais,
       superficie_pre : superficie_pre,
       superficie_apl : superficie_apl,
       valor_proyecto : valor_proyecto,
       valor_metro_cuadrado : valor_x_m2,
       fecha_inicio : fecha_inicio,
       fecha_entrega : fecha_entrega,
       fecha_termino : fecha_termino,
       num_pisos : num_pisos,
       num_subterraneo : num_subte,
       zona : zona,
       suelo : suelo,
       categoria : categoria,
       num_plano_estimado : num_planos_estimado
     };
  
  const result = await pool.query('INSERT INTO pro_proyectos set ?', [newProyecto]);
  
  var fecha_ingreso = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");
  //req.user.idUsuario

  const newProyectoTracking = { //Se gurdaran en un nuevo objeto
    // Nproyecto : Nproyecto, nombre : proyecto[0].year + "-" +proyecto[0].code + " " + proyecto[0].nombre,
     nombre: nombre,
     year: year,
     code:code,
     id_tipo_proyecto: id_tipo_proyecto,
     id_tipo_servicio: id_servicio,
     id_estado: id_Estado,
     id_director: id_director,
     id_jefe: id_jefe,
     id_mandante: id_mandante,
     id_cliente: id_cliente,
     id_arquitecto: id_arquitecto,
     id_revisor: id_revisor,
     latitud :loc_lat,
     altitud : loc_long,
     direccion : direccion,
     id_complejidad : id_Complejidad,
     id_pais : id_pais,
     superficie_pre : superficie_pre,
     superficie_apl : superficie_apl,
     valor_proyecto : valor_proyecto,
     valor_metro_cuadrado : valor_x_m2,
     fecha_inicio : fecha_inicio,
     fecha_entrega : fecha_entrega,
     fecha_termino : fecha_termino,
     num_pisos : num_pisos,
     num_subterraneo : num_subte,
     zona : zona,
     suelo : suelo,
     categoria : categoria,
     num_plano_estimado : num_planos_estimado,
     fecha_estado : fecha_ingreso,
     id_usuario : req.user.idUsuario
   };

   const resultTracking = await pool.query('INSERT INTO pro_proyectos_tracking set ?', [newProyectoTracking]);

   // Registro de mail 

   // buscar la informacion del proyecto 

   const infoProyecto = await pool.query("SELECT * FROM pro_proyectos as t1 where t1.year = ? and t1.code = ? ",[year,code])
   
   const mail = {
     codigo : infoProyecto[0].year + "-" +  infoProyecto[0].code,
     to : "documentos@renelagos.com"
   };
   const mailTI = {
    codigo : infoProyecto[0].year + "-" +  infoProyecto[0].code,
    to : "cpoblete@renelagos.com"
  };

   mensajeria.EnvioMailCreacionProyectoDocumentos(mail);
   mensajeria.EnvioMailCreacionProyectoTI(mailTI);

 res.redirect(   url.format({
    pathname:"../proyecto/listado",
    query: {
       "a": 1
     }
  }));
  

});


router.post('/ActualizarProyecto', async (req, res) => {

  const { year,code, nombre,id_tipo_proyecto,id_servicio,id_Estado,valor_x_m2,valor_proyecto,superficie_pre,id_director,id_jefe,
    id_mandante,id_cliente,id_arquitecto,loc_lat,loc_long,direccion,id_Complejidad,id_revisor,superficie_apl,
    fecha_inicio,fecha_entrega,fecha_termino,num_pisos,num_subte,zona,suelo,categoria,num_planos_estimado , id,id_tipo_cobro, id_pais} = req.body;

    
  
  var fecha_ingreso = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");
  //req.user.idUsuario

  const Proyecto = { //Se gurdaran en un nuevo objeto
    // Nproyecto : Nproyecto, nombre : proyecto[0].year + "-" +proyecto[0].code + " " + proyecto[0].nombre,
     nombre: nombre,
     year: year,
     code:code,
     id_tipo_moneda : id_tipo_cobro,
     id_tipo_proyecto: id_tipo_proyecto,
     id_tipo_servicio: id_servicio,
     id_estado: id_Estado,
     id_director: id_director,
     id_jefe: id_jefe,
     id_mandante: id_mandante,
     id_cliente: id_cliente,
     id_arquitecto: id_arquitecto,
     id_revisor: id_revisor,
     latitud :loc_lat,
     altitud : loc_long,
     direccion : direccion,
     id_complejidad : id_Complejidad,
     id_pais:id_pais,
     superficie_pre : superficie_pre,
     superficie_apl : superficie_apl,
     valor_proyecto : valor_proyecto,
     valor_metro_cuadrado : valor_x_m2,
     fecha_inicio : fecha_inicio,
     fecha_entrega : fecha_entrega,
     fecha_termino : fecha_termino,
     num_pisos : num_pisos,
     num_subterraneo : num_subte,
     zona : zona,
     suelo : suelo,
     categoria : categoria,
     num_plano_estimado : num_planos_estimado
   };

   const resultTrackingProyecto = await pool.query('UPDATE pro_proyectos set ? WHERE id = ?', [Proyecto,id]); 

  const newProyectoTracking = { //Se gurdaran en un nuevo objeto
    // Nproyecto : Nproyecto, nombre : proyecto[0].year + "-" +proyecto[0].code + " " + proyecto[0].nombre,
     nombre: nombre,
     year: year,
     code:code,
     id_tipo_moneda : id_tipo_cobro,
     id_tipo_proyecto: id_tipo_proyecto,
     id_tipo_servicio: id_servicio,
     id_estado: id_Estado,
     id_director: id_director,
     id_jefe: id_jefe,
     id_mandante: id_mandante,
     id_cliente: id_cliente,
     id_arquitecto: id_arquitecto,
     id_revisor: id_revisor,
     latitud :loc_lat,
     altitud : loc_long,
     direccion : direccion,
     id_complejidad : id_Complejidad,
     superficie_pre : superficie_pre,
     superficie_apl : superficie_apl,
     valor_proyecto : valor_proyecto,
     valor_metro_cuadrado : valor_x_m2,
     fecha_inicio : fecha_inicio,
     fecha_entrega : fecha_entrega,
     fecha_termino : fecha_termino,
     num_pisos : num_pisos,
     num_subterraneo : num_subte,
     zona : zona,
     suelo : suelo,
     categoria : categoria,
     num_plano_estimado : num_planos_estimado,
     fecha_estado : fecha_ingreso,
     id_usuario : req.user.idUsuario
   };

   const resultTracking = await pool.query('INSERT INTO pro_proyectos_tracking set ?', [newProyectoTracking]);

   res.redirect(   url.format({
    pathname:"../proyecto/listado",
    query: {
       "a": 2
     }
  }));

});
router.post('/buscarPais', isLoggedIn, async (req, res) => {

  //console.log(req.body.pais);
  const sql = " SELECT * " +
                  " FROM  " +
                " pais	 AS t1 " +
                " WHERE  " +
                " t1.pais LIKE '%"+ req.body.pais +"%' ";

  const pais = await pool.query( sql);

  if (pais.length === 0 )
  {
    const respuesta = { estado : 0};
    res.send(respuesta);
  }
  else
  {
    // los valores de la zona
    const zona = await pool.query("SELECT * FROM proyecto_parametro_pais_valor AS t1 WHERE t1.id_pais = "+pais[0].id+" AND t1.id_parametro = 1 UNION SELECT 1,1,1,'N/A' FROM proyecto_parametro_pais_valor AS t1 WHERE t1.id = 1");
    const suelo = await pool.query("SELECT * FROM proyecto_parametro_pais_valor AS t1 WHERE t1.id_pais = "+pais[0].id+" AND t1.id_parametro = 2 UNION SELECT 1,1,1,'N/A' FROM proyecto_parametro_pais_valor AS t1 WHERE t1.id = 1");
    const categoria = await pool.query("SELECT * FROM proyecto_parametro_pais_valor AS t1 WHERE t1.id_pais = "+pais[0].id+" AND t1.id_parametro = 3 UNION SELECT 1,1,1,'N/A' FROM proyecto_parametro_pais_valor AS t1 WHERE t1.id = 1");
    
    const respuesta = { estado : 1, id_pais : pais[0].id,zona : zona,suelo : suelo,categoria : categoria};
    //console.log(respuesta);
    res.send(respuesta);
  }


  
});

router.get('/equipo/:id', async (req, res) => {
  const { id } = req.params;

  const proyectos = await pool.query("SELECT *, t1.id as idProyecto FROM pro_proyectos AS t1  WHERE t1.id = "+id+""); 
  const equipo_proyecto =  await pool.query("SELECT t1.id , t2.Nombre FROM pro_equipo AS t1, sys_usuario AS t2 WHERE t1.id_proyecto = "+id+" AND t1.id_usuario = t2.idUsuario");
 
  const colaboradores =  await pool.query("SELECT * FROM sys_usuario AS t1a WHERE t1a.idUsuario"+
                                          " NOT IN ( SELECT t1.id_usuario FROM pro_equipo AS t1, sys_usuario AS t2 " +
                                          " WHERE t1.id_proyecto = "+id+" AND t1.id_usuario = t2.idUsuario)");

 // res.render('proyecto/equipo', { equipo_proyecto, proyecto:proyectos[0], req, layout: 'template' });
 if (req.query.a === undefined)
            {
              res.render('proyecto/equipo', { colaboradores, equipo_proyecto, proyecto:proyectos[0], req, layout: 'template' });
            }
    else
            {
                var verToask = {};
                switch(req.query.a)
                {
                    case 1: // borrar
                    case "1":
                        verToask= {
                        titulo : "Mensaje",
                        body   : "Relacion Eliminada",
                        tipo   : "Eliminar"
                            };
    
                    res.render('proyecto/equipo', {colaboradores,verToask, equipo_proyecto, proyecto:proyectos[0], req, layout: 'template' });
                    break;
                    case 2: // Asignado
                    case "2":
                        verToask = {
                        titulo : "Mensaje",
                        body   : "Colaborador agregado con exito",
                        tipo   : "Crear"
                            };
    
                            res.render('proyecto/equipo', {colaboradores,verToask, equipo_proyecto, proyecto:proyectos[0], req, layout: 'template' });
                    break;
                }
            }

});

router.get('/equipo/delete/:id', async (req, res) => {
  const { id } = req.params;

  console.log(req.params);
  console.log(req.body);

  const informacion = await pool.query("SELECT * FROM pro_equipo AS t1 WHERE t1.id = "+id+"");
  
  await pool.query('DELETE FROM pro_equipo WHERE id = ?', [id]);

  res.redirect(   url.format({
    pathname:'/proyecto/equipo/'+informacion[0].id_proyecto,
    query: {
       "a": 1
     }
  }));

  


});
router.get('/equipo/add/:idUsuario/:id', async (req, res) => {
  const { id,idUsuario } = req.params;

  
  const newEquipoProyecto = { //Se gurdaran en un nuevo objeto
          id_usuario: idUsuario,
          id_proyecto: id
          };

   const resultTracking = await pool.query('INSERT INTO pro_equipo set ?', [newEquipoProyecto]);


   res.redirect(   url.format({
    pathname:'/proyecto/equipo/'+id,
    query: {
       "a": 2
     }
  }));
  


});

router.post('/buscarCodigo', isLoggedIn, async (req, res) => {

   // console.log(req.body.year:);

    switch(req.body.pais)
    {
      case 1:
      case '1':
        switch(req.body.servicio)
        {
          case 1:
          case '1':
          case 2:
          case '2':
            const codigo1a = await pool.query(" SELECT  " +
                                                " if ( (max(t1.code) + 1) > 0 , (max(t1.code) + 1) , 1) AS num " +
                                            " FROM " +
                                                " pro_proyectos AS t1 " +
                                            " WHERE  " +
                                                " t1.year = "+req.body.year+" " +
                                            " AND  " +
                                                " t1.code >= 0 AND 		t1.code <= 199"); 

          res.send(String(codigo1a[0].num));
          break;
          case 3:
          case '3':
            const codigo1b = await pool.query(" SELECT  " +
                                                " if ( (max(t1.code) + 1) > 0 , (max(t1.code) + 1) , 400) AS num " +
                                            " FROM " +
                                                " pro_proyectos AS t1 " +
                                            " WHERE  " +
                                                " t1.year = "+req.body.year+" " +
                                            " AND  " +
                                                " t1.code >= 400 AND 		t1.code <= 499"); 
          //console.log(codigo[0].num);
          res.send(String(codigo1b[0].num));
          break;
          default:
            const codigo1c = await pool.query(" SELECT  " +
                                                " if ( (max(t1.code) + 1) > 0 , (max(t1.code) + 1) , 300) AS num " +
                                            " FROM " +
                                                " pro_proyectos AS t1 " +
                                            " WHERE  " +
                                                " t1.year = "+req.body.year+" " +
                                            " AND  " +
                                                " t1.code >= 300 AND 		t1.code <= 399"); 
          //console.log(codigo[0].num);
          res.send(String(codigo1c[0].num));
          break;
        }
        break;
      case 6:
      case '6':
          const codigo = await pool.query(" SELECT  " +
                                                  " if ( (max(t1.code) + 1) > 0 , (max(t1.code) + 1) , 200) AS num " +
                                            " FROM " +
                                                " pro_proyectos AS t1 " +
                                            " WHERE  " +
                                                " t1.year = "+req.body.year+" " +
                                            " AND  " +
                                                " t1.code >= 200 AND 		t1.code <= 299"); 
          //console.log(codigo[0].num);
          res.send(String(codigo[0].num));
          break;
      default:
        const codigo2 = await pool.query(" SELECT  " +
                                              " if ( (max(t1.code) + 1) > 0 , (max(t1.code) + 1) , 600) AS num " +
                                            " FROM " +
                                                " pro_proyectos AS t1 " +
                                            " WHERE  " +
                                                " t1.year = "+req.body.year+" " +
                                            " AND  " +
                                                " t1.code >= 500 AND 		t1.code <= 599"); 
          res.send(String(codigo2[0].num));
        break;
    }
    
  
});



module.exports = router;