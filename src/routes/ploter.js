const express = require('express');
const router = express.Router();
const nodemailer = require("nodemailer");
var util = require('util');
var dateFormat = require('dateformat');

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

var url = require('url');

const mensajeria = require('../mensajeria/mail');


router.get('/ploteo', isLoggedIn, async (req, res) => {
 
    try {
        const ploteos_pendiente  =  await pool.query("SELECT t.*, t2.nombre AS nomPro,t3.Nombre AS nomIngr, t4.Nombre AS nomDes" +
                                                "  FROM sol_ploteo as t  "+
                                                " LEFT JOIN sys_usuario AS t4 ON t.id_destinatario = t4.idUsuario, "+
                                                " pro_proyectos AS t2 , sys_usuario AS t3" +
                                                " where t.id_estado = 1 AND t.id_proyecto = t2.id AND t.id_ingreso = t3.idUsuario");  

    const ploteos_proceso  =  await pool.query("SELECT t.*, t2.nombre AS nomPro,t3.Nombre AS nomIngr, t4.Nombre AS nomDes" +
                                                "  FROM sol_ploteo as t "+
                                                " LEFT JOIN sys_usuario AS t4 ON t.id_destinatario = t4.idUsuario," +
                                                " pro_proyectos AS t2 , sys_usuario AS t3" +
                                                " where t.id_estado = 2 AND t.id_proyecto = t2.id AND t.id_ingreso = t3.idUsuario ");
    
    
    const ploteos_terminados  =  await pool.query("SELECT t.*, t2.nombre AS nomPro,t3.Nombre AS nomIngr, t4.Nombre AS nomDes" +
                                                "  FROM sol_ploteo as t "+
                                                " LEFT JOIN sys_usuario AS t4 ON t.id_destinatario = t4.idUsuario," +
                                                " pro_proyectos AS t2 , sys_usuario AS t3" +
                                                " where t.id_estado = 3 AND t.id_proyecto = t2.id AND t.id_ingreso = t3.idUsuario ");
                                                                                            

    //console.log(req.user.idCategoria);

    var esDocumento = false;

    switch(req.user.idCategoria)
    {
        case 16:
        case 1: // solo pruebas
            esDocumento = true;
        break;   
    }
   // console.log(esDocumento);

    var mensaje = -1;
  
    if (req.query.a !== undefined)
    {
        mensaje = req.query.a;
    }

    if (mensaje !== -1)
    { 
       
        var verToask = {};
                switch(req.query.a)
                {
                    case 1: // CREAR
                    case "1":
                        verToask= {
                        titulo : "Mensaje",
                        body   : "Solicitud ingresada correctamente.",
                        tipo   : "Crear"
                            };
                    if (esDocumento === true)             
                    {
                        console.log("asdad");
                        res.render('ploter/ingresar', {documento:'ok', verToask, ploteos_pendiente, ploteos_proceso ,ploteos_terminados, req ,layout: 'template'});
                    }
                    else
                    {
                        res.render('ploter/ingresar', {verToask, ploteos_pendiente, ploteos_proceso ,ploteos_terminados, req ,layout: 'template'});
                    }
                    
                    break;
                    case 2: // Asignado
                    case "2":
                        verToask = {
                        titulo : "Mensaje",
                        body   : "Solicitud cambio de estado correctamente",
                        tipo   : "Editar"
                            };
                            if (esDocumento === true)              
                            {
                                res.render('ploter/ingresar', {documento:'ok',verToask, ploteos_pendiente, ploteos_proceso ,ploteos_terminados, req ,layout: 'template'});
                            }
                            else
                            {
                                res.render('ploter/ingresar', {verToask, ploteos_pendiente, ploteos_proceso ,ploteos_terminados, req ,layout: 'template'});
                            }
                    
                    break;
                }

    }
    else
    {
        if (esDocumento === true)
        {
            res.render('ploter/ingresar', { documento:'ok',ploteos_pendiente, ploteos_proceso ,ploteos_terminados, req ,layout: 'template'});
        }
        else
        {
            res.render('ploter/ingresar', { ploteos_pendiente, ploteos_proceso ,ploteos_terminados, req ,layout: 'template'});
        }
        
    }

    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : ploter.js \n Error en el directorio: /ploteo \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  


    }

    
    
}); 

router.post('/addSolicitud', isLoggedIn, async (req, res) => {

                 
    try {
          // 15/11 Nuevo objeto
    //req.user.id
    const {idProyecto,idDestinatario,trabajo,impresion,series,ruta,otroarch,comentarios,escalas,ncopias,ncopiasCD,formapapel,formatoEntrega,fecheHora} = req.body; 
    var trabajosBD = "";
    var impresionBD = "";
    var seriesBD = "";

    //console.log(req.body);


    if (typeof trabajo !== 'undefined') 
    {
        if (typeof trabajo === 'string'){ trabajosBD = trabajo;}
        else
        {
            for (var i=0; i<trabajo.length; i++) 
            { if ( (i + 1) === trabajo.length) {trabajosBD = trabajosBD + trabajo[i];} else {trabajosBD = trabajosBD + trabajo[i]+ " + ";} }
        }
    }
    if (typeof impresion !== 'undefined') 
    {
        if (typeof impresion === 'string'){ impresionBD = impresion;}
        else
        {
            for (var i=0; i<impresion.length; i++) 
            { if ( (i + 1) === impresion.length) {impresionBD = impresionBD + impresion[i];} else {impresionBD = impresionBD + impresion[i]+ " + ";}  }
        }
    }
    

    if (typeof series !== 'undefined') 
    {
        if (typeof series === 'string'){ seriesBD = series;}
        else
        {
            for (var i=0; i<series.length; i++) 
            { if ( (i + 1) === series.length) {seriesBD = seriesBD + series[i];} else {seriesBD = seriesBD + series[i]+ " + ";}  }
        }
    }
    //______________________________________________
    
   // console.log(req.user.isLoggedIn);
   //dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");
   var fechaActual = dateFormat(new Date(), "dd-mm-yyyy HH:MM");
      
   const solicitud = {
        id_proyecto : idProyecto,
        id_ingreso : req.user.idUsuario,
        id_destinatario : idDestinatario,
        id_estado : 1,
        trabajo : trabajosBD,
        impresion : impresionBD,
        ruta : ruta, // es cuando se tiene que entregar el trabajo,
        fecha_entrega : fecheHora,
        fecha_solicitud : fechaActual,
        comentario : comentarios ,
        serie : seriesBD,
        serieespecial : otroarch,
        escala : escalas,
        nimpresion : ncopias,
        ncopias : ncopiasCD,
        formatoPapel : formapapel,
        formatoEntrega : formatoEntrega };


    const result = await pool.query('INSERT INTO sol_ploteo set ?', [solicitud]);


    const infoProyecto = await pool.query("SELECT * FROM pro_proyectos as t1 where t1.id =  ? ",[idProyecto]);
    const infoDestinatario = await pool.query('SELECT * FROM sys_usuario as t1 where t1.idUsuario = ? ', [idDestinatario]);

    const mailPloter = {
        to : "documentos@renelagos.com",
        id_proyecto : idProyecto,
        id_ingreso : req.user.idUsuario,
        id_destinatario : idDestinatario,
        destinario : infoDestinatario[0].Nombre,
        id_estado : 1,
        trabajo : trabajosBD,
        impresion : impresionBD,
        ruta : ruta, // es cuando se tiene que entregar el trabajo,
        fecha_entrega : fecheHora,
        fecha_solicitud : fechaActual,
        comentario : comentarios ,
        serie : seriesBD,
        serieespecial : otroarch,
        escala : escalas,
        nimpresion : ncopias,
        ncopias : ncopiasCD,
        formatoPapel : formapapel,
        formatoEntrega : formatoEntrega,
        proyecto : infoProyecto[0].year + "-" + infoProyecto[0].code + " : " + infoProyecto[0].nombre,
        solicitante : req.user.Nombre
      }

      mensajeria.EnvioMailIngresoPloter(mailPloter);

    //res.redirect('/ploter/ploteo/');
    res.redirect(   url.format({
        pathname:'/ploter/ploteo',
        query: {
           "a": 1
         }
      }));

    } catch (error) {
        mensajeria.MensajerErrores("\n\n Archivo : ploter.js \n Error en el directorio: /addSolicitud \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  
    }

  
}); 

router.post('/cambiaEstado',express.json({type: '*/*'}), isLoggedIn, async (req, res) => {

    
    try {

        switch(req.body[0].estado)
        {
            case 'Procesando':
                const pro = await pool.query('UPDATE solicitudes set estado = ? WHERE id = ?', [req.body[0].estado,req.body[0].id]);
                res.send("mensaje");
            break;
            case 'Terminado':
                var hora = dateFormat(new Date(), "HH:MM");
                var fecha = dateFormat(new Date(), "dd-mm-yyyy");
                const ter = await pool.query('UPDATE solicitudes set estado = ? , horat = ? ,fechat = ? WHERE id = ?', [req.body[0].estado,hora,fecha,req.body[0].id]);
                res.send("mensaje");
            break;
        }
    
        //res.location('http://demo.com');

        
    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : ploter.js \n Error en el directorio: /cambiaEstado \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                })); 

    }



}); 

router.get('/buscarPro/:find', isLoggedIn, async (req, res) => {

    try {
         // BUSCAR DIRECTOR  
    const nombre = req.query.term;
    const proyectos =  await pool.query("SELECT t1.id AS id, CONCAT(t1.year,'-',t1.code , ' : ' , t1.nombre) AS value " +
                                        " FROM pro_proyectos as t1 WHERE t1.nombre LIKE '%"+nombre+"%' OR CONCAT(t1.year,'-',t1.code) LIKE '%"+nombre+"%' LIMIT 100");
    
                                        
    res.setHeader('Content-Type', 'application/json');
    res.json(proyectos);
    } catch (error) {
       
        mensajeria.MensajerErrores("\n\n Archivo : ploter.js \n Error en el directorio: /buscarPro/:find \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                })); 

    }
  
   
  
  });

router.get('/buscarDesti/:find', isLoggedIn, async (req, res) => {
  
    try {
        // BUSCAR DIRECTOR  
    const nombre = req.query.term;
    const destinarios =  await pool.query("SELECT t1.idUsuario AS id, t1.Nombre AS value FROM sys_usuario AS t1 WHERE t1.Nombre LIKE '%"+nombre+"%' AND t1.id_estado = 1");
    
 
    res.setHeader('Content-Type', 'application/json');
    res.json(destinarios);

    } catch (error) {
       
        mensajeria.MensajerErrores("\n\n Archivo : ploter.js \n Error en el directorio: /buscarDesti/:find \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                })); 

    }

    
  
  });

router.get('/ploteo/cambiaEstadoProceso/:id',isLoggedIn, async (req, res) => {

    try {

        const { id } = req.params;

    var fechaActual = dateFormat(new Date(), "dd-mm-yyyy HH:MM");
    
    const proyecto = await pool.query('UPDATE sol_ploteo set id_estado = 2 , fecha_e_trabajando = ? WHERE id = ?', [fechaActual, id]);

    //res.redirect('/ploter/ploteo/');
    res.redirect(   url.format({
        pathname:'/ploter/ploteo',
        query: {
           "a": 2
         }
      }));

        
    } catch (error) {
      
        mensajeria.MensajerErrores("\n\n Archivo : ploter.js \n Error en el directorio: /buscarDesti/:find \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                })); 

    }

  });

router.get('/ploteo/cambiaEstadoTerminado/:id',isLoggedIn,  async (req, res) => {

    try {

        const { id } = req.params;
    
    var fechaActual = dateFormat(new Date(), "dd-mm-yyyy HH:MM");

    const proyecto = await pool.query('UPDATE sol_ploteo set id_estado = 3 , fecha_e_terminado = ? WHERE id = ?', [fechaActual,id]);

    // buscar la informacion de ploteo 
    // Primero preguntar si la persona que ingreso la solicitud es la mismna que el destinatario.

    const inforPloteo = await pool.query('SELECT * FROM sol_ploteo AS t1 WHERE  t1.id = ?',[id]);

    if (inforPloteo[0].id_ingreso == inforPloteo[0].id_destinatario )
    {
        const infoIngresa = await pool.query('SELECT * FROM sys_usuario as t1 where t1.idUsuario = ? ', [inforPloteo[0].id_destinatario]);

        const mailTerminoIgual = {
            to : infoIngresa[0].Email
          };

        mensajeria.EnviaAvisoTerminoPloteo(mailTerminoIgual);
    }
    else
    {
        const infoIngresa1 = await pool.query('SELECT * FROM sys_usuario as t1 where t1.idUsuario = ? ', [inforPloteo[0].id_destinatario]);
        const infoIngresa2 = await pool.query('SELECT * FROM sys_usuario as t1 where t1.idUsuario = ? ', [inforPloteo[0].id_ingreso]);

        const mailTerminoIgual1 = {
            to : infoIngresa1[0].Email
          };

        const mailTerminoIgual2 = {
            to : infoIngresa2[0].Email
          };

          mensajeria.EnviaAvisoTerminoPloteo(mailTerminoIgual1);
          mensajeria.EnviaAvisoTerminoPloteo(mailTerminoIgual2);

    }



    res.redirect(   url.format({
        pathname:'/ploter/ploteo',
        query: {
           "a": 2
         }
      }));

        
    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : ploter.js \n Error en el directorio: /ploteo/cambiaEstadoTerminado/:id \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                })); 

    }
  });

module.exports = router;