const express = require('express');
const router = express.Router();
const pool = require('../database');
var dateFormat = require('dateformat');

const mensajeria = require('../mensajeria/mail');
const { isEmptyObject } = require('jquery');




router.get('/bitacora',  async (req, res) => {


     // Preguntar semana anterior. 
     let fecha_inicio = new Date();
     let fecha_final  = new Date();
 
     fecha_inicio.setDate(fecha_inicio.getDate() - 7);
     fecha_final.setDate(fecha_final.getDate() - 1);
 
     let inicio = dateFormat(fecha_inicio, "yyyy-mm-dd");
     let termino = dateFormat(fecha_final, "yyyy-mm-dd");


    // mostrar informacion que se puede ejecutar en este proceso. 

    //preguntar si existen feriados. 
    //console.log(inicio);
    //console.log(termino);

    const informacion = await pool.query("SELECT * FROM alerta_horas_empresa as t1 WHERE t1.estado = 'Y'");

    const informacionPorDia = await pool.query("SELECT * " +
                                                " FROM " +
                                                    " alerta_dia_cantidad_hora AS t1 " +
                                                " WHERE " +
                                                        "t1.id_hora_empresa = "+informacion[0].id+"");

    //1console.log(informacionPorDia);

    const feriados = await pool.query("SELECT " + 
                                            " DATE_FORMAT(t1.fecha,'%w') AS dia, " +
                                            " t1.descripcion " +
                                            " FROM " +
                                            " alerta_dia_feriado AS t1 " +
                                            " WHERE  " +
                                            " t1.fecha BETWEEN '"+inicio+"' AND '"+termino+"'");


    let numeroHorasActiva = informacion[0].numHH;
    let descuentosPorFeriado = 0;
    feriados.forEach(element => {
        
            let dia_semana = element.dia; // puede ser de 1 - 5 para que sea un descuento valido.
            
            informacionPorDia.forEach(element2 => {
                if (element2.id_num_dia == dia_semana)
                {
                    descuentosPorFeriado +=  element2.horas;
                }
            });

    });

    numeroHorasActiva = numeroHorasActiva - descuentosPorFeriado;

    //console.log(numeroHorasActiva);

    const informacionCorreo = await pool.query("SELECT " +
                                                    " t1.id_lider_equipo, " +
                                                    " t3.Email AS mailJefe, "+
                                                    " t3.Nombre AS nombreJefe, " +
                                                    " t6.centroCosto AS centroCostoColaborador, " +
                                                    " t4.Email AS mailColaborador, " +
                                                    " t4.Nombre AS nombreColaborador, " +
                                                    " t1.id_colaborador, " +
                                                    " SUM(TIME_TO_SEC(timediff(t2.fin_time, t2.ini_time))/ 3600) as numHH " +
                                                " FROM " +
                                                    " sys_usuario_equipo AS t1 "+
                                                    " LEFT JOIN bita_horas AS t2 ON  t1.id_colaborador = t2.id_session AND t2.ini_time >= '"+inicio+" 00:00:01' AND t2.fin_time <= '"+termino+" 23:59:59', " +
                                                    " sys_usuario AS t3, " +
                                                    " sys_usuario AS t4, " +
                                                    " categorias AS t5, " +
                                                    " centro_costo AS t6 " +
                                                " WHERE  " +
                                                    " t1.id_lider_equipo = t3.idUsuario " +
                                                " AND  " +
                                                    " t1.id_colaborador = t4.idUsuario " +
                                                " AND  " +
                                                    " t4.idCategoria = t5.id " +
                                                " AND  " +
                                                    " t5.idCentroCosto = t6.id " +  
                                                " AND  " +
			                                            " t6.centroCosto IN ('INGENIERIA','I+D','DIBUJO','COORDINACION' ) " + 
                                                " GROUP BY t1.id_colaborador "+
                                                " ");

    const vacacionesColaboradores = await pool.query("SELECT " +
                                        " t3.idUsuario, " +
                                        " t3.Nombre, " +
                                        " t2.fecha, " +
                                        " DATE_FORMAT(t2.fecha,'%w') AS dia " +
                                    " FROM  " +
                                        " sol_solicitud AS t1, " +
                                        " sol_selec_dias AS t2, " +
                                        " sys_usuario AS t3 " +
                                    " WHERE " +
                                        " t1.idTipoSolicitud = 1 " +
                                    " AND " +
                                        " t1.idEstado = 3 " +
                                    " AND  " +
                                        " t1.id = t2.idSolicitud " +
                                    " AND  " +
                                        " t2.fecha BETWEEN '"+inicio+"' AND '"+termino+"' " +
                                    " AND  " +
                                        " t2.idUsuario = t3.idUsuario");
    //______________________________________________________________________________________________________
    
    

    let informacionMail = [];
    const sleep = ms => new Promise(res => setTimeout(res, ms));

    informacionCorreo.forEach(
        element => { 

            const informacionCorreoUser = !!informacionMail.find(user => {return user.nombreJefe === element.nombreJefe });

            if (informacionCorreoUser === false)
                {
                    let infoColaborador = [{
                        nombreColaborador :  element.nombreColaborador, 
                        mailColaborador :  element.mailColaborador, 
                        centroCostoColaborador :  element.centroCostoColaborador, 
                        numHH :  element.numHH,
                        hhVacaciones : 0,
                        id_colaborador : element.id_colaborador

                    }];
                    informacionMail.push({
                                            nombreJefe :  element.nombreJefe,
                                            mailJefe : element.mailJefe,
                                            colaborares : infoColaborador
                                        });
                }
            else{
                const correoUser = informacionMail.find(user => {return user.nombreJefe === element.nombreJefe });

                correoUser.colaborares.push({nombreColaborador :  element.nombreColaborador, 
                                             mailColaborador :  element.mailColaborador, 
                                             centroCostoColaborador :  element.centroCostoColaborador, 
                                             numHH :  element.numHH,
                                             hhVacaciones : 0,
                                             id_colaborador : element.id_colaborador});
            }
        });
        
    // buscar vacaciones de los usuarios 

    vacacionesColaboradores.forEach(vacaciones => {
            
            informacionMail.forEach(Jefe => {

                Jefe.colaborares.forEach(colaborador => {
                    if (colaborador.id_colaborador ==  vacaciones.idUsuario)
                    {
                        //colaborador.hhVacaciones = colaborador.hhVacaciones + 
                        informacionPorDia.forEach(diaFeriado => {
                            if (diaFeriado.id_num_dia == vacaciones.dia)
                            {
                                colaborador.hhVacaciones = colaborador.hhVacaciones + parseFloat(diaFeriado.horas);
                            }
                        });
                    }
                });
            });    
        });


    let objeto = [];

    informacionMail.forEach((lider,i) => {
        setTimeout(
                    function(){
                        let tableInformacion = "";
                        lider.colaborares.forEach(colaborador => {
                                                //console.log(colaborador);

                                                let numHHCargadas = 0;

                                                if (colaborador.numHH == null)
                                                {
                                                    numHHCargadas = 0;
                                                }
                                                else
                                                {
                                                    numHHCargadas  = colaborador.numHH;
                                                }

                        let numHorasColaborador =   numeroHorasActiva - colaborador.hhVacaciones;                                              
                                                let porcentajeCumplimiento = numHHCargadas * 100 / numHorasColaborador;
                                
                                                tableInformacion += "<tr>" +
                                                                      " <td>"+colaborador.nombreColaborador+"</td>"+
                                                                      " <td>"+colaborador.centroCostoColaborador+"</td>"+
                                                                      " <td>"+numHorasColaborador+"</td>"+
                                                                      " <td>"+numHHCargadas+"</td>"+
                                                                      " <td>"+parseInt(porcentajeCumplimiento)+"</td>"+
                                                                    "</tr>";
                                            });  

                        let objeto = {
                                        to : lider.mailJefe,
                                        tabla : tableInformacion,
                                        nombre : lider.nombreJefe,
                                        inicio : inicio,
                                        termino : termino
                                     };
                        mensajeria.NotificacionBitacoraSemanal(objeto);                
                    }
                , i * 1500);
        });

    res.send("OASAR UN");

});


function getUsuarios( listadoJefes, inicio , termino)
{
    let tableInformacion = "";
    listadoJefes.forEach( (element)=>{


        let idJefe = element.id_lider_equipo;

        const usuarios = pool.query("SELECT " +									 
                                                " * " +
                                          " FROM " +
                                                " sys_usuario_equipo AS t1 " +
                                          " WHERE " +
                                                " t1.id_lider_equipo = "+idJefe+"");
        usuarios.
            then( infoUser => { 
                        
                infoUser.forEach((user => { 
                    
                    const numHHCargadas = pool.query( " SELECT  " +
                                                        " SUM(TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600) AS numHH, " +
                                                        " t2.Nombre " +
                                                        " FROM bita_horas AS t1, " +
                                                        " sys_usuario AS t2 " +
                                                        " WHERE " +
                                                                    " t1.id_session = "+user.id_colaborador+" " +
                                                        " AND  " +
                                                                    " t1.id_session = t2.idUsuario " +
                                                        " AND  " +
                                                                    " t1.ini_time >= '"+inicio+" 00:00:01' AND t1.fin_time <= '"+termino+" 23:59:59' " +
                                                        " GROUP BY t1.id_session ");
                    
                    numHHCargadas.
                        then(
                            horasUser => {
                                if (isEmpty(horasUser))
                                {

                                }
                                else
                                {
                                    tableInformacion += " <tr>"+ 
                                                        " <td>"+horasUser[0].Nombre+"<td>"+ 
                                                        " <td><td>"+ 
                                                        " <td><td>"+ 
                                                        " <td><td>"+ 
                                                        " <td><td>"+ 
                                                    " </tr>";
                                }
                            }
                        )

                }));
                }
            )
      });

      //console.log(tableInformacion);
      return tableInformacion;
}

function isEmpty(object) {  
    return Object.keys(object).length === 0
  }

module.exports = router;