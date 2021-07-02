const express = require('express');
const router = express.Router();
const nodemailer = require("nodemailer");
var util = require('util');
var dateFormat = require('dateformat');

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/ploteo', isLoggedIn, async (req, res) => {

    const proyectos =  await pool.query("SELECT * FROM pro_proyectos as t1 ORDER BY year DESC, code DESC");       
    const usuarios = await pool.query('SELECT * FROM sys_usuario');      
    
    const ploteos =  await pool.query('SELECT * FROM solicitudes ORDER BY id DESC LIMIT 100');      
    const ploteosPendientes =  await pool.query("SELECT * FROM solicitudes as t WHERE t.estado in ('Pendiente', 'Procesando') ");

    //console.log(ploteos);
    res.render('ploter/ingresar', { proyectos,usuarios,ploteos, ploteosPendientes , req ,layout: 'template'});
}); 

router.post('/addSolicitud', isLoggedIn, async (req, res) => {

                                                
    //res.render('ploter/ingresar', { req ,layout: 'template'});

    //console.log(req.body);

    const { impresion , digital, idProyecto, ruta ,series,fecha,idDestinatario,comentarios,otroarch,escalas,ncopias,ncopiasCD,formapapel,tipopapel} = req.body; 

    var mailImpresion = "";
    if (typeof impresion == "string")
    {
       // console.log(impresion);
       mailImpresion = impresion;
    }
    else
    {
        mailImpresion= impresion.join(" + ");
    }

    //______________________________________________
    var s1,s2,s3,s4,s5,s6,s7,s8,s9 = "";
    var mailSerie = "";
    if (typeof series == "string")
    {
       // console.log(impresion);
       mailSerie = series;
       s1 = series;
    }
    else
    {
        mailSerie= series.join(" + ");
        for (var i=0; i<series.length; i++) 
        { 
            switch(i)
            {
                case 0:
                    s1 = series[i];
                break;
                case 1:
                    s2 = series[i];
                break;
                case 2:
                    s3 = series[i];
                break;
                case 3:
                    s4 = series[i];
                break;
                case 4:
                    s5 = series[i];
                break;
                case 5:
                    s6 = series[i];
                break;
                case 6:
                    s7 = series[i];
                break;
                case 7:
                    s8 = series[i];
                break;
                case 8:
                    s9 = series[i];
                break;
            }
        }

    }

    //______________________________________________

    const proyecto =  await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id ="+idProyecto+"");     
    const usuario =  await pool.query("SELECT * FROM sys_usuario as t1 WHERE t1.idUsuario ="+idDestinatario+"");
    
   // console.log(req.user.isLoggedIn);
   //dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");
   var fechaActual = dateFormat(new Date(), "dd-mm-yyyy");
   var horaA = dateFormat(new Date(), "HH:MM");
    const solicitud = {
        nomproyec :proyecto[0].id,
        nombre : proyecto[0].year + "-" +proyecto[0].code + " " + proyecto[0].nombre,
        login : req.user.login,
        formapapel : formapapel,
        tipopapel : tipopapel,
        prioridad : fecha, // es cuando se tiene que entregar el trabajo,
        complemento : mailImpresion,
        estado : "Pendiente",
        fecha : fechaActual ,
        fechat : "",
        ruta : ruta,
        destinatario : usuario[0].Email,
        hora : horaA,
        horat : '',
        serie1 : s1,
        serie2 : s2,
        serie3 : s3,
        serie4 : s4,
        serie5 : s5,
        serie6 : s6,
        serie7 : s7,
        serie8 : s8,
        serie9 : s9,
        escalaespecial : escalas,
        escalaespecial2 : '',
        observacion : comentarios,
        ncopiasimp : ncopias,
        ncopiascd : ncopiasCD,
        enviomail : usuario[0].Email,
        fechaprograentre : '',
        comen : ''
    };

    //console.log('INSERT INTO solicitudes set ?', [solicitud]);

    const result = pool.query('INSERT INTO solicitudes set ?', [solicitud]);

    var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // upgrade later with STARTTLS
        auth: {
          user: "dbenites@renelagos.com",
          pass: "dbenites."
        }
      });

      var mailOptions = {
          from : "Remitente",
          to : "dbenites.s@gmail.com",
          subject : "Enviado desde nodemailer",
          html: '<b>Detalles</b>' +
                '<table>'+
                    '<tr><td>Incluye</td><td>'+impresion+'</td></tr>'+
                    '<tr><td>Fecha Entrega</td><td>'+fecha+'</td></tr>'+
                    '<tr><td>Ruta Archivos</td><td>'+ruta+'</td></tr>'+
                    '<tr><td>Series</td><td>'+series+'</td></tr>'+
                    '<tr><td>Escalas</td><td>'+escalas+'</td></tr>'+
                    '<tr><td>Formato Papel</td><td>'+formapapel+'</td></tr>'+ 
                    '<tr><td>Tipo Papel</td><td>'+tipopapel+'</td></tr>'+ 
                    '<tr><td>Copias Impresion</td><td>'+ncopias+'</td></tr>'+ 
                    '<tr><td>Copias CD</td><td>'+ncopiasCD+'</td></tr>'+ 
                    '<tr><td>Comentarios</td><td>'+comentarios+'</td></tr>'+ 
                '</table>',
          alternatives: [
              {
                  contentType: 'text/x-web-markdown',
                  content: '**Hello world!**'
              }
          ]
      }
   res.send("Mensaje");
}); 


router.post('/cambiaEstado',express.json({type: '*/*'}), isLoggedIn, async (req, res) => {

    //console.log(req.body[0].estado);
    //res.send("mensaje");
    //update solicitudes set estado = '$var', horat = '$hora' where id=$cod

    switch(req.body[0].estado)
    {
        case 'Procesando':
            const pro = await pool.query('UPDATE solicitudes set estado = ? WHERE id = ?', [req.body[0].estado,req.body[0].id]);
            res.send("mensaje");
            //location.reload();
            //req.reload();
            //res.redirect('..');
        break;
        case 'Terminado':
            var hora = dateFormat(new Date(), "HH:MM");
            var fecha = dateFormat(new Date(), "dd-mm-yyyy");
            const ter = await pool.query('UPDATE solicitudes set estado = ? , horat = ? ,fechat = ? WHERE id = ?', [req.body[0].estado,hora,fecha,req.body[0].id]);
            res.send("mensaje");
            //location.reload();
            //req.reload();
            //res.redirect('..');
        break;
    }

    //res.location('http://demo.com');


}); 






module.exports = router;