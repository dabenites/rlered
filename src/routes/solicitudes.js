const express = require('express');
const router = express.Router();
const pool = require('../database');
var dateFormat = require('dateformat');
var url = require('url');

const { isLoggedIn } = require('../lib/auth');

const mensajeria = require('../mensajeria/mail');
const { Console, count } = require('console');

// Permisos 
router.get('/permisos', isLoggedIn, async (req, res) => {

  try {
    // buscar los datos del usuario en las variables req
 
  //console.log("permisos de usuario");
  const usuarios = await pool.query("SELECT * FROM sys_usuario as t1 WHERE t1.id_estado = 1 ORDER BY t1.nombre ASC");


  //res.render('solicitudes/permisos', { req ,usuarios,res,layout: 'template'});

  var mensaje = -1;
    //console.log(req.query);
    if (req.query.a !== undefined)
    {
        mensaje = req.query.a;
    }

    if (mensaje !== -1)
    { 
        const verToask = {
        titulo : "Mensaje",
        body   : "Solicitud de permiso fuera de horario",
        tipo   : "Eliminar"
            };
    
            res.render('solicitudes/permisos', { verToask, req ,usuarios,res,layout: 'template'});
    }
    else
    {
      res.render('solicitudes/permisos', { req ,usuarios,res,layout: 'template'});
    }

  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /permisos \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }
}); 


// INgreso de permisos.
router.post('/IngresoPermiso', isLoggedIn, async (req, res) => {

  try {
     // buscar los datos del usuario en las variables req
 
 const { tipoP,fechaI,horaI ,fechaT,horaT,idActividad,idAprobador,comentario,idInformar} = req.body; 
 var horai = horaI.substring(0, 5);
 var horaf = horaT.substring(0, 5);
 
 var divFechaI = fechaI.split("/", 3);
 var divFechaF = fechaT.split("/", 3);
 
 
 var dateTimeInicio = divFechaI[2] + "-" +  divFechaI[1] + "-"+ divFechaI[0]+ " " + horai;
 var dateTimeTermino = divFechaF[2] + "-" +  divFechaF[1] + "-"+ divFechaF[0]+ " " + horaf;


 // Preguntar que dia de la semana es el permiso. 
 const numeroDia = new Date(dateTimeInicio).getDay();
 var  estado = true;

 switch(numeroDia)
 {
   case 1:
   case 2:
   case 3:
   case 4:
     if (horai < "13:00")
     {
       if (horaf > "13:00") { estado = false;}
     }
     else if(horai >= "14:00")
     {
      if (horaf > "18:15") { estado = false;}
     }
   break;
   case 5:
    if (horaf > "13:30") { estado = false;}
   break;
 }
  
 if (estado === true)
 {
 // Permiso
    const permiso  ={ //Se gurdaran en un nuevo objeto

      idUsuario :  req.user.idUsuario,
      idAprobador: idAprobador,
      idInformar : 0,
      idTipoSolicitud : 2,
      fecha : new Date(),
      comentario:comentario,
      idEstado: '2'
    }
      //Guardar datos en la BD      

    const infoPermiso = await pool.query('INSERT INTO sol_solicitud  set ? ', [permiso]);
    const det_permiso  ={ //Se gurdaran en un nuevo objeto

      idUsuario :  req.user.idUsuario,
      idEstado : 2,
      idActividad : idActividad,
    // fecha_inicio : dateFormat(dateTimeInicio, 'yyyy-dd-mm HH:MM:ss') ,
    fecha_inicio : dateTimeInicio,
      //fecha_termino : dateFormat(dateTimeTermino,'yyyy-dd-mm HH:MM:ss'),
      fecha_termino : dateTimeTermino,
      idSolicitud : infoPermiso.insertId
    }



    const infoSolicitud = await pool.query('INSERT INTO sol_permiso  set ? ', [det_permiso]);

    const infoAprobador = await pool.query('SELECT * FROM sys_usuario as t1 where t1.idUsuario = ? ', [idAprobador]);

    const mail = {
      to : infoAprobador[0].Email,
      comentario : comentario,
      solicitante : req.user.Nombre
    }

    mensajeria.EnvioMailSolicitudPermiso(mail);

    
    if (idInformar !== undefined)
    {
      if (Array.isArray(idInformar))
      {
        idInformar.forEach( async(dat)=>{

          const infoInformarN = await pool.query('SELECT * FROM sys_usuario as t1 where t1.idUsuario = ? ', [dat]);

        const mailN = {
          to : infoInformarN[0].Email,
          comentario : comentario,
          solicitante : req.user.Nombre
        }
    
        mensajeria.EnvioMailSolicitudPermiso(mailN);

         
        });
      }
      else
      {
        const infoInformar = await pool.query('SELECT * FROM sys_usuario as t1 where t1.idUsuario = ? ', [idInformar]);

        const mail = {
          to : infoInformar[0].Email,
          comentario : comentario,
          solicitante : req.user.Nombre
        }
    
        mensajeria.EnvioMailSolicitudPermiso(mail);

        
      }
    }


    res.redirect("../solicitudes/permisos");
 }
 else
 {
  res.redirect(   url.format({
    pathname:'/solicitudes/permisos',
    query: {
       "a": 1
     }
  }));

 }
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /IngresoPermiso \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }
 
}); 





// vacaciones 
router.get('/vacaciones', isLoggedIn, async (req, res) => {

  try {

     // buscar los datos del usuario en las variables req
     const vacacione = await pool.query('SELECT * FROM sol_selec_dias');
     const usuarios = await pool.query("SELECT * FROM sys_usuario as t1 WHERE t1.id_estado = 1  AND t1.idUsuario not in (1) ORDER BY t1.Nombre ASC");
     const solicitud = await pool.query('SELECT * FROM sol_solicitud');
 
 
     res.render('solicitudes/vacaciones', { req ,vacacione,usuarios,solicitud,layout: 'template'});

    
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /vacaciones \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }
}); 

// VACACIONES RLE 

// vacaciones 
router.get('/vacacionesrle', isLoggedIn, async (req, res) => {

  try {

    res.render('solicitudes/vacacionesrle', { req , layout: 'template'});
    
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /vacacionesrle \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

  
}); 


router.post('/getDias', async (req,res) => {

  try {
    //res.json(req.body);
  //console.log(req.user);

  // ir a preguntar a la base de datoscuantos dias tiene solicitado el usuario.
  const numeroDias = await pool.query('SELECT COUNT(t.id) as ndias FROM sol_selec_dias AS t WHERE t.idUsuario = '+req.user.idUsuario+' AND t.idEstado = 1'); 
  
  const d =  numeroDias[0]["ndias"].toString();
  
  res.send(d);
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /getDias \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            }));
  }
  
});

router.post('/getDiasEs', async (req,res) => {

  try {

    //res.json(req.body);
  //console.log(req.user);

  // ir a preguntar a la base de datoscuantos dias tiene solicitado el usuario.

   const informacionDias = await pool.query("SELECT DATE_FORMAT(t.fecha , '%Y-%m-%d') AS fecha, t.id " +
   "  FROM sol_selec_dias AS t WHERE t.idUsuario = "+req.user.idUsuario+" AND t.idEstado = 1 ORDER BY fecha ASC"); 



res.render('solicitudes/dias', { req ,informacionDias, layout: 'blanco'});
    
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /getDiasEs \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

});

//getDiasEs
//getDiasIngresados

router.post('/getDiasIngresados', async (req,res) => {

  try {
    const dias = await pool.query("SELECT DATE_FORMAT(t.fecha , '%Y-%m-%d') AS fecha, t.id FROM sol_selec_dias AS t WHERE t.idUsuario = " + req.user.idUsuario + " AND t.idEstado = 1 ORDER BY fecha ASC"); 
  
    //console.log("SELECT DATE_FORMAT(t.fecha , '%Y-%m-%d') AS fecha, t.id FROM sol_selec_dias AS t WHERE t.idUsuario = " + req.user.idUsuario + " AND t.idEstado = 1");
  
    //console.log(dias);
    
    res.render('solicitudes/listadoDias', { req ,dias, layout: 'blanco'});
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /getDiasIngresados \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
  

});

router.post('/getPermisosSolicitados', async (req,res) => {

  try {
    const permisos = await pool.query(" SELECT " +
    " DATE_FORMAT(t2.fecha_inicio, '%Y-%m-%d') AS dia, "+
    " DATE_FORMAT(t2.fecha_inicio, '%H-%i') AS fecha_inicio, " +
    " DATE_FORMAT(t2.fecha_termino, '%H-%i') AS fecha_termino, t1.id "+
    " FROM sol_solicitud AS t1, sol_permiso AS t2 WHERE t1.idTipoSolicitud = 2 AND t1.idEstado = 2 AND t1.idUsuario = "+req.user.idUsuario+" AND t1.id = t2.idSolicitud"); 

    res.render('solicitudes/listadoPermisos', { req ,permisos, layout: 'blanco'});

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /getPermisosSolicitados \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
  
  //console.log(permisos);
  //res.send("asd");
});

router.get('/getPermisos', async (req,res) => {
  
  try {
    
    const permisosIngresados = await pool.query("SELECT *, DATE_FORMAT(t2.fecha_inicio,'%Y-%m-%d %H:%i') AS fecha_inicio "+
                                              " , DATE_FORMAT(t2.fecha_termino,'%Y-%m-%d %H:%i') AS fecha_termino FROM sol_solicitud AS t , sol_permiso AS t2 WHERE " +
                                " t.idUsuario = " +req.user.idUsuario + " AND t.idTipoSolicitud = 2 AND " + 
                                " t.id = t2.idSolicitud"); 

  const permisos = [];
  permisosIngresados.forEach(element => {
   // console.log(element.idEstado);
    switch(element.idEstado)
    {
        case 2:
          const permisoSol = {
            title : element.comentario,
            start : element.fecha_inicio,
            end: element.fecha_termino,
            overlap: false,
            color: '#33C4FF'
        }
              permisos.push(permisoSol);
        break;
        case 3:
          const permisoApro = {
            title : element.comentario,
            start : element.fecha_inicio,
            end: element.fecha_termino,
            overlap: false,
            color: '#23b23d'
        }
        //console.log("asd");
              permisos.push(permisoApro);
        break;
        case 6:
          const permisoRecha = {
            title : element.comentario,
            start : element.fecha_inicio,
            end: element.fecha_termino,
            overlap: false,
            color: '#B63210'
        }
        //console.log("asd");
              permisos.push(permisoRecha);
        break;
        
    }
    
  });

  res.send(permisos);

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /getPermisos \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }

});

router.get('/eventos', async (req,res) => {

  try {
    
    const dias = await pool.query('SELECT t.* FROM sol_selec_dias AS t, sol_solicitud AS t2  WHERE t.idUsuario = '+req.user.idUsuario+' AND t.idEstado in(1,2,3)  AND t.idSolicitud = t2.id AND t2.idEstado IN (1,2,3,4)'); 
    const diaSolicitados = [];
    dias.forEach(element => {
      switch(element.idEstado)
        {
          case 1:
            const ingresando = {
              start : dateFormat(element.fecha, "yyyy-mm-dd"),
              display : 'background',
              overlap: false,
              color:  '#0d6efd'
          }
            diaSolicitados.push(ingresando);
          break;  
          case 2:
            const solicitado = {
              start : dateFormat(element.fecha, "yyyy-mm-dd"),
              display : 'background',
              overlap: false,
              color: '#de980b'
          }
          diaSolicitados.push(solicitado);
            break;
            case 3:
            const aprobado = {
              start : dateFormat(element.fecha, "yyyy-mm-dd"),
              display : 'background',
              overlap: false,
              color: '#33FF58'
          }
          diaSolicitados.push(aprobado);
            break;
  
        }
        
    });
  
   res.send(diaSolicitados);

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /eventos \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }

 
}); 

router.get('/vacacionesDiaRle', async (req,res) => {

  try {
    
    const dias = await pool.query('SELECT * FROM sol_selec_dias AS t, sys_usuario as t2  WHERE t.idEstado in(3) AND t.idUsuario = t2.idUsuario'); 
  const vacacionesRLE = [];
  dias.forEach(element => {
    
        
          const background = {
            start : dateFormat(element.fecha, "yyyy-mm-dd"),
            display : 'background',
            overlap: false,
            color: '#33FF58',           
        }
        const eventos = {
          start : dateFormat(element.fecha, "yyyy-mm-dd"),
          color: '#black',
          title : element.Nombre,
          background:"#33FF58"           
      }
        vacacionesRLE.push(background);
        vacacionesRLE.push(eventos);
        

      
      
  });

 res.send(vacacionesRLE);

  } catch (error) {
   
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /vacacionesDiaRle \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }

  
}); 



router.post('/ajaxAdd', express.json({type: '/'}), async (req,res) => {

  try {
       //res.json(req.body);
  //  console.log(req.user)
  var fecha = req.body[0].dia;
  var idUsuario =  req.user.idUsuario;
  
//  console.log(fecha + "---" + idUsuario);


  const vaca  ={ //Se gurdaran en un nuevo objeto
    fecha : fecha,
    idUsuario :  idUsuario,
    idEstado : '1'
};
//Guardar datos en la BD      

  const result = await pool.query('INSERT INTO sol_selec_dias set ? ', [vaca]);
  const vacacione = await pool.query('SELECT * FROM sol_selec_dias');


res.render('solicitudes/vacaciones', { req ,vacacione,layout: 'template'});
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /ajaxAdd \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 


  }
   
});

router.post('/ajaxDelete', express.json({type: '/'}), async (req,res) => {

  try {
    
     //res.json(req.body);
      //  console.log(req.user)
      var arrayDeCadenas = req.body[0].dia.split('/');
      //console.log(arrayDeCadenas);
      var fecha = arrayDeCadenas[2]+"-"+arrayDeCadenas[1]+"-"+arrayDeCadenas[0];
      var idUsuario =  req.user.idUsuario;

      //Guardar datos en la BD      

      //console.log(fecha);
      //console.log(idUsuario);
      //console.log('DELETE FROM sol_selec_dias WHERE idUsuario = ? AND fecha = ?  AND idSolicitud IS NULL');

      const result = await pool.query('DELETE FROM sol_selec_dias WHERE idUsuario = ? AND fecha = ?  AND idSolicitud IS NULL', [idUsuario,fecha]);

      const vacacione = await pool.query('SELECT * FROM sol_selec_dias');


      res.render('solicitudes/vacaciones', { req ,vacacione,layout: 'template'});

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /ajaxDelete \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
 
});

router.post('/eliminarDia', express.json({type: '/'}), async (req,res) => {

  try {
      //res.json(req.body);
      //  console.log(req.user)
      var id = req.body[0].dia;

      //console.log(id);
      const result = await pool.query('DELETE FROM sol_selec_dias WHERE id = ? AND idSolicitud IS NULL ', [id]);

      res.send("OK");

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /eliminarDia \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }


});

router.post('/AddIngreso', async (req,res) => {

  try {
    var idUsuario =  req.user.idUsuario;
    var idAprobador =  req.body.idAprobador;
    var idInformar = req.body.idInformar;
    var comentario = req.body.comentario;
    var fecha = new Date();
  
  
    const datos = JSON.parse(JSON.stringify(req.body));
  
    let informacion = [];
  
    for (const property in datos) {
      var arrPartes = property.split('_');
      if (arrPartes.length === 2)
      {
        if (arrPartes[0] === 'tipodia')
        {
            if (datos ['dia_'+arrPartes[1]] === undefined)
            {
              // dia completo.
              const vaca  ={ 
  
                mediodia :  'N',
                id: arrPartes[1],
                hora : 'AM'
              };
              informacion.push(vaca);
            }
            else
            {
              // medio dia. 
              const vaca  ={ 
                mediodia :  'Y',
                id: arrPartes[1],
                hora : datos[property]
              };
              informacion.push(vaca);
            }
        }
      }
    }
    
    //Se gurdaran en un nuevo objeto
    
    const vaca  ={ 
  
      idUsuario :  idUsuario,
      idAprobador: idAprobador,
      idInformar : idInformar,
      idTipoSolicitud : 1,
      fecha : fecha,
      comentario:comentario,
      idEstado: '2'
    }
    
      //Guardar datos en la BD      
  
     const infoSolicitud = await pool.query('INSERT INTO sol_solicitud  set ? ', [vaca]);
  
      
     var key = infoSolicitud.insertId
  
      //console.log("UPDATE sol_selec_dias set idEstado = 2 , idSolicitud = "+key+"  WHERE idEstado = 1 AND idUsuario = "+idUsuario+" ");
    //  const result = await pool.query("UPDATE sol_selec_dias set idEstado = 2 , idSolicitud = "+key+"  WHERE idEstado = 1 AND idUsuario = "+idUsuario+" ");
  
    informacion.forEach(element => {
      const result = pool.query("UPDATE sol_selec_dias set idEstado = 2 , idSolicitud = "+key+" , medioDia = '"+element.mediodia+"', hora = '"+element.hora+"'  WHERE idEstado = 1 AND id = "+element.id+" ");
    });
  
    // Buscar la informacion del informante. 
    //idInformar
  
    // Buscar la informacion 
    if (idAprobador > 0)
    {
      const infoAprobador = await pool.query('SELECT * FROM sys_usuario as t1 where t1.idUsuario = ? ', [idAprobador]);
  
      // Obtener informacion de los dias a solicitar. 
      const infoDias =  await pool.query("SELECT DATE_FORMAT(t1.fecha,'%Y-%m-%d') AS fecha, t1.medioDia FROM sol_selec_dias as t1 where t1.idSolicitud = ? ORDER BY t1.fecha DESC", [key]);
  
  
      const mail = {
        to : infoAprobador[0].Email,
        comentario : comentario,
        solicitante : req.user.Nombre,
        dias : infoDias
      }
      
  
  
      //console.log(infoDias);
      mensajeria.EnvioMailSolicitudVacaciones(mail);
      
      //enviar mail a RRHH
      const mailRRHH = {
        to : 'rrhh@renelagos.com',
        comentario : comentario,
        solicitante : req.user.Nombre,
        dias : infoDias
      }
  
      mensajeria.EnvioMailSolicitudVacaciones(mailRRHH);
  
  
  
      if (idInformar !== undefined)
      {
        if (Array.isArray(idInformar))
        {
          idInformar.forEach( async(dat)=>{
  
            const infoInformarN = await pool.query('SELECT * FROM sys_usuario as t1 where t1.idUsuario = ? ', [dat]);
  
          const mailN = {
            to : infoInformarN[0].Email,
            comentario : comentario,
            solicitante : req.user.Nombre
          }
      
          mensajeria.EnvioMailSolicitudVacacionesNotificar(mailN);
  
           
          });
        }
        else
        {
          const infoInformar = await pool.query('SELECT * FROM sys_usuario as t1 where t1.idUsuario = ? ', [idInformar]);
  
          const mail = {
            to : infoAprobador[0].Email,
            comentario : comentario,
            solicitante : req.user.Nombre
          }
      
          mensajeria.EnvioMailSolicitudVacacionesNotificar(mail);
  
          
        }
      }
  
    }
  
     res.redirect("../solicitudes/vacaciones");

  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /AddIngreso \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }  

});

router.get('/apermisos', async (req,res) => {

  try {
    
          const permisos  = await pool.query(' SELECT t2.Nombre, '+
          "DATE_FORMAT(t1.fecha,'%Y-%m-%d') AS fecha, " +
          "DATE_FORMAT(t3.fecha_inicio,'%Y-%m-%d' ) AS fecha_per," +
          "DATE_FORMAT(t3.fecha_inicio,'%H:%i' ) AS fecha_inicio," +
          "DATE_FORMAT(t3.fecha_termino,'%H:%i' ) AS fecha_termino, "+
          't1.id,' +
          't4.descripcion' +
          ' FROM sol_solicitud AS t1, sys_usuario AS t2, sol_permiso AS t3, sol_estado AS t4 '+
          ' WHERE' +
          ' t1.idTipoSolicitud = 2 AND t1.idEstado IN(2,4) AND t1.idUsuario = t2.idUsuario AND t3.idSolicitud = t1.id ' +
          ' AND ' + 
                ' t4.id = t1.idEstado ' +
          ' AND ' + 
          " t1.idAprobador = "+ req.user.idUsuario +"");

      // Historial de permisos. 
      const historiaPermisos  = await pool.query(' SELECT t2.Nombre, '+
                "DATE_FORMAT(t1.fecha,'%Y-%m-%d') AS fecha, " +
                "DATE_FORMAT(t3.fecha_inicio,'%Y-%m-%d' ) AS fecha_per," +
                "DATE_FORMAT(t3.fecha_inicio,'%H:%i' ) AS fecha_inicio," +
                "DATE_FORMAT(t3.fecha_termino,'%H:%i' ) AS fecha_termino, "+
                't1.id,' +
                't4.descripcion' +
                ' FROM sol_solicitud AS t1, sys_usuario AS t2, sol_permiso AS t3, sol_estado AS t4 '+
                ' WHERE' +
                ' t1.idTipoSolicitud = 2 AND t1.idEstado NOT IN(2,4) AND t1.idUsuario = t2.idUsuario AND t3.idSolicitud = t1.id ' +
                ' AND ' + 
                      ' t4.id = t1.idEstado ' +
                ' AND ' + 
                " t1.idAprobador = "+ req.user.idUsuario +"");

      // El historial de pemriso los muestro todos o solo los del aprobador ?

      res.render('solicitudes/aprobarPermiso', { req ,permisos ,historiaPermisos, layout: 'template'});


  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /apermisos \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

 
}); 

router.get('/solicitudes/revisar/:id', async (req, res) => {

  try {
    const { id } = req.params;

  
    const permisos  = await pool.query(' SELECT t2.Nombre, '+
                                      "DATE_FORMAT(t1.fecha,'%Y-%m-%d') AS fecha, " +
                                      "DATE_FORMAT(t3.fecha_inicio,'%Y-%m-%d' ) AS fecha_per," +
                                      "DATE_FORMAT(t3.fecha_inicio,'%H:%i' ) AS fecha_inicio," +
                                      "DATE_FORMAT(t3.fecha_termino,'%H:%i' ) AS fecha_termino, "+
                                      't1.id,' +
                                      't4.descripcion' +
                                      ' FROM sol_solicitud AS t1, sys_usuario AS t2, sol_permiso AS t3 , sol_estado AS t4'+
                                       ' WHERE' +
                                       ' t1.idTipoSolicitud = 2 AND t1.idEstado IN (2,4) AND t1.idUsuario = t2.idUsuario AND t3.idSolicitud = t1.id ' +
                                       ' AND ' + 
                                       ' t4.id = t1.idEstado ' +
                                       ' AND ' + 
                                       " t1.idAprobador = "+ req.user.idUsuario +"");
  
    const permiso = await pool.query(' SELECT t2.Nombre, '+
                                      "DATE_FORMAT(t1.fecha,'%Y-%m-%d') AS fechaI, " +
                                      "DATE_FORMAT(t3.fecha_inicio,'%Y-%m-%d' ) AS fecha_per," +
                                      "DATE_FORMAT(t3.fecha_inicio,'%H:%i' ) AS fecha_inicio," +
                                      "DATE_FORMAT(t3.fecha_termino,'%H:%i' ) AS fecha_termino, "+
                                      " t1.*, "+
                                      ' t1.id,' +
                                      ' t1.idEstado as estadoActual ,' +
                                      " t1a.comentario as comentarioSolicitud" +
                                      ' FROM sol_solicitud AS t1 '+
                                      " LEFT JOIN sol_solicitud_tracking as t1a ON t1.id = t1a.idSolicitud AND t1a.estado_inicial = 2,"+
                                      ' sys_usuario AS t2, sol_permiso AS t3 '+
                                      ' WHERE' +
                                      ' t1.idTipoSolicitud = 2 AND t1.idUsuario = t2.idUsuario AND t3.idSolicitud = t1.id ' +
                                      ' AND ' + 
                                      " t1.id = "+ id+"");
  
    const permisoAnteriores = await pool.query(' SELECT t2.Nombre, '+
                                      "DATE_FORMAT(t1.fecha,'%Y-%m-%d') AS fechaI, " +
                                      "DATE_FORMAT(t3.fecha_inicio,'%Y-%m-%d' ) AS fecha_per," +
                                      "DATE_FORMAT(t3.fecha_inicio,'%H:%i' ) AS fecha_inicio," +
                                      "DATE_FORMAT(t3.fecha_termino,'%H:%i' ) AS fecha_termino, "+
                                      " t1.*, "+
                                      ' t1.id' +
                                      ' FROM sol_solicitud AS t1, sys_usuario AS t2, sol_permiso AS t3 '+
                                      ' WHERE' +
                                      ' t1.idTipoSolicitud = 2 AND t1.idEstado = 3 AND t1.idAprobador = t2.idUsuario AND t3.idSolicitud = t1.id ' +
                                      ' AND ' + 
                                      " t1.idUsuario = "+ permiso[0]["idUsuario"]+"");
    
    //___
    switch(permiso[0].idEstado)
    {
      case 2:
      case "2":
        res.render('solicitudes/aprobarPermiso', { req,permisoAnteriores ,permisos ,permiso:permiso[0], layout: 'template'})
      break;
      case 4:
      case "4":
        const anulacion = "";
        res.render('solicitudes/aprobarPermiso', { req,permisoAnteriores ,anulacion:permiso[0], permisos ,permiso:permiso[0], layout: 'template'})
      break;
    }

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /solicitudes/revisar/:id \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
}); 

router.post('/updatePermisos', async (req,res) => {

  try {
    switch(req.body.estado)
  {
    case "2":
      const resultPer2 = await pool.query("UPDATE sol_permiso set idEstado = 5 WHERE  idSolicitud = "+req.body.id_solicitud+" "); // Anulado
      const result2 = await pool.query("UPDATE sol_solicitud set idEstado = 5 WHERE  id = "+req.body.id_solicitud+" ");
    break;

    case "1":
      const resultPer1 = await pool.query("UPDATE sol_permiso set idEstado = 3 WHERE  idSolicitud = "+req.body.id_solicitud+" "); // Aprobado
      const result1 = await pool.query("UPDATE sol_solicitud set idEstado = 3 WHERE  id = "+req.body.id_solicitud+" ");

      const tracking1 = {idSolicitud : req.body.id_solicitud,
        fecha   : new Date(),
        estado_inicial : req.body.estado_actual,
        estado_final : "3",
        idUsuario : req.user.idUsuario,
        comentario   : req.body.Observacion};

      const result1Tr = await pool.query('INSERT INTO sol_solicitud_tracking set ? ', [tracking1]);

    break;

    case "0":
      const resultPer = await pool.query("UPDATE sol_permiso set idEstado = 6 WHERE idSolicitud = "+req.body.id_solicitud+" "); // Rechazado
      const result = await pool.query("UPDATE sol_solicitud set idEstado = 6 WHERE  id = "+req.body.id_solicitud+" ");

      const tracking2 = {idSolicitud : req.body.id_solicitud,
        fecha   : new Date(),
        estado_inicial : req.body.estado_actual,
        estado_final : "6",
        idUsuario : req.user.idUsuario,
        comentario   : req.body.Observacion};

      const result2Tr = await pool.query('INSERT INTO sol_solicitud_tracking set ? ', [tracking2]);

    break;
  }
  

  res.redirect("../solicitudes/apermisos");
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /updatePermisos \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }
});

//Seleccionar vacaciones
router.get('/avacaciones', isLoggedIn, async (req, res) => {

  try {
    
    // Seleccicionar los días que el ha ingresado
  const soliVacaciones  = await pool.query(" SELECT SUM(if (t2.medioDia = 'Y', 0.5 , 1)) AS Dias, t3.*, t1.id, t4.descripcion"+
  " FROM  " +
              " sol_solicitud AS t1 ,  " +
              " sol_selec_dias AS t2 ,  " +
              " sol_estado AS t4,  " +
              " sys_usuario AS t3" +
  " WHERE  " +
               " t1.idTipoSolicitud = t1.idTipoSolicitud " +
  " AND  " +
              " t1.idAprobador = " +  req.user.idUsuario +  "" +
  " AND  " +
              " t1.idEstado = t1.idEstado "+
  " AND  " +
              " t1.idEstado = t4.id"+
  " AND  " +
              " t1.id = t2.idSolicitud"+
  " AND  " +
              " t1.idEstado in (2,4)"+
  " AND  " +
              " t1.idUsuario = t3.idUsuario "+ 
  "   GROUP BY t2.idSolicitud ");

const historialVacaiones = await pool.query(" SELECT SUM(if (t2.medioDia = 'Y', 0.5 , 1)) AS Dias, t3.*, t1.id, t1.fecha, DATE_FORMAT(t1.fecha, '%d-%m-%Y') as fecha,"+
  " DATE_FORMAT(MAX(t2.fecha), '%d-%m-%Y') AS maxFecha, " +
  " DATE_FORMAT(MIN(t2.fecha), '%d-%m-%Y') AS minFecha" +

    " FROM  " +
                " sol_solicitud AS t1 ,  " +
                " sol_selec_dias AS t2 ,  " +
                " sys_usuario AS t3" +
                
    " WHERE  " +
                " t1.id = t2.idSolicitud"+
    " AND  " +
                " t1.idUsuario = t3.idUsuario "+
    " AND  " +
                " t1.idEstado = 3 "+
      
    " GROUP BY t2.idSolicitud ");




res.render('proyecto/avacaciones', {historial:req,historialVacaiones, soliVacaciones , req , layout: 'template'});

  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /avacaciones \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }
});

router.get('/avacaciones/revisar/:id', async (req, res) => {

  try {
     //console.log(req.body);
  const { id } = req.params;
  // Seleccicionar los días que el ha ingresado
  const soliVacaciones  = await pool.query(" SELECT SUM(if (t2.medioDia = 'Y', 0.5 , 1)) AS Dias, t3.*, t1.id, t4.descripcion"+
  " FROM  " +
              " sol_solicitud AS t1 ,  " +
              " sol_selec_dias AS t2 ,  " +
              " sol_estado AS t4,  " +
              " sys_usuario AS t3" +
  " WHERE  " +
               " t1.idTipoSolicitud = t1.idTipoSolicitud " +
  " AND  " +
              " t1.idAprobador = " +  req.user.idUsuario +  "" +
  " AND  " +
              " t1.idEstado in (2,4) "+
  " AND  " +
              " t1.idEstado = t4.id"+
  " AND  " +
              " t1.id = t2.idSolicitud"+
  " AND  " +
              " t1.idUsuario = t3.idUsuario "+
  " GROUP BY t2.idSolicitud ");

 const selecciona = await pool.query(" SELECT t1.idEstado as estadoActual,  SUM(if (t2.medioDia = 'Y', 0.5 , 1)) AS Dias," +
                                      " t3.*, t1.id, t1.fecha , t1.comentario,t1.comentario_anulacion, t1.fecha, "+
                                      " DATE_FORMAT(t1.fecha, '%Y-%m-%d') as fecha, t4.descripcion, t4.id as idEstado, t1a.comentario as comentarioSolicitud "+
                                     " FROM  " +
                                                 " sol_solicitud AS t1   " +
                                                 " LEFT JOIN sol_solicitud_tracking as t1a ON t1.id = t1a.idSolicitud AND t1a.estado_inicial = 2,"+
                                                 " sol_selec_dias AS t2 ,  " +
                                                 " sol_estado AS t4,  " +
                                                 " sys_usuario AS t3" +
                                     " WHERE  " +
                                                 " t1.idTipoSolicitud =  t1.idTipoSolicitud " +
                                     " AND  " +
                                                 " t2.idSolicitud = " + id +""+
                                     " AND  " +
                                                 " t1.id = t2.idSolicitud"+
                                     " AND  " +
                                                 " t1.idEstado = t4.id"+
                                     " AND  " +
                                                 " t1.idUsuario = t3.idUsuario "+
                                     " GROUP BY t2.idSolicitud ");


 const seleccionaList = await pool.query(" SELECT SUM(if (t2.medioDia = 'Y', 0.5 , 1)) AS Dias, t3.*, t1.id, t1.fecha, DATE_FORMAT(t1.fecha, '%d-%m-%Y') as fecha,"+
                                         " DATE_FORMAT(MAX(t2.fecha), '%d-%m-%Y') AS maxFecha, " +
                                         " DATE_FORMAT(MIN(t2.fecha), '%d-%m-%Y') AS minFecha" +
 
                                           " FROM  " +
                                                       " sol_solicitud AS t1 ,  " +
                                                       " sol_selec_dias AS t2 ,  " +
                                                       " sys_usuario AS t3" +
                                                       
                                           " WHERE  " +
                                                       
                                                       " t2.idUsuario = " + selecciona[0].idUsuario +""+
                                           " AND  " +
                                                       " t1.id = t2.idSolicitud"+
                                           " AND  " +
                                                       " t1.idUsuario = t3.idUsuario "+
                                           " AND  " +
                                                       " t1.idEstado = 3 "+
                                             
                                           " GROUP BY t2.idSolicitud ");

 const diasFecha = await pool.query("SELECT  DATE_FORMAT(t1.fecha, '%Y-%m-%d') as fecha, " +
                                    "   if (t1.medioDia = 'Y', ' Medio Día', ' Día Completo') AS mediodia, " +
                                    " if (t1.medioDia = 'Y', if(t1.hora = 'AM', ' Mañana',' Tarde'), '') AS hora " +
                                    " FROM  " +
                                             " sol_selec_dias AS t1 " +
                                    " WHERE  " +
                                             " t1.idSolicitud = " + id +"");

// Preguntar el estado 

//console.log(selecciona[0]);
switch(selecciona[0].idEstado)
{
 case 2:
 case "2":
   res.render('proyecto/avacaciones', { soliVacaciones , selecciona , obj :selecciona[0] ,seleccionaList,diasFecha, req , layout: 'template'});
 break;

 case 4:
 case "4":
   const anulacion = "";
   res.render('proyecto/avacaciones', { anulacion:selecciona[0], soliVacaciones , selecciona , obj :selecciona[0] ,seleccionaList,diasFecha, req , layout: 'template'});
 break;

}
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /avacaciones/revisar/:id \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            }));
  }

 

});

router.post('/updateVacaciones', async (req,res) => {

  try {
     //console.log(req.body);

  switch(req.body.estado)
  {
    case "2":
      //console.log("UPDATE sol_selec_dias set idEstado = 3 WHERE  idSolicitud = "+req.body.id_solicitud+" ");
      const resultPer2 = await pool.query("UPDATE sol_selec_dias set idEstado = 5 WHERE  idSolicitud = "+req.body.id_solicitud+" "); // Anulada
      const result2 = await pool.query("UPDATE sol_solicitud set idEstado = 5 WHERE  id = "+req.body.id_solicitud+" ");
    break;
    case "1":
      const resultPer1 = await pool.query("UPDATE sol_selec_dias set idEstado = 3 WHERE  idSolicitud = "+req.body.id_solicitud+" "); // Aprobado
      const result1 = await pool.query("UPDATE sol_solicitud set idEstado = 3 WHERE  id = "+req.body.id_solicitud+" ");

      // registrar el tracking de la aprobacion 
      const tracking1 = {idSolicitud : req.body.id_solicitud,
        fecha   : new Date(),
        estado_inicial : req.body.estado_actual,
        estado_final : "3",
        idUsuario : req.user.idUsuario,
        comentario   : req.body.Observacion};

      const result1Tr = await pool.query('INSERT INTO sol_solicitud_tracking set ? ', [tracking1]);

    break;
    case "0":
      const resultPer = await pool.query("UPDATE sol_selec_dias set idEstado = 6 WHERE idSolicitud = "+req.body.id_solicitud+" "); // Rechazado
      const result = await pool.query("UPDATE sol_solicitud set idEstado = 6 WHERE  id = "+req.body.id_solicitud+" ");

            // registrar el tracking de la aprobacion 
      const tracking2 = {idSolicitud : req.body.id_solicitud,
              fecha   : new Date(),
              estado_inicial : req.body.estado_actual,
              estado_final : "6",
              idUsuario : req.user.idUsuario,
              comentario   : req.body.Observacion};
      
      const result2Tr = await pool.query('INSERT INTO sol_solicitud_tracking set ? ', [tracking2]);

    break;
  }
  

  const result1Info1 = await pool.query("SELECT * FROM sol_solicitud AS t1, sys_usuario  AS t2 WHERE t1.id = ? AND t1.idUsuario = t2.idUsuario ",[req.body.id_solicitud]);

      const mail1 = {
        to : "rrhh@renelagos.com",
        nombre : result1Info1[0].Nombre,
        aprobador : req.user.Nombre,
        comentario : req.body.Observacion
      }

  mensajeria.EnvioMailCambioEstadoVacaciones(mail1);


  res.redirect("../solicitudes/avacaciones");
    
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /updateVacaciones \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }
});

//eliminarPermisos
router.post('/eliminarPermisos', express.json({type: '/'}), async (req,res) => {

  try {
    var id = req.body[0].dia;

    //console.log(id);
    const result = await pool.query('DELETE FROM sol_permiso WHERE idSolicitud = ? ', [id]);
    const result2 = await pool.query('DELETE FROM sol_solicitud WHERE id = ? ', [id]);

    res.send("OK");
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /eliminarPermisos \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }
});

// Permisos 
router.get('/missolicitudes', isLoggedIn, async (req, res) => {

 
  try {
    const solicitudes = await pool.query("SELECT " +
                                              " t1.id, " +
                                              " t2.descripcion, " +
                                              " t1.idAprobador, " +
                                              " t3.Nombre, "+
                                              " t4.descripcion AS estado, " +
                                              " t1.idEstado, " +
                                              " DATE_FORMAT(t1.fecha , '%Y-%m-%d')  AS fecha " +
                                        " FROM sol_solicitud AS t1, " +
                                              " sol_tipo_solicitud AS t2, " +
                                              " sys_usuario AS t3, " +
                                              " sol_estado AS t4 " +
                                        " WHERE " +
                                              " t1.idUsuario = "+req.user.idUsuario+" " +
                                          " AND  " +
                                              " t1.idTipoSolicitud = t2.id " +
                                          " AND  " +
                                              " t1.idAprobador = t3.idUsuario " +
                                          " AND " +
                                              " t4.id = t1.idEstado"+
                                          " AND 	t1.fecha > DATE_SUB(NOW(),INTERVAL 1 YEAR)" );


   const horasextrasHistorial =  await pool.query("SELECT t2.Nombre , t1.numhh , DATE_FORMAT(t1.fecha_solicitante, '%Y-%m-%d')  as fecha,"+
                                              " t3.nombre AS nomPro,t1.comentario,t4.descripcion, "+
                                              " t1.id " +
                                              " FROM sol_horaextra AS t1, sys_usuario AS t2, pro_proyectos AS t3, sol_estado AS t4 " +
                                              " WHERE " +
                                              " t1.idSolicitante = t2.idUsuario AND t1.idProyecto = t3.id "+
                                              " AND t4.id = t1.idEstado"+
                                              " AND 	t1.fecha_solicitante > DATE_SUB(NOW(),INTERVAL 1 YEAR)");


  
  var mensaje = -1;
   if (req.query.a !== undefined)
        {
           mensaje = req.query.a;
        }

        if (mensaje !== -1)
        { 
            const verToask = {
            titulo : "",
            body   : "Solicitud fue enviada a proceso de anulación",
            tipo   : "Editar"
                };
        
                res.render('solicitudes/missolicitudes', {  verToask, solicitudes,horasextrasHistorial, req ,layout: 'template'});
        }
        else
        {
          res.render('solicitudes/missolicitudes', {  solicitudes,horasextrasHistorial, req ,layout: 'template'});
        }

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /missolicitudes \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }

    
}); 

router.get('/missolicitudesE/:id', isLoggedIn, async (req, res) => {

try {
  const { id } = req.params;

  const solicitudes = await pool.query("SELECT " +
                                                " t1.id, " +
                                                " t2.descripcion, " +
                                                " t1.idAprobador, " +
                                                " t3.Nombre, "+
                                                " t4.descripcion AS estado, " +
                                                " t1.idEstado, " +
                                                " DATE_FORMAT(t1.fecha , '%Y-%m-%d')  AS fecha " +
                                    " FROM sol_solicitud AS t1, " +
                                                " sol_tipo_solicitud AS t2, " +
                                                " sys_usuario AS t3, " +
                                                " sol_estado AS t4 " +
                                    " WHERE " +
                                                " t1.idUsuario = "+req.user.idUsuario+" " +
                                    " AND  " +
                                                " t1.idTipoSolicitud = t2.id " +
                                    " AND  " +
                                                " t1.idAprobador = t3.idUsuario " +
                                    " AND " +
                                                " t4.id = t1.idEstado"+
                                    " AND 	t1.fecha > DATE_SUB(NOW(),INTERVAL 1 YEAR)");


    const horasextrasHistorial =  await pool.query("SELECT t2.Nombre , t1.numhh , DATE_FORMAT(t1.fecha_solicitante, '%Y-%m-%d')  as fecha,"+
                                          " t3.nombre AS nomPro,t1.comentario,t4.descripcion, "+
                                          " t1.id " +
                                          " FROM sol_horaextra AS t1, sys_usuario AS t2, pro_proyectos AS t3, sol_estado AS t4 " +
                                          " WHERE " +
                                          " t1.idSolicitante = t2.idUsuario AND t1.idProyecto = t3.id "+
                                          " AND t4.id = t1.idEstado"+
                                          " AND 	t1.fecha_solicitante > DATE_SUB(NOW(),INTERVAL 1 YEAR)");

     const horasextra =  await pool.query("SELECT "+
                                                                                        " t2.Nombre , t1.numhh ," +
                                                                                        " t2a.Nombre As colaborador," +
                                                                                        " DATE_FORMAT(t1.fecha_solicitante, '%Y-%m-%d')  as fecha," +
                                                                                        " t3.nombre AS nomPro, t1.id, " +
                                                                                        " t4.descripcion, " +
                                                                                        " t1.comentario, " +
                                                                                        " t1a.comentario AS comentarioSolicitud " +
                                                                               " from  sol_horaextra AS t1" +
                                                                                      " LEFT JOIN sol_horaextra_tracking AS t1a ON t1.id = t1a.idHoraExtra , " +
                                                                                      " sys_usuario AS t2, " +
                                                                                      " sys_usuario AS t2a, " +
                                                                                      " sol_estado AS t4, " +
                                                                                      " pro_proyectos AS t3 " +
                                                                               " WHERE t1.idIngreso = t2.idUsuario " +
                                                                               " AND t2a.idUsuario = t1.idSolicitante " +
                                                                               " AND t1.idProyecto = t3.id " +
                                                                               " AND t4.id = t1.idEstado " +
                                                                               " AND t1.id = "+id+"");


    res.render('solicitudes/missolicitudesE', {  solicitud:horasextra[0], horasextrasHistorial, solicitudes, req ,layout: 'template'});
} catch (error) {
  mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /missolicitudesE/:id \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
}
 });

router.get('/missolicitudes/:id', isLoggedIn, async (req, res) => {

  try {
    const { id } = req.params;

  const solicitudes = await pool.query("SELECT " +
                                                " t1.id, " +
                                                " t2.descripcion, " +
                                                " t1.idAprobador, " +
                                                " t3.Nombre, "+
                                                " t4.descripcion AS estado, " +
                                                " t1.idEstado, " +
                                                " DATE_FORMAT(t1.fecha , '%Y-%m-%d')  AS fecha " +
                                    " FROM sol_solicitud AS t1, " +
                                                " sol_tipo_solicitud AS t2, " +
                                                " sys_usuario AS t3, " +
                                                " sol_estado AS t4 " +
                                    " WHERE " +
                                                " t1.idUsuario = "+req.user.idUsuario+" " +
                                    " AND  " +
                                                " t1.idTipoSolicitud = t2.id " +
                                    " AND  " +
                                                " t1.idAprobador = t3.idUsuario " +
                                    " AND " +
                                                " t4.id = t1.idEstado");

  const solicitud = await pool.query("SELECT " +
                                          " t1.id, " +
                                          " t2.id as tipo, " +
                                          " t2.descripcion, " +
                                          " t1.idAprobador, " +
                                          " t3.Nombre, "+
                                          " t4.descripcion AS estado, " +
                                          " t4.id AS idEstado, " +
                                          " t1.idEstado, " +
                                          " DATE_FORMAT(t1.fecha , '%Y-%m-%d')  AS fecha, " +
                                          " t1.comentario, " +
                                          " t1.comentario_anulacion, " +
                                          " t1a.comentario as comenAprob " +
                                        " FROM sol_solicitud AS t1 " +
                                          " LEFT JOIN sol_solicitud_tracking as t1a ON t1.id = t1a.idSolicitud AND t1a.estado_inicial = 2,"+
                                          " sol_tipo_solicitud AS t2, " +
                                          " sys_usuario AS t3, " +
                                          " sol_estado AS t4 " +
                                        " WHERE " +
                                          " t1.idUsuario = "+req.user.idUsuario+" " +
                                        " AND  " +
                                          " t1.idTipoSolicitud = t2.id " +
                                        " AND  " +
                                          " t1.idAprobador = t3.idUsuario " +
                                        " AND  " +
                                          " t1.id = "+id+" " +
                                        " AND " +
                                          " t4.id = t1.idEstado"+
                                        " AND 	t1.fecha > DATE_SUB(NOW(),INTERVAL 1 YEAR)");

    const horasextrasHistorial =  await pool.query("SELECT t2.Nombre , t1.numhh , DATE_FORMAT(t1.fecha_solicitante, '%Y-%m-%d')  as fecha,"+
                                          " t3.nombre AS nomPro,t1.comentario,t4.descripcion, "+
                                          " t1.id " +
                                          " FROM sol_horaextra AS t1, sys_usuario AS t2, pro_proyectos AS t3, sol_estado AS t4 " +
                                          " WHERE " +
                                          " t1.idSolicitante = t2.idUsuario AND t1.idProyecto = t3.id "+
                                          " AND t4.id = t1.idEstado"+
                                          " AND 	t1.fecha_solicitante > DATE_SUB(NOW(),INTERVAL 1 YEAR)");


  //console.log(horasextrasHistorial);
  //console.log("asdsada");

  switch(solicitud[0].tipo)
  {
    case 1:
    case "1":
      var sql  = "SELECT " +
              " DATE_FORMAT(t1.fecha , '%Y-%m-%d') as fecha , " +
              " if (t1.medioDia = 'Y', if(t1.hora = 'AM','Mañana','Tarde'),'') AS horario " +
              " FROM  " +
              " sol_selec_dias AS t1 " +
              " WHERE " +
              " t1.idSolicitud = "+solicitud[0].id+"";
     
     const vacaciones = await pool.query(sql);
     switch(solicitud[0].idEstado)
     {
        case 1:
        case 2:
        case 3:
          res.render('solicitudes/missolicitudes', {valido:solicitud[0],horasextrasHistorial,  vacaciones, solicitud:solicitud[0], solicitudes, req ,layout: 'template'});
        break;
        case 4:
        case 5:
        case 6:
          res.render('solicitudes/missolicitudes', { vacaciones,horasextrasHistorial, solicitud:solicitud[0], solicitudes, req ,layout: 'template'});
        break;

     }
     

    break;


    case 2:
    case "2":
      var sql  = " SELECT " +
 		                  " DATE_FORMAT(t1.fecha_inicio, '%Y-%m-%d') AS fecha, " +
		                  " DATE_FORMAT(t1.fecha_inicio, '%H:%i') AS inicio, " +
		                  " DATE_FORMAT(t1.fecha_termino, '%H:%i') AS termino " +
                " FROM  " +
		                  " sol_permiso AS t1 " +
                " WHERE  " +
		                  "  t1.idSolicitud = "+solicitud[0].id+" "; 
      
      const permisos = await pool.query(sql);

     // console.log(solicitud[0]);

     // res.render('solicitudes/missolicitudes', {  permiso:permisos[0],solicitud:solicitud[0], solicitudes, req ,layout: 'template'});
     switch(solicitud[0].idEstado)
     {
        case 1:
        case 2:
        case 3:
          res.render('solicitudes/missolicitudes', { valido:solicitud[0], permiso:permisos[0],solicitud:solicitud[0],horasextrasHistorial, solicitudes, req ,layout: 'template'});
        break;
        case 4:
        case 5:
        case 6:
          res.render('solicitudes/missolicitudes', {  permiso:permisos[0],solicitud:solicitud[0],horasextrasHistorial, solicitudes, req ,layout: 'template'});
        break;

     }
    break;

  }
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /missolicitudes/:id \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            }));
  }
 });
//

router.post('/anular', async (req,res) => {

  try {
    const {comentario,id,idEstado} = req.body
  
 // console.log(comentario);

  switch(idEstado)
  {
    case 1:
    case "1":
    case 2:
    case "2":
    case 4:
    case "4":  
      const result = await pool.query('UPDATE sol_solicitud set  idEstado = 5 , comentario_anulacion = ? WHERE id = ? ', [comentario,id]);
    break;
    case 3:
    case "3":
      const result2 = await pool.query('UPDATE sol_solicitud set  idEstado = 4 , comentario_anulacion = ? WHERE id = ? ', [comentario,id]);
    break;
  }
 
  res.redirect(   url.format({
    pathname:"../solicitudes/missolicitudes",
    query: {
       "a": 1
     }
  }));

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /anular \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }

});


//horaextras
router.get('/horaextras', isLoggedIn, async (req, res) => {

  try {

    const horasExtras  =  await pool.query("SELECT " +
    " t1.numhh,t1.comentario,t1.id, t2.Nombre AS nomSol,t3.nombre AS nomPro,t3.year,t3.code, t4.descripcion   " +
    "  FROM sol_horaextra AS t1  "+
    "  LEFT JOIN sys_usuario AS t2 ON t1.idSolicitante = t2.idUsuario  "+
    "  LEFT JOIN pro_proyectos AS t3 ON t1.idProyecto = t3.id"+
    "  LEFT JOIN sol_estado AS t4 ON t1.idEstado = t4.id"+
    " WHERE "+
        " t1.idIngreso = "+req.user.idUsuario+"" +
    " ORDER BY t1.id DESC"); 

    //res.render('solicitudes/horasextras', {  horasExtras,req ,layout: 'template'});
    var mensaje = -1;
    if (req.query.a !== undefined)
    {
    mensaje = req.query.a;
    }

    if (mensaje !== -1)
    { 
    const verToask = {
    titulo : "",
    body   : "Solicitud de horas extras ingresada.",
    tipo   : "Crear"
    };

    res.render('solicitudes/horasextras', { verToask, horasExtras,req ,layout: 'template'});
    }
    else
    {
    res.render('solicitudes/horasextras', {  horasExtras,req ,layout: 'template'});
    }

    
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /horaextras \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

 });
 

 router.get('/buscarPro/:find', async (req, res) => {

  try {

     // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const proyectos =  await pool.query("SELECT t1.id AS id, CONCAT(t1.year,'-',t1.code , ' : ' , t1.nombre) AS value " +
                                      " FROM pro_proyectos as t1 WHERE t1.nombre LIKE '%"+nombre+"%' OR CONCAT(t1.year,'-',t1.code) LIKE '%"+nombre+"%'");
  
                                      
  res.setHeader('Content-Type', 'application/json');
  res.json(proyectos);

    
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /buscarPro/:find \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

});

router.get('/buscarSol/:find', async (req, res) => {


  try {

      // BUSCAR DIRECTOR  
  const nombre = req.query.term;
  const destinarios =  await pool.query("SELECT t1.idUsuario AS id, t1.Nombre AS value FROM sys_usuario AS t1 WHERE t1.Nombre LIKE '%"+nombre+"%' AND t1.id_estado = 1");
  

  res.setHeader('Content-Type', 'application/json');
  res.json(destinarios);

    
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /buscarSol/:find \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

});

//addHorasExtras
router.post('/addHorasExtras', async (req,res) => {


  try {
    
    const {comentario,num_hh,idSolicitante,idProyecto,solicitante} = req.body;
    //proyecto: '1998-11 : IGLESIA CORPORACION PENTECOSTAL SAN BERNARDO',
    //idProyecto: '185',
    //solicitante: 'David Benites',
    //idSolicitante: '124',
    //num_hh: '23',
    //comentario: 'comentario'
  
     // Permiso
   const horaExtra  ={ //Se gurdaran en un nuevo objeto
    idSolicitante :idSolicitante ,
    idIngreso:   req.user.idUsuario,
    idProyecto : idProyecto,
    idEstado : 2,
    fecha_solicitante : new Date(),
    numhh:num_hh,
    comentario: comentario
  }
  
  const he = await pool.query('INSERT INTO sol_horaextra  set ? ', [horaExtra]);
  
  const infoProyecto = await pool.query("SELECT * FROM pro_proyectos as t1 where t1.id =  ? ",[idProyecto]);
  
  // NOTIFICACIONES 
  // cambniar la noteficacio
  const mailFinanzas = {
    to : "finanzas@renelagos.com",
    comentario : comentario,
    proyecto : infoProyecto[0].year + "-" + infoProyecto[0].code + " : " + infoProyecto[0].nombre,
    solicitante : req.user.Nombre,
    numhh:num_hh,
    realizada :solicitante
  }
  
  const mailFinanzasClaudio = {
    to : "cgahona@renelagos.com",
    comentario : comentario,
    proyecto : infoProyecto[0].year + "-" + infoProyecto[0].code + " : " + infoProyecto[0].nombre,
    solicitante : req.user.Nombre,
    numhh:num_hh,
    realizada :solicitante
  }
  
  
   mensajeria.EnvioMailHorasIngresoFinanzas(mailFinanzas);
   mensajeria.EnvioMailHorasIngresoFinanzas(mailFinanzasClaudio);
  
   if (infoProyecto[0].id_jefe > 0)
   {
      const infoJefe = await pool.query('SELECT * FROM sys_usuario as t1 where t1.idUsuario = ? ', [infoProyecto[0].id_jefe]);
  
      const mailJefeProyecto = {
        to : infoJefe[0].Email,
        comentario : comentario,
        proyecto : infoProyecto[0].year + "-" + infoProyecto[0].code + " : " + infoProyecto[0].nombre,
        solicitante : req.user.Nombre,
        numhh:num_hh,
        realizada :solicitante
      }
  
      mensajeria.EnvioMailHorasIngresoFinanzas(mailJefeProyecto);
  
   }
     
      res.redirect(   url.format({
        pathname:"../solicitudes/horaextras",
        query: {
           "a": 1
         }
      }));

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /addHorasExtras \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }

 
  
  });


// ahorasExtras

//Cannot GET /solicitudes/ahorasExtras
router.get('/ahorasExtras', async (req, res) => {


  try {

    //________________________________________________
  // sol_horaextra

    const horasextras =  await pool.query("SELECT t2.Nombre , t1.numhh , DATE_FORMAT(t1.fecha_solicitante, '%Y-%m-%d')  as fecha, t3.nombre AS nomPro, "+
    "t1.id from sol_horaextra AS t1, sys_usuario AS t2, pro_proyectos AS t3 WHERE " +
    " t1.idIngreso = t2.idUsuario AND t1.idProyecto = t3.id AND t1.idEstado in (2)");

  // comentario : Las horas extras no seran aprobadas por una persona especifica 
  //              saran aprobadas por la persona que tenga permiso al modulo 

    const horasextrasHistorial =  await pool.query("SELECT t2.Nombre , t1.numhh , DATE_FORMAT(t1.fecha_solicitante, '%Y-%m-%d')  as fecha,"+
              " t3.nombre AS nomPro,t1.comentario,t4.descripcion, "+
              " t1.id " +
              " FROM sol_horaextra AS t1, sys_usuario AS t2, pro_proyectos AS t3, sol_estado AS t4 " +
              " WHERE " +
              " t1.idSolicitante = t2.idUsuario AND t1.idProyecto = t3.id AND t1.idEstado not in (2)"+
              " AND t4.id = t1.idEstado");

    //console.log(horasextrasHisotial);

    res.render('solicitudes/ahorasextras', { horasextras,horasextrasHistorial, req ,layout: 'template'});
    
  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /ahorasExtras \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

});
//Cannot GET /solicitudes/ahorasExtras
router.get('/horaextra/:id', async (req, res) => {

  try {
    
     // sol_horaextra
  const { id } = req.params;


  const horasextra =  await pool.query("SELECT "+
                                                " t2.Nombre , t1.numhh ," +
                                                " t2a.Nombre As colaborador," +
                                                " DATE_FORMAT(t1.fecha_solicitante, '%Y-%m-%d')  as fecha," +
                                                " t3.nombre AS nomPro, t1.id, " +
                                                " t1.comentario " +
                                       " from  sol_horaextra AS t1," +
                                              " sys_usuario AS t2, " +
                                              " sys_usuario AS t2a, " +
                                              " pro_proyectos AS t3 " +
                                       " WHERE t1.idIngreso = t2.idUsuario " +
                                       " AND t2a.idUsuario = t1.idSolicitante " +
                                       " AND t1.idProyecto = t3.id " +
                                       " AND t1.id = "+id+"");
  const horasextras =  await pool.query("SELECT t2.Nombre , t1.numhh , DATE_FORMAT(t1.fecha_solicitante, '%Y-%m-%d')  as fecha, t3.nombre AS nomPro, t1.id from sol_horaextra AS t1, sys_usuario AS t2, pro_proyectos AS t3 WHERE t1.idIngreso = t2.idUsuario AND t1.idProyecto = t3.id AND t1.idEstado in (2)");

  //console.log(horasextra);

  res.render('solicitudes/ahorasextras', { horasextra:horasextra[0],horasextras, req ,layout: 'template'});


  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /horaextra/:id \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
  //________________________________________________
 
});


//___________________
//addHorasExtras
router.post('/uhorasextras', async (req,res) => {


  try {
    
    const {id,estado,comentario} = req.body;

  // sol_horaextra
  const infoSolicitud = await pool.query('SELECT * FROM sol_horaextra as t1 where t1.id = ? ', [id]);

  const infoIngreso = await pool.query('SELECT * FROM sys_usuario as t1 where t1.idUsuario = ? ', [infoSolicitud[0].idIngreso]);

  const infoAsignada = await pool.query('SELECT * FROM sys_usuario as t1 where t1.idUsuario = ? ', [infoSolicitud[0].idSolicitante]);


  const infoProyecto = await pool.query("SELECT * FROM pro_proyectos as t1 where t1.id =  ? ",[infoSolicitud[0].idProyecto])




  switch(estado)
  {
    case 1:
    case "1":
      const tracking = {idHoraExtra : id,
                        fecha   : new Date(),
                        estado_inicial : "2",
                        estado_final : "3",
                        idUsuario : req.user.idUsuario,
                        comentario   : comentario};
    
     const result0 = await pool.query('INSERT INTO sol_horaextra_tracking set ? ', [tracking]);

     const result = pool.query("UPDATE sol_horaextra set idEstado = 3 WHERE  id = "+id+" ");

      const mailAprobado = {
        to : infoIngreso[0].Email,
        comentario : comentario,
        estado : "Aprobado",
        proyecto : infoProyecto[0].year + "-" + infoProyecto[0].code + " : " + infoProyecto[0].nombre,
        solicitante : infoAsignada[0].Nombre
      };

      const mailAprobadoAsignada = {
        to : infoAsignada[0].Email,
        comentario : comentario,
        estado : "Aprobado",
        numhh : infoSolicitud[0].numhh,
        proyecto : infoProyecto[0].year + "-" + infoProyecto[0].code + " : " + infoProyecto[0].nombre,
        solicitante : infoAsignada[0].Nombre
      };


      mensajeria.EnvioMailHorasRespuesta(mailAprobado);
      mensajeria.EnvioMailHorasRespuestaAsignado(mailAprobadoAsignada);
      
      break;
    case 2:
    case "2":
      const tracking2 = {idHoraExtra : id,
        fecha   : new Date(),
        estado_inicial : "2",
        estado_final : "6",
        idUsuario : req.user.idUsuario,
        comentario   : comentario};

      const result01 = await pool.query('INSERT INTO sol_horaextra_tracking set ? ', [tracking2]);

      const result1 = pool.query("UPDATE sol_horaextra set idEstado = 6 WHERE  id = "+id+" ");

      const mailRechazado = {
        to : infoIngreso[0].Email,
        comentario : comentario,
        estado : "Rechazado",
        proyecto : infoProyecto[0].year + "-" + infoProyecto[0].code + " : " + infoProyecto[0].nombre,
        solicitante : infoAsignada[0].Nombre
      };

      mensajeria.EnvioMailHorasRespuesta(mailRechazado);

      break;
  }
  
  res.redirect(   url.format({
    pathname:"../solicitudes/ahorasExtras",
    query: {
       "a": 1
     }
  }));

  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /uhorasextras \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

  

});


// ORDEN COMPRA 

router.get('/ordencompra', async (req,res) => {

  try {
    
     // empresas 
  const empresas = await pool.query('SELECT * FROM sys_empresa'); 

  const solicitantes = await pool.query('SELECT * FROM sys_usuario as t1 WHERE t1.id_estado = 1 ORDER BY t1.Nombre ASC'); 
  const directores = await pool.query('SELECT * FROM sys_usuario as t1 WHERE t1.id_estado = 1 AND t1.idCategoria IN (25,26,27,34,38,39,41,42,43,47,48,50,52,54) ORDER BY t1.Nombre ASC'); 

  const centroCostos = await pool.query('SELECT * FROM centro_costo'); 
  const proyectos = await pool.query('SELECT * FROM pro_proyectos'); 
  const etapas = await pool.query('SELECT * FROM orden_compra_etapa'); 
  const monedas = await pool.query("SELECT * FROM moneda_tipo as t1 WHERE t1.factura = 'Y'"); 


  // preguntar si existen requerimientos para esta persona que esta logeada.
  const requerimientos = await pool.query('SELECT t1.*, t2.descripcion as mon FROM orden_compra_requerimiento  as t1, moneda_tipo as t2 WHERE t1.id_ingreso = ? AND t1.id_solicitud = 0 AND t1.id_moneda = t2.id_moneda',[req.user.idUsuario]); 

  if (requerimientos.length > 0)
  {
    res.render('solicitudes/ordencompra', { req ,empresas,directores,centroCostos, solicitantes,etapas, monedas, proyectos,requerimientos, layout: 'template'});
  }
  else
  {
    res.render('solicitudes/ordencompra', { req ,empresas,directores,centroCostos, solicitantes,etapas, monedas, proyectos, layout: 'template'});
  }


  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /ordencompra \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
}); 

router.post('/buscaEmpresa', isLoggedIn, async (req, res) => {

  try {

    const { id} = req.body;

  const empresa = await pool.query('SELECT * FROM sys_empresa  as t1 WHERE t1.id = ?',[id]); 

  const informacion = {
    rut : empresa[0].rut,
    razonsocial : empresa[0].razonsocial
  }



  res.send(informacion);

    
  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /buscaEmpresa \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
});

router.post('/buscaProveedor', isLoggedIn, async (req, res) => {

  try {
    
    const { id} = req.body;
  let opciones;
  switch(id)
  {
    case "1":
      opciones = await pool.query('SELECT t1.id, t1.nombre as descripcion FROM prov_externo  as t1 WHERE t1.id_tipo_proveedor = ?',[id]); 
    break;
    case "2":
      opciones = await pool.query('SELECT t1.id, t1.razon_social as descripcion FROM prov_externo  as t1 WHERE t1.id_tipo_proveedor = ?',[id]); 
    break;
  }
  

  


  res.render('bitacora/optionValues', {opciones, layout: 'blanco'});

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /buscaProveedor \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 


  }
});


router.post('/buscaProveedorRut', isLoggedIn, async (req, res) => {

  try {
    const { id} = req.body;

  const proovedor = await pool.query('SELECT * FROM prov_externo  as t1 WHERE t1.id = ?',[id]); 

  const informacion = {
    rut : proovedor[0].rut,
  }



  res.send(informacion);

  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /buscaProveedorRut \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

  
});

router.post('/buscaCentroCosto', isLoggedIn, async (req, res) => {

  try {
    const { id} = req.body;

  const centroCosto = await pool.query('SELECT * FROM centro_costo  as t1 WHERE t1.id = ?',[id]); 

  const informacion = {
    areanegocio : centroCosto[0].idAreaNegocio,
  }



  res.send(informacion);

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /buscaCentroCosto \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }

});

router.post('/ordecompradetalle', isLoggedIn, async (req, res) => {

  try {
    
    const { cantidad,descripcion,precioUnitario,moneda,tipocambio} = req.body;

  const detalle  ={ //Se gurdaran en un nuevo objeto

    id_ingreso :  req.user.idUsuario,
    id_moneda: moneda,
    cantidad : cantidad,
    precio_unitario : precioUnitario,
    tipo_cambio : tipocambio,
    descripcion:descripcion
  }

  const infoPermiso = await pool.query('INSERT INTO orden_compra_requerimiento  set ? ', [detalle]);

  // buscar toda la informacion relacionada a la persona que esta ignresando los requerimientos de la OC

  const requerimientos = await pool.query('SELECT t1.*, t2.descripcion as mon FROM orden_compra_requerimiento  as t1, moneda_tipo as t2 WHERE t1.id_ingreso = ? AND t1.id_solicitud = 0 AND t1.id_moneda = t2.id_moneda',[req.user.idUsuario]); 



  res.render('solicitudes/ordencompradetalle', { requerimientos,layout: 'blanco'});

  } catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /ordecompradetalle \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }

  


});

//ordecompradetalleEliminar


router.post('/ordecompradetalleEliminar', isLoggedIn, async (req, res) => {

  try {
    const { id} = req.body;

  // 

  const result = await pool.query('DELETE FROM orden_compra_requerimiento WHERE id = ? ', [id]);

  const requerimientos = await pool.query('SELECT t1.*, t2.descripcion as mon FROM orden_compra_requerimiento  as t1, moneda_tipo as t2 WHERE t1.id_ingreso = ? AND t1.id_solicitud = 0 AND t1.id_moneda = t2.id_moneda',[req.user.idUsuario]); 
  
  res.render('solicitudes/ordencompradetalle', { requerimientos,layout: 'blanco'});

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /ordecompradetalleEliminar \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 
  }


});

router.post('/addOC', isLoggedIn, async (req, res) => {

  try {
    
    const {id_tipo_proveedor,id_proveedor,id_director,id_centro_costo,id_solicitante,id_proyecto,id_etapa,razonsocialpro} = req.body
  
  const oc  ={ //Se gurdaran en un nuevo objeto

    id_tipo : id_tipo_proveedor,
    id_proveedor: razonsocialpro,
    id_solicitante :  id_solicitante,
    id_director : id_director,
    id_centro_costo : id_centro_costo,
    id_ingreso: req.user.idUsuario,
    id_proyecto: id_proyecto,
    id_etapa: id_etapa,
    fecha : new Date()
  };

  const ingresoOC = await pool.query('INSERT INTO orden_compra  set ? ', [oc]);

  const result = pool.query("UPDATE orden_compra_requerimiento set id_solicitud = ? WHERE id_solicitud = 0 AND id_ingreso = ?", [ingresoOC.insertId,req.user.idUsuario]);

  /*
  emisor: '1',
  razonsocial: 'Rene Lagos y Asociados Ingenieros civiles SpA ',
  rut: '78956640-2',
  id_tipo_proveedor: '1',
  razonsocialpro: '4',
  rutproveedor: '0',
  rutproidproveedorveedor: '',
  id_solicitante: '73',
  id_director: '15',
  id_centro_costo: '2',
  id_proyecto: '5',
  id_etapa: '3',
  cantidad: '',
  descripcion: '',
  punitario: '',
  id_moneda: '',
  tipocambio: ''
*/
  res.redirect(   url.format({
    pathname:'/solicitudes/ordencompra',
    query: {
       "a": 1
     }
  }));

  } catch (error) {
    
    mensajeria.MensajerErrores("\n\n Archivo : solicitudes.js \n Error en el directorio: /addOC \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

  }
});

module.exports = router;