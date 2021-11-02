const express = require('express');
const router = express.Router();
const pool = require('../database');
var dateFormat = require('dateformat');

const { isLoggedIn } = require('../lib/auth');

// Permisos 
router.get('/permisos', isLoggedIn, async (req, res) => {
  // buscar los datos del usuario en las variables req
 
  //console.log("permisos de usuario");
  const usuarios = await pool.query('SELECT * FROM sys_usuario');


  res.render('solicitudes/permisos', { req ,usuarios,res,layout: 'template'});

  

}); 


// INgreso de permisos.
router.post('/IngresoPermiso', isLoggedIn, async (req, res) => {
  // buscar los datos del usuario en las variables req
 
  

 const { tipoP,fechaI,horaI ,fechaT,horaT,idActividad,idAprobador,comentario} = req.body; 
 var horai = horaI.substring(0, 5);
 var horaf = horaT.substring(0, 5);
 
 var divFechaI = fechaI.split("/", 3);
 var divFechaF = fechaT.split("/", 3);
 
 
 var dateTimeInicio = divFechaI[2] + "-" +  divFechaI[1] + "-"+ divFechaI[0]+ " " + horai;
 var dateTimeTermino = divFechaF[2] + "-" +  divFechaF[1] + "-"+ divFechaF[0]+ " " + horaf;

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

// cargada el detalle de la solicitud 

res.redirect("../solicitudes/permisos");

}); 





// vacaciones 
router.get('/vacaciones', isLoggedIn, async (req, res) => {
    // buscar los datos del usuario en las variables req
    const vacacione = await pool.query('SELECT * FROM sol_selec_dias');
    const usuarios = await pool.query('SELECT * FROM sys_usuario');
    const solicitud = await pool.query('SELECT * FROM sol_solicitud');
    res.render('solicitudes/vacaciones', { req ,vacacione,usuarios,solicitud,layout: 'template'});
}); 

// VACACIONES RLE 

// vacaciones 
router.get('/vacacionesrle', isLoggedIn, async (req, res) => {

  res.render('solicitudes/vacacionesrle', { req , layout: 'template'});
}); 


router.post('/getDias', async (req,res) => {
  //res.json(req.body);
  //console.log(req.user);

  // ir a preguntar a la base de datoscuantos dias tiene solicitado el usuario.
  const numeroDias = await pool.query('SELECT COUNT(t.id) as ndias FROM sol_selec_dias AS t WHERE t.idUsuario = '+req.user.idUsuario+' AND t.idEstado = 1'); 
  
  const d =  numeroDias[0]["ndias"].toString();
  
  res.send(d);
});

router.post('/getDiasEs', async (req,res) => {
  //res.json(req.body);
  //console.log(req.user);

  // ir a preguntar a la base de datoscuantos dias tiene solicitado el usuario.

   const informacionDias = await pool.query("SELECT DATE_FORMAT(t.fecha , '%Y-%m-%d') AS fecha, t.id " +
                                            "  FROM sol_selec_dias AS t WHERE t.idUsuario = "+req.user.idUsuario+" AND t.idEstado = 1 "); 
  


  res.render('solicitudes/dias', { req ,informacionDias, layout: 'blanco'});

});

//getDiasEs
//getDiasIngresados

router.post('/getDiasIngresados', async (req,res) => {
  
  const dias = await pool.query("SELECT DATE_FORMAT(t.fecha , '%Y-%m-%d') AS fecha, t.id FROM sol_selec_dias AS t WHERE t.idUsuario = " + req.user.idUsuario + " AND t.idEstado = 1 ORDER BY fecha DESC"); 
  
  //console.log("SELECT DATE_FORMAT(t.fecha , '%Y-%m-%d') AS fecha, t.id FROM sol_selec_dias AS t WHERE t.idUsuario = " + req.user.idUsuario + " AND t.idEstado = 1");

  //console.log(dias);
  
  res.render('solicitudes/listadoDias', { req ,dias, layout: 'blanco'});

});

router.post('/getPermisosSolicitados', async (req,res) => {
  
  const permisos = await pool.query(" SELECT " +
                                    " DATE_FORMAT(t2.fecha_inicio, '%Y-%m-%d') AS dia, "+
                                    " DATE_FORMAT(t2.fecha_inicio, '%H-%i') AS fecha_inicio, " +
                                    " DATE_FORMAT(t2.fecha_termino, '%H-%i') AS fecha_termino, t1.id "+
                                    " FROM sol_solicitud AS t1, sol_permiso AS t2 WHERE t1.idTipoSolicitud = 2 AND t1.idEstado = 2 AND t1.idUsuario = "+req.user.idUsuario+" AND t1.id = t2.idSolicitud"); 
   
  res.render('solicitudes/listadoPermisos', { req ,permisos, layout: 'blanco'});
  //console.log(permisos);
  //res.send("asd");
});

router.get('/getPermisos', async (req,res) => {
  
  const permisosIngresados = await pool.query("SELECT * FROM sol_solicitud AS t , sol_permiso AS t2 WHERE " +
                                " t.idUsuario = " +req.user.idUsuario + " AND t.idTipoSolicitud = 2 AND " + 
                                " t.id = t2.idSolicitud"); 

  const permisos = [];
  permisosIngresados.forEach(element => {
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
            color: ':#33FF58'
        }
        console.log("asd");
              permisos.push(permisoApro);
        break;
    }
    
  });

  res.send(permisos);


});

router.get('/eventos', async (req,res) => {

  const dias = await pool.query('SELECT * FROM sol_selec_dias AS t WHERE t.idUsuario = '+req.user.idUsuario+' AND t.idEstado in(1,2,3)'); 
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
}); 


router.get('/vacacionesDiaRle', async (req,res) => {

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
}); 



router.post('/ajaxAdd', express.json({type: '/'}), async (req,res) => {
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


  res.render('solicitudes/vacaciones', { req ,vacacione,layout: 'template'})
});

//eliminarDia

router.post('/eliminarDia', express.json({type: '/'}), async (req,res) => {
  //res.json(req.body);
//  console.log(req.user)
var id = req.body[0].dia;

//console.log(id);
const result = await pool.query('DELETE FROM sol_selec_dias WHERE id = ? AND idSolicitud IS NULL ', [id]);

res.send("OK");

});

router.post('/AddIngreso', async (req,res) => {

  
  //onsole.log(req.body)
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
    idEstado: '1'
  }
  
    //Guardar datos en la BD      

   const infoSolicitud = await pool.query('INSERT INTO sol_solicitud  set ? ', [vaca]);

    
   var key = infoSolicitud.insertId

    //console.log("UPDATE sol_selec_dias set idEstado = 2 , idSolicitud = "+key+"  WHERE idEstado = 1 AND idUsuario = "+idUsuario+" ");
  //  const result = await pool.query("UPDATE sol_selec_dias set idEstado = 2 , idSolicitud = "+key+"  WHERE idEstado = 1 AND idUsuario = "+idUsuario+" ");

  informacion.forEach(element => {
    const result = pool.query("UPDATE sol_selec_dias set idEstado = 2 , idSolicitud = "+key+" , medioDia = '"+element.mediodia+"', hora = '"+element.hora+"'  WHERE idEstado = 1 AND id = "+element.id+" ");
  });

   res.redirect("../solicitudes/vacaciones");


});



router.get('/apermisos', async (req,res) => {

  const permisos  = await pool.query(' SELECT t2.Nombre, '+
                                    "DATE_FORMAT(t1.fecha,'%Y-%m-%d') AS fecha, " +
                                    "DATE_FORMAT(t3.fecha_inicio,'%Y-%m-%d' ) AS fecha_per," +
                                    "DATE_FORMAT(t3.fecha_inicio,'%H:%i' ) AS fecha_inicio," +
                                    "DATE_FORMAT(t3.fecha_termino,'%H:%i' ) AS fecha_termino, "+
                                    't1.id' +
                                    ' FROM sol_solicitud AS t1, sys_usuario AS t2, sol_permiso AS t3 '+
                                     ' WHERE' +
                                     ' t1.idTipoSolicitud = 2 AND t1.idEstado = 2 AND t1.idUsuario = t2.idUsuario AND t3.idSolicitud = t1.id ' +
                                     ' AND ' + 
                                     " t1.idAprobador = "+ req.user.idUsuario +"");

  res.render('solicitudes/aprobarPermiso', { req ,permisos , layout: 'template'})

}); 

router.get('/solicitudes/revisar/:id', async (req, res) => {

  const { id } = req.params;

  const permisos  = await pool.query(' SELECT t2.Nombre, '+
                                    "DATE_FORMAT(t1.fecha,'%Y-%m-%d') AS fecha, " +
                                    "DATE_FORMAT(t3.fecha_inicio,'%Y-%m-%d' ) AS fecha_per," +
                                    "DATE_FORMAT(t3.fecha_inicio,'%H:%i' ) AS fecha_inicio," +
                                    "DATE_FORMAT(t3.fecha_termino,'%H:%i' ) AS fecha_termino, "+
                                    't1.id' +
                                    ' FROM sol_solicitud AS t1, sys_usuario AS t2, sol_permiso AS t3 '+
                                     ' WHERE' +
                                     ' t1.idTipoSolicitud = 2 AND t1.idEstado = 2 AND t1.idUsuario = t2.idUsuario AND t3.idSolicitud = t1.id ' +
                                     ' AND ' + 
                                     " t1.idAprobador = "+ req.user.idUsuario +"");

  const permiso = await pool.query(' SELECT t2.Nombre, '+
                                    "DATE_FORMAT(t1.fecha,'%Y-%m-%d') AS fechaI, " +
                                    "DATE_FORMAT(t3.fecha_inicio,'%Y-%m-%d' ) AS fecha_per," +
                                    "DATE_FORMAT(t3.fecha_inicio,'%H:%i' ) AS fecha_inicio," +
                                    "DATE_FORMAT(t3.fecha_termino,'%H:%i' ) AS fecha_termino, "+
                                    " t1.*, "+
                                    ' t1.id' +
                                    ' FROM sol_solicitud AS t1, sys_usuario AS t2, sol_permiso AS t3 '+
                                    ' WHERE' +
                                    ' t1.idTipoSolicitud = 2 AND t1.idEstado = 2 AND t1.idUsuario = t2.idUsuario AND t3.idSolicitud = t1.id ' +
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

  res.render('solicitudes/aprobarPermiso', { req,permisoAnteriores ,permisos ,permiso:permiso[0], layout: 'template'})

}); 



router.post('/updatePermisos', async (req,res) => {

  switch(req.body.estado)
  {
    case "1":
      console.log("Aprobado");
      const resultPer1 = await pool.query("UPDATE sol_permiso set idEstado = 3 WHERE  idSolicitud = "+req.body.id_solicitud+" "); // Aprobado
      const result1 = await pool.query("UPDATE sol_solicitud set idEstado = 3 WHERE  id = "+req.body.id_solicitud+" ");
    break;
    case "0":
      const resultPer = await pool.query("UPDATE sol_permiso set idEstado = 4 WHERE idSolicitud = "+req.body.id_solicitud+" "); // Rechazado
      const result = await pool.query("UPDATE sol_solicitud set idEstado = 4 WHERE  id = "+req.body.id_solicitud+" ");
    break;
  }
  

  res.redirect("../solicitudes/apermisos");

});

//Seleccionar vacaciones
router.get('/avacaciones', isLoggedIn, async (req, res) => {


  // Seleccicionar los días que el ha ingresado
  const soliVacaciones  = await pool.query(" SELECT COUNT (*) AS Dias, t3.*, t1.id"+
                                  " FROM  " +
                                              " sol_solicitud AS t1 ,  " +
                                              " sol_selec_dias AS t2 ,  " +
                                              " sys_usuario AS t3" +
                                  " WHERE  " +
                                               " t1.idTipoSolicitud = t1.idTipoSolicitud " +
                                  " AND  " +
                                              " t1.idAprobador = " +  req.user.idUsuario +  "" +
                                  " AND  " +
                                              " t1.idEstado = t1.idEstado "+
                                  " AND  " +
                                              " t1.id = t2.idSolicitud"+
                                  " AND  " +
                                              " t1.idEstado in (1,2)"+
                                  " AND  " +
                                              " t1.idUsuario = t3.idUsuario "+ 
                                  "   GROUP BY t2.idSolicitud ");
                                  
  //console.log(soliVacaciones);
  //console.log(req.user);
  res.render('proyecto/avacaciones', {soliVacaciones , req , layout: 'template'});
});

router.get('/avacaciones/revisar/:id', async (req, res) => {

  //console.log(req.body);
  const { id } = req.params;
   // Seleccicionar los días que el ha ingresado
   const soliVacaciones  = await pool.query(" SELECT COUNT (*) AS Dias, t3.*, t1.id"+
   " FROM  " +
               " sol_solicitud AS t1 ,  " +
               " sol_selec_dias AS t2 ,  " +
               " sys_usuario AS t3" +
   " WHERE  " +
                " t1.idTipoSolicitud = t1.idTipoSolicitud " +
   " AND  " +
               " t1.idAprobador = " +  req.user.idUsuario +  "" +
   " AND  " +
               " t1.idEstado in (1,2) "+

   " AND  " +
               " t1.id = t2.idSolicitud"+
   " AND  " +
               " t1.idUsuario = t3.idUsuario "+
   " GROUP BY t2.idSolicitud ");

  const selecciona = await pool.query(" SELECT COUNT (*) AS Dias, t3.*, t1.id, t1.fecha , t1.comentario, t1.fecha, DATE_FORMAT(t1.fecha, '%Y-%m-%d') as fecha "+
  " FROM  " +
              " sol_solicitud AS t1 ,  " +
              " sol_selec_dias AS t2 ,  " +
              " sys_usuario AS t3" +
  " WHERE  " +
               " t1.idTipoSolicitud =  t1.idTipoSolicitud " +
   " AND  " +
               " t2.idSolicitud = " + id +""+
  " AND  " +
              " t1.id = t2.idSolicitud"+
  " AND  " +
              " t1.idUsuario = t3.idUsuario "+
  " GROUP BY t2.idSolicitud ");




  const seleccionaList = await pool.query(" SELECT COUNT (*) AS Dias, t3.*, t1.id, t1.fecha, DATE_FORMAT(t1.fecha, '%d-%m-%Y') as fecha"+
  
                                            " FROM  " +
                                                        " sol_solicitud AS t1 ,  " +
                                                        " sol_selec_dias AS t2 ,  " +
                                                        " sys_usuario AS t3" +
                                                        
                                            " WHERE  " +
                                                        " t1.idTipoSolicitud = t1.idTipoSolicitud " +
                                            " AND  " +
                                                        " t2.idSolicitud = " + id +""+
                                            " AND  " +
                                                        " t1.id = t2.idSolicitud"+
                                            " AND  " +
                                                        " t1.idUsuario = t3.idUsuario "+
                                            " AND  " +
                                                        " t1.idEstado = 3 "+
                                              
                                            " GROUP BY t2.idSolicitud ");

  const diasFecha = await pool.query("SELECT  DATE_FORMAT(t1.fecha, '%Y-%m-%d') as fecha, " +
                                     "   if (t1.medioDia = 'Y', ' Medio dia', ' Dia completo') AS mediodia, " +
                                     " if (t1.medioDia = 'Y', if(t1.hora = 'AM', ' Mañana',' Tarde'), '') AS hora " +
                                     " FROM  " +
                                              " sol_selec_dias AS t1 " +
                                     " WHERE  " +
                                              " t1.idSolicitud = " + id +"");

res.render('proyecto/avacaciones', { soliVacaciones , selecciona , obj :selecciona[0] ,seleccionaList,diasFecha, req , layout: 'template'});
});


router.post('/updateVacaciones', async (req,res) => {

  //console.log(req.body);

  switch(req.body.estado)
  {
    case "1":
      //console.log("UPDATE sol_selec_dias set idEstado = 3 WHERE  idSolicitud = "+req.body.id_solicitud+" ");
      const resultPer1 = await pool.query("UPDATE sol_selec_dias set idEstado = 3 WHERE  idSolicitud = "+req.body.id_solicitud+" "); // Aprobado
      const result1 = await pool.query("UPDATE sol_solicitud set idEstado = 3 WHERE  id = "+req.body.id_solicitud+" ");
    break;
    case "0":
      const resultPer = await pool.query("UPDATE sol_selec_dias set idEstado = 4 WHERE idSolicitud = "+req.body.id_solicitud+" "); // Rechazado
      const result = await pool.query("UPDATE sol_solicitud set idEstado = 4 WHERE  id = "+req.body.id_solicitud+" ");
    break;
  }
  
  res.redirect("../solicitudes/avacaciones");
  //res.send("asdd");

});

//eliminarPermisos
router.post('/eliminarPermisos', express.json({type: '/'}), async (req,res) => {
  //res.json(req.body);
//  console.log(req.user)
var id = req.body[0].dia;

//console.log(id);
const result = await pool.query('DELETE FROM sol_permiso WHERE idSolicitud = ? ', [id]);
const result2 = await pool.query('DELETE FROM sol_solicitud WHERE id = ? ', [id]);

res.send("OK");

});


module.exports = router;