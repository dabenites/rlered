const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../lib/auth');
const pool = require('../database');
const { isEmptyObject } = require('jquery');

router.get('/proyectos',isLoggedIn,  async (req, res) => {
    
    const paises = await pool.query('SELECT * FROM pais as t1 ORDER BY t1.pais ASC');

    res.render('reporteria/buscarProyecto', {paises,  req , layout: 'template'});

});

router.post('/buscarAnnio',isLoggedIn,  async (req, res) => {
    
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

});

router.post('/buscarProyecto',isLoggedIn,  async (req, res) => {
    
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

});

router.get('/proyectos/:id',isLoggedIn,  async (req, res) => {
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
                                                        " LEFT JOIN categorias AS t2a ON t2.idCategoria = t2a.id " +
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
                                                        " LEFT JOIN categorias AS t2a ON t2.idCategoria = t2a.id " +
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
                                                        " LEFT JOIN categorias AS t2a ON t2.idCategoria = t2a.id " +
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
    

});
function search(user){
        return Object.keys(this).every((key) => user[key] === this[key]);
      }
      

router.get('/proyectos/horas/:id',isLoggedIn,  async (req, res) => {
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
                                                        " LEFT JOIN categorias AS t2a ON t2.idCategoria = t2a.id " +
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
                                                        " LEFT JOIN categorias AS t2a ON t2.idCategoria = t2a.id " +
                                                        " LEFT JOIN centro_costo AS t2b ON t2a.idCentroCosto = t2b.id " +
                                                " WHERE  " +
                                                " t1.project = ? " +
                                                " AND  " +
                                                " t1.owner = t2.idUsuario " +
                                                " AND t1.owner NOT IN ("+userMaximo+") " +                                              
                                                " GROUP BY t1.project " +
                                                " ORDER BY t DESC",[id,id]);



        res.send(JSON.stringify(cinternos));
});
//proyecto/2413

module.exports = router;
