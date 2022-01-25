const express = require('express');
const { render } = require('timeago.js');
const router = express.Router();
var dateFormat = require('dateformat');

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/', isLoggedIn, async (req, res) => {

   // Buscar la información 

   //console.log(req.user);
   var fecha = new Date(); 
    fecha.setMonth(fecha.getMonth() - 1); 
    //console.log(fecha.getFullYear() + '-'+ (fecha.getMonth()+1));
   let consulta_mes_anterior =   " SELECT  " +
                                    " IF(	SUM( TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600) IS null , 0 ,SUM( TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600))  AS horas  " +
                                 " FROM   " +
                                          " bita_horas AS t1  " +
                                 " WHERE   " +
                                             " t1.id_session = "+req.user.idUsuario+" " +
                                 "AND   " +
                                            " t1.ini_time BETWEEN '"+fecha.getFullYear() + '-'+ (fecha.getMonth()+1)+"-01 00:00:01' AND '"+fecha.getFullYear() + '-'+ (fecha.getMonth()+1)+"-31 23:59:59' ";
   
   let infoMesAnterior =  await pool.query(consulta_mes_anterior);

   var fechaActual = new Date(); 
   let consulta_mes_Actual =   " SELECT  " +
                                    " IF(	SUM( TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600) IS null , 0 ,SUM( TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600))  AS horas  " +
                                 " FROM   " +
                                          " bita_horas AS t1  " +
                                 " WHERE   " +
                                             " t1.id_session = "+req.user.idUsuario+" " +
                                 "AND   " +
                                            " t1.ini_time BETWEEN '"+fechaActual.getFullYear() + '-'+ (fechaActual.getMonth()+1)+"-01 00:00:01' AND '"+fechaActual.getFullYear() + '-'+ (fechaActual.getMonth()+1)+"-31 23:59:59' ";

    let infoMesActual =  await pool.query(consulta_mes_Actual);

    var fechaSemanaActualLunes = new Date();    
    var fechaSemanaActualDomingo = new Date();
    fechaSemanaActualLunes.setDate(fechaSemanaActualLunes.getDate() - 7);
    

    let diapararestar=fechaSemanaActualLunes.getUTCDay();
      if(diapararestar==0){
         dias1=(-6);        
      }else{
         dias1=(diapararestar-1)*(-1);        
      }

      fechaSemanaActualLunes.setDate(fechaSemanaActualLunes.getDate() + dias1);
      fechaSemanaActualDomingo.setDate(fechaSemanaActualLunes.getDate() + 6);
   
     let semana_anterior =   " SELECT  " +
                                    " IF(	SUM( TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600) IS null , 0 ,SUM( TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600))  AS horas  " +
                                 " FROM   " +
                                          " bita_horas AS t1  " +
                                 " WHERE   " +
                                             " t1.id_session = "+req.user.idUsuario+" " +
                                 "AND   " +
                                            " t1.ini_time BETWEEN '"+fechaSemanaActualLunes.getFullYear() + '-'+ (fechaSemanaActualLunes.getMonth()+1)+"-"+fechaSemanaActualLunes.getDate()+" 00:00:01' "+
                                 " AND '"+fechaSemanaActualDomingo.getFullYear() + '-'+ (fechaSemanaActualDomingo.getMonth()+1)+"-"+fechaSemanaActualDomingo.getDate()+" 23:59:59' ";

      console.log(semana_anterior);
      
   let infoSemanaAnteriorer =  await pool.query(semana_anterior);

   let infoHoras = {
      mesAnterior : infoMesAnterior[0].horas,
      mesActual : infoMesActual[0].horas,
      semanaAnterior : infoSemanaAnteriorer[0].horas
   }
   

   res.render('dashboard/idi', { infoHoras, req ,layout: 'template'});
  
});

module.exports = router;