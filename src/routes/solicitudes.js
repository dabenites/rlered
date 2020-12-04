const express = require('express');
const router = express.Router();
const pool = require('../database');
var dateFormat = require('dateformat');

const { isLoggedIn } = require('../lib/auth');


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
            color: '#FFF333'
        }
          diaSolicitados.push(ingresando);
        break;  
        case 2:
          const solicitado = {
            start : dateFormat(element.fecha, "yyyy-mm-dd"),
            display : 'background',
            overlap: false,
            color: '#33C4FF'
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
    
        
          const diaVacaciones = {
            start : dateFormat(element.fecha, "yyyy-mm-dd"),
            title : element.NombreCompleto,
            textColor: 'black',
            color : '#f8f9fa'
            
            
        }
        vacacionesRLE.push(diaVacaciones);
        

      
      
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






router.post('/AddIngreso', async (req,res) => {

  
  console.log(req.body)
  var idUsuario =  req.user.idUsuario;
  var idAprobador =  req.body.idAprobador;
  var idInformar = req.body.idInformar;
  var comentario = req.body.comentario;
  var fecha = new Date();

  
  //console.log(req.body);comentario

  const vaca  ={ //Se gurdaran en un nuevo objeto

    idUsuario :  idUsuario,
    idAprobador: idAprobador,
    idInformar : idInformar,
    fecha : fecha,
    comentario:comentario,
    idEstado: '1'
  }
    //Guardar datos en la BD      

    const infoSolicitud = await pool.query('INSERT INTO sol_solicitud  set ? ', [vaca]);

    
    var key = infoSolicitud.insertId

    //console.log("UPDATE sol_selec_dias set idEstado = 2 , idSolicitud = "+key+"  WHERE idEstado = 1 AND idUsuario = "+idUsuario+" ");
    const result = await pool.query("UPDATE sol_selec_dias set idEstado = 2 , idSolicitud = "+key+"  WHERE idEstado = 1 AND idUsuario = "+idUsuario+" ");


    res.redirect("../solicitudes/vacaciones");


});



module.exports = router;