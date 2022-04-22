const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../lib/auth');
const pool = require('../database');
const { isEmptyObject } = require('jquery');

const mensajeria = require('../mensajeria/mail');

var url = require('url');

//var Excel = require('exceljs');

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
   
                /// buscar la informacion del proyecto con el id que viene por la ruta GET
            
                const proyecto = await pool.query("SELECT t1.year, t1.nombre, t1.code, t2.descripcion , t1a.name AS nomCliente,t1.valor_metro_cuadrado,t1.num_plano_estimado,"+
                                                  " t1b.Nombre AS nomDire, t1c.Nombre AS nomJefe, t3.descripcion AS tipologia,t1.superficie_pre" +
                                                  " FROM pro_proyectos as t1 " +
                                                  " LEFT JOIN contacto AS t1a ON t1.id_cliente = t1a.id "+
                                                  " LEFT JOIN sys_usuario AS t1b ON t1.id_director = t1b.idUsuario" +
                                                  " LEFT JOIN sys_usuario AS t1c ON t1.id_jefe = t1c.idUsuario ,"+
                                                  " proyecto_estado AS t2, proyecto_tipo AS t3  "+
                                                  " WHERE t1.id = ?"+
                                                  " AND t1.id_estado = t2.id" +
                                                  " AND t1.id_tipo_proyecto = t3.id", [id]);
            
            
                const facturas = await pool.query("SELECT *, t5.descripcion AS tipoCobro, if(t1.es_roc = 1 ,'SI','No' ) as roc, t4.descripcion AS moneda " +
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
                                                            " t1.id_estado = 3"+
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
                                                            " 'valor Proyecto' AS totPro " +
                                                    " FROM " +
                                                            " proyecto_costo_externo AS t1, " +
                                                            " moneda_tipo AS t2 " +
                                                    " WHERE  " +
                                                            " t1.id_proyecto = ? " +
                                                    " AND  " +
                                                            "t1.id_moneda = t2.id_moneda",[id]);
                    var numHH = 0;
                     cexternos.forEach(element => {numHH = numHH + element.numhh; });
            
                 const numeroHoras = await pool.query("SELECT if (SUM(t1.nHH) / 6 +   SUM(t1.nHE) / 6 is NULL , 0 , SUM(t1.nHH) / 6 +   SUM(t1.nHE) / 6) as numHH FROM bitacora AS t1 WHERE t1.project = ?",[id]); 
                 const cinternos = await pool.query("SELECT " +
                                                            " t2.Nombre AS nombre, " +
                                                            " t2.idUsuario AS idUsuario, " +
                                                            " SUBSTRING(t1.date,1,7) AS fecha, " +
                                                            " 'moneda' AS moneda, " +
                                                            " 'valor' AS valorMonda, " +
                                                            " SUM(t1.nHH) / 6 AS numHH, " +
                                                            " SUM(t1.nHE) / 6 AS numHE, " +
                                                            " (SUM(t1.nHH) / 6 + SUM(t1.nHE) / 6) AS t, " +	 
                                                            " 'total' AS total, " +
                                                            " t2b.centroCosto AS centroCosto, " +
                                                            " 'costo' AS costo, " +
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
                                                            " GROUP BY nombre " +
                                                            " ORDER BY t DESC",[id]);
            
                    const detalleInterno = await pool.query("SELECT " +
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
                                                            " GROUP BY fecha, nombre " +
                                                            " ORDER BY t DESC",[id]);
            
                    const costoInterno = await pool.query("SELECT * FROM sys_usuario_costo AS t1");
                    var costoMesUsuario = [];
                    var erroresCosto = [];
                    var mensaje = "";
                    detalleInterno.forEach(
                            element => {    
                                            var query = {annio: element.annio, mes:  element.mes, idUsuario :element.idUsuario };
                                            var result = costoInterno.filter(search, query);
                                            costoMesUsuario.push(result);
                                            //console.log(result);
                                            if (result.length === 0)
                                            {
                                                    //console.log(element.annio + ":" + element.mes + " " + element.nombre);
                                                    element.costo = 0;
                                                    mensaje = "Exiten valores de usuario que no estan ingresados";
                                                    erroresCosto.push(element);
                                            }
                                            else
                                            {
                                                    //console.log(element.annio + "///"+ element.mes + "///" + element.idUsuario + "///" + result[0].costo);
                                                    element.costo = result[0].costo;
                                            }
                                        }
                           );
            
                    //console.log(detalleInterno);
                    var infoPersona = new Array();
                    
                    detalleInterno.forEach(
                                            element => {    
                                                    var query = { idUsuario :element.idUsuario };
                                                    var result = infoPersona.filter(search, query);
                                                            if (result.length === 0)
                                                            {
                                                                    infoPersona.push({ idUsuario :element.idUsuario, costo : Math.round(element.numHH  * element.costo + element.numHE  * element.costo *1.5)  });
                                                            }
                                                            else
                                                            {
                                                                    result[0].costo =  Math.round(result[0].costo) +  Math.round( element.numHH  * element.costo + element.numHE  * element.costo *1.5) ;
                                                            }
                                                        }
                                           );
                    
            
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
            
            
                   var numHHCosto = 0;
                            centro_costo.forEach(element => {numHHCosto = numHHCosto + element.t; });
            
            
                   var  varTotalProyecto = numHHCosto + numHH;
                   //console.log(infoPersona);
                   cinternos.forEach(
                    element => {    
                                    var query = { idUsuario :element.idUsuario };
                                    var result = infoPersona.filter(search, query);
                                    element.costo =result[0].costo;
                                    element.totalPro = Math.round( (element.t) / numeroHoras[0].numHH * 100, 2);
                                }
                   );
                   //console.log(cinternos);
            
            
            if (mensaje === "")
            {
                    res.render('reporteria/dashboard', { erroresCosto, varTotalProyecto, numHH, centro_costo,cinternos, cexternos,facturas, proyecto:proyecto[0], req , layout: 'template'});
            }
            else
            {
                    res.render('reporteria/dashboard', { erroresCosto, mensaje, varTotalProyecto, numHH, centro_costo,cinternos, cexternos,facturas, proyecto:proyecto[0], req , layout: 'template'});
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

                const maximos = await pool.query("SELECT  " +
                                                                " t1.owner " +
                                                " FROM  bitacora AS t1 WHERE   t1.project = "+id+"    " +       
                                                " GROUP BY t1.owner   " +
                                                " ORDER BY (SUM(t1.nHH) / 6 + SUM(t1.nHE) / 6) DESC " +
                                                "LIMIT 6");
        
               var userMaximo = "";
               maximos.forEach(element => {
                                                  if (userMaximo === ''){userMaximo  =  element.owner; }
                                                        else {userMaximo  = userMaximo + "," + element.owner;}
                                                 }
                                                );
               
                const cinternos = await pool.query("SELECT " +
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
                                                        " AND t1.owner IN ("+userMaximo+") " +
                                                        " GROUP BY nombre " +
                                                  "UNION " +
                                                  "SELECT " +
                                                        " 'Otros' AS nombre, " +
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
                                                        " AND t1.owner NOT IN ("+userMaximo+") " +                                              
                                                        " GROUP BY t1.project " +
                                                        " ORDER BY t DESC",[id,id]);
        
        
        
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

//proyectosMaps

    /*
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
*/

module.exports = router;
