const express = require('express');
const router = express.Router();

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

var dateFormat = require('dateformat');


var url = require('url');

const mensajeria = require('../mensajeria/mail');
const { parse } = require('path');



//AGREGAR UN PROYECTO

router.get('/iproyecto', isLoggedIn, async (req, res) => {
  try {
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
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /iproyecto \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }

  
});


router.post('/addProyecto', isLoggedIn, async (req, res) => {

  try {
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
  //Guardar datos en la BD     
    //Guardar datos en la BD     
  //Guardar datos en la BD     
    //Guardar datos en la BD     
    const result = await pool.query('INSERT INTO pro_proyectos set ?', [newProyecto]);//Inserción

    const proye = await pool.query('SELECT * FROM pro_proyectos');
  
  
  
    res.render('proyecto/buscador', { req, proye, layout: 'template' });
  
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /addProyecto \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }

  
});

//BUSCADOR inicial bd

router.get('/buscador', isLoggedIn, async (req, res) => {

  try {

    const estado = await pool.query("SELECT * FROM pro_costo_externo_estado");
    const buscadores = await pool.query("SELECT * FROM pro_proyectos");
    const tipo = await pool.query("SELECT * FROM proyecto_tipo");
    const usuarios = await pool.query("SELECT * FROM sys_usuario");
    const contacto = await pool.query("SELECT * FROM contacto");
    const paises = await pool.query("SELECT * FROM pais");
  
  
    res.render('proyecto/buscador', { req, buscadores, tipo, usuarios, contacto,estado,paises, layout: 'template' });

    
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscador \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

 
});

//LISTAR PROYECTOS


router.post('/listPro', isLoggedIn, async (req, res) => {
  // const buscadores = await pool.query("SELECT * FROM pro_proyectos");
  // const tipo = await pool.query("SELECT * FROM proyecto_tipo");
  // const usuarios = await pool.query("SELECT * FROM sys_usuario");
  // const contacto = await pool.query("SELECT * FROM contacto");


try {
  var a = req.body.nombre;
  var b = req.body.year;
  var c = req.body.id_Tipo;
  var co = req.body.code;
  
  var p = req.body.Zona;
  var q = req.body.Suelo;
  
  const buscadores = await pool.query("SELECT * FROM pro_proyectos AS t1 " +
    " WHERE " +
    " t1.nombre=? OR t1.year=? OR t1.id_Tipo=? OR t1.code=? OR t1.Zona=? OR t1.Zona=? ", [a,b,c,co,p,q]);

    res.json({ 
      anObject: { item1: "item1val", item2: "item2val" }, 
      anArray: ["item1", "item2"], 
      another: "item"
    });

} catch (error) {
  mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /listPro \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

}

  
  //res.render('proyecto/listPro', { req, buscadores, layout: 'template' });
});



router.get('/buscador/edit/:id', isLoggedIn, async (req, res) => {

  try {
    
    const { id } = req.params;

    const buscadores = await pool.query("SELECT * FROM pro_proyectos ");
    const buscador = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ?", [id]);
  
  
  
    res.render('proyecto/editProyecto', {
      buscadores, buscador: buscador[0], req, layout: 'template'//, helpers: {
        //if_equal: isEqualHelperHandlerbar
      //}
    });

  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscador/edit/:id' \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }
 
});



router.post('/editBusca', isLoggedIn, async (req, res) => {

  try {
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
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /editBusca' \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }

  

});


router.post('/edit', isLoggedIn, async (req, res) => {

  try {
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
  
  
  const Pedit = await pool.query('UPDATE pro_proyectos set nombre =  ? , code =  ?,  SuperficiePPTO =  ?,  SuperficieAPC =  ?, Ciudad =  ?, Ubicacion =  ?,Npisos =  ?,Nsubterraneo =  ?,ValorMC =  ?,Zona =  ?,Suelo =  ?,Nplanos = ? WHERE id = ?', [nombre,code,SuperficiePPTO,SuperficieAPC,Ciudad,Ubicacion,Npisos, Nsubterraneo,ValorMC,Zona,Suelo,Nplanos,id] );
    //res.send("ppp");
  
  
  
    res.redirect('/proyecto/buscador');
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /edit' \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }

  
});



router.get('/buscador/delete/:id', isLoggedIn, async (req, res) => {

  try {
    const { id } = req.params;
    await pool.query('DELETE FROM pro_proyectos WHERE id = ?', [id]);
  
  
    res.redirect('/proyecto/buscador');
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /edit' \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

 


});


// addPro
router.get('/addPro', isLoggedIn, async (req, res) => {

  try {
    const tipo = await pool.query("SELECT * FROM proyecto_tipo");
  const estado = await pool.query("SELECT * FROM proyecto_estado");
  const servicio = await pool.query("SELECT * FROM proyecto_servicio");  
  // // 

  res.render('proyecto/addProyecto', {servicio, tipo,estado, req, layout: 'template' });
  
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /addPro' \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

  
});



// listado
router.get('/listado',isLoggedIn, async (req, res) => {
  try {

      // Filtrar segun la categoria de la persona. 
  // JP // Director  // ING A // ING B
 // ING A 21
 // ING B 22
 // JP 24
 // DIRECTORES 26 // 27 // 40 // 41 // 42 // 46
 // Todos los demas pueden ver todo. 
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
            " WHERE t1.id_jefe = "+req.user.idUsuario +" OR t1.id_director = "+req.user.idUsuario +" " + // ORDER BY t1.year ASC, t1.code ASC";
            " UNION " +
            " SELECT t3.Nombre AS nomJefe, t4.Nombre AS nomDir, t2.name AS nomCli, t1.*  FROM pro_proyectos AS t1   " +
            " LEFT JOIN contacto AS t2 ON t1.id_cliente = t2.id   " +
            " LEFT JOIN sys_usuario AS t3 ON t1.id_jefe = t3.idUsuario   " +
            " LEFT JOIN sys_usuario AS t4 ON t1.id_director = t4.idUsuario, " +
            " pro_equipo AS t5   " +
            " WHERE t1.id = t5.id_proyecto AND t5.id_usuario = "+req.user.idUsuario+" " 
            " GROUP BY id " 
            " ORDER BY year DESC, code DESC ";
    break;
    default:
      sql = "SELECT t3.Nombre AS nomJefe, t4.Nombre AS nomDir, t2.name AS nomCli, t1.* FROM pro_proyectos AS t1 "+ 
            "LEFT JOIN contacto AS t2 ON t1.id_cliente = t2.id " +
            " LEFT JOIN sys_usuario AS t3 ON t1.id_jefe = t3.idUsuario " + 
            " LEFT JOIN sys_usuario AS t4 ON t1.id_director = t4.idUsuario" +
            " ORDER BY t1.id";
    break;
  }


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

    
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /listado' \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }
  
});
//buscarPais

router.get('/facturar/:id', isLoggedIn, async (req, res) => {

  try {
    const { id } = req.params;
 
  //______ cargar template. 
  const proyectos = await pool.query( " SELECT t1.*, t2.Nombre AS director, t3.Nombre AS jefe, t4.descripcion AS servicio , t5.descripcion AS tipo" +
                                      " FROM pro_proyectos AS t1 " +
                                      " LEFT JOIN sys_usuario AS t2 ON t1.id_director = t2.idUsuario " +
                                      " LEFT JOIN sys_usuario AS t3 ON t1.id_jefe = t3.idUsuario "+
                                      " LEFT JOIN proyecto_servicio AS t4 ON t1.id_tipo_servicio = t4.id " +
                                      " LEFT JOIN proyecto_tipo AS t5 ON t1.id_tipo_proyecto = t5.id "+
                                      " WHERE t1.id = "+id+" ");

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


  const monedas = await pool.query("SELECT * FROM moneda_tipo AS t1 WHERE t1.factura = 'Y'");

 // Aqui dar un inteligencia segun el tipo de proyecto son los tipos de cobro

 let tipoCobro = {};
if (proyectos[0].id_tipo_servicio == 2)
{
  tipoCobro =  await pool.query("SELECT * FROM fact_tipo_cobro as t1 where t1.revision = 'Y'");

}
else if (proyectos[0].id_tipo_servicio == 3)
{
  tipoCobro =  await pool.query("SELECT * FROM fact_tipo_cobro as t1 where t1.coordinacion = 'Y'");
}
else
{
  tipoCobro =  await pool.query("SELECT * FROM fact_tipo_cobro as t1 where t1.proyecto = 'Y'");
}

  

  var  estado  = true;

  // validaciones del equipo 
  if (id_jefe === 0 || id_jefe === null || id_jefe === undefined)  estado = false;

  if (estado)
  res.render('proyecto/facturar', { factura:true,facturacion,monedas,tipoCobro, proyecto: proyectos[0], req, layout: 'template' });
  else
  res.render('proyecto/facturar', { facturacion,monedas,tipoCobro, proyecto: proyectos[0], req, layout: 'template' });
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /facturar/:id' \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

  
});

router.get('/editar/:id', isLoggedIn, async (req, res) => {

  try {
    const { id } = req.params;
 
  const tipo = await pool.query("SELECT * FROM proyecto_tipo");

  const servicio = await pool.query("SELECT * FROM proyecto_servicio");

  const complejidad = await pool.query("SELECT * FROM proyecto_complejidad");

  const estado = await pool.query("SELECT * FROM proyecto_estado");

  const monedas = await pool.query("SELECT * FROM moneda_tipo as t1 WHERE t1.factura = 'Y'");
  
  // // 


  const pre =  await pool.query("SELECT * from pro_proyectos AS t1 WHERE t1.id = ? ", [id]);
  let proyectos;
  if (pre[0].id_tipo_servicio == 2)
  {
    
    proyectos = await pool.query("SELECT * , t1.id as idPro, " +
    " t1.id_director AS idDir, " +
     " t1a.Nombre AS nomDir, " +
     " t1.id_pais AS id_pais, " +
     " t1.zona AS zona, " +
     " t1.id_estado as id_estado,"+
     " t1.direccion as direccion,"+
     " t1.suelo AS suelo, " +
     " t1.categoria AS categoria, " +
     " t1.id_jefe AS idJefe, t1b.Nombre AS nomJefe, " +
     " t1.id_mandante AS idMan , t1c.name nomMan, " +
     " t1.id_cliente AS idCli , t1d.Nombre as  nomCli, " +
     " t1.id_arquitecto AS idArq , t1e.name nomArq, " +
     " t1.id_revisor AS idRev , t1f.name nomRev, " +
     " t1p.simbolo AS simbolo," +
     " CONCAT(t1p.simbolo,' /', 'm <sup> 2</sup>')  AS sm2" +
     " FROM pro_proyectos AS t1 " +
     " LEFT JOIN sys_usuario AS t1a ON t1.id_director = t1a.idUsuario " +
     " LEFT JOIN sys_usuario AS t1b ON t1.id_jefe = t1b.idUsuario " +
     " LEFT JOIN contacto AS t1c ON t1.id_mandante = t1c.id " +
     " LEFT JOIN sys_usuario AS t1d ON t1.id_cliente = t1d.idUsuario " +
     " LEFT JOIN contacto AS t1e ON t1.id_arquitecto = t1e.id " +
     " LEFT JOIN contacto AS t1f ON t1.id_revisor = t1f.id " +
     " LEFT JOIN moneda_tipo AS t1p ON t1.id_tipo_moneda = t1p.id_moneda " +
     " WHERE t1.id = ?",[id]);
  }
  else
  {
    proyectos = await pool.query("SELECT * , t1.id as idPro, " +
    " t1.id_director AS idDir, " +
     " t1a.Nombre AS nomDir, " +
     " t1.id_pais AS id_pais, " +
     " t1.zona AS zona, " +
     " t1.id_estado as id_estado,"+
     " t1.suelo AS suelo, " +
     " t1.direccion as direccion,"+
     " t1.categoria AS categoria, " +
     " t1.id_jefe AS idJefe, t1b.Nombre AS nomJefe, " +
     " t1.id_mandante AS idMan , t1c.name nomMan, " +
     " t1.id_cliente AS idCli , t1d.name nomCli, " +
     " t1.id_arquitecto AS idArq , t1e.name nomArq, " +
     " t1.id_revisor AS idRev , t1f.name nomRev, " +
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

  }


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
  
  // Revisión
  //console.log(proyectos[0]);
 
  res.render('proyecto/uptProyecto', {monedas,zonas, suelo,categoria, proyecto:proyectos[0], tipo, complejidad, servicio, estado, req, layout: 'template' , helpers : { if_equal : isEqualHelperHandlerbar}});

  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /editar/:id \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }
  

});

router.get('/buscarDirector/:find', isLoggedIn, async (req, res) => {

  try {

    // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const directores =  await pool.query("SELECT t1.idUsuario AS id, t1.Nombre AS value FROM sys_usuario AS t1"+
                                       " WHERE t1.Nombre LIKE '%"+nombre+"%'" +
                                       " AND t1.id_estado = 1" + 
                                       " AND (t1.idCategoria IN (25,26,28,1,42,27,41,43) OR t1.idUsuario IN (39,24) )");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(directores);

    
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscarDirector/:find \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
});

router.get('/buscarIngRev/:find', isLoggedIn, async (req, res) => {
  
  try {

    // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const directores =  await pool.query("SELECT t1.idUsuario AS id, t1.Nombre AS value FROM sys_usuario AS t1,sys_categoria AS t2"+
                                       " WHERE t1.Nombre LIKE '%"+nombre+"%'" +
                                       " AND t1.id_estado = 1" + 
                                       " AND t1.idCategoria = t2.id" +
                                       " AND t2.idCentroCosto IN (2,7,5,4)");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(directores);

    
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscarIngRev/:find \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }


});

router.get('/buscarCoord/:find', isLoggedIn, async (req, res) => {
  
  try {
  // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const directores =  await pool.query("SELECT t1.idUsuario AS id, t1.Nombre AS value FROM sys_usuario AS t1"+
                                       " WHERE t1.Nombre LIKE '%"+nombre+"%'" +
                                       " AND t1.id_estado = 1" + 
                                       " AND  t1.idUsuario IN (52)");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(directores);
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscarCoord/:find \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }



});

router.get('/buscarCoordPe/:find',isLoggedIn,  async (req, res) => {
  
  try {
    // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const directores =  await pool.query("SELECT t1.idUsuario AS id, t1.Nombre AS value FROM sys_usuario AS t1"+
                                       " WHERE t1.Nombre LIKE '%"+nombre+"%'" +
                                       " AND t1.id_estado = 1" + 
                                       " AND  t1.idUsuario IN (86 , 40 ,43 )");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(directores);


  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscarCoordPe/:find \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }

  
});

router.get('/buscarProA/:find', isLoggedIn, async (req, res) => {
  
  try {
    // BUSCAR DIRECTOR  
  const nombre = req.query.term;


  const directores =  await pool.query("SELECT t1.idUsuario AS id, t1.Nombre AS value FROM sys_usuario AS t1"+
                                       " WHERE t1.Nombre LIKE '%"+nombre+"%'" +
                                       " AND t1.id_estado = 1" + 
                                       " AND t1.idUsuario IN (39, 34) ");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(directores);
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscarProA/:find \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
  

});

router.get('/buscarProAPe/:find', isLoggedIn, async (req, res) => {
  
  try {
     // BUSCAR DIRECTOR  
  const nombre = req.query.term;


  const directores =  await pool.query("SELECT t1.idUsuario AS id, t1.Nombre AS value FROM sys_usuario AS t1"+
                                       " WHERE t1.Nombre LIKE '%"+nombre+"%'" +
                                       " AND t1.id_estado = 1" + 
                                       " AND t1.idUsuario IN ( 86 , 40 ) ");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(directores);
  } catch (error) {
    
     
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscarProAPe/:find \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
 

});

router.get('/buscarJefe/:find',isLoggedIn, async (req, res) => {
  
  try {

     // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const jefes =  await pool.query("SELECT t1.idUsuario AS id, t1.Nombre AS value FROM sys_usuario AS t1 " +
                                  " WHERE t1.Nombre LIKE '%"+nombre+"%'" +
                                  " AND t1.id_estado = 1"+
                                  " AND t1.idCategoria IN (25,26,28,1,24,22,43,41,42)");

  res.setHeader('Content-Type', 'application/json');
  res.json(jefes);
    
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscarJefe/:find \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
 

});

router.get('/buscarMandante/:find', isLoggedIn, async (req, res) => {
  
  try {
    // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const jefes =  await pool.query("SELECT t1.id AS id, t1.name AS value FROM contacto AS t1 WHERE t1.name LIKE '%"+nombre+"%'");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(jefes);

    
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscarMandante/:find \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
  

});

router.get('/buscarMandante/:find', isLoggedIn, async (req, res) => {
  
  try {
    // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const mandantes =  await pool.query("SELECT t1.id AS id, t1.name AS value FROM contacto AS t1 WHERE t1.name LIKE '%"+nombre+"%'");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(mandantes);
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscarMandante/:find \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
  

});

router.get('/buscarCliente/:find', isLoggedIn, async (req, res) => {
  
  try {

    // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const clientes =  await pool.query("SELECT t1.id AS id, t1.name AS value FROM contacto AS t1 WHERE t1.name LIKE '%"+nombre+"%'");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(clientes);

    
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscarCliente/:find \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
  

});

router.get('/buscarArquitecto/:find', isLoggedIn, async (req, res) => {
  

  try {

    // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const arquitectos =  await pool.query("SELECT t1.id AS id, t1.name AS value FROM contacto AS t1 WHERE t1.name LIKE '%"+nombre+"%'");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(arquitectos);
    
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscarArquitecto/:find \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
  

});

router.get('/buscarRevisor/:find',isLoggedIn, async (req, res) => {
  

  try {

    // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const revisores =  await pool.query("SELECT t1.id AS id, t1.name AS value FROM contacto AS t1 WHERE t1.name LIKE '%"+nombre+"%'");
  
  res.setHeader('Content-Type', 'application/json');
  res.json(revisores);

    
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscarRevisor/:find \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
  

});

router.get('/buscarJefeCoor/:find',isLoggedIn, async (req, res) => {
  

  try {

    // BUSCAR DIRECTOR  
    const nombre = req.query.term;
    const jefes =  await pool.query("SELECT t1.idUsuario AS id, t1.Nombre AS value FROM sys_usuario AS t1 " +
                                    " WHERE t1.Nombre LIKE '%"+nombre+"%'" +
                                    " AND t1.id_estado = 1"+
                                    " AND t1.idCategoria IN (41,44)");

    res.setHeader('Content-Type', 'application/json');
    res.json(jefes);

    
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscarJefeCoor/:find \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
  

});


//buscarJefeCoor

//cargarFactura
router.post('/cargarFactura',isLoggedIn,  async (req, res) => {

  try {
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

  
    let nomMoneda = "";
    switch(tipoMoneda)
    {
      case 1:
      case "1":
        nomMoneda = "Pesos";
      break;
      case 2:
      case "2":
        nomMoneda = "Dolar";
      break;
      case 4:
      case "4":
        nomMoneda = "UF";
      break;
    }


    const infoProyecto = await pool.query("SELECT * FROM pro_proyectos as t1 where t1.id =  ? ",[id_proyecto]);
    // agregar el director de proyecto.
    
    const infoDirector = await pool.query("SELECT if(COUNT(t1.idUsuario)=0,'N/A',t1.Nombre) AS  nom , t1.Email  FROM sys_usuario as t1 where t1.idUsuario =  "+[infoProyecto[0].id_director]+" ");

    const infoProyectoResulmen = await pool.query("SELECT * FROM pro_proyectos_info as t1 where t1.id_proyecto =  ? AND t1.id_cabecera = (  SELECT MAX(t2.id_cabecera) FROM pro_proyectos_info AS t2 ) ",[id_proyecto]);

    // revisar. 
    let aviso_facturado = "";
    let aviso_costo = "";
    
    if (infoProyectoResulmen.length > 0)
    {
      aviso_facturado =  parseFloat( infoProyectoResulmen[0].total_facturado,2);
      aviso_costo = parseFloat( infoProyectoResulmen[0].costo_totales,2);
    }

    const facturacion = {
      to : 'contabilidad@renelagos.com',
      comentario : comentario,
      proyecto : infoProyecto[0].year + "-" + infoProyecto[0].code + " : " + infoProyecto[0].nombre,
      solicitante : req.user.Nombre,
      mailsolicitante : infoDirector[0].Email,
      director : infoDirector[0].nom,
      nomMoneda : nomMoneda,
      monto : monto,
      mailopt1 : 'cgahona@renelagos.com',
      mailopt2 : 'mcastillo@renelagos.com',
     // facturado : parseFloat( infoProyectoResulmen[0].total_facturado,2),
     // costo : parseFloat( infoProyectoResulmen[0].costo_totales,2),
     facturado : aviso_facturado,
     costo : aviso_costo,
    };


  //  console.log(facturacion);

 // Descomentar una vez terminaada las pruebas para el ingreso de facturaciones.    
  mensajeria.EnvioMailIngresoFactura(facturacion);  // 
 

const resultFactura = await pool.query('INSERT INTO fact_facturas set ?', [newFactura]); 

  
res.redirect('/proyecto/facturar/'+id_proyecto);
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /cargarFactura \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }

  

});


// CARGAR PROYECTO 20/10/2021
//cargarProyecto
//router.post()
router.post('/cargarProyecto',isLoggedIn,  async (req, res) => {

  try {
    const { year,code, nombre,id_tipo_proyecto,id_servicio,id_Estado,valor_x_m2,valor_proyecto,superficie_pre,id_director,id_jefe,
      id_cliente,id_arquitecto,loc_lat,loc_long,direccion,id_Complejidad,id_revisor,superficie_apl,
      fecha_inicio,fecha_entrega,fecha_termino,num_pisos,num_subte,zona,suelo,categoria,num_planos_estimado,id_tipo_cobro,id_pais} = req.body;
  
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
         id_mandante: id_cliente,
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
     const infoIngresa = await pool.query('SELECT * FROM sys_usuario as t1 where t1.idUsuario = ? ', [req.user.idUsuario]);
  
     const infoProyecto = await pool.query("SELECT t1.*, t2.descripcion AS servicio "+
                                          " FROM pro_proyectos as t1 , "  +
                                          " proyecto_servicio AS t2 " +
                                          " where t1.year = ? and t1.code = ? " + 
                                          " AND t1.id_tipo_servicio = t2.id ",[year,code]);
     
     const mail = {
       nombre : infoProyecto[0].nombre,
       codigo : infoProyecto[0].year + "-" +  infoProyecto[0].code,
       to : "documentos@renelagos.com",
       ingresado : infoIngresa[0].Nombre,
       servicio : infoProyecto[0].servicio
     };
  
     const mailTI = {
      nombre : infoProyecto[0].nombre,
      codigo : infoProyecto[0].year + "-" +  infoProyecto[0].code,
      to : "computacion@renelagos.com",
      ingresado : infoIngresa[0].Nombre,
      servicio : infoProyecto[0].servicio
    };  
  
    const mailIngreso = {
      nombre : infoProyecto[0].nombre,
      codigo : infoProyecto[0].year + "-" +  infoProyecto[0].code,
      to : infoIngresa[0].Email,
      servicio : infoProyecto[0].servicio
    };
   
  if (infoProyecto[0].id_jefe != 0)  
  {
    // Preguntar las personas que tiene a cargo este jefe de proyecto.
    // sys_usuario_equipo
    let equipoJefe = await pool.query('SELECT * FROM sys_usuario_equipo as t1 where t1.id_lider_equipo = ? ', [infoProyecto[0].id_jefe]);

      equipoJefe.forEach( async(element)=>{

      let equipoProyecto = {
        id_usuario : element.id_colaborador,
        id_proyecto : infoProyecto[0].id
      }
      
      let registroProyecto = await pool.query('INSERT INTO pro_equipo set ?', [equipoProyecto]);

    });
    
  }
  
  mensajeria.EnvioMailCreacionProyectoDocumentos(mail);
  mensajeria.EnvioMailCreacionProyectoTI(mailTI);
  mensajeria.EnvioMailCreacion(mailIngreso);
  
   res.redirect(   url.format({
      pathname:"../proyecto/listado",
      query: {
         "a": 1
       }
    }));

  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /cargarProyecto \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

  
  

});


router.post('/ActualizarProyecto',isLoggedIn, async (req, res) => {

  try {
    const { year,code, nombre,id_tipo_proyecto,id_servicio,id_Estado,valor_x_m2,valor_proyecto,superficie_pre,id_director,id_jefe,
      id_cliente,id_arquitecto,loc_lat,loc_long,direccion,id_Complejidad,id_revisor,superficie_apl,
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
       //id_mandante: id_mandante,
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
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /ActualizarProyecto \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

 

});

router.post('/buscarPais', isLoggedIn, async (req, res) => {

  try {
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
         
          res.send(respuesta);
          }

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscarPais \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
});

router.get('/equipo/:id', isLoggedIn, async (req, res) => {

  try {
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
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /equipo/:id \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
  

});

router.get('/equipo/delete/:id', isLoggedIn, async (req, res) => {

  try {
    
    const { id } = req.params;


  const informacion = await pool.query("SELECT * FROM pro_equipo AS t1 WHERE t1.id = "+id+"");
  
  await pool.query('DELETE FROM pro_equipo WHERE id = ?', [id]);

  res.redirect(   url.format({
    pathname:'/proyecto/equipo/'+informacion[0].id_proyecto,
    query: {
       "a": 1
     }
  }));

  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /equipo/delete/:id \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }
});

router.get('/equipo/add/:idUsuario/:id',isLoggedIn,  async (req, res) => {

  try {
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
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /equipo/add/:idUsuario/:id \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }
  
});

router.post('/buscarCodigo', isLoggedIn, async (req, res) => {


  try {

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
     
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /buscarCodigo \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }
});

// Buscador de preyectos. 
router.get('/buscadorPr', isLoggedIn, async (req, res) => {

  try {
    
      // buiscar la informacion de todos los jefes de proyectos y directores.

  const jefes = await pool.query("SELECT " +
                                  " t2.idUsuario, " +
                                  " t2.Nombre  " +
                                  " FROM  " +
                                      " pro_proyectos AS t1, " +
                                      " sys_usuario AS t2 " +
                                  " WHERE  " +
                                      " t1.id_jefe = t2.idUsuario "  +
                                      " GROUP BY t1.id_jefe " +
                                      " ORDER BY t2.Nombre ASC"); 

  const directores = await pool.query("SELECT " +
                                      " t2.idUsuario, " +
                                      " t2.Nombre  " +
                                      " FROM  " +
                                          " pro_proyectos AS t1, " +
                                          " sys_usuario AS t2 " +
                                      " WHERE  " +
                                          " t1.id_director = t2.idUsuario "  +
                                          " GROUP BY t1.id_director " +
                                          " ORDER BY t2.Nombre ASC"); 

  const tipos_proyecto = await pool.query("SELECT * FROM proyecto_tipo");

  const zonas = await pool.query("SELECT * FROM pro_proyectos GROUP BY zona");
  const suelos = await pool.query("SELECT * FROM pro_proyectos GROUP BY suelo");
  const categorias = await pool.query("SELECT * FROM pro_proyectos GROUP BY categoria");

  const isEqualHelperHandlerbar = function(a, b, opts) {
    if (a == b) {
        return true
    } else { 
        return false
    } 
};

res.render('proyecto/buscadorProyecto', { jefes , directores ,tipos_proyecto ,zonas,suelos, categorias,req,  layout: 'template', helpers : { if_equal : isEqualHelperHandlerbar} });

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /cargarProyecto \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }


});

router.post('/filtroProyecto', isLoggedIn, async (req, res) => {

  try {
    
    const {nombre,codigo,director,jefe,tipo_proyecto,id_cliente,id_arquitecto,numpisos,numsubte,zona,suelo,categoria} = req.body;


  let consulta  =  "SELECT t1.*, t2.nombre AS nomJefe ,t3.Nombre AS nomDir , t4.name AS nomCli"+
                   "  , t5.descripcion AS servicio, t6.descripcion AS tipo FROM pro_proyectos as t1 " +
                  "  LEFT JOIN proyecto_servicio AS t5 ON t1.id_tipo_servicio = t5.id " +
                   " LEFT JOIN proyecto_tipo AS t6 ON t1.id_tipo_proyecto = t6.id  " +
                  " LEFT JOIN sys_usuario AS t2 ON t1.id_jefe = t2.idUsuario LEFT JOIN sys_usuario AS t3 ON t1.id_director = t3.idUsuario"+
                  " LEFT JOIN contacto AS t4 ON t1.id_cliente = t4.id  WHERE 1 = 1";

  if ( nombre != '')
  {
    consulta += " AND t1.nombre like '%"+nombre+"%'";
  }
  if (codigo != '')
  {
    consulta += " AND CONCAT(t1.year,'-',t1.code) LIKE '%"+codigo+"%'"
  }

  if (director != '0')
  {
    consulta += " AND t1.id_director = "+director+"";
  }

  if (jefe != '0')
  {
    consulta += " AND t1.id_jefe = "+jefe+"";
  }

  if (tipo_proyecto != '0')
  {
    consulta += " AND t1.id_tipo_proyecto = "+tipo_proyecto+"";
  }

  if (id_cliente != '0')
  {
    consulta += " AND t1.id_cliente = "+id_cliente+"";
  }

  if (id_arquitecto != '0')
  {
    consulta += " AND t1.id_arquitecto = "+id_arquitecto+"";
  }

  if (numpisos != '')
  {
    consulta += " AND t1.num_pisos = "+numpisos+"";
  }

  if (numsubte != '')
  {
    consulta += " AND t1.num_subterraneo = "+numsubte+"";
  }

  if (zona != '0')
  {
    consulta += " AND t1.zona = '"+zona+"'";
  }

  if (suelo != '0')
  {
    consulta += " AND t1.suelo = '"+suelo+"'";
  }

  if (categoria != '0')
  {
    consulta += " AND t1.categoria = '"+categoria+"'";
  }


  const jefes = await pool.query("SELECT " +
                                  " t2.idUsuario, " +
                                  " t2.Nombre  " +
                                  " FROM  " +
                                      " pro_proyectos AS t1, " +
                                      " sys_usuario AS t2 " +
                                  " WHERE  " +
                                      " t1.id_jefe = t2.idUsuario "  +
                                      " GROUP BY t1.id_jefe " +
                                      " ORDER BY t2.Nombre ASC"); 

  const directores = await pool.query("SELECT " +
                                      " t2.idUsuario, " +
                                      " t2.Nombre  " +
                                      " FROM  " +
                                          " pro_proyectos AS t1, " +
                                          " sys_usuario AS t2 " +
                                      " WHERE  " +
                                          " t1.id_director = t2.idUsuario "  +
                                          " GROUP BY t1.id_director " +
                                          " ORDER BY t2.Nombre ASC"); 

  const tipos_proyecto = await pool.query("SELECT * FROM proyecto_tipo");


  const proyectos =  await pool.query(consulta);

  const zonas = await pool.query("SELECT * FROM pro_proyectos GROUP BY zona");
  const suelos = await pool.query("SELECT * FROM pro_proyectos GROUP BY suelo");
  const categorias = await pool.query("SELECT * FROM pro_proyectos GROUP BY categoria");


  const isEqualHelperHandlerbar = function(a, b, opts) {
    if (a == b) {
        return true
    } else { 
        return false
    } 
};

  if (proyectos.length === 0)
  {
    const verToask = {
      titulo : "Mensaje",
      body   : "No se encontraron proyectos con los filtros ingresados.",
      tipo   : "Editar"
          };
    res.render('proyecto/buscadorProyecto', { parametros :req.body, jefes , verToask, directores ,proyectos ,tipos_proyecto,zonas,suelos, categorias, req,  layout: 'template', helpers : { if_equal : isEqualHelperHandlerbar} });
  }
  else
  {
    res.render('proyecto/buscadorProyecto', { parametros :req.body, jefes , directores ,proyectos ,tipos_proyecto,zonas,suelos, categorias, req,  layout: 'template', helpers : { if_equal : isEqualHelperHandlerbar} });
  }
  


  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /filtroProyecto \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
});


router.post('/validoFactura', isLoggedIn, async (req, res) => {

  try {
    
    //tipo_servicio: '1',
    //tipo_cobro: '1',
    //proyecto: '2562'
  const {tipo_servicio,tipo_cobro,proyecto} =  req.body;
  
  const infoProyecto = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ?",[proyecto]);
  
  const {id_tipo_proyecto,id_estado,superficie_pre,id_complejidad,num_pisos,num_subterraneo,id_pais,nombre} = infoProyecto[0]; // DATOS GENERALES
  const {id_tipo_moneda,valor_metro_cuadrado,valor_proyecto,fecha_inicio} = infoProyecto[0]; // DATOS FINACIEROS
  const {id_director,id_jefe,id_cliente,id_arquitecto} = infoProyecto[0]; // DATOS EQUIPO
  const {id_revisor,fecha_entrega,fecha_termino,superficie_apl,zona,suelo,categoria,num_plano_estimado} = infoProyecto[0]; // Informacion APL

  let verificacion = new Object();
  let error = false;
  let datos = "<ul>";

  switch(tipo_servicio)
  {
    // Revisión
    case 2:
    case "2":
      switch(tipo_cobro)
      {
        case 1:
        case "1":
        case 8:
        case "8":  
        if (id_tipo_proyecto == 0 || id_tipo_proyecto == ""){verificacion.TipoProyecto = id_tipo_proyecto;}
        if (id_estado == 0 || id_estado == ""){verificacion.Estado = id_estado;}
        if (superficie_pre == 0 || superficie_pre == ""){verificacion.SuperficiePre = superficie_pre;}
        if (id_complejidad == 0 || id_complejidad == ""){verificacion.Complejidad = id_complejidad;}
        if (num_pisos == 0 || num_pisos == ""){verificacion.NumPisos = num_pisos;}
        if (num_subterraneo == ""){verificacion.NumSubte = num_subterraneo;}

        if (id_tipo_moneda == 0 || id_tipo_moneda == ""){verificacion.TipoMoneda = id_tipo_moneda;}
        if (valor_metro_cuadrado == 0 || valor_metro_cuadrado == ""){verificacion.ValorMetroCuadrado = valor_metro_cuadrado;}
        if (valor_proyecto == 0 || valor_proyecto == ""){verificacion.ValorProyecto = valor_proyecto;}
        if (fecha_inicio == 0 || fecha_inicio == ""){verificacion.FechaInicio = fecha_inicio;}
        break;
        
        case 9:
        case "9":
          if (id_tipo_proyecto == 0 || id_tipo_proyecto == ""){verificacion.TipoProyecto = id_tipo_proyecto;}
          if (id_estado == 0 || id_estado == ""){verificacion.Estado = id_estado;}
          if (superficie_pre == 0 || superficie_pre == ""){verificacion.SuperficiePre = superficie_pre;}
          if (id_complejidad == 0 || id_complejidad == ""){verificacion.Complejidad = id_complejidad;}
          if (num_pisos == 0 || num_pisos == ""){verificacion.NumPisos = num_pisos;}
          if (num_subterraneo == ""){verificacion.NumSubte = num_subterraneo;}
  
          if (id_tipo_moneda == 0 || id_tipo_moneda == ""){verificacion.TipoMoneda = id_tipo_moneda;}
          if (valor_metro_cuadrado == 0 || valor_metro_cuadrado == ""){verificacion.ValorMetroCuadrado = valor_metro_cuadrado;}
          if (valor_proyecto == 0 || valor_proyecto == ""){verificacion.ValorProyecto = valor_proyecto;}
          if (fecha_inicio == 0 || fecha_inicio == ""){verificacion.FechaInicio = fecha_inicio;}
          
          if (id_director == 0 || id_director == ""){verificacion.Responsable = id_director;}
          if (id_jefe == 0 || id_jefe == ""){verificacion.Coordinador = id_jefe;}
          if (id_cliente == 0 || id_cliente == ""){verificacion.IngRevisor = id_cliente;}
          if (id_arquitecto == 0 || id_arquitecto == ""){verificacion.Calculista = id_arquitecto;}
        break;
        case 10:
        case "10":
          if (id_tipo_proyecto == 0 || id_tipo_proyecto == ""){verificacion.TipoProyecto = id_tipo_proyecto;}
          if (id_estado == 0 || id_estado == ""){verificacion.Estado = id_estado;}
          if (superficie_pre == 0 || superficie_pre == ""){verificacion.SuperficiePre = superficie_pre;}
          if (id_complejidad == 0 || id_complejidad == ""){verificacion.Complejidad = id_complejidad;}
          if (num_pisos == 0 || num_pisos == ""){verificacion.NumPisos = num_pisos;}
          if (num_subterraneo == ""){verificacion.NumSubte = num_subterraneo;}
  
          if (id_tipo_moneda == 0 || id_tipo_moneda == ""){verificacion.TipoMoneda = id_tipo_moneda;}
          if (valor_metro_cuadrado == 0 || valor_metro_cuadrado == ""){verificacion.ValorMetroCuadrado = valor_metro_cuadrado;}
          if (valor_proyecto == 0 || valor_proyecto == ""){verificacion.ValorProyecto = valor_proyecto;}
          if (fecha_inicio == 0 || fecha_inicio == ""){verificacion.FechaInicio = fecha_inicio;}
          
          if (id_director == 0 || id_director == ""){verificacion.Responsable = id_director;}
          if (id_jefe == 0 || id_jefe == ""){verificacion.Coordinador = id_jefe;}
          if (id_cliente == 0 || id_cliente == ""){verificacion.IngRevisor = id_cliente;}
          if (id_arquitecto == 0 || id_arquitecto == ""){verificacion.Calculista = id_arquitecto;}

          if (fecha_entrega == 0 || fecha_entrega == ""){verificacion.FechaEntrega = fecha_entrega;}
          if (zona == 0 || zona == ""){verificacion.Zona = zona;}
          if (suelo == 0 || suelo == ""){verificacion.Suelo = suelo;}
          if (categoria == 0 || categoria == ""){verificacion.Categoria = categoria;}
        break;
      }
    break;

    case 3:
      switch(tipo_cobro)
      {
        case 1:
          case "1":
          case 2:
          case "2":        
          if (id_tipo_proyecto == 0 || id_tipo_proyecto == ""){verificacion.TipoProyecto = id_tipo_proyecto;}
          if (id_estado == 0 || id_estado == ""){verificacion.Estado = id_estado;}
          if (superficie_pre == 0 || superficie_pre == ""){verificacion.SuperficiePre = superficie_pre;}
          //if (id_complejidad == 0 || id_complejidad == ""){verificacion.Complejidad = id_complejidad;}
          //if (num_pisos == ""){verificacion.NumPisos = num_pisos;}
          //if (num_subterraneo == ""){verificacion.NumSubte = num_subterraneo;}
  
          if (id_tipo_moneda == 0 || id_tipo_moneda == ""){verificacion.TipoMoneda = id_tipo_moneda;}
          if (valor_metro_cuadrado == 0 || valor_metro_cuadrado == ""){verificacion.ValorMetroCuadrado = valor_metro_cuadrado;}
          if (valor_proyecto == 0 || valor_proyecto == ""){verificacion.ValorProyecto = valor_proyecto;}
          if (fecha_inicio == 0 || fecha_inicio == ""){verificacion.FechaInicio = fecha_inicio;}
  
          if (id_director == 0 || id_director == ""){verificacion.Director = id_director;}
          if (id_jefe == 0 || id_jefe == ""){verificacion.Jefe = id_jefe;}
          if (id_cliente == 0 || id_cliente == ""){verificacion.Cliente = id_cliente;}
          if (id_arquitecto == 0 || id_arquitecto == ""){verificacion.Arquitecto = id_arquitecto;}
          break;
          case 3:
          case "3":
          case 4:
          case "4":   
          case 5:
          case "5":
          case 6:
          case "6":
            if (id_tipo_proyecto == 0 || id_tipo_proyecto == ""){verificacion.TipoProyecto = id_tipo_proyecto;}
            if (id_estado == 0 || id_estado == ""){verificacion.Estado = id_estado;}
            if (superficie_pre == 0 || superficie_pre == ""){verificacion.SuperficiePre = superficie_pre;}
            //if (id_complejidad == 0 || id_complejidad == ""){verificacion.Complejidad = id_complejidad;}
            //if (num_pisos == 0 || num_pisos == ""){verificacion.NumPisos = num_pisos;}
            //if (num_subterraneo == ""){verificacion.NumSubte = num_subterraneo;}
    
            if (id_tipo_moneda == 0 || id_tipo_moneda == ""){verificacion.TipoMoneda = id_tipo_moneda;}
            if (valor_metro_cuadrado == 0 || valor_metro_cuadrado == ""){verificacion.ValorMetroCuadrado = valor_metro_cuadrado;}
            if (valor_proyecto == 0 || valor_proyecto == ""){verificacion.ValorProyecto = valor_proyecto;}
            if (fecha_inicio == 0 || fecha_inicio == ""){verificacion.FechaInicio = fecha_inicio;}
    
            if (id_director == 0 || id_director == ""){verificacion.Director = id_director;}
            if (id_jefe == 0 || id_jefe == ""){verificacion.Jefe = id_jefe;}
            if (id_cliente == 0 || id_cliente == ""){verificacion.Cliente = id_cliente;}
            if (id_arquitecto == 0 || id_arquitecto == ""){verificacion.Arquitecto = id_arquitecto;}
  
            //if (id_revisor == 0 || id_revisor == ""){verificacion.Revisor = id_revisor;}
            if (fecha_entrega == 0 || fecha_entrega == ""){verificacion.FechaAPC = fecha_entrega;}
            if (fecha_termino == 0 || fecha_termino == ""){verificacion.FechaAPL = fecha_termino;}
            if (superficie_apl == 0 || superficie_apl == ""){verificacion.SuperficieAPL = superficie_apl;}
            //if (zona == 0 || zona == ""){verificacion.Zona = zona;}
            //if (suelo == 0 || suelo == ""){verificacion.Suelo = suelo;}
            //if (categoria == 0 || categoria == ""){verificacion.Categoria = categoria;}
            //if (num_plano_estimado == 0 || num_plano_estimado == ""){verificacion.PlanoEstimado = num_plano_estimado;}
  
          break;   
         case 7:
         case "7":
          if (id_pais == 0 || id_pais == ""){verificacion.Pais = id_pais;}
          if (nombre == 0 || nombre == ""){verificacion.Nombre = nombre;}
         break;

         case 11:
         case "11":
         break;
         case 12:
         case "12":
         break;
         case 13:
         case "13":
         break;
         case 14:
         case "14":
         break;
      }
    break;
    default:
      // tipo_cobro
      switch(tipo_cobro)
      {
        case 1:
        case "1":
        case 2:
        case "2":        
        if (id_tipo_proyecto == 0 || id_tipo_proyecto == ""){verificacion.TipoProyecto = id_tipo_proyecto;}
        if (id_estado == 0 || id_estado == ""){verificacion.Estado = id_estado;}
        if (superficie_pre == 0 || superficie_pre == ""){verificacion.SuperficiePre = superficie_pre;}
        if (id_complejidad == 0 || id_complejidad == ""){verificacion.Complejidad = id_complejidad;}
        if (num_pisos == 0 || num_pisos == ""){verificacion.NumPisos = num_pisos;}
        if (num_subterraneo == ""){verificacion.NumSubte = num_subterraneo;}

        if (id_tipo_moneda == 0 || id_tipo_moneda == ""){verificacion.TipoMoneda = id_tipo_moneda;}
        if (valor_metro_cuadrado == 0 || valor_metro_cuadrado == ""){verificacion.ValorMetroCuadrado = valor_metro_cuadrado;}
        if (valor_proyecto == 0 || valor_proyecto == ""){verificacion.ValorProyecto = valor_proyecto;}
        if (fecha_inicio == 0 || fecha_inicio == ""){verificacion.FechaInicio = fecha_inicio;}

        if (id_director == 0 || id_director == ""){verificacion.Director = id_director;}
        if (id_jefe == 0 || id_jefe == ""){verificacion.Jefe = id_jefe;}
        if (id_cliente == 0 || id_cliente == ""){verificacion.Cliente = id_cliente;}
        if (id_arquitecto == 0 || id_arquitecto == ""){verificacion.Arquitecto = id_arquitecto;}
        break;
        case 3:
        case "3":
        case 4:
        case "4":   
        case 5:
        case "5":
        case 6:
        case "6":
          if (id_tipo_proyecto == 0 || id_tipo_proyecto == ""){verificacion.TipoProyecto = id_tipo_proyecto;}
          if (id_estado == 0 || id_estado == ""){verificacion.Estado = id_estado;}
          if (superficie_pre == 0 || superficie_pre == ""){verificacion.SuperficiePre = superficie_pre;}
          if (id_complejidad == 0 || id_complejidad == ""){verificacion.Complejidad = id_complejidad;}
          if (num_pisos == 0 || num_pisos == ""){verificacion.NumPisos = num_pisos;}
          if (num_subterraneo == ""){verificacion.NumSubte = num_subterraneo;}
  
          if (id_tipo_moneda == 0 || id_tipo_moneda == ""){verificacion.TipoMoneda = id_tipo_moneda;}
          if (valor_metro_cuadrado == 0 || valor_metro_cuadrado == ""){verificacion.ValorMetroCuadrado = valor_metro_cuadrado;}
          if (valor_proyecto == 0 || valor_proyecto == ""){verificacion.ValorProyecto = valor_proyecto;}
          if (fecha_inicio == 0 || fecha_inicio == ""){verificacion.FechaInicio = fecha_inicio;}
  
          if (id_director == 0 || id_director == ""){verificacion.Director = id_director;}
          if (id_jefe == 0 || id_jefe == ""){verificacion.Jefe = id_jefe;}
          if (id_cliente == 0 || id_cliente == ""){verificacion.Cliente = id_cliente;}
          if (id_arquitecto == 0 || id_arquitecto == ""){verificacion.Arquitecto = id_arquitecto;}

          if (id_revisor == 0 || id_revisor == ""){verificacion.Revisor = id_revisor;}
          if (fecha_entrega == 0 || fecha_entrega == ""){verificacion.FechaAPC = fecha_entrega;}
          if (fecha_termino == 0 || fecha_termino == ""){verificacion.FechaAPL = fecha_termino;}
          if (superficie_apl == 0 || superficie_apl == ""){verificacion.SuperficieAPL = superficie_apl;}
          if (zona == 0 || zona == ""){verificacion.Zona = zona;}
          if (suelo == 0 || suelo == ""){verificacion.Suelo = suelo;}
          if (categoria == 0 || categoria == ""){verificacion.Categoria = categoria;}
          if (num_plano_estimado == 0 || num_plano_estimado == ""){verificacion.PlanoEstimado = num_plano_estimado;}

        break;   
       case 7:
       case "7":
        if (id_pais == 0 || id_pais == ""){verificacion.Pais = id_pais;}
        if (nombre == 0 || nombre == ""){verificacion.Nombre = nombre;}
       break;
      }
	  break;
	  }

    Object.entries(verificacion).forEach( function(elemento, indice, array){
      error = true;
      switch(array[indice][0])
      {
        case "TipoProyecto":
          datos +=" <li>Tipo Proyecto </li>";
        break;
        case "Estado":
          datos +=" <li>Estado </li>";
        break;
        case "Complejidad":
          datos +=" <li>Complejidad </li>";
        break;
        case "SuperficiePre":
          datos +=" <li>Superficie Preliminar </li>";
        break;
        case "NumPisos":
          datos +="<li> Nº Pisos</li>";
        break;
        case "NumSubte":
          datos +="<li> Nº Subterraneo</li>";
        break;
        case "TipoMoneda":
          datos +=" <li>Tipo Moneda</li>";
        break;
        case "ValorMetroCuadrado":
          datos +=" <li>Valor Metro Cuadrado</li>";
        break;
        case "ValorProyecto":
          datos +="<li> Valor Proyecto</li>";
        break;
        case "FechaInicio":
          datos +="<li> Fecha Inicio</li>";
        break;
        case "Director":
          datos +=" <li>Director Proyecto</li>";
        break;
        case "Jefe":
          datos +="<li> Jefe Proyecto</li>";
        break;
        case "Cliente":
          datos +="<li> Cliente</li>";
        break;
        case "Arquitecto":
          datos +="<li> Arquitecto</li>";
        break;
        case "Revisor":
          datos +="<li> Revisor</li>";
        break;
        case "FechaAPC":
          datos +="<li> Fecha APC</li>";
        break;
        case "FechaAPL":
          datos +="<li> Fecha APL</li>";
        break;
        case "SuperficieAPL":
          datos +="<li> Superficie APL</li>";
        break;
        case "Zona":
          datos +="<li>Zona</li>";
        break;
        case "Suelo":
          datos +="<li>Suelo</li>";
        break;
        case "Categoria":
          datos +="<li>Categoria</li>";
        break;
        case "PlanoEstimado":
          datos +="<li>Nº Planos Estimado</li>";
        break;
        case "Responsable":
          datos +="<li>Profesional Responsable</li>";
        break;
        case "Coordinador":
          datos +="<li>Coordinador</li>";
        break;
        case "IngRevisor":
          datos +="<li>Ingeniero Revisor</li>";
        break;
        case "Calculista":
          datos +="<li>Calculista</li>";
        break;
        case "FechaEntrega":
          datos +="<li>Fecha Entrega</li>";
          break;
      }
    });
      

    // colocar los nombres correctos. 
      
    datos += "</ul>";
    if (error)
    {
      verificacion.data = datos;
    }

    res.send(verificacion);
    
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /validoFactura \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }

  
    
  });


  // Buscador de preyectos. 
router.get('/ver/:id', isLoggedIn, async (req, res) => {

  try {
    
      // buiscar la informacion de todos los jefes de proyectos y directores.
      const { id } = req.params;

      const pre =  await pool.query("SELECT * from pro_proyectos AS t1 WHERE t1.id = ? ", [id]);
      let proyectos;
      if (pre[0].id_tipo_servicio == 2)
      {
        
        proyectos = await pool.query("SELECT *, t1.id as idPro,t1.year, t1.code, t1.nombre as nomPro,t1.direccion as direccionPro,t1.num_pisos, t1.num_subterraneo," +
        " t1s.descripcion AS tipoServicio, " +
        " t1pr.descripcion AS tipoProyecto, " +
        " t1es.descripcion AS estadoProyecto, " + 
        " t1.id_director AS idDir, " +
         " t1a.Nombre AS nomDir, " +
         " t1.id_pais AS id_pais, " +
         " t1.zona AS zona, " +
         " t1.id_estado as id_estado,"+
         " t1.suelo AS suelo, " +
         " t1.categoria AS categoria, " +
         " t1.id_jefe AS idJefe, t1b.Nombre AS nomJefe, " +
         " t1.id_mandante AS idMan , t1c.name nomMan, " +
         " t1.id_cliente AS idCli , t1d.Nombre as  nomCli, " +
         " t1.id_arquitecto AS idArq , t1e.name nomArq, " +
         " t1.id_revisor AS idRev , t1f.name nomRev, " +
         " t1p.simbolo AS simbolo," +
         " CONCAT(t1p.simbolo,' /', 'm <sup> 2</sup>')  AS sm2" +
         " FROM pro_proyectos AS t1 " +
         " LEFT JOIN proyecto_servicio AS t1s ON t1.id_tipo_servicio = t1s.id " +
         " LEFT JOIN proyecto_tipo AS t1pr ON t1.id_tipo_proyecto = t1pr.id " + 
         " LEFT JOIN proyecto_estado AS t1es ON t1.id_estado = t1es.id " +
         " LEFT JOIN sys_usuario AS t1a ON t1.id_director = t1a.idUsuario " +
         " LEFT JOIN sys_usuario AS t1b ON t1.id_jefe = t1b.idUsuario " +
         " LEFT JOIN contacto AS t1c ON t1.id_mandante = t1c.id " +
         " LEFT JOIN sys_usuario AS t1d ON t1.id_cliente = t1d.idUsuario " +
         " LEFT JOIN contacto AS t1e ON t1.id_arquitecto = t1e.id " +
         " LEFT JOIN contacto AS t1f ON t1.id_revisor = t1f.id " +
         " LEFT JOIN moneda_tipo AS t1p ON t1.id_tipo_moneda = t1p.id_moneda " +
         " WHERE t1.id = ?",[id]);
      }
      else
      {
        proyectos = await pool.query("SELECT t1.id as idPro,t1.year, t1.code,t1.nombre as nomPro,t1.direccion as direccionPro,  t1.num_pisos, t1.num_subterraneo," +
        " t1.id_director AS idDir, " +
         " t1a.Nombre AS nomDir, " +
         " t1.id_pais AS id_pais, " +
         " t1.zona AS zona, " +
         " t1.id_estado as id_estado,"+
         " t1.suelo AS suelo, " +
         " t1.categoria AS categoria, " + 
         " t1s.descripcion AS tipoServicio, " +
         " t1pr.descripcion AS tipoProyecto, " +
         " t1es.descripcion AS estadoProyecto, " + 
         " t1mo.descripcion AS moneda, " +
         " t1.id_jefe AS idJefe, t1b.Nombre AS nomJefe, " +
         " t1.id_mandante AS idMan , t1c.name nomMan, " +
         " t1.id_cliente AS idCli , t1d.name nomCli, " +
         " t1.id_arquitecto AS idArq , t1e.name nomArq, " +
         " t1.id_revisor AS idRev , t1f.name nomRev, " +
         " t1p.simbolo AS simbolo," +
         " CONCAT(t1p.simbolo,' /', 'm <sup> 2</sup>')  AS sm2" +
         " FROM pro_proyectos AS t1 " +
         " LEFT JOIN proyecto_servicio AS t1s ON t1.id_tipo_servicio = t1s.id " +
         " LEFT JOIN proyecto_tipo AS t1pr ON t1.id_tipo_proyecto = t1pr.id " + 
         " LEFT JOIN proyecto_estado AS t1es ON t1.id_estado = t1es.id " +
         " LEFT JOIN moneda_tipo AS t1mo ON t1.id_tipo_moneda = t1mo.id_moneda " +
         " LEFT JOIN sys_usuario AS t1a ON t1.id_director = t1a.idUsuario " +
         " LEFT JOIN sys_usuario AS t1b ON t1.id_jefe = t1b.idUsuario " +
         " LEFT JOIN contacto AS t1c ON t1.id_mandante = t1c.id " +
         " LEFT JOIN contacto AS t1d ON t1.id_cliente = t1d.id " +
         " LEFT JOIN contacto AS t1e ON t1.id_arquitecto = t1e.id " +
         " LEFT JOIN contacto AS t1f ON t1.id_revisor = t1f.id " +
         " LEFT JOIN moneda_tipo AS t1p ON t1.id_tipo_moneda = t1p.id_moneda " +
         " WHERE t1.id = ?",[id]);
    
      }
      
     // console.log(proyectos[0]);


      res.render('proyecto/ver', { req, proyectos:proyectos[0], layout: 'template' });

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : proyecto.js \n Error en el directorio: /cargarProyecto \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }


});

module.exports = router;