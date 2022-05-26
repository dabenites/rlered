const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../lib/auth');
const pool = require('../database');
const { isEmptyObject } = require('jquery');

const mensajeria = require('../mensajeria/mail');

var url = require('url');

var Excel = require('exceljs');
const { parse } = require('path');

router.get('/proyectos',isLoggedIn,  async (req, res) => {
    
        try {
                const paises = await pool.query('SELECT * FROM pais as t1 ORDER BY t1.pais ASC');

                res.render('reporteria/buscarProyecto', {paises,  req , layout: 'template'});
        } catch (error) {
                mensajeria.MensajerErrores("\n\n Archivo : reporteria.js \n Error en el directorio: /proyectos \n" + error + "\n Generado por : " + req.user.login);
                res.redirect(   url.format({
                    pathname:'/dashboard',
                            query: {
                            "a": 1
                            }
                        }));     
        }

});

router.post('/buscarAnnio',isLoggedIn,  async (req, res) => {

        try {
              // Buscar todos los proyectos correspondiente a este Id Pais
        const annios = await pool.query(" SELECT t1.year AS id," +
                                        " t1.year AS descripcion " +
                                        " FROM " +
                                                " pro_proyectos AS t1 " +
                                        " WHERE  " +
                                                " t1.id_pais = ?" +
                                        " GROUP BY t1.year  " +
                                        "ORDER BY t1.year DESC", [req.body.idPais]);
        res.render('reporteria/annio', {annios,  req , layout: 'blanco'});   
        } catch (error) {
                mensajeria.MensajerErrores("\n\n Archivo : reporteria.js \n Error en el directorio: /buscarAnnio \n" + error + "\n Generado por : " + req.user.login);
                res.redirect(   url.format({
                    pathname:'/dashboard',
                            query: {
                            "a": 1
                            }
                        }));  
        }
    
});


router.post('/buscarProyecto',isLoggedIn,  async (req, res) => {
    

        try {
                // Buscar todos los proyectos correspondiente a este Id Pais
                const annios = await pool.query( " SELECT t1.id AS id, " +
                " CONCAT(t1.year,'-',t1.code,' : ', t1.nombre)  AS descripcion " +
                " FROM " +
                        " pro_proyectos AS t1 "  +
                " WHERE "+
                        " t1.id_pais = ? " +
                " AND  " +
                        " t1.year = ? " +
                " ORDER BY t1.code DESC", [req.body.idPais,req.body.annio]);

                res.render('reporteria/annio', {annios,  req , layout: 'blanco'});
        } catch (error) {
                mensajeria.MensajerErrores("\n\n Archivo : reporteria.js \n Error en el directorio: /buscarProyecto \n" + error + "\n Generado por : " + req.user.login);
                res.redirect(   url.format({
                    pathname:'/dashboard',
                            query: {
                            "a": 1
                            }
                        }));    
        }

    

});

router.get('/proyectos/:id',isLoggedIn,  async (req, res) => {

        try {
               
                const { id } = req.params;

                const indicadoresAvancesUser = await pool.query("SELECT *, DATE_FORMAT( t1.fecha, '%Y-%m-%d') as fecha " +
                                                                " FROM pro_proyecto_avance AS t1 " +
                                                                " WHERE  " +
                                                                " t1.id_proyecto = ? ", [id] );

               // console.log(indicadoresAvancesUser);

                // valores de moneda de UF 
                const valorUFMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha, MAX(t1.valor) as valor FROM moneda_valor AS t1 WHERE t1.id_moneda = 4 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");

                let valorUfMensual = []; // Ordenamiento por pesona. 

                valorUFMes.forEach(
                        element => {    
                                       const containsFecha = !!valorUfMensual.find(fecha => {return fecha.fecha === element.fecha });

                                        if (containsFecha === false)
                                        {
                                                valorUfMensual.push(
                                                        { 
                                                                fecha : element.fecha,
                                                                valor : element.valor
                                                        }
                                                      );
                                        }
                                    }
                       );

                //console.log(valorUfMensual);                    
   
                /// buscar la informacion del proyecto con el id que viene por la ruta GET
            
                const proyecto = await pool.query("SELECT t1.year, t1.nombre, t1.code, t2.descripcion , t1a.name AS nomCliente,t1.valor_metro_cuadrado,t1.num_plano_estimado,"+
                                                  " t1b.Nombre AS nomDire, t1c.Nombre AS nomJefe, t3.descripcion AS tipologia,t1.superficie_pre,t1.id, t4.descripcion AS tipoServicio," +
                                                  " t1.valor_proyecto, t3.porcentaje_costo, t3.limite_rojo, t3.limite_amarillo " +
                                                  " FROM pro_proyectos as t1 " +
                                                  " LEFT JOIN contacto AS t1a ON t1.id_cliente = t1a.id "+
                                                  " LEFT JOIN sys_usuario AS t1b ON t1.id_director = t1b.idUsuario" +
                                                  " LEFT JOIN sys_usuario AS t1c ON t1.id_jefe = t1c.idUsuario ,"+
                                                  " proyecto_estado AS t2, proyecto_tipo AS t3 , proyecto_servicio as t4 "+
                                                  " WHERE t1.id = ?"+
                                                  " AND t1.id_estado = t2.id" +
                                                  " AND t1.id_tipo_servicio = t4.id" +
                                                  " AND t1.id_tipo_proyecto = t3.id", [id]);
            
            
                const facturas = await pool.query("SELECT *, t5.descripcion AS tipoCobro, if(t1.es_roc = 1 ,'SI','No' ) as roc, t4.descripcion AS moneda, t2.descripcion AS estadoFac,  " +
                                                        " ( " +
                                                        " SELECT format(t1a.valor,2, 'de_DE') " +
                                                        " FROM " +
                                                                " moneda_valor AS t1a " +
                                                        " WHERE  " +
                                                                " t1a.id_moneda = 4 " +
                                                        " AND " +
                                                                " t1a.fecha_valor = t1.fecha_factura " +
                                                        " LIMIT 1 " +
                                                        " ) AS 'uf_valor'" +
                                                    " FROM fact_facturas AS t1 " +
                                                    " LEFT JOIN sys_usuario AS t1a ON t1.id_solicitante = t1a.idUsuario,"+
                                                    " fact_estados AS t2, " +
                                                    " moneda_tipo AS t4, " +
                                                    " fact_tipo_cobro AS t5 " +
                                                    " WHERE  " +
                                                            " t1.id_estado = t2.id " +
                                                    " AND " +
                                                            " t1.id_proyecto = ? " +
                                                    " AND  " +
                                                            " t1.id_estado in (1,2,3) "+
                                                    " AND  " +
                                                            " t1.id_tipo_moneda = t4.id_moneda" +
                                                    " AND " +
                                                            "t1.id_tipo_cobro = t5.id",[id]);


                const cexternos = await pool.query("SELECT " +
                                                            " t1.cc_a_pagar 	AS ccosto, " +
                                                            " t2.descripcion AS moneda, " +
                                                            " t1.def_trabajo AS descripcion, " +
                                                            " t1.num_occ AS numoc, "+
                                                            " t1.num_hh 		AS numhh, " +
                                                            " t1.costo 		AS costo, " +
                                                            " t1a.nombre as nNombre, " +
                                                            " FORMAT(costo / t1b.valor,2) AS totPro " +
                                                    " FROM " +
                                                            " proyecto_costo_externo AS t1 " +
                                                            " LEFT JOIN moneda_valor AS t1b ON DATE_FORMAT( t1.fecha_carga, '%Y-%m-%d') = t1b.fecha_valor AND t1b.id_moneda = 4  " +
                                                            " LEFT JOIN proyecto_prov_externo as t1a ON t1.id_prob_externo = t1a.id_prov_externo  , " +
                                                            " moneda_tipo AS t2 " +
                                                    " WHERE  " +
                                                            " t1.id_proyecto = ? " +
                                                    " AND  " +
                                                            "t1.id_moneda = t2.id_moneda"+
                                                    " UNION " +
                                                    " SELECT  " +
                                                            " t2.centroCosto AS ccosto,"+
                                                            " t3a.descripcion AS moneda, " +
                                                            " t3.descripcion AS descripcion,"+
                                                            " t1.folio AS numoc,"+
                                                            " t3.cantidad AS numhh,"+
                                                            " if (t3.id_moneda = 4,FORMAT( t3.precio_unitario * t3.tipo_cambio,0,'de_DE'), 0) AS costo, "+
                                                            " if (t1.id_tipo = 3 , 'Empresa' , (SELECT t1c.nombre FROM prov_externo AS t1c WHERE t1c.id = t1.id_razonsocialpro)) as nNombre , "+
                                                            " if (t3.id_moneda = 4, t3.cantidad * t3.precio_unitario,0) AS totPro " +
                                                     " FROM " +
                                                            " orden_compra AS t1, " +
                                                            " centro_costo AS t2, " +
                                                            " orden_compra_requerimiento AS t3 " +
                                                            " LEFT JOIN   moneda_tipo AS t3a ON t3.id_moneda = t3a.id_moneda " +
                                                     " WHERE  " +
                                                            " t1.id_proyecto = ? " +
                                                     " AND  " +
                                                            " t1.id_estado > 2 " +
                                                     " AND  " +
                                                            " t1.id_centro_costo = t2.id " +
                                                      " AND  " +
                                                            " t1.id = t3.id_solicitud  ",[id, id]);
      
                    var numHH = 0;
                let centroCostoHH = [];
                cexternos.forEach(element => {
                                        //console.log(element);
                                        numHH = numHH + element.numhh; 

                                        const containsCentroCosto = !!centroCostoHH.find(centro => {return centro.nombre === element.ccosto });

                                        if (containsCentroCosto === true)
                                        {
                                         const colCentroCosto = centroCostoHH.find(centro => {return centro.nombre === element.ccosto });
                                         colCentroCosto.horas = colCentroCosto.horas + parseInt(element.numhh);
                                         colCentroCosto.totPro = parseFloat( colCentroCosto.totPro) + parseFloat(element.totPro);
                                         
                                        }
                                        else
                                        {
                                                centroCostoHH.push(
                                                        { 
                                                                nombre : element.ccosto,
                                                                horas : parseInt(element.numhh),
                                                                totPro : parseFloat(element.totPro)
                                                        }
                                                      );
                                        }
                                });
                                
                //console.log(centroCostoHH); 
                 

                 const centro_costo = await pool.query("SELECT " +
                                                        " t2.Nombre AS nombre, " +
                                                        " SUBSTRING(t1.date,1,7) AS fecha, " +
                                                        " 'moneda' AS moneda, " +
                                                        " 'valor' AS valorMonda, " +
                                                        " SUM(t1.nHH) / 6 AS numHH, " +
                                                        " SUM(t1.nHE) / 6 AS numHE, " +
                                                        " (SUM(t1.nHH) / 6 + SUM(t1.nHE) / 6) AS t, " +	 
                                                        " 'total' AS total, " +
                                                        " t2b.centroCosto AS centroCosto, " +
                                                        " 'Total Proyecto' AS totalPro " +
                                                        " FROM  " +
                                                        " bitacora AS t1, " +
                                                        " sys_usuario AS t2 " +
                                                                " LEFT JOIN sys_categoria AS t2a ON t2.idCategoria = t2a.id " +
                                                                " LEFT JOIN centro_costo AS t2b ON t2a.idCentroCosto = t2b.id " +
                                                        " WHERE  " +
                                                        " t1.project = ? " +
                                                        " AND  " +
                                                        " t1.owner = t2.idUsuario " +
                                                        " GROUP BY centroCosto " +
                                                        " ORDER BY t DESC",[id]);
        var costoMesUsuario = [];
        var erroresCosto = [];
        var mensaje = "";
        var varTotalProyecto = "";

        const detalleInterno = await pool.query(" SELECT " +
                                                " t2.Nombre AS nombre, " +
                                                " t2.idUsuario AS idUsuario, " +
                                                " SUBSTRING(t1.date,1,7) AS fecha, " +
                                                " SUBSTRING(t1.date,1,4) AS annio, " +
                                                " SUBSTRING(t1.date,6,2) AS mes, " +
                                                " 'moneda' AS moneda, " +
                                                " 'valor' AS valorMonda, " +
                                                " SUM(t1.nHH) / 6 AS numHH, " +
                                                " SUM(t1.nHE) / 6 AS numHE, " +
                                                " (SUM(t1.nHH) / 6 + SUM(t1.nHE) / 6) AS t, " +	 
                                                " 'total' AS total, " +
                                                " t2b.centroCosto AS centroCosto, " +
                                                " 'Total Proyecto' AS totalPro, " +
                                                " t2c.costo AS costoMes " +
                                                " FROM  " +
                                                " bitacora AS t1 " +
                                                " LEFT JOIN sys_usuario_costo AS t2c ON t2c.idUsuario = t1.owner AND t2c.annio = SUBSTRING(t1.date,1,4) AND t2c.mes = SUBSTRING(t1.date,6,2),   "+
                                                " sys_usuario AS t2 " +
                                                        " LEFT JOIN sys_categoria AS t2a ON t2.idCategoria = t2a.id " +
                                                        " LEFT JOIN centro_costo AS t2b ON t2a.idCentroCosto = t2b.id " +
                                                " WHERE  " +
                                                " t1.project = ? " +
                                                " AND  " +
                                                " t1.owner = t2.idUsuario " +
                                                " GROUP BY fecha, nombre " +
                                                " UNION " +
                                                " SELECT  " +
                                                              "  t2.Nombre AS nombre,"+
                                                              " t2.idUsuario AS idUsuario,"+
                                                              "  SUBSTRING(t1.ini_time,1,7) AS fecha,"+
                                                              "  SUBSTRING(t1.ini_time,1,4) AS annio,"+
                                                              "  SUBSTRING(t1.ini_time,6,2) AS mes,"+
                                                              "  'moneda' AS moneda, "+
                                                              "  'valor' AS valorMonda,"+
                                                              "  SUM(TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600) AS numHH, "+
                                                              "  0 as numHE, " +
                                                              "  SUM(TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600) AS t, " +
                                                              "  'total' AS total, " +
                                                              "  t2b.centroCosto AS centroCosto, " +
                                                              "  'Total Proyecto' AS totalPro, " +
                                                              "  t2c.costo AS costoMes " +     
                                                " FROM  " +
                                                              "  bita_horas AS t1 " +
                                                                        " LEFT JOIN sys_usuario_costo AS t2c ON t2c.idUsuario = t1.id_session AND t2c.annio = SUBSTRING(t1.ini_time,1,4) AND t2c.mes = SUBSTRING(t1.ini_time,6,2), " +
                                                              " sys_usuario AS t2 " +
                                                                        " LEFT JOIN sys_categoria AS t2a ON t2.idCategoria = t2a.id " +
                                                                        " LEFT JOIN centro_costo AS t2b ON t2a.idCentroCosto = t2b.id " +
                                                " WHERE  " +
                                                              " t1.id_project = ? " +
                                                " AND  " +
                                                                " t1.id_session = t2.idUsuario " +
                                                " GROUP BY fecha, nombre " +
                                                " ORDER BY t DESC",[id,id]);



        let modificaciones = await pool.query("SELECT (SUM(t1.nHH) / 6 + SUM(t1.nHE) / 6) AS horas " +
                                " FROM  " +
                                " bitacora AS t1 " +
                                " WHERE  " +
                                            "  t1.project = ? " +
                                " AND  " +
                                            "  t1.modificacion = 1 " +
                                " UNION  " +
                                " SELECT  " +
                                             " SUM(TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600) AS horas " +
                                " FROM " +
                                          "   bita_horas AS t1 "+
                                " WHERE  " +
                                            "    t1.id_project = ? " +
                                " AND  "+
                                         "    t1.modificacion = 1 " +
                                "GROUP BY t1.id_project",[id,id]);
        

        let colaboradores = []; // Ordenamiento por pesona. 
        let colaboradoresCentroCosto = [];
        let colaboradoresCentroCostoGeneral = [];
        let costoColaborador = [];                        
        detalleInterno.forEach(
                element => {  
                        //console.log(element);  
                               if (element.costoMes === null) {
                                let costoColaboradorUserValor = costoColaborador.find(user => {return user.nombre === element.nombre });

                                if (costoColaboradorUserValor !== undefined)
                                {
                                        element.costoMes = costoColaboradorUserValor.costo;
                                }
                                else
                                {
                                        // registrar este problema.
                                        element.costoMes = 15000;

                                }

                               }
                               else
                               {
                                const costoColaboradorUser = !!costoColaborador.find(user => {return user.nombre === element.nombre });

                                if (costoColaboradorUser === false)
                                {
                                        costoColaborador.push({
                                                nombre :  element.nombre,
                                                costo : element.costoMes
                                        });
                                }
                               }

                               const containsUser = !!colaboradores.find(user => {return user.nombre === element.nombre });

                               
                               const containsValorUF = !!valorUfMensual.find(fecha => {return fecha.fecha === element.fecha });

                               let valorDelMesUF = 0;

                               if (containsValorUF === true)
                               {
                                const colUF = valorUfMensual.find(fecha => {return fecha.fecha === element.fecha });
                                valorDelMesUF = colUF.valor;
                               }
                               else
                               {
                                       // registrar el error del valor de la UF MES
                               }


                                if (containsUser === true)
                                {
                                        const col = colaboradores.find(user => {return user.nombre === element.nombre });
                                        col.horas       =   col.horas + element.numHH;
                                        col.horasextras =   col.horasextras + element.numHE;
                                        col.horastotal  =   col.horastotal + element.t;
                                        col.costoHHMes  =   col.costoHHMes + (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5);
                                        col.valorUF     =   col.valorUF + (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesUF
                                }
                                else
                                {
                                    colaboradores.push(
                                                        { 
                                                                nombre : element.nombre,
                                                                horas : element.numHH,
                                                                horasextras : element.numHE,
                                                                horastotal : element.t,
                                                                costo : '',
                                                                porcentaje : 0,
                                                                costoHHMes : element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5,
                                                                valorUF : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesUF
                                                        }
                                                      );
                                }

                                // analisis por centro de costo. 
                                   const containsCentro = !!colaboradoresCentroCosto.find(centro => {return centro.nombre === element.centroCosto });
                                   if (containsCentro === true)
                                   {
                                        const colCentro = colaboradoresCentroCosto.find(centro => {return centro.nombre === element.centroCosto });
                                        colCentro.horas       =   colCentro.horas + element.t;
                                        colCentro.horasCosto       =   colCentro.horasCosto + (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesUF;
                                   }
                                   else
                                   {
                                        colaboradoresCentroCosto.push(
                                                { 
                                                        nombre : element.centroCosto,
                                                        horas : element.t,
                                                        horasCosto : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesUF,
                                                        externo : 0,
                                                        total :0
                                                }
                                              );
                                   }
                                   const containsCentroGeneral = !!colaboradoresCentroCostoGeneral.find(centro => {return centro.nombre === element.centroCosto });
                                   if (containsCentroGeneral === true)
                                   {
                                        const colCentroGeneral = colaboradoresCentroCostoGeneral.find(centro => {return centro.nombre === element.centroCosto });
                                        colCentroGeneral.horas       =   colCentroGeneral.horas + element.t;
                                        colCentroGeneral.horasCosto       =   colCentroGeneral.horasCosto + (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesUF;
                                   }
                                   else
                                   {
                                        colaboradoresCentroCostoGeneral.push(
                                                { 
                                                        nombre : element.centroCosto,
                                                        horas : element.t,
                                                        horasCosto : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesUF,
                                                        externo : 0,
                                                        total :0
                                                }
                                              );
                                   }

                            }
               );

             //  console.log("STEP 2 ");        

               let horasTotal= 0;
               colaboradores.forEach(element => {  
                const col = colaboradores.find(user => {return user.nombre === element.nombre });
                       horasTotal = horasTotal + col.horastotal;
                });
                
                colaboradores.forEach(element => {  
                        const col = colaboradores.find(user => {return user.nombre === element.nombre });
                                col.porcentaje = parseFloat(  (col.horastotal /horasTotal)*100 ).toFixed(2);
                                col.valorUF = parseFloat( col.valorUF ).toFixed(2);
                                col.horas = parseFloat( col.horas ).toFixed(2);
                                col.horastotal = parseFloat( col.horastotal ).toFixed(2);
                                
                        });

            
            colaboradoresCentroCosto.forEach(
                    element=> {
                        const containsCentro = !!centroCostoHH.find(centro => {return centro.nombre === element.nombre });
                         if (containsCentro === true)    
                         {
                                const centro = colaboradoresCentroCosto.find(centro => {return centro.nombre === element.nombre });   
                                const centroExterno = centroCostoHH.find(centro => {return centro.nombre === element.nombre });
                                centro.externo = centroExterno.horas;
                         }
                    }
            );

            colaboradoresCentroCostoGeneral.forEach(
                element=> {
                    const containsCentro = !!centroCostoHH.find(centro => {return centro.nombre === element.nombre });
                     if (containsCentro === true)    
                     {
                            const centro = colaboradoresCentroCostoGeneral.find(centro => {return centro.nombre === element.nombre });   
                            const centroExterno = centroCostoHH.find(centro => {return centro.nombre === element.nombre });
                            centro.externo = centroExterno.horas;
                            centro.costoUFExterno = parseFloat(centroExterno.totPro).toFixed(2);
                     }
                }
        );
            // 

            centroCostoHH.forEach(
                    element => {
                        const containsCentro = !!colaboradoresCentroCosto.find(centro => {return centro.nombre === element.nombre });
                        if (containsCentro === false) 
                        {
                                const centroCostoExterno = centroCostoHH.find(centro => {return centro.nombre === element.nombre });
                        }
                    }
            );

            centroCostoHH.forEach(
                    
                element => {
                     //   console.log(element);
                    const containsCentro = !!colaboradoresCentroCostoGeneral.find(centro => {return centro.nombre === element.nombre });
                    if (containsCentro === false) 
                    {
                            const centroCostoExterno = centroCostoHH.find(centro => {return centro.nombre === element.nombre });
                            colaboradoresCentroCostoGeneral.push({nombre : element.nombre,
                                    horas : 0,
                                    externo :centroCostoExterno.horas,
                                    costoUFExterno : parseFloat(centroCostoExterno.totPro).toFixed(2),
                                    total :0});    
                    }
                }
        );

            
            let interna = 0;
            let externa = 0;
            let total = 0;
            let costoUF = 0;

            let internaGeneral = 0;
            let externaGeneral = 0;
            let totalGeneral = 0;
            let costoUFGeneral = 0;
            let costoUFExteroGeneral = 0;

          
            colaboradoresCentroCosto.forEach(
                element => {
                        const centro = colaboradoresCentroCosto.find(centro => {return centro.nombre === element.nombre });
                        //console.log(centro);
                        centro.total = centro.horas + centro.externo;
                        interna = interna + centro.horas;
                        externa = externa + centro.externo;
                        total = total + centro.total;
                        costoUF = costoUF + centro.horasCosto;
                });

           colaboradoresCentroCostoGeneral.forEach(
                        element => {
                                const centro = colaboradoresCentroCostoGeneral.find(centro => {return centro.nombre === element.nombre });
                                //console.log(element);
                                centro.total = centro.horas + centro.externo;
                                internaGeneral = internaGeneral + centro.horas;
                                externaGeneral = externaGeneral + centro.externo;
                                totalGeneral = totalGeneral + centro.total;
                                if (centro.horasCosto === undefined){costoUFGeneral = costoUFGeneral + 0;}
                                else {costoUFGeneral = costoUFGeneral + centro.horasCosto;}
                                
                                if (centro.costoUFExterno === undefined){costoUFExteroGeneral = parseFloat(costoUFExteroGeneral) + 0;}
                                else {costoUFExteroGeneral = parseFloat(costoUFExteroGeneral) + parseFloat(centro.costoUFExterno);}

                                
                        });


            colaboradoresCentroCosto.push({nombre : 'TOTALES',
                        horas : interna,
                        externo :externa,
                        total :total,
                        horasCosto :costoUF
                });

            colaboradoresCentroCostoGeneral.push({nombre : 'TOTALES',
                        horas : internaGeneral,
                        externo :externaGeneral,
                        total :totalGeneral,
                        costoUFExterno : costoUFExteroGeneral,
                        horasCosto :costoUFGeneral,
                });


        colaboradoresCentroCosto.forEach(element => {  
                        //console.log(element);
                        const col = colaboradoresCentroCosto.find(centro => {return centro.nombre === element.nombre });
                        col.horas = parseFloat( col.horas ).toFixed(2);
                        col.externo = parseFloat( col.externo ).toFixed(2);
                        col.total = parseFloat( col.total ).toFixed(2);
                        col.horasCosto = parseFloat( col.horasCosto ).toFixed(2);
                        });

        colaboradoresCentroCostoGeneral.forEach(element => {  
                                
                                const col = colaboradoresCentroCostoGeneral.find(centro => {return centro.nombre === element.nombre });
                                col.horas = parseFloat( col.horas ).toFixed(2);
                                col.externo = parseFloat( col.externo ).toFixed(2);
                                col.total = parseFloat( col.total ).toFixed(2);
                                
                                if (col.horasCosto === undefined){ col.horasCosto = parseFloat( 0 ).toFixed(2);}
                                else {col.horasCosto = parseFloat( col.horasCosto ).toFixed(2);}

                                if (col.costoUFExterno === undefined){ col.costoUFExterno = parseFloat( 0 ).toFixed(2);}
                                else {col.costoUFExterno = parseFloat( col.costoUFExterno ).toFixed(2);}
                                
                                let costoUfLinea = parseFloat(col.costoUFExterno) + parseFloat(col.horasCosto);
                                col.costoTotal = parseFloat( costoUfLinea).toFixed(2);

                               // console.log(element);

                                });

            let porcentaje = proyecto[0].porcentaje_costo / 100;
            let costoEsperado = (parseFloat( proyecto[0].valor_proyecto) * porcentaje).toFixed(2);

          
            // facturas. 
            let totalFacturado = 0;
            let totalPagado = 0;
            facturas.forEach(element => {  

                totalFacturado = parseFloat(totalFacturado) + parseFloat( element.monto_a_facturar);

                if (element.estadoFac === "Pagada")
                {
                        totalPagado = parseFloat(totalPagado) + parseFloat( element.monto_a_facturar);
                }
            });
            
            totalFacturado = parseFloat(totalFacturado).toFixed(2);
            totalPagado = parseFloat(totalPagado).toFixed(2);

            if (mensaje === "")
            {
                    res.render('reporteria/dashboard', {indicadoresAvancesUser, totalPagado, totalFacturado, modificaciones:modificaciones[0], costoEsperado,colaboradoresCentroCostoGeneral, colaboradoresCentroCosto, colaboradores, erroresCosto, varTotalProyecto, numHH, centro_costo, cexternos,facturas, proyecto:proyecto[0], req , layout: 'template'});
            }
            else
            {
                    res.render('reporteria/dashboard', {indicadoresAvancesUser, totalPagado, totalFacturado, modificaciones:modificaciones[0], costoEsperado,colaboradoresCentroCosto, colaboradores, erroresCosto, mensaje, varTotalProyecto, numHH, centro_costo, cexternos,facturas, proyecto:proyecto[0], req , layout: 'template'});
            }
    
            
        } catch (error) {
           
                mensajeria.MensajerErrores("\n\n Archivo : reporteria.js \n Error en el directorio: /proyectos/:id \n" + error + "\n Generado por : " + req.user.login);
                                res.redirect(   url.format({
                                        pathname:'/dashboard',
                                                query: {
                                                "a": 1
                                                }
                                        })); 

        }

   
});

function search(user){
        return Object.keys(this).every((key) => user[key] === this[key]);
      }
      
router.get('/proyectos/horas/:id',isLoggedIn,  async (req, res) => {


        try {
                const { id } = req.params;

                
               
                const detalleInterno = await pool.query("SELECT " +
                " SUBSTRING(t1.date,1,7) AS fecha, " +
                " (SUM(t1.nHH) / 6 + SUM(t1.nHE) / 6) AS t, " +	 
                " t2b.centroCosto AS centroCosto, " +
                " t2b.color AS color " +
                " FROM  " +
                " bitacora AS t1, " +
                " sys_usuario AS t2 " +
                        " LEFT JOIN sys_categoria AS t2a ON t2.idCategoria = t2a.id " +
                        " LEFT JOIN centro_costo AS t2b ON t2a.idCentroCosto = t2b.id " +
                " WHERE  " +
                " t1.project = ? " +
                " AND  " +
                " t1.owner = t2.idUsuario " +
                " GROUP BY fecha, centroCosto "+
                " UNION " +
                " SELECT " +
                                " SUBSTRING(t1.ini_time,1,7) AS fecha,"+
                                " SUM(TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600) AS t," +
                                " t2b.centroCosto AS centroCosto, " +
                                " t2b.color AS color" +       
                " FROM  " +
                        " bita_horas AS t1,"+
                        " sys_usuario AS t2 "+
                                " LEFT JOIN sys_categoria AS t2a ON t2.idCategoria = t2a.id "+
                                " LEFT JOIN centro_costo AS t2b ON t2a.idCentroCosto = t2b.id " +
                " WHERE " +
                        " t1.id_project = ? " +
                " AND  " +
                        " t1.id_session = t2.idUsuario " +
                " GROUP BY fecha, centroCosto " +
                " ORDER BY fecha ASC",[id,id]);
                
                /*const detalleInterno = await pool.query("SELECT " +
                " SUBSTRING(t1.date,1,7) AS fecha, " +
                " (SUM(t1.nHH) / 6 + SUM(t1.nHE) / 6) AS t, " +	 
                " t2b.centroCosto AS centroCosto, " +
                " t2b.color AS color " +
                " FROM  " +
                " bitacora AS t1, " +
                " sys_usuario AS t2 " +
                        " LEFT JOIN sys_categoria AS t2a ON t2.idCategoria = t2a.id " +
                        " LEFT JOIN centro_costo AS t2b ON t2a.idCentroCosto = t2b.id " +
                " WHERE  " +
                " t1.project = ? " +
                " AND  " +
                " t1.owner = t2.idUsuario " +
                " GROUP BY fecha, centroCosto " +
                " ORDER BY fecha ASC",[id]);*/


                let informacion = [];
                let cinternos= [];

                const centrosCosto = await pool.query("  SELECT * FROM centro_costo");

                detalleInterno.forEach(element => {
                        const containsFecha = !!cinternos.find(fecha => {return fecha.fecha === element.fecha });

                        if (containsFecha ===false)
                        {
                                cinternos.push({
                                        fecha :element.fecha,
                                        centro : [],
                                        color : element.color,
                                        centroColores : centrosCosto
                                });
                                
                                let colCentroCosto = cinternos.find(fecha => {return fecha.fecha === element.fecha });
                                colCentroCosto.centro.push({
                                        centro : element.centroCosto,
                                        horas : element.t,
                                        color : element.color
                                });

                        }
                        else
                        {
                                let colCentroCosto = cinternos.find(fecha => {return fecha.fecha === element.fecha });
                                colCentroCosto.centro.push({
                                        centro : element.centroCosto,
                                        horas : element.t,
                                        color : element.color
                                }); 
                        }
                });

                //informacion.push(cinternos);
                
                //console.log(cinternos);
                       
                res.send(JSON.stringify(cinternos)); 
        } catch (error) {
                mensajeria.MensajerErrores("\n\n Archivo : reporteria.js \n Error en el directorio: /proyectos/horas/:id \n" + error + "\n Generado por : " + req.user.login);
                res.redirect(   url.format({
                    pathname:'/dashboard',
                            query: {
                            "a": 1
                            }
                        }));   
        }

        
});
//proyecto/2413

router.get('/horas',isLoggedIn,  async (req, res) => {

        try {
                // const paises = await pool.query('SELECT * FROM pais as t1 ORDER BY t1.pais ASC');
    
       // res.render('reporteria/buscarProyecto', {paises,  req , layout: 'template'});

       res.render('reporteria/bhoras', {  req , layout: 'template'});

        } catch (error) {
            
                mensajeria.MensajerErrores("\n\n Archivo : reporteria.js \n Error en el directorio: /horas \n" + error + "\n Generado por : " + req.user.login);
    res.redirect(   url.format({
        pathname:'/dashboard',
                query: {
                "a": 1
                }
            })); 

        }
    
       
    
    });

router.post('/cargaOpciones',isLoggedIn,  async (req, res) => {

        try {
               
                let annios = {};
       // console.log(req.body);
        switch(req.body.opcion)
        {
                case '1': // usuarios 
                //SELECT t1.idUsuario AS id , t1.Nombre AS descripcion  FROM sys_usuario AS t1 WHERE t1.id_estado = 1 AND t1.idUsuario NOT IN (1,2) ORDER BY t1.Nombre ASC
                 annios = await pool.query("SELECT t1.idUsuario AS id ,"+
                                                " t1.Nombre AS descripcion  " +
                                                " FROM sys_usuario AS t1 WHERE t1.id_estado = 1 AND t1.idUsuario NOT IN (1,2) ORDER BY t1.Nombre ASC");

                res.render('reporteria/annio', {  annios, req , layout: 'blanco'});
                break;
                case '2': // Centro Costo
                annios = await pool.query( "SELECT t1.id AS id , t1.centroCosto AS descripcion FROM centro_costo AS t1 ORDER BY t1.centroCosto ASC");
                res.render('reporteria/annio', {  annios, req , layout: 'blanco'});
                break;
                case '3': // Jefatura Directa
                annios = await pool.query(" SELECT t2.idUsuario AS id, t2.Nombre AS descripcion " +
                                                " FROM sys_usuario_equipo AS t1, sys_usuario AS t2 " +
                                                " WHERE t1.id_lider_equipo = t2.idUsuario GROUP BY t1.id_lider_equipo ORDER BY t2.Nombre asc ");
                res.render('reporteria/annio', {  annios, req , layout: 'blanco'});

                break;
        }

                
        } catch (error) {
                mensajeria.MensajerErrores("\n\n Archivo : reporteria.js \n Error en el directorio: /cargaOpciones \n" + error + "\n Generado por : " + req.user.login);
                res.redirect(   url.format({
                    pathname:'/dashboard',
                            query: {
                            "a": 1
                            }
                        }));      
        }
    
        

        
    
    });

router.post('/buscarHoras',isLoggedIn,  async (req, res) => {

        try {
                
        let objeto = req.body;
                
        let consulta = "";
        let parametros = {
                fecha_inicio : req.body.fecha_inicio,
                fecha_termino : req.body.fecha_termino
        };

        switch(req.body.stipoOpcion)
        {
          case 1:
          case '1':
                consulta = " SELECT t1.idUsuario, " +
		                " t1.Nombre, " +
		                " t4.centroCosto, " +
		                " t3.categoria, " +
		                " if (t2.id_lider_equipo is NOT NULL , (SELECT t1a.Nombre FROM sys_usuario AS t1a WHERE t1a.idUsuario = t2.id_lider_equipo) , 'N/A') AS lider " +
                                " FROM  " +
                        " sys_usuario AS t1 " +
                                        " LEFT JOIN sys_usuario_equipo AS t2 ON t1.idUsuario = t2.id_colaborador, " +
                        " sys_categoria AS t3, " +
                        " centro_costo AS t4 " +
                        " WHERE  " +
                                " t1.idUsuario = "+req.body.opcion+" " +
                        " AND  " +
                                " t1.idCategoria = t3.id " +
                        " AND  " +
                                " t3.idCentroCosto = t4.id " ;
                break; // USUARIOS ESPECIFICOS 
          case 2:
          case '2':
                consulta = " SELECT t1.idUsuario, "+
                                " t1.Nombre, " +
                                " t4.centroCosto, " +
                                " t3.categoria, " +
                                " if (t2.id_lider_equipo is NOT NULL , (SELECT t1a.Nombre FROM sys_usuario AS t1a WHERE t1a.idUsuario = t2.id_lider_equipo) , 'N/A') AS lider " +
                            " FROM " +
                                " sys_usuario AS t1 " +
                                " LEFT JOIN sys_usuario_equipo AS t2 ON t1.idUsuario = t2.id_colaborador, " +
                                " sys_categoria AS t3, " +
                                " centro_costo AS t4 " +
                                " WHERE  " +
                                                " t4.id = "+req.body.opcion+" " +
                                " AND  " +
                                                " t1.idCategoria = t3.id " +
                                " AND  " +
                                                " t3.idCentroCosto = t4.id " +
                                " AND  " +
                                                " t1.id_estado = 1 " +
                                " ORDER BY categoria ASC, Nombre ASC ";
                
                break; // Usuarios por centro de costo 
          case 3:
          case '3':
                  consulta = "SELECT "+
                                        " t2.idUsuario, " +
                                        " t2.Nombre, " +
                                        " t3.categoria, " +
                                        " t4.centroCosto, " +
                                        " t5.Nombre AS lider " +
                            " FROM " +
                                        " sys_usuario_equipo AS t1, " +
                                        " sys_usuario AS t2, " +
                                        " sys_categoria AS t3, " +
                                        " centro_costo AS t4, " +
                                        " sys_usuario AS t5 " +
                           " WHERE  " +
                                        " t1.id_lider_equipo = "+req.body.opcion+" "  +
                           " AND  " +
                                        " t1.id_colaborador = t2.idUsuario " +
                            " AND  " +
                                        " t2.idCategoria = t3.id " +
                           " AND   " +
                                        " t3.idCentroCosto = t4.id " +
                           " AND  " +
                                        " t1.id_lider_equipo = t5.idUsuario"  +
                          "   AND " +
	                                " t2.id_estado = 1"; 
                break; // usuarios por jefatura directa
        }
        
        let informacion = [];

        let inf =  await pool.query(consulta);
        let lstUser = "";
        for (const e of inf) {
                let consulta2 = " SELECT  " +
                                                " IF(	SUM( TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600) IS null , 0 ,SUM( TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600))  AS horas " +
                                        " FROM  " +
                                                " bita_horas AS t1 " +
                                        " WHERE  " +
                                                    "    t1.id_session = "+e.idUsuario+" "+
                                        " AND  " +
                                                  "      t1.ini_time BETWEEN '"+req.body.fecha_inicio+"' AND '"+ req.body.fecha_termino +"' " ;
                
                let consulta3 = "SELECT " +
                                        " if (SUM(t.numhh) IS NULL , 0 ,SUM(t.numhh))  AS cantidad " +
                                "  FROM " +
                                " sol_horaextra AS t " +
                                " WHERE  " +
                                        " t.idEstado = 3 " +
                                " AND  " +
                                        " t.idSolicitante = "+e.idUsuario+" " +
                                " AND  " +
                                        " t.fecha_solicitante BETWEEN  '"+req.body.fecha_inicio+"' AND '"+ req.body.fecha_termino +"'";

                
                lstUser += e.idUsuario+",";

                let horasBita =  await pool.query(consulta2);                                  
                let horasBitaExtra =  await pool.query(consulta3); 
                informacion.push({
                        idUsuario: e.idUsuario,
                                Nombre: e.Nombre,
                                centroCosto: e.centroCosto,
                                categoria: e.categoria,
                                lider: e.lider,
                                horas : horasBita[0].horas,
                                horaextras : horasBitaExtra[0].cantidad
                });
              }
        //167,214,96,3,5,17,32,75,53,106,126,122,108,100,175,130,
        lstUser = lstUser.substring(0, lstUser.length - 1);
        
        let sqlProyecto = " SELECT   "+
                                      "  IF(SUM( TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600) IS null , 0 ,SUM( TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600))  AS horas,"+
                                      "  t2.nombre "+
                                      "  FROM   "+
                                      "  bita_horas AS t1 "+
                                      "  LEFT JOIN pro_proyectos AS t2 ON t1.id_project = t2.id  "+
                                      "  WHERE "+
                                      "  t1.id_session in ( "+lstUser+" ) AND  t1.ini_time BETWEEN  '"+req.body.fecha_inicio+"'  AND '"+ req.body.fecha_termino +"' AND t1.id_project != -1"+
                                      "  GROUP BY t1.id_project" +
                                      "  UNION "+
                                      "  SELECT  "+
                                      "  IF(SUM( TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600) IS null , 0 ,SUM( TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600))  AS horas," +
                                      "  t1.title " +
                                      "  FROM   "+
                                      "  bita_horas AS t1 "+
                                      "  WHERE     "+ 
                                      "  t1.id_session in ( "+lstUser+") "+
                                      "  AND t1.ini_time BETWEEN  '"+req.body.fecha_inicio+"'  AND '"+ req.body.fecha_termino +"'"+
                                      "  AND t1.id_project = -1 "+
                                      "  ORDER BY horas DESC" ;

        let horasProyecto =  await pool.query(sqlProyecto);   

        //console.log(objeto);

        res.render('reporteria/infoHoras', {  objeto , informacion, parametros, horasProyecto , req , layout: 'template'});


        } catch (error) {
                mensajeria.MensajerErrores("\n\n Archivo : reporteria.js \n Error en el directorio: /buscarHoras \n" + error + "\n Generado por : " + req.user.login);
                res.redirect(   url.format({
                    pathname:'/dashboard',
                            query: {
                            "a": 1
                            }
                        }));     
        }

    
    
    });
  
router.get('/maps',isLoggedIn,  async (req, res) => {


        try {

                const proyectos = await pool.query(" SELECT * " +
                                                   " FROM  " +
                                                            " pro_proyectos AS t1 " +
                                                   " WHERE  " +
                                                            " t1.latitud != '' " +
                                                   " AND  " +
                                                            " t1.altitud != '' " );

                res.render('reporteria/gmaps2', { proyectos, req , layout: 'template'});
              
        } catch (error) {
                mensajeria.MensajerErrores("\n\n Archivo : reporteria.js \n Error en el directorio: /maps \n" + error + "\n Generado por : " + req.user.login);
                res.redirect(   url.format({
                    pathname:'/dashboard',
                            query: {
                            "a": 1
                            }
                        }));   
        }

        
});

router.get('/proyectosMaps',isLoggedIn,  async (req, res) => {


        try {
                const proyectos = await pool.query(" SELECT * " +
                                                   " FROM  " +
                                                            " pro_proyectos AS t1 " +
                                                   " WHERE  " +
                                                            " t1.latitud != '' " +
                                                   " AND  " +
                                                            " t1.altitud != '' " );



                   res.json(proyectos);
              
        } catch (error) {
             //   mensajeria.MensajerErrores("\n\n Archivo : reporteria.js \n Error en el directorio: /maps \n" + error + "\n Generado por : " + req.user.login);
             console.log(error);
                res.redirect(   url.format({
                    pathname:'/dashboard',
                            query: {
                            "a": 1
                            }
                        }));   
        }

        
});

//uptProyecto
router.post('/uptProyecto', isLoggedIn, async function (req, res) {

        let id = req.body["idProyecto"] ;

        const result = await pool.query('UPDATE pro_proyectos set superficie_pre = ?, valor_metro_cuadrado = ? ,num_plano_estimado = ?  WHERE id = ? ', [req.body["uptSuperficie"],
                                                                                                                                                        req.body["uptTarifa"],
                                                                                                                                                        req.body["uptPlanos"],
                                                                                                                                                        id]);
        res.send("1");
});

router.post('/avance', isLoggedIn, async function (req, res) {

   let avance = {
                        id_usuario : req.user.idUsuario,
                        id_proyecto : req.body["id"],
                        porcentaje_avance : req.body["porcentaje"] ,
                        observaciones : req.body["comentario"],
                        fecha :  new Date(),
                        superficie : req.body["superficie"],
                        planos : req.body["planos"],
                        venta: req.body["venta"],
                        costo : req.body["costo"],
                        margen_directo_uf :parseFloat( req.body["margenUF"]).toFixed(2),
                        margen_directo_porcentaje : parseFloat(req.body["margenPor"]).toFixed(2),
                        costoEstAvance : parseFloat(req.body["costoAvanceUF"]).toFixed(2),
                        desvCosto : parseFloat(req.body["desvCostoAvanceUF"]).toFixed(2),
                        porcDev : parseFloat(req.body["porcAvanceDesv"]).toFixed(2)
                };


    const idLogIngreso = await pool.query('INSERT INTO pro_proyecto_avance set ?', [avance]);

    res.send("1");

});

    
router.post('/exportExcelHoras', isLoggedIn, async function (req, res) {

        try {

                let consulta = "";
                let parametros = {
                        fecha_inicio : req.body.fecha_inicio,
                        fecha_termino : req.body.fecha_termino
                };
        
                switch(req.body.stipoOpcion)
                {
                  case 1:
                  case '1':
                        consulta = " SELECT t1.idUsuario, " +
                                        " t1.Nombre, " +
                                        " t4.centroCosto, " +
                                        " t3.categoria, " +
                                        " if (t2.id_lider_equipo is NOT NULL , (SELECT t1a.Nombre FROM sys_usuario AS t1a WHERE t1a.idUsuario = t2.id_lider_equipo) , 'N/A') AS lider " +
                                        " FROM  " +
                                " sys_usuario AS t1 " +
                                                " LEFT JOIN sys_usuario_equipo AS t2 ON t1.idUsuario = t2.id_colaborador, " +
                                " sys_categoria AS t3, " +
                                " centro_costo AS t4 " +
                                " WHERE  " +
                                        " t1.idUsuario = "+req.body.opcion+" " +
                                " AND  " +
                                        " t1.idCategoria = t3.id " +
                                " AND  " +
                                        " t3.idCentroCosto = t4.id " ;
                        break; // USUARIOS ESPECIFICOS 
                  case 2:
                  case '2':
                        consulta = " SELECT t1.idUsuario, "+
                                        " t1.Nombre, " +
                                        " t4.centroCosto, " +
                                        " t3.categoria, " +
                                        " if (t2.id_lider_equipo is NOT NULL , (SELECT t1a.Nombre FROM sys_usuario AS t1a WHERE t1a.idUsuario = t2.id_lider_equipo) , 'N/A') AS lider " +
                                    " FROM " +
                                        " sys_usuario AS t1 " +
                                        " LEFT JOIN sys_usuario_equipo AS t2 ON t1.idUsuario = t2.id_colaborador, " +
                                        " sys_categoria AS t3, " +
                                        " centro_costo AS t4 " +
                                        " WHERE  " +
                                                        " t4.id = "+req.body.opcion+" " +
                                        " AND  " +
                                                        " t1.idCategoria = t3.id " +
                                        " AND  " +
                                                        " t3.idCentroCosto = t4.id " +
                                        " AND  " +
                                                        " t1.id_estado = 1 " +
                                        " ORDER BY categoria ASC, Nombre ASC ";
                        
                        break; // Usuarios por centro de costo 
                  case 3:
                  case '3':
                          consulta = "SELECT "+
                                                " t2.idUsuario, " +
                                                " t2.Nombre, " +
                                                " t3.categoria, " +
                                                " t4.centroCosto, " +
                                                " t5.Nombre AS lider " +
                                    " FROM " +
                                                " sys_usuario_equipo AS t1, " +
                                                " sys_usuario AS t2, " +
                                                " sys_categoria AS t3, " +
                                                " centro_costo AS t4, " +
                                                " sys_usuario AS t5 " +
                                   " WHERE  " +
                                                " t1.id_lider_equipo = "+req.body.opcion+" "  +
                                   " AND  " +
                                                " t1.id_colaborador = t2.idUsuario " +
                                    " AND  " +
                                                " t2.idCategoria = t3.id " +
                                   " AND   " +
                                                " t3.idCentroCosto = t4.id " +
                                   " AND  " +
                                                " t1.id_lider_equipo = t5.idUsuario"  +
                                  "   AND " +
                                                " t2.id_estado = 1"; 
                        break; // usuarios por jefatura directa
                }


                let informacion = [];

                let inf =  await pool.query(consulta);
                let lstUser = "";
                for (const e of inf) {
                        let consulta2 = " SELECT  " +
                                                        " IF(	SUM( TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600) IS null , 0 ,SUM( TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600))  AS horas " +
                                                " FROM  " +
                                                        " bita_horas AS t1 " +
                                                " WHERE  " +
                                                            "    t1.id_session = "+e.idUsuario+" "+
                                                " AND  " +
                                                          "      t1.ini_time BETWEEN '"+req.body.fecha_inicio+"' AND '"+ req.body.fecha_termino +"' " ;
                        
                        let consulta3 = "SELECT " +
                                                " if (SUM(t.numhh) IS NULL , 0 ,SUM(t.numhh))  AS cantidad " +
                                        "  FROM " +
                                        " sol_horaextra AS t " +
                                        " WHERE  " +
                                                " t.idEstado = 3 " +
                                        " AND  " +
                                                " t.idSolicitante = "+e.idUsuario+" " +
                                        " AND  " +
                                                " t.fecha_solicitante BETWEEN  '"+req.body.fecha_inicio+"' AND '"+ req.body.fecha_termino +"'";
        
                        
                        lstUser += e.idUsuario+",";
        
                        let horasBita =  await pool.query(consulta2);                                  
                        let horasBitaExtra =  await pool.query(consulta3); 
                        informacion.push({
                                idUsuario: e.idUsuario,
                                        Nombre: e.Nombre,
                                        centroCosto: e.centroCosto,
                                        categoria: e.categoria,
                                        lider: e.lider,
                                        horas : horasBita[0].horas,
                                        horaextras : horasBitaExtra[0].cantidad
                        });
                      }


          res.writeHead(200, {
            'Content-Disposition': 'attachment; filename="Horas.xlsx"',
            'Transfer-Encoding': 'chunked',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
    
          var workbook = new Excel.stream.xlsx.WorkbookWriter({ stream: res });

          var worksheet = workbook.addWorksheet('some-worksheet');

          worksheet.addRow(['Colaborator', 'Centro Costo', 'Categoria' , 'Jefe Directo', 'Horas Bitácora', 'Horas Extras']).commit();
          
          informacion.forEach(element => {
                worksheet.addRow([element.Nombre,
                                  element.centroCosto,
                                  element.categoria,
                                  element.lider,
                                  element.horas,
                                  element.horaextras]);
          });

          worksheet.commit();
          workbook.commit();
      
          
        } catch (error) 
        {
          
          mensajeria.MensajerErrores("\n\n Archivo : reporteria.js \n Error en el directorio: /exportExcel \n" + error + "\n Generado por : " + req.user.login);
          res.redirect(   url.format({
              pathname:'/dashboard',
                      query: {
                      "a": 1
                      }
                  })); 
      
        }
      
        
          
        });


module.exports = router;
