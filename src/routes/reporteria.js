const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../lib/auth');
const pool = require('../database');
const { isEmptyObject } = require('jquery');

const mensajeria = require('../mensajeria/mail');
var dateFormat = require('dateformat');
var url = require('url');

var Excel = require('exceljs');
const { parse } = require('path');
const { tpu_v1 } = require('googleapis');


router.get('/proyectos',isLoggedIn,  async (req, res) => {
    
        try {
                
                // const paises = await pool.query('SELECT * FROM pais as t1 ORDER BY t1.pais ASC');
                // res.render('reporteria/buscarProyecto', {paises,  req , layout: 'template'});
                
                sql = "SELECT t3.Nombre AS nomJefe, t4.Nombre AS nomDir, t2.name AS nomCli, t1.*,t5.descripcion as servicio, t6.descripcion as tipoProyecto  FROM pro_proyectos AS t1 "+ 
                        " LEFT JOIN proyecto_servicio AS t5 ON t1.id_tipo_servicio = t5.id " +
                        " LEFT JOIN proyecto_tipo AS t6 ON t1.id_tipo_proyecto = t6.id " +
                        " LEFT JOIN contacto AS t2 ON t1.id_cliente = t2.id " +
                        " LEFT JOIN sys_usuario AS t3 ON t1.id_jefe = t3.idUsuario " + 
                        " LEFT JOIN sys_usuario AS t4 ON t1.id_director = t4.idUsuario" +
                        " ORDER BY t1.id";

                const proyectos = await pool.query(sql);


                // Preguntar la informacion de las monedas. para la UF 
                let sqlUF = "SELECT * FROM moneda_valor AS t1 WHERE t1.id_moneda = 4";
                const valoresUF = await pool.query(sqlUF);

                let valoresUFBD = [];
                valoresUF.forEach(datoBD => {
                    
                let existeValor = valoresUFBD.find(valor => {return valor.fecha === datoBD.fecha_valor });
                
                if (existeValor == undefined)
                {
                        let valorFecha = {
                                fecha : datoBD.fecha_valor,
                                valor : datoBD.valor
                        }
                        valoresUFBD.push(valorFecha);
                }              
                });

                

                const inicio = new Date("2009-09-01");
                const fin = new Date("2009-12-31");
                const UN_DIA_EN_MILISEGUNDOS = 1000 * 60 * 60 * 24;
                const INTERVALO = UN_DIA_EN_MILISEGUNDOS * 1; // Cada dia
                

                //#################################################################################
                for (let i = inicio; i <= fin; i = new Date(i.getTime() + INTERVALO)) {

                        let fechaFind = dateFormat(i, "yyyy-mm-dd");
                        let existeValorUF = valoresUFBD.find(valor => {return valor.fecha === fechaFind});

                        if (existeValorUF == undefined)
                        {
                            
                        }
                }
                //#################################################################################

                res.render('reporteria/buscarProyecto2', { proyectos, req, layout: 'template' });

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

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

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

function getSimboloByIdMoneda( idMoneda)
{
        let moneda = "UF";
        switch(idMoneda)
        {
                case "1":
                        moneda = "$";
                break;
                case "2":
                        moneda = "US$";         
                break;
                case "4":
                        moneda = "UF"
                break;
                case "10":
                        moneda = "S/";
                break;
        }

        return moneda;
}

router.get('/proyectos/:id',isLoggedIn,  async (req, res) => {

        try {
               
                let { id } = req.params;
                let moneda = "UF";

                let selectUF,selectUSD,selectSOL = "";

                if(isNaN(id)) 
                {
                        let informacion = id.split('_');
                        id = informacion[1];
                        moneda = getSimboloByIdMoneda(informacion[0]);

                        switch(moneda)
                        {
                                case "UF":
                                        selectUF = "selected";
                                        selectUSD = "";
                                        selectSOL = "";
                                break;
                                case "US$":
                                        selectUF = "";
                                        selectUSD = "selected";
                                        selectSOL = "";
                                break;
                                case "S/":
                                        selectUF = "";
                                        selectUSD = "";
                                        selectSOL = "selected";
                                break;
                        }
                }
                else
                {

                        // informacion del proyecto para que sea dinamico
                        let infoProyectoMoneda = await pool.query(" SELECT * FROM pro_proyectos as t1 WHERE t1.id = ? ", [id]);

                        switch(infoProyectoMoneda[0].id_tipo_moneda)
                        {
                                case 0:
                                case "0":
                                case 1:
                                case "1":
                                        selectUF = "selected";
                                        selectUSD = "";
                                        selectSOL = "";  
                                        moneda = "UF" ;
                                break;
                                case 2:
                                case "2":
                                        selectUF = "";
                                        selectUSD = "selected";
                                        selectSOL = "";
                                        moneda = "US$" ;
                                break;
                                case 10:
                                case "10":
                                        selectUF = "";
                                        selectUSD = "";
                                        selectSOL = "selected";
                                        moneda = "S/";
                                break;
                        
                        }

                }
                const indicadoresAvancesUser = await pool.query("SELECT *, DATE_FORMAT( t1.fecha, '%Y-%m-%d') as fecha " +
                                                                " FROM pro_proyecto_avance AS t1 " +
                                                                " WHERE  " +
                                                                " t1.id_proyecto = ? ", [id] );


                // listado de costos adiocionales que estan en la tabla de facturas. 
                let costoAdiocionales = await pool.query("SELECT t2.simbolo, t3.Nombre, t1.monto_a_facturar, t1.id,t1.fecha_solicitud  FROM fact_facturas AS t1, moneda_tipo AS t2, sys_usuario AS t3   " +
		                                         " WHERE t1.id_estado =  6 AND t1.id_proyecto = ? AND t1.id_tipo_moneda = t2.id_moneda AND t1.id_solicitante = t3.idUsuario" , [id]);


                // valores de moneda de UF 
                const valorUFMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha, MAX(t1.valor) as valor FROM moneda_valor AS t1 WHERE t1.id_moneda = 4 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");
                const valorDolarMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha, MAX(t1.valor) as valor FROM moneda_valor AS t1 WHERE t1.id_moneda = 2 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");
                const valorSolMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha, MAX(t1.valor) as valor FROM moneda_valor AS t1 WHERE t1.id_moneda = 10 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");

                
                let valorUfMensual = []; 
                let valorDolarMensual = [];
                let valorSolMensual = [];

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

                valorDolarMes.forEach(
                        element => {    
                                       const containsFecha = !!valorDolarMensual.find(fecha => {return fecha.fecha === element.fecha });

                                        if (containsFecha === false)
                                        {
                                                valorDolarMensual.push(
                                                        { 
                                                                fecha : element.fecha,
                                                                valor : element.valor
                                                        }
                                                      );
                                        }
                                    }
                       );

                valorSolMes.forEach(
                        element => {    
                                       const containsFecha = !!valorSolMensual.find(fecha => {return fecha.fecha === element.fecha });

                                        if (containsFecha === false)
                                        {
                                                valorSolMensual.push(
                                                        { 
                                                                fecha : element.fecha,
                                                                valor : element.valor
                                                        }
                                                      );
                                        }
                                    }
                       );

                  
   
                /// buscar la informacion del proyecto con el id que viene por la ruta GET
            
                const proyecto = await pool.query("SELECT t1.id_tipo_moneda,  t1.year, t1.nombre, t1.code, t2.descripcion , t1a.name AS nomCliente,t1.valor_metro_cuadrado,t1.num_plano_estimado,"+
                                                  " t1b.Nombre AS nomDire, t1c.Nombre AS nomJefe, t3.descripcion AS tipologia,t1.superficie_pre,t1.id, t4.descripcion AS tipoServicio," +
                                                  " t1.valor_proyecto, t3.porcentaje_costo, t3.limite_rojo, t3.limite_amarillo, " +
                                                  " t1e.valor AS valorDolar, "+
                                                  " t1e2.valor AS valorUF, " +
                                                  " t1e3.valor AS valorS " +
                                                  " FROM pro_proyectos as t1 " +
                                                  " LEFT JOIN moneda_valor AS t1e ON t1.fecha_inicio = t1e.fecha_valor AND t1e.id_moneda = 2  " +
                                                  " LEFT JOIN moneda_valor AS t1e2 ON t1.fecha_inicio = t1e2.fecha_valor AND t1e2.id_moneda = 4 " +
                                                  " LEFT JOIN moneda_valor AS t1e3 ON t1.fecha_inicio = t1e3.fecha_valor AND t1e3.id_moneda = 10 " +
                                                  " LEFT JOIN contacto AS t1a ON t1.id_cliente = t1a.id "+
                                                  " LEFT JOIN sys_usuario AS t1b ON t1.id_director = t1b.idUsuario" +
                                                  " LEFT JOIN sys_usuario AS t1c ON t1.id_jefe = t1c.idUsuario ,"+
                                                  " proyecto_estado AS t2, proyecto_tipo AS t3 , proyecto_servicio as t4 "+
                                                  " WHERE t1.id = ?"+
                                                  " AND t1.id_estado = t2.id" +
                                                  " AND t1.id_tipo_servicio = t4.id" +
                                                  " AND t1.id_tipo_proyecto = t3.id", [id]);
               
            
                const facturas = await pool.query("SELECT *, t1.id_estado as estadoFAC , t5.descripcion AS tipoCobro, if(t1.es_roc = 1 ,'SI','No' ) as roc, t4.descripcion AS moneda, t2.descripcion AS estadoFac,  " +
                                                        " ( " +
                                                        " SELECT format(t1a.valor,2, 'de_DE') " +
                                                        " FROM " +
                                                                " moneda_valor AS t1a " +
                                                        " WHERE  " +
                                                                " t1a.id_moneda = 4 " +
                                                        " AND " +
                                                                " t1a.fecha_valor = t1.fecha_factura " +
                                                        " LIMIT 1 " +
                                                        " ) AS 'uf_valor'," +
                                                        " (  SELECT format(t1b.valor,2, 'de_DE')   " +
                                                        " FROM  moneda_valor AS t1b  WHERE   t1b.id_moneda = 2  AND  t1b.fecha_valor = t1.fecha_factura  LIMIT 1  ) AS 'dolar_valor', " +
                                                        " (  SELECT format(t1c.valor,2, 'de_DE') " +
                                                        " FROM  moneda_valor AS t1c  WHERE   t1c.id_moneda = 10  AND  t1c.fecha_valor = t1.fecha_factura LIMIT 1  ) AS 'sol_valor' " +
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
                                                            " t1.id_estado in (0,1,2,3,6) "+
                                                    " AND  " +
                                                            " t1.id_tipo_moneda = t4.id_moneda" +
                                                    " AND " +
                                                            "t1.id_tipo_cobro = t5.id",[id]);
                
                //console.log("test");


                const cexternos = await pool.query("SELECT " +
                                                            " 3200 AS valorUFAux," +
                                                            " t1.fecha_carga  as fecha_carga, " +
                                                            " t1.cc_a_pagar 	AS ccosto, " +
                                                            " t2.descripcion AS moneda, " +
                                                            " t2.simbolo AS simbolo, " +
                                                            " t1.def_trabajo AS descripcion, " +
                                                            " t1.num_occ AS numoc, "+
                                                            " t1.num_hh 		AS numhh, " +
                                                            " FORMAT(t1.costo,0,'de_DE') AS costo, " +
                                                            " t1a.nombre as nNombre, " +
                                                            " FORMAT(costo / t1b.valor,2) AS totPro, " +
                                                            " (SELECT format(t1a.valor,2, 'de_DE') " +
                                                                   " FROM  " +
                                                                                " moneda_valor AS t1a  " +
                                                                    " WHERE   " +
                                                                                " t1a.id_moneda = 4  " +
                                                                        " AND  " +
                                                                                " t1a.fecha_valor = DATE_FORMAT( t1.fecha_carga, '%Y-%m-%d') " +
                                                                        " LIMIT 1) AS 'uf_valor', " +
                                                             " (  SELECT format(t1b.valor,2, 'de_DE')   " +
                                                                        " FROM  moneda_valor AS t1b  WHERE   t1b.id_moneda = 2  AND  t1b.fecha_valor = DATE_FORMAT( t1.fecha_carga, '%Y-%m-%d')  LIMIT 1  ) "+
                                                                        " AS 'dolar_valor', " +
                                                             " (  SELECT format(t1c.valor,2, 'de_DE')   " +
                                                                        " FROM  moneda_valor AS t1c  WHERE   t1c.id_moneda = 10  AND  t1c.fecha_valor = DATE_FORMAT( t1.fecha_carga, '%Y-%m-%d')  LIMIT 1  ) "+
                                                                        " AS 'sol_valor', " +
                                                             " 1 as punitario ," +
                                                             " 1 as pcambio" +
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
                                                            " ( SELECT th.valor FROM moneda_valor AS th WHERE th.id_moneda = 4 AND th.fecha_valor = DATE_FORMAT( t1.fecha_aprobacion, '%Y-%m-%d')) AS valorUFAux, " +
                                                            " DATE_FORMAT( t1.fecha_aprobacion, '%Y-%m-%d') as fecha_carga, " +
                                                            " t2.centroCosto AS ccosto,"+
                                                            " t3a.descripcion AS moneda, " +
                                                            " t3a.simbolo AS simbolo, " +
                                                            " t3.descripcion AS descripcion,"+
                                                            " t1.folio AS numoc,"+
                                                            " t3.cantidad AS numhh,"+
                                                            " if (t3.id_moneda = 4,FORMAT( t3.precio_unitario * t3.tipo_cambio,0,'de_DE'), 0) AS costo, "+
                                                            //" if (t1.id_tipo = 3 , 'Empresa' , (SELECT t1c.nombre FROM prov_externo AS t1c WHERE t1c.id = t1.id_razonsocialpro)) as nNombre , "+
                                                            " if (t1.id_tipo = 3 , 'Empresa' , "+
                                                            " if (t1.id_tipo = 2 , (SELECT t1c.nombre FROM prov_externo AS t1c WHERE t1c.id = t1.id_razonsocialpro)," +
                                                            " if (t1.id_tipo = 1 , (SELECT t1d.nombre FROM sys_usuario AS t1d WHERE t1d.idUsuario = t1.id_razonsocialpro), '2'))) as nNombre ,  " +
                                                            " if (t3.id_moneda = 4, t3.cantidad * t3.precio_unitario,0) AS totPro, " +
                                                            " 1 AS 'uf_valor'," +
                                                            " (  SELECT format(t1b.valor,2, 'de_DE')   " +
                                                                        " FROM  moneda_valor AS t1b  WHERE   t1b.id_moneda = 2  AND  t1b.fecha_valor = DATE_FORMAT( t1.fecha_aprobacion, '%Y-%m-%d')  LIMIT 1  ) "+
                                                                        " AS 'dolar_valor', " +
                                                            " (  SELECT format(t1c.valor,2, 'de_DE')   " +
                                                                        " FROM  moneda_valor AS t1c  WHERE   t1c.id_moneda = 10  AND  t1c.fecha_valor = DATE_FORMAT( t1.fecha_aprobacion, '%Y-%m-%d')  LIMIT 1  ) "+
                                                                        " AS 'sol_valor' , " +
                                                            " t3.precio_unitario as punitario ," +
                                                            " t3.tipo_cambio as pcambio" +
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
                                        
                                let costoIngresado = element.costo.replace(".","");
                                
                                //dolar_valor: null,
                                //sol_valor: null,
                                if (element.dolar_valor === null)
                                {
                                        element.dolar_valor = "850";   
                                }
                                if (element.sol_valor === null)
                                {
                                        element.sol_valor = "240";
                                }


                                        switch(moneda) // moneda visualizacion por defecto UF
                                        {
                                                case "S/":
                                                        
                                                        switch(element.simbolo)
                                                        {
                                                                case "$":
                                                                        if (element.pcambio === "1") // no es una OC
                                                                        {
                                                                           element.totPro = (costoIngresado / element.sol_valor).toFixed(2);  
                                                                        }
                                                                break;
                                                                case "UF":
                                                                        element.totPro =    ((element.punitario *   element.numhh *  element.pcambio) /   element.sol_valor ).toFixed(2); 
                                                                break;
                                                                case "US$":
                                                                        if (element.pcambio === "1")
                                                                        {
                                                                                element.dolar_valor = element.dolar_valor.replace(".", "").replace(",",".");
                                                                                element.sol_valor = element.sol_valor.replace(".", "").replace(",",".")
                                                                                element.totPro =    ((costoIngresado * element.dolar_valor) /   element.sol_valor ).toFixed(2);
                                                                        } 
                                                                break;
                                                        }
                                                break;
                                                case "UF":
                                                        switch(element.simbolo)
                                                        {
                                                                case "UF":
                                                                        if (element.pcambio === "1") // no es una OC
                                                                        {
                                                                                element.totPro = costoIngresado;
                                                                                let costoUF_Pesos = costoIngresado * parseFloat(element.uf_valor.replace(".",""));
                                                                                element.costo = costoUF_Pesos;
                                                                        }
                                                                        else
                                                                        {
                                                                                
                                                                                element.costo =  new Intl.NumberFormat('de-DE').format(parseInt( element.numhh * element.punitario * element.pcambio));
                                                                                element.totPro = element.numhh * element.punitario;
                                                                        }
                                                                        
                                                                break;
                                                                case "$":
                                                                                

                                                                                if (element.pcambio === "1")
                                                                                {
                                                                                        if(element.uf_valor == "1")
                                                                                        {
                                                                                                // REVISAR 
                                                                                                element.totPro =  new Intl.NumberFormat('de-DE').format(parseInt( element.numhh * element.punitario / element.valorUFAux));
                                                                                                element.costo =  new Intl.NumberFormat('de-DE').format(parseInt( element.numhh * element.punitario));
                                                                                        }
                                                                                        else
                                                                                        {
                                                                                                element.costo =  new Intl.NumberFormat('de-DE').format(parseInt( element.totPro * element.uf_valor.replace(".","").replace(",",".")));
                                                                                        }
                                                                                }
                                                                                else
                                                                                {
                                                                                        if(element.uf_valor == "1")
                                                                                        {
                                                                                                // REVISAR 
                                                                                                element.totPro =  new Intl.NumberFormat('de-DE').format(parseInt( element.numhh * element.punitario / element.valorUFAux));
                                                                                                element.costo =  new Intl.NumberFormat('de-DE').format(parseInt( element.numhh * element.punitario));
                                                                                        }
                                                                                }
                                                                break;

                                                        }
                                                break;
                                                case "US$":
                                                        switch(element.simbolo)
                                                        {
                                                                case "UF":// ingresaron el costo externo en UF
                                                                        if (element.pcambio === "1") // no es una OC
                                                                        {
                                                                                let costoUF_Pesos = costoIngresado * parseFloat(element.uf_valor.replace(".",""));
                                                                                element.costo = costoUF_Pesos;
                                                                                element.totPro = parseFloat(costoUF_Pesos / element.dolar_valor.replace(",",".")).toFixed(2);
                                                                        }
                                                                        else
                                                                        {
                                                                                //let costoUF_Pesos = costoIngresado * parseFloat(element.pcambio.replace(".",""));
                                                                                let costoUF_Pesos = element.numhh * element.punitario * element.pcambio;

                                                                                element.costo = new Intl.NumberFormat('de-DE').format(parseInt( costoUF_Pesos));

                                                                                element.totPro = costoUF_Pesos / element.dolar_valor.replace(",",".");
                                                                                element.totPro = parseFloat(element.totPro).toFixed(2); 
                                                                                
                                                                        }
                                                                        
                                                                break;
                                                                case "$":// ingresaron el costo externo en Pesos
                                                                        if (element.pcambio === "1") // no es una OC
                                                                        {
                                                                                element.totPro = parseFloat(costoIngresado.replace(".","") / element.dolar_valor.replace(",",".")).toFixed(2);
                                                                        }
                                                                        else
                                                                        {
                                                                               
                                                                        }
                                                                        
                                                                break;
                                                        }
                                                break;
                                        }

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
        let arregloErroresUserCosto = [];

        let ArregloErroresFormateados = [];


        detalleInterno.forEach(
                element => {   
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
                                        arregloErroresUserCosto.push(element);

                                        let error = {
                                                tipo : "Costo Usuario",
                                                dato : element.nombre,
                                                fecha : element.fecha,
                                                valor_ref : 15000
                                        }
                                        ArregloErroresFormateados.push(error);
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

                               const containsValorDolar = !!valorDolarMensual.find(fecha => {return fecha.fecha === element.fecha });

                               const containsValorSol = !!valorSolMensual.find(fecha => {return fecha.fecha === element.fecha });


                               let valorDelMesUF = 0;
                               let valorDelMesDolar = 0;
                               let valorDelMesSol = 0;
                        
                               

                               if (containsValorUF === true)
                               {
                                const colUF = valorUfMensual.find(fecha => {return fecha.fecha === element.fecha });
                                valorDelMesUF = colUF.valor;
                               }
                               else
                               {
                                 // No existe el valor de la UF
                                 
                                 valorDelMesUF = 32000;

                                 let error = {
                                        tipo : "Costo Moneda",
                                        dato : "UF",
                                        fecha : element.fecha,
                                        valor_ref : 32000
                                }
                                ArregloErroresFormateados.push(error);


                               }

                               if (containsValorDolar === true)
                               {
                                const colDolar = valorDolarMensual.find(fecha => {return fecha.fecha === element.fecha });
                                valorDelMesDolar = colDolar.valor;
                               }
                               else
                               {
                                // No existe el valor del Dolar. 
                                valorDelMesDolar = 800;

                                let error = {
                                        tipo : "Costo Moneda",
                                        dato : "USD",
                                        fecha : element.fecha,
                                        valor_ref : 800
                                }
                                ArregloErroresFormateados.push(error);

                               }

                               if (containsValorSol === true)
                               {
                                const colSol = valorSolMensual.find(fecha => {return fecha.fecha === element.fecha });
                                valorDelMesSol = colSol.valor;
                               }
                               else
                               {
                                // No existe el valor del Dolar. 
                                valorDelMesSol = 240;

                                let error = {
                                        tipo : "Costo Moneda",
                                        dato : "SOL",
                                        fecha : element.fecha,
                                        valor_ref : 240
                                }
                                ArregloErroresFormateados.push(error);

                               }

                                


                                if (containsUser === true)
                                {
                                        const col = colaboradores.find(user => {return user.nombre === element.nombre });
                                        col.horas       =   col.horas + element.numHH;
                                        col.horasextras =   col.horasextras + element.numHE;
                                        col.horastotal  =   col.horastotal + element.t;
                                        col.costoHHMes  =   col.costoHHMes + (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5);
                                        col.valorUF     =   col.valorUF + (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesUF;
                                        col.valorDolar  =   col.valorDolar + (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesDolar;
                                        col.valorSol    =   col.valorSol + (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesSol;

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
                                                                valorUF : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesUF,
                                                                valorDolar : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesDolar,
                                                                valorSol : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesSol
                                                        }
                                                      );
                                }

                                // analisis por centro de costo. 
                                   const containsCentro = !!colaboradoresCentroCosto.find(centro => {return centro.nombre === element.centroCosto });
                                   if (containsCentro === true)
                                   {
                                        const colCentro = colaboradoresCentroCosto.find(centro => {return centro.nombre === element.centroCosto });
                                        colCentro.horas       =   colCentro.horas + element.t;
                                        colCentro.horasCosto  =   colCentro.horasCosto + (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesUF;
                                        colCentro.horasCostoDolar  =   colCentro.horasCostoDolar + (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesDolar;
                                        colCentro.horasCostoSol  =   colCentro.horasCostoSol + (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesSol;
                                   }
                                   else
                                   {
                                        colaboradoresCentroCosto.push(
                                                { 
                                                        nombre : element.centroCosto,
                                                        horas : element.t,
                                                        horasCosto : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesUF,
                                                        horasCostoDolar : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesDolar,
                                                        horasCostoSol : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesSol,
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
                                        colCentroGeneral.horasCosto  =   colCentroGeneral.horasCosto + (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesUF;
                                        colCentroGeneral.horasCostoDolar  =   colCentroGeneral.horasCostoDolar + (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesDolar;
                                        colCentroGeneral.horasCostoSol  =   colCentroGeneral.horasCostoSol + (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesSol;
                                   }
                                   else
                                   {
                                        colaboradoresCentroCostoGeneral.push(
                                                { 
                                                        nombre : element.centroCosto,
                                                        horas : element.t,
                                                        horasCosto : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesUF,
                                                        horasCostoDolar : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesDolar,
                                                        horasCostoSol : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesSol,
                                                        externo : 0,
                                                        total :0
                                                }
                                              );
                                   }

                            }
               );
       

               let horasTotal= 0;
               colaboradores.forEach(element => {  
                const col = colaboradores.find(user => {return user.nombre === element.nombre });
                       horasTotal = horasTotal + col.horastotal;
                });
                
                colaboradores.forEach(element => {  


                        const col = colaboradores.find(user => {return user.nombre === element.nombre });
                                col.porcentaje = parseFloat(  (col.horastotal /horasTotal)*100 ).toFixed(2);
                                col.valorUF = parseFloat( col.valorUF ).toFixed(2);
                                col.valorDolar = parseFloat( col.valorDolar ).toFixed(2);
                                col.valorSol = parseFloat( col.valorSol ).toFixed(2);
                                col.horas = parseFloat(col.horas ).toFixed(2);
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
                                centro.horasFormat = new Intl.NumberFormat('de-DE').format(centro.horas);
                                

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

            // 
            centroCostoHH.forEach(
                    
                element => {
                    const containsCentro = !!colaboradoresCentroCostoGeneral.find(centro => {return centro.nombre === element.nombre });
                    if (containsCentro === false) 
                    {
                        // Si no existe lo agrego. 
                        
                            const centroCostoExterno = centroCostoHH.find(centro => {return centro.nombre === element.nombre });
                            colaboradoresCentroCostoGeneral.push({nombre : element.nombre,
                                    horas : 0,
                                    externo :centroCostoExterno.horas,
                                    costoUFExterno : parseFloat(centroCostoExterno.totPro).toFixed(2),
                                    horasCosto : 0,
                                    horasCostoDolar : 0,
                                    horasCostoSol : 0,
                                    total :0});    
                    }
                }
        );


            let interna = 0;
            let externa = 0;
            let total = 0;
            let costoUF = 0;
            let costoDolar = 0;
            let costoSol = 0;

            let internaGeneral = 0;
            let externaGeneral = 0;
            let totalGeneral = 0;
            let costoUFGeneral = 0;
            let costoDolarGeneral = 0;
            let costoSolGeneral = 0;

            let costoUFExteroGeneral = 0;
            let costoDolarExteroGeneral = 0;

          
            colaboradoresCentroCosto.forEach(
                element => {
                        const centro = colaboradoresCentroCosto.find(centro => {return centro.nombre === element.nombre });

                        centro.total = centro.horas + centro.externo;
                        interna = interna + centro.horas;
                        externa = externa + centro.externo;
                        total = total + centro.total;
                        costoUF = costoUF + centro.horasCosto;
                        costoDolar = costoDolar + centro.horasCostoDolar;
                        costoSol = costoSol + centro.horasCostoSol;
                });


           colaboradoresCentroCostoGeneral.forEach(
                        element => {
                                const centro = colaboradoresCentroCostoGeneral.find(centro => {return centro.nombre === element.nombre });
                                centro.total = centro.horas + centro.externo;
                                internaGeneral = internaGeneral + centro.horas;
                                externaGeneral = externaGeneral + centro.externo;
                                totalGeneral = totalGeneral + centro.total;

                                if (centro.horasCosto === undefined){costoUFGeneral = costoUFGeneral + 0;}
                                else {costoUFGeneral = costoUFGeneral + centro.horasCosto;}

                                if (centro.horasCostoDolar === undefined){costoDolarGeneral = costoDolarGeneral + 0;}
                                else {costoDolarGeneral = costoDolarGeneral + centro.horasCostoDolar;}

                                if (centro.horasCostoSol === undefined){costoSolGeneral = costoSolGeneral + 0;}
                                else {costoSolGeneral = costoSolGeneral + centro.horasCostoSol;}


                                //costoSolGeneral

                                if (centro.costoUFExterno === undefined)
                                {
                                        costoUFExteroGeneral = parseFloat(costoUFExteroGeneral) + 0;
                                        costoDolarExteroGeneral = parseFloat(costoDolarExteroGeneral) + 0;

                                }
                                else {
                                        costoUFExteroGeneral = parseFloat(costoUFExteroGeneral) + parseFloat(centro.costoUFExterno);
                                        costoDolarExteroGeneral = parseFloat(costoDolarExteroGeneral) + parseFloat(centro.costoUFExterno);
                                }

                                
                        });

            
                  


            colaboradoresCentroCosto.push({nombre : 'TOTALES',
                        horas : interna,
                        horasFormat : new Intl.NumberFormat('de-DE').format(interna),
                        externo :externa,
                        total :total,
                        horasCosto :costoUF,
                        horasCostoDolar :costoDolar,
                        horasCostoSol :costoSol
                });
            
            colaboradoresCentroCostoGeneral.push({nombre : 'TOTALES',
                        horas : internaGeneral,
                        externo :externaGeneral,
                        total :totalGeneral,
                        costoUFExterno : costoUFExteroGeneral,
                        horasCosto :costoUFGeneral,
                        horasCostoDolar :costoDolarGeneral,
                        horasCostoSol :costoSolGeneral
                });

        
                

        colaboradoresCentroCosto.forEach(element => {  
                        const col = colaboradoresCentroCosto.find(centro => {return centro.nombre === element.nombre });
                        col.horas = parseFloat( col.horas ).toFixed(2);
                        col.externo = parseFloat( col.externo ).toFixed(2);
                        col.total = parseFloat( col.total ).toFixed(2);
                        col.horasCosto = parseFloat( col.horasCosto ).toFixed(2);
                        col.horasCostoDolar = parseFloat( col.horasCostoDolar ).toFixed(2);
                        });

         

         colaboradoresCentroCostoGeneral.forEach(element => {  



                                
                                const col = colaboradoresCentroCostoGeneral.find(centro => {return centro.nombre === element.nombre });
                                col.horas = parseFloat( col.horas ).toFixed(2);
                                col.externo = parseFloat( col.externo ).toFixed(2);
                                col.total = parseFloat( col.total ).toFixed(2);
                                
                                if (col.horasCosto === undefined){ col.horasCosto = parseFloat( 0 ).toFixed(2);}
                                else {col.horasCosto = parseFloat( col.horasCosto ).toFixed(2);}

                                if (col.horasCostoDolar === undefined){ col.horasCostoDolar = parseFloat( 0 ).toFixed(2);}
                                else {col.horasCostoDolar = parseFloat( col.horasCostoDolar ).toFixed(2);}


                                if (col.costoUFExterno === undefined){ col.costoUFExterno = parseFloat( 0 ).toFixed(2);}
                                else {col.costoUFExterno = parseFloat( col.costoUFExterno ).toFixed(2);}
                                
                                let costoUfLinea = parseFloat(col.costoUFExterno) + parseFloat(col.horasCosto);
                                let costoDolarLinea = parseFloat(col.horasCostoDolar) + parseFloat(col.horasCostoDolar);
                                let costoSolLinea = parseFloat(col.costoUFExterno) + parseFloat(col.horasCostoSol);

                                

                                col.costoTotal = parseFloat( costoUfLinea).toFixed(2);

                                col.costoTotalDolar = parseFloat( costoDolarLinea).toFixed(2);

                                col.costoTotalSol = parseFloat( costoSolLinea).toFixed(2);


                                });

        
        
        
            let porcentaje = proyecto[0].porcentaje_costo / 100;



        
          
            // facturas. 
            let totalFacturadoIngresado = 0;
            let totalFacturado = 0;
            let totalFacturadoDolar = 0;
            let totalPagado = 0;
            let totalPagadoDolar = 0;
            let totalRocPagado = 0;
        
            
           

            facturas.forEach(element => {  
                
                if (element.simbolo !== moneda) // la moneda de pago de la factura es distinta a la que se esta viendo en pantalla revisar los montos.
                {
                        let montoFacturar = 0;
                        let valorUF = 0;
                        let valorDolar = 0;
                        let valorSol = 0;


                        if ((element.estadoFac == "Ingresado") ||
                           (element.estadoFac == "Para Cobro"))

                        {
                                let fechaBuscar = dateFormat(element.fecha_solicitud, "yyyy-mm");

                               

                                let containsFechaSol = !!valorSolMensual.find(fecha => {return fecha.fecha === fechaBuscar});
                                let containsFechaUf = !!valorUfMensual.find(fecha => {return fecha.fecha === fechaBuscar});
                                let containsFechaUsd = !!valorDolarMensual.find(fecha => {return fecha.fecha === fechaBuscar});
                                

                                if (containsFechaSol === true){
                                        const colSOL = valorSolMensual.find(fecha => {return fecha.fecha === fechaBuscar });
                                        element.sol_valor = colSOL.valor.toString().replace(".",",");
                                }
                                if (containsFechaUf === true){
                                        const colUF = valorUfMensual.find(fecha => {return fecha.fecha === fechaBuscar });
                                        element.uf_valor = colUF.valor.toString().replace(".",",");
                                }
                                if (containsFechaUsd === true){
                                        const colUSD = valorDolarMensual.find(fecha => {return fecha.fecha === fechaBuscar });
                                        element.dolar_valor = colUSD.valor.toString().replace(".",",");
                                }
                        
                        }

                        if (element.monto_a_facturar !== null){ montoFacturar = parseFloat(element.monto_a_facturar.replace(".",""));}else{ montoFacturar =element.monto_a_facturar;}
                        if (element.uf_valor !== null){valorUF = parseFloat(element.uf_valor.replace(".","")); }else{valorUF =element.uf_valor; }
                        if (element.dolar_valor !== null){valorDolar = parseFloat(element.dolar_valor.replace(".",""));}else {valorDolar = element.dolar_valor;}
                        if (element.sol_valor !== null){valorSol = parseFloat(element.sol_valor.replace(".",""));}else {valorSol = element.sol_valor;}
                        // intentar traer el valor del dolar 


        

        //const containsFecha = !!valorSolMensual.find(fecha => {return fecha.fecha === element.fecha });
                
                   switch(element.simbolo) // simbolo de la entrada de la factura 
                   {
                       case("US$"): // entrada en dolares
                        switch(moneda) // de salida en pantalla 
                        {
                                case "UF":
                                        
                                        let montoUSD_UF = montoFacturar * valorDolar / valorUF;
                                        element.monto_a_facturar = parseFloat(montoUSD_UF).toFixed(2); // cambiar los DOLARES A UF 
                                break;
                                case "S/":
                                        
                                        let USD_PESO = parseFloat(montoFacturar) * parseFloat(valorDolar);
                                        
                                        let PESO_SOL = USD_PESO / parseFloat( element.sol_valor);

                                        element.monto_a_facturar = parseFloat(PESO_SOL).toFixed(2); // cambiar los DOLARES A SOL 
                                        element.sol_valor = parseFloat(PESO_SOL) / parseFloat(montoFacturar);
                                break;
                                case "US$":

                                break;
                        }
                       break;

                       case("UF"):
                        switch(moneda) // de salida en pantalla 
                        {
                                case "US$":// tenemos el valos en USD 
                                        // Notificar que no tengo el valor del dolar. 
                                        let montoUF_USD = montoFacturar * valorUF / valorDolar;
                                        element.monto_a_facturar = parseFloat(montoUF_USD).toFixed(2); // cambiar los DOLARES A UF 
                                break;
                                case "S/":
                                        
                                        let montoUF_SOL = montoFacturar * valorUF / valorSol;
                                        element.monto_a_facturar = parseFloat(montoUF_SOL).toFixed(2); // cambiar los DOLARES A UF 

                                break;
                        } 
                        break;   
                        
                        case ("$"):
                                switch(moneda) // de salida en pantalla 
                                {
                                        case "UF":
                                                let montoPeso_UF = montoFacturar / valorUF ;
                                                element.monto_a_facturar = parseFloat(montoPeso_UF).toFixed(2);
                                        break;
                                        case "US$":
                                                let montoPeso_Dolar = montoFacturar / valorDolar ;
                                                element.monto_a_facturar = parseFloat(montoPeso_Dolar).toFixed(2);
                                        break;
                                }  
                        break;

                        case ("S/"):
                                {
                                        switch(moneda) // de salida en pantalla 
                                        {
                                                case "UF":
                                                        let montoSOL_UF = montoFacturar * element.sol_valor / valorUF ;
                                                        element.monto_a_facturar = parseFloat(montoSOL_UF).toFixed(2);
                                                break;
                                        }     
                                }

                       
                   }
                }
                else
                {
                        element.sol_valor = 1;
                        element.dolar_valor = 1;
                        element.uf_valor = 1;
                }

                
                

                if (element.estadoFac === "Pagada")
                {
                        // ___
                        totalPagado = parseFloat(totalPagado) + parseFloat( element.monto_a_facturar.replace(",","."));
                        //totalRocPagado
                        if (element.roc == "SI")
                        {
                                totalRocPagado = parseFloat(totalRocPagado) + parseFloat( element.monto_a_facturar);
                        }
                }
                if (element.estadoFac != "Ingresado")
                {
                        totalFacturado = parseFloat(totalFacturado) + parseFloat( element.monto_a_facturar);
                }
                else
                {
                        
                        totalFacturadoIngresado = parseFloat(totalFacturadoIngresado) + parseFloat( element.monto_a_facturar);
                }
                
            });



            totalFacturado = parseFloat(totalFacturado).toFixed(2);
            totalFacturadoIngresado = parseFloat(totalFacturadoIngresado).toFixed(2);
            totalPagado = parseFloat(totalPagado).toFixed(2);

            let suma_a = parseFloat( proyecto[0].valor_proyecto);
            let suma_b = parseFloat( totalFacturadoIngresado);
            let suma_c = suma_a + suma_b + totalRocPagado;
           
            let costoEsperado = parseFloat( suma_c * porcentaje).toFixed(2);

            // revisar los valores de las de las facturas. 
            const isEqualHelperHandlerbar = function(a, b, opts) {
                if (a == b) {
                    return true
                } else { 
                    return false
                } 
            };

            let proGeneral = proyecto[0];
            proGeneral.valorUSD =  parseFloat(proGeneral.valor_proyecto * proGeneral.valorUF / proGeneral.valorDolar).toFixed(2);

            let costoEsperadoDolar = "";
            let costoEsperadoSol = "";
            //(parseFloat(proGeneral.valorUSD) * porcentaje).toFixed(2);
           

            //switch(proyecto[0].id_tipo_moneda)
            
            switch(moneda)
            {
                case 0:
                case "0":
                case "4":
                case "UF":
                case 4:
                        proGeneral.valorUSD =  parseFloat(proGeneral.valor_proyecto * proGeneral.valorUF / proGeneral.valorDolar).toFixed(2); 
                        costoEsperadoDolar = (parseFloat(proGeneral.valorUSD) * porcentaje).toFixed(2);

                        switch(proyecto[0].id_tipo_moneda)
                        {
                                case 2:
                                    proyecto[0].valor_proyecto   = parseFloat(proGeneral.valor_proyecto * proGeneral.valorDolar / proGeneral.valorUF).toFixed(2);
                                    proyecto[0].valor_metro_cuadrado   =parseFloat(proGeneral.valor_metro_cuadrado * proGeneral.valorDolar / proGeneral.valorUF).toFixed(2);
                                break;
                        }

                break;
                case 2:
                case "2":
                case "US$":
                        proGeneral.valorUSD = parseFloat(proGeneral.valor_proyecto).toFixed(2);
                        costoEsperadoDolar = (parseFloat(proGeneral.valorUSD) * porcentaje).toFixed(2);
                        
                        switch(proyecto[0].id_tipo_moneda)
                        {
                                case 4:
                                case 1:
                                    proyecto[0].valor_proyecto   = parseFloat(proGeneral.valor_proyecto * proGeneral.valorUF / proGeneral.valorDolar).toFixed(2);
                                    proyecto[0].valor_metro_cuadrado   =parseFloat(proGeneral.valor_metro_cuadrado * proGeneral.valorUF / proGeneral.valorDolar).toFixed(2);
                                break;
                        }
                break;
                /**
                 * REVISAR LA OPCION DE SOL
                 */
                case 10:
                case "10":
                case "S/":
                        
                        proGeneral.valorSOL = parseFloat(proGeneral.valor_proyecto).toFixed(2);
                        costoEsperadoSol = (parseFloat(proGeneral.valorSOL) * porcentaje).toFixed(2);
                        switch(proyecto[0].id_tipo_moneda)
                        {
                                case 2: /// USD
                                    proyecto[0].valor_metro_cuadrado   =parseFloat(proGeneral.valor_metro_cuadrado * proGeneral.valorDolar / proGeneral.valorS).toFixed(2);
                                    proGeneral.valorSOL = parseFloat(proGeneral.valor_proyecto * proGeneral.valorDolar / proGeneral.valorS).toFixed(2);
                                    proyecto[0].valor_proyecto  = parseFloat(proGeneral.valor_proyecto * proGeneral.valorDolar / proGeneral.valorS).toFixed(2);
                                break;
                                case 4: // UF
                                case 1: // PESO
                                    proyecto[0].valor_metro_cuadrado   =parseFloat(proGeneral.valor_metro_cuadrado * proGeneral.valorUF / proGeneral.valorS).toFixed(2);
                                    proGeneral.valorSOL = parseFloat(proGeneral.valor_proyecto * proGeneral.valorUF / proGeneral.valorS).toFixed(2);   
                                    proyecto[0].valor_proyecto  = parseFloat(proGeneral.valor_proyecto * proGeneral.valorUF / proGeneral.valorS).toFixed(2); 
                                break;
                        }
                break;
            }
            
            let flag = 0;

            if (ArregloErroresFormateados.length > 0 )
            {
                flag = 1;
            }
           
            let registros = {
                                cantidad : flag,
                                datos : ArregloErroresFormateados
            };


            ///////////// REVISION 21/12/2022
            let adicionalesIngresadosv2  =0; // Esto incluira :
                                             // Finanzas - Cobro Adcional (TODOS)
                                             // Facturas - ROC (Ingresada )

            let adicionalesPagadosv2 = 0;// Esto Incluira :
                                         // Facturas - ROC (PAGADAS)

            // facturas ingresadas en modulo de facuracion

           facturas.forEach(element => {  
                if (element.estadoFAC == 0 || element.estadoFAC == 1 || element.estadoFAC == 2) // estados filtrados 
                                                                                                // Para cobro // En adminitracion // En cobranza
                {
                        if (element.es_roc == 1) // Solo las roc
                                {
                                        if (element.simbolo == moneda)  // misma moneda de presentacion.
                                        {
                                                adicionalesIngresadosv2 = adicionalesIngresadosv2 +  parseFloat(element.monto_a_facturar);
                                        }
                                        else
                                        {       /*
                                                switch(moneda) // presentando 
                                                {
                                                        case "US$":
                                                                
                                                        break;
                                                        case "UF":
                                                                adicionalesIngresadosv2 = parseFloat(element.monto_a_facturar);
                                                        break;
                                                        case "S/":
                                                                
                                                        break;
                                                }*/
                                                adicionalesIngresadosv2 = parseFloat(element.monto_a_facturar);
                                        }
                                        
                                }
                }
                else if (element.estadoFAC == 3)
                {
                        if (element.es_roc == 1) // Solo las roc
                        {
                                if (element.simbolo == moneda)  // misma moneda de presentacion.
                                {
                                        adicionalesPagadosv2 = parseFloat(element.monto_a_facturar);
                                }
                                else
                                {
                                        adicionalesPagadosv2 = parseFloat(element.monto_a_facturar);
                                }
                                // expandir a las otras monedas en cuestion. 
                        } 
                }
           });
           // contrato_pago_adicional
           const pagosAdiocionalesDATA = await pool.query("SELECT * , "  +
                                                        " (SELECT format(t1a.valor,2, 'de_DE')  " +
                                                        " FROM  " +
                                                                " moneda_valor AS t1a  " +
                                                        " WHERE   " +
                                                                " t1a.id_moneda = 4  " +
                                                        " AND  " +
                                                                " t1a.fecha_valor = t1.fecha_ingreso  " +
                                                        " LIMIT 1 )  AS 'valorUF'," +
                                                        " (SELECT format(t1a.valor,2, 'de_DE') " +
                                                        " FROM  " +
                                                                " moneda_valor AS t1a " +
                                                        " WHERE  " +
                                                                " t1a.id_moneda = 10  " +
                                                        " AND  " +
                                                                " t1a.fecha_valor = t1.fecha_ingreso  " +
                                                        " LIMIT 1 )  AS 'valorSOL', " +
                                                        " (SELECT format(t1a.valor,2, 'de_DE') " +
                                                        " FROM  " +
                                                                " moneda_valor AS t1a  " +
                                                        " WHERE   " +
                                                                " t1a.id_moneda = 2  " +
                                                        " AND  " +
                                                                " t1a.fecha_valor = t1.fecha_ingreso " +
                                                        " LIMIT 1 )  AS 'valorDolar' "+
                                                          " FROM contrato_pago_adicional as t1, moneda_tipo as t2  " +
                                                          "WHERE t1.id_proyecto = ? " +
                                                          " AND t1.id_moneda = t2.id_moneda", [id] );

        pagosAdiocionalesDATA.forEach(element => {  
                if (element.simbolo == moneda)
                {       
                        adicionalesIngresadosv2 =parseFloat( adicionalesIngresadosv2) + parseFloat(element.monto);  
                }
                else
                {
                        element.monto = element.monto.replace(".","");
                        element.valorDolar = element.valorDolar.replace(".","");
                        element.valorUF = element.valorUF.replace(".","");
                        let aux = 0;

                        switch(moneda)
                        {
                                case "US$":
                                        
                                break;
                                case "UF":
                                        switch(element.simbolo)
                                        {
                                                case "US$":
                                                aux =  parseFloat( element.monto)  * parseFloat( element.valorDolar) / parseFloat( element.valorUF);
                                                aux = aux.toFixed(2);
                                                adicionalesIngresadosv2 = parseFloat( adicionalesIngresadosv2 ) + parseFloat(aux);                    
                                                break;
                                                case "S/":
                                                break;
                                        }
                                break;
                                case "S/":
                                        
                                break;
                        }
                }
        });


           let totalProyectov2 = 0; // Es valor del proyecto + Adicionales ingresados + Adicionales Pagados
           
           totalProyectov2 = adicionalesIngresadosv2 + adicionalesPagadosv2;
           
           /* 
           switch(moneda)
           {
                case "US$":
                        totalProyectov2 = parseFloat( totalProyectov2 ) + parseFloat( proGeneral.valorUSD );
                        
                break;
                case "UF":
                        totalProyectov2 = parseFloat( totalProyectov2 ) + parseFloat( proGeneral.valor_proyecto);
                        
                break;
                case "S/":
                        totalProyectov2 = parseFloat( totalProyectov2 ) + parseFloat( proGeneral.valorSOL);
                        
                break;
           }
           */
           totalProyectov2 = adicionalesIngresadosv2 + adicionalesPagadosv2 + parseFloat( proGeneral.valor_proyecto);

           let sql2 = " SELECT  " +
                    " t3a.descripcion AS substructura," +
                    "  t4a.descripcion AS  motivohito, "+
                    " t1a.numero AS numero, " +
                    " t5a.descripcion AS moneda, " +
                    " t1a.porcentaje AS porcentaje, " +
                    " t1a.monto AS monto, " +
                    " t1a.observacion AS observacion, " +
                    " 2 AS tiporegistro, " + 
                    " t1a.id AS id, " + 
                    " t6a.descripcion as tipoCobro " + 
            " FROM contrato_pago_adicional as t1a  " +
                " LEFT JOIN metod_subestructura AS t3a ON t1a.id_substructura = t3a.id "+
                " LEFT JOIN contrato_motivo_del_cobro AS t4a ON t1a.id_motivo = t4a.id " +
                " LEFT JOIN moneda_tipo AS t5a ON t1a.id_moneda = t5a.id_moneda " +
                " LEFT JOIN contrato_tipo_cobro_adicional AS t6a ON t1a.id_tipo_cobro = t6a.id " +
                " where t1a.id_proyecto = "+id+" ";

            let pago_adicional   = await pool.query(sql2); 

            pago_adicional.forEach(element => {
                element.monto = new Intl.NumberFormat('de-DE').format(parseInt( element.monto));
            });


            
            let costoEsperadov2 = (totalProyectov2 * porcentaje).toFixed(2);

            

            if (mensaje === "")
            {
                    res.render('reporteria/dashboard', { costoEsperadov2, pago_adicional, totalProyectov2, adicionalesPagadosv2, adicionalesIngresadosv2, totalFacturadoIngresado, costoAdiocionales, registros, selectUF,selectUSD,selectSOL ,proGeneral, moneda, indicadoresAvancesUser, totalPagado, totalFacturado, 
                                                        modificaciones:modificaciones[0], costoEsperado,costoEsperadoDolar,costoEsperadoSol, colaboradoresCentroCostoGeneral, 
                                                        colaboradoresCentroCosto, colaboradores, erroresCosto, varTotalProyecto, numHH, 
                                                        centro_costo, cexternos,facturas, proyecto:proyecto[0], req , layout: 'template', helpers : {
                                                                if_equal : isEqualHelperHandlerbar
                                                            }});
            }
            else
            {
                    res.render('reporteria/dashboard', { costoEsperadov2, pago_adicional, totalProyectov2, adicionalesPagadosv2, adicionalesIngresadosv2, totalFacturadoIngresado, costoAdiocionales, registros, selectUF,selectUSD,selectSOL , proGeneral, moneda, indicadoresAvancesUser, totalPagado, totalFacturado,
                                                        modificaciones:modificaciones[0], costoEsperado,
                                                        colaboradoresCentroCosto, colaboradores, erroresCosto, mensaje, varTotalProyecto, numHH, centro_costo, 
                                                        costoEsperadoDolar, cexternos,facturas, proyecto:proyecto[0], req , layout: 'template', helpers : {
                                                                if_equal : isEqualHelperHandlerbar
                                                            }});
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


//cargaCostoAdicional 
router.post('/cargaCostoAdicional', isLoggedIn, async function (req, res) {

        let idProyecto = req.body["idProyecto"];
        let ingreso_tipo_moneda = req.body["ingreso_tipo_moneda"];
        let ingreso_monto = req.body["ingreso_monto"];

        // cargar 
        //fact_facturas

        var fecha_ingreso = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");

        let registro = {
                fecha_solicitud : fecha_ingreso,
                id_proyecto : idProyecto,
                id_tipo_moneda : ingreso_tipo_moneda,
                id_estado : 6,
                monto_a_facturar : ingreso_monto,
                id_solicitante : req.user.idUsuario,
                roc : ''
        };

        
        const idLogIngreso = await pool.query('INSERT INTO fact_facturas set ?', [registro]);

        res.send("1");

});

//eliminarCostoAdiocional 
router.post('/eliminarCostoAdiocional', isLoggedIn, async function (req, res) {

        let iId = req.body["iId"];

        
        const idDelete = await pool.query('DELETE FROM `fact_facturas` WHERE  `id`= ? LIMIT 1;', [iId]);

        res.send("1");

});


router.post('/avance', isLoggedIn, async function (req, res) {

   let avance = {
                        id_usuario : req.user.idUsuario,
                        id_proyecto : req.body["id"],
                        moneda : req.body["moneda"],
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
                        porcDev : parseFloat(req.body["porcAvanceDesv"]).toFixed(2),
                        costo_esperado : parseFloat(req.body["costoEsperado"]).toFixed(2),
                        margen_pagado : parseFloat(req.body["MargenPagado"]).toFixed(2)
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


router.get('/buscaErroresProyecto',  async (req, res) => {

        // buscar informacion de los proyectos. 

        let fitrado_proyecto =  await pool.query(sqlProyectos);               


        


});


router.get('/analisisProyectos',  async (req, res) => {

        // listado de los proyectos 
        // inicialmente filtrare los proyectos de un jefe de proyecto Francisco Cordero como ejemplo 

        const valorUFMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha," +
                                            " MAX(t1.valor) as valor" +
                                            " FROM " + 
                                            " moneda_valor AS t1 " +
                                            " WHERE t1.id_moneda = 4 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");
        
        const valorUSDMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha," +
                                            " MAX(t1.valor) as valor" +
                                            " FROM " + 
                                            " moneda_valor AS t1 " +
                                            " WHERE t1.id_moneda = 2 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");

        const valorSOLMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha," +
                                            " MAX(t1.valor) as valor" +
                                            " FROM " + 
                                            " moneda_valor AS t1 " +
                                            " WHERE t1.id_moneda = 10 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");

        let valorUfMensual = []; 
        let valorUsdMensual = [];
        let valorSolMensual = [];
                                          
                            
        valorUFMes.forEach(element => {    
                                        const containsFecha = !!valorUfMensual.find(fecha => {return fecha.fecha === element.fecha });
                                                if (containsFecha === false)
                                                        {
                                                                valorUfMensual.push({ 
                                                                                            fecha : element.fecha,
                                                                                            valor : element.valor
                                                                                    });
                                                        }
                                        }
                           );

        valorUSDMes.forEach(element => {    
                                const containsFecha = !!valorUsdMensual.find(fecha => {return fecha.fecha === element.fecha });
                                        if (containsFecha === false)
                                                {
                                                        valorUsdMensual.push({ 
                                                                                    fecha : element.fecha,
                                                                                    valor : element.valor
                                                                            });
                                                }
                                }
                   );

        valorSOLMes.forEach(element => {    
                        const containsFecha = !!valorSolMensual.find(fecha => {return fecha.fecha === element.fecha });
                                if (containsFecha === false)
                                        {
                                                valorSolMensual.push({ 
                                                                            fecha : element.fecha,
                                                                            valor : element.valor
                                                                    });
                                        }
                        }
           );


        let sqlProyectos = " SELECT  " +
                                " t1.id,"+
                                " t1.`year`,"+
                                " t1.code,"+
                                " t1.nombre,"+
                                " t2.descripcion AS servicio, "+
                                " t3.descripcion AS tipo, "+
                                " t1.superficie_pre, " +
                                " t1.num_pisos, " +
                                " t1.num_subterraneo," + 
                                " t1.valor_proyecto," +
                                " t1.valor_metro_cuadrado," +
                                " t4.name AS mandante, "+
                                " t5.name AS arquitecto, "+
                                " t6.Nombre AS director, " +
                                " t7.Nombre AS jefe, " +
                                " t1.num_plano_estimado " +
                        " FROM " +
                               "  pro_proyectos AS t1 " +
                               "  LEFT JOIN proyecto_servicio AS t2 ON t1.id_tipo_servicio = t2.id " +
                               "  LEFT JOIN proyecto_tipo AS t3 ON t1.id_tipo_proyecto = t3.id "+
                               " LEFT JOIN contacto AS t4 ON t1.id_mandante = t4.id"+
                               " LEFT JOIN contacto AS t5 ON t1.id_arquitecto = t5.id"+
                               " LEFT JOIN sys_usuario AS t6 ON t1.id_director = t6.idUsuario"+
                               " LEFT JOIN sys_usuario AS t7 ON t1.id_jefe = t7.idUsuario "+
                         " WHERE " +
                            " t1.id_jefe in (8 , 52 , 73, 81 , 39, 21, 25,27,18,40,86,43,35,6,15,174,80,104,28,65,127,46,114,132,48,139,200,97) ";//+
                           // " t1.id_jefe in (8) "+//+
                            // "  t1.id in (2011,2015) ";
                                   //"  t1.id in (2316) ";
                      //        " t1.id_jefe in ( 81 ) ";
                       //" AND " +
                         //    " t1.id = 2570";

        //process.exit();


        let proyectos =  await pool.query(sqlProyectos);               

        let cabecera = {
                fecha_inicio: new Date()
        };

        const idCabecera = await pool.query('INSERT INTO pro_proyectos_info_cabecera set ?', [cabecera]);

        let star = 0;
        let registros = [];
        for (const p of proyectos) {
                star++;
                //preguntar la informacion
                //let informacionProyecto = await getInfoProyecto(p.id);

                let msj_proyecto = "";
                let msj_registro = {};
                
                try{
                    // SECTOR DE LAS HORAS INTERNAS DEL PROYECTO     
                    const horas_internas_proyecto = await getHorasInternaProyecto(p.id); 
                    let hh_int_ing = 0;
                    let hh_int_dib = 0;
                    let hh_int_cord = 0;
                    let hh_int_imasd = 0;
                    let hh_int_obra = 0;

                    horas_internas_proyecto.forEach(centroCosto => {
                      if (centroCosto.centroCosto == "INGENIERIA"){hh_int_ing = parseFloat(hh_int_ing) + parseFloat(centroCosto.t);}
                      if (centroCosto.centroCosto == "COORDINACION"){hh_int_cord = parseFloat(hh_int_cord) + parseFloat(centroCosto.t);}
                      if (centroCosto.centroCosto == "DIBUJO"){hh_int_dib = parseFloat(hh_int_dib) + parseFloat(centroCosto.t);}
                      if (centroCosto.centroCosto == "I+D"){hh_int_imasd = parseFloat(hh_int_imasd) + parseFloat(centroCosto.t);}
                      if (centroCosto.centroCosto == "OBRA"){hh_int_obra = parseFloat(hh_int_obra) + parseFloat(centroCosto.t);}
                    });

                    // SECTOR DE LAS HORAS EXTERNAS
                    const horas_externa_proyecto = await getHorasExternoProyecto(p.id); 

                    let hh_ext_ing = 0;
                    let hh_ext_dib = 0;
                    let hh_ext_cord = 0;
                    let hh_ext_imasd = 0;
                    let hh_ext_obra = 0;

                    horas_externa_proyecto.forEach(costoExterno => {
                        if (costoExterno.ccosto == "INGENIERIA"){hh_ext_ing = parseFloat(hh_ext_ing) + parseFloat(costoExterno.numhh);}
                        if (costoExterno.ccosto == "COORDINACION"){hh_ext_cord = parseFloat(hh_ext_cord) + parseFloat(costoExterno.numhh);}
                        if (costoExterno.ccosto == "DIBUJO"){hh_ext_dib = parseFloat(hh_ext_dib) + parseFloat(costoExterno.numhh);}
                        if (costoExterno.ccosto == "I+D"){hh_ext_imasd = parseFloat(hh_ext_imasd) + parseFloat(costoExterno.numhh);}
                        if (costoExterno.ccosto == "OBRA"){hh_ext_obra = parseFloat(hh_ext_obra) + parseFloat(costoExterno.numhh);}
                      });

                // Metro cuadrado por plano 
                let metro_por_plano = "";
                if (isNaN(parseFloat(p.num_plano_estimado)))
                {
                        metro_por_plano = "0"; 
                }
                else
                {
                         metro_por_plano = parseFloat(p.superficie_pre) / parseFloat(p.num_plano_estimado); 
                }
                
                
                
                // Toda exportacion de COSTOS SERA EN UF
                // COSTOS INTERNOS costos son por mes a mes por que va variando
                let cst_int_ing = 0;
                let cst_int_dib = 0;
                let cst_int_cord = 0;
                let cst_int_imasd = 0;
                let cst_int_obra = 0;    
                
                const valores = await getCostosInternoProyecto(p.id); 
                const costosInternoPorCentroCosto = await getDataCostoInterno(valores, valorUFMes);
                


                let costoTotal = 0; // costo total del proyecto sumatoria interno + externo 
                costosInternoPorCentroCosto.forEach(costoInterno => {
                        if (costoInterno.nombre == "INGENIERIA"){cst_int_ing = parseFloat(costoInterno.costoUF);}
                        if (costoInterno.nombre == "COORDINACION"){cst_int_cord = parseFloat(costoInterno.costoUF);}
                        if (costoInterno.nombre == "DIBUJO"){cst_int_dib = parseFloat(costoInterno.costoUF);}
                        if (costoInterno.nombre == "I+D"){cst_int_imasd = parseFloat(costoInterno.costoUF);}
                        if (costoInterno.nombre == "OBRA"){cst_int_obra = parseFloat(costoInterno.costoUF);}
                        
                        costoTotal = costoTotal + parseFloat(costoInterno.costoUF);
                      });

                // COSTOS EXTERNOS el ingreso puede ser en pesos // DOLAR // UF  pero la respresntacion siempre sera en UF
                let cst_ext_ing = 0;
                let cst_ext_dib = 0;
                let cst_ext_cord = 0;
                let cst_ext_imasd = 0;
                let cst_ext_obra = 0;

                const valoresCostoExterno = await getCostoExternoProyecto(p.id);
                const costosExternosPorCentroCosto = await getDataCostoExterno(valoresCostoExterno);
                
                costosExternosPorCentroCosto.forEach(costoExterno => {
                        if (costoExterno.nombre == "INGENIERIA"){cst_ext_ing = parseFloat(costoExterno.totalUF);}
                        if (costoExterno.nombre == "COORDINACION"){cst_ext_cord = parseFloat(costoExterno.totalUF);}
                        if (costoExterno.nombre == "DIBUJO"){cst_ext_dib = parseFloat(costoExterno.totalUF);}
                        if (costoExterno.nombre == "I+D"){cst_ext_imasd = parseFloat(costoExterno.totalUF);}
                        if (costoExterno.nombre == "OBRA"){cst_ext_obra = parseFloat(costoExterno.totalUF);}
                        costoTotal = costoTotal + parseFloat(costoExterno.totalUF);

                      });

                let hh_ing_plano = (hh_ext_ing + hh_int_ing) / parseFloat(p.num_plano_estimado);
                let hh_dib_plano = (hh_ext_dib + hh_int_dib) / parseFloat(p.num_plano_estimado);
                let hh_cord_plano = (hh_ext_cord + hh_int_cord) / parseFloat(p.num_plano_estimado);
                let hh_imasd_plano = (hh_ext_imasd + hh_int_imasd) / parseFloat(p.num_plano_estimado);
                let hh_obra_plano = (hh_ext_obra + hh_int_obra) / parseFloat(p.num_plano_estimado);

                if (metro_por_plano == "")
                {
                        hh_ing_plano = "0";
                        hh_dib_plano = "0";
                        hh_cord_plano = "0";
                        hh_imasd_plano = "0";
                        hh_obra_plano = "0";
                }
                
                let m2_hh_ing =  parseFloat(p.superficie_pre) / (hh_ext_ing + hh_int_ing); if (m2_hh_ing === Infinity){m2_hh_ing = 0;}
                let m2_hh_dib =  parseFloat(p.superficie_pre) / (hh_ext_dib + hh_int_dib); if (m2_hh_dib === Infinity){m2_hh_dib = 0;}
                let m2_hh_cord =  parseFloat(p.superficie_pre) / (hh_ext_cord + hh_int_cord); if (m2_hh_cord === Infinity){m2_hh_cord = 0;}
                let m2_hh_imasd =  parseFloat(p.superficie_pre) / (hh_ext_imasd + hh_int_imasd); if (m2_hh_imasd === Infinity){m2_hh_imasd = 0;}
                let m2_hh_obra =  parseFloat(p.superficie_pre) / (hh_ext_obra + hh_int_obra); if (m2_hh_obra === Infinity){m2_hh_obra = 0;}

              

                if (p.superficie_pre == "" || p.superficie_pre == 0 || p.superficie_pre == "0")
                {
                        m2_hh_ing = "0";
                        m2_hh_dib = "0";
                        m2_hh_cord = "0";
                        m2_hh_imasd = "0";
                        m2_hh_obra = "0";
                }


                let cst_ing_plano = (cst_ext_ing + cst_int_ing) / parseFloat(p.num_plano_estimado);
                let cst_dib_plano = (cst_ext_dib + cst_int_dib) / parseFloat(p.num_plano_estimado);
                let cst_cord_plano = (cst_ext_cord + cst_int_cord) / parseFloat(p.num_plano_estimado);
                let cst_imasd_plano = (cst_ext_imasd + cst_int_imasd) / parseFloat(p.num_plano_estimado);
                let cst_obra_plano = (cst_ext_obra + cst_int_obra) / parseFloat(p.num_plano_estimado);

                
                if (metro_por_plano == "")
                {
                        cst_ing_plano = "0";
                        cst_dib_plano = "0";
                        cst_cord_plano = "0";
                        cst_imasd_plano = "0";
                        cst_obra_plano = "0";
                }

                let cst_ing_hh = (cst_ext_ing + cst_int_ing) / (hh_ext_ing + hh_int_ing) ; if (isNaN(parseFloat(cst_ing_hh))){cst_ing_hh = 0;}
                let cst_dib_hh = (cst_ext_dib + cst_int_dib) / (hh_ext_dib + hh_int_dib) ; if (isNaN(parseFloat(cst_dib_hh))){cst_dib_hh = 0;}
                let cst_cord_hh = (cst_ext_cord + cst_int_cord) / (hh_ext_cord + hh_int_cord) ; if (isNaN(parseFloat(cst_cord_hh))){cst_cord_hh = 0;}
                let cst_imasd_hh = (cst_ext_imasd + cst_int_imasd) / (hh_ext_imasd + hh_int_imasd) ; if (isNaN(parseFloat(cst_imasd_hh))){cst_imasd_hh = 0;}
                let cst_obra_hh = (cst_ext_obra + cst_int_obra) / (hh_ext_obra + hh_int_obra) ; if (isNaN(parseFloat(cst_obra_hh))){cst_obra_hh = 0;}
                
                // Preguntar cuantas horas en total tiene el proyecto. 
                const data_horas_proyecto = await getDataTotalHorasProyecto(p.id);
                let total_horas_proyecto =  await getTotalHorasProyecto(data_horas_proyecto);

                const data_horas_proyecto_modificacion = await getDataTotalHorasProyectoModificacion(p.id);
                let total_horas_proyecto_moficiacion =  await getTotalHorasProyecto(data_horas_proyecto_modificacion);

                let porc_mod = total_horas_proyecto_moficiacion * 100 / total_horas_proyecto;

                if (isNaN(parseFloat(porc_mod)))
                {
                        porc_mod = "0";
                }
                
                
                let data_facturacion_proyecto = await getDataFacturacionProyecto(p.id);
                
                //let valorUfMensual = []; 
                //let valorUsdMensual = [];
                //let valorSolMensual = [];
                let total_facturacion = await getTotalFacturacionProyecto(data_facturacion_proyecto , valorUfMensual , valorUsdMensual , valorSolMensual);

                let totalProyecto = "";
                let margen_proyecto = "";
                if (p.valor_proyecto == "" || p.valor_proyecto == null)
                {
                        totalProyecto = "0";
                        margen_proyecto = "0";
                }
                else
                {
                        totalProyecto = parseFloat( p.valor_proyecto) + parseFloat( total_facturacion["adicional"]) + parseFloat( total_facturacion["adicional_ingresado"]);
                        margen_proyecto = parseFloat( p.valor_proyecto) + parseFloat( total_facturacion["adicional"]) + parseFloat( total_facturacion["adicional_ingresado"]) - parseFloat(costoTotal);
                }
                

                // validar numero de pisos. 
                if (p.num_pisos == "" ||p.num_pisos == null )
                {
                        p.num_pisos = 0;    
                }

                // validar num subterraneo
                if (p.num_subterraneo == "" ||p.num_subterraneo == null )
                {
                        p.num_subterraneo = 0;    
                }

                // validar superficie lo dejamos en 1 entregado por lorenzo.
                if (p.superficie_pre == "" ||p.superficie_pre == null )
                {
                        p.superficie_pre = 1;    
                }

                // validar numero de planos estimados
                if (p.num_plano_estimado == "" ||p.num_plano_estimado == null )
                {
                        p.num_plano_estimado = 1;    
                }
                // validar valor del proyecto 
                if (p.valor_proyecto == "" ||p.valor_proyecto == null )
                {
                        p.valor_proyecto = 0;    
                }

                //
                if (isNaN(parseFloat(hh_ing_plano))){ hh_ing_plano = "0";}
                if (isNaN(parseFloat(hh_dib_plano))){ hh_dib_plano = "0";}
                if (isNaN(parseFloat(hh_cord_plano))){ hh_cord_plano = "0";}
                if (isNaN(parseFloat(hh_imasd_plano))){ hh_imasd_plano = "0";}
                if (isNaN(parseFloat(hh_obra_plano))){ hh_obra_plano = "0";}

                if (isNaN(parseFloat(cst_ing_plano))){ cst_ing_plano = "0";}
                if (isNaN(parseFloat(cst_dib_plano))){ cst_dib_plano = "0";}
                if (isNaN(parseFloat(cst_cord_plano))){ cst_cord_plano = "0";}
                if (isNaN(parseFloat(cst_imasd_plano))){ cst_imasd_plano = "0";}
                if (isNaN(parseFloat(cst_obra_plano))){ cst_obra_plano = "0";}



                msj_proyecto = p.id;
                let registro = {
                        id_proyecto: p.id,
                        id_cabecera : idCabecera.insertId,
                        year : p.year,
                        code : p.code,
                        nombre : p.nombre,
                        servicio : p.servicio,
                        tipo : p.tipo,
                        num_pisos : p.num_pisos,
                        num_subte : p.num_subterraneo,
                        mandante : p.mandante,
                        arquitecto : p.arquitecto,
                        director : p.director,
                        jefe_proyecto : p.jefe,
                        superficie : p.superficie_pre,
                        num_planos : p.num_plano_estimado,
                        hh_int_ingenieria : hh_int_ing,
                        hh_int_dibujo : hh_int_dib,
                        hh_int_coordinacion : hh_int_cord,
                        hh_int_imasd : hh_int_imasd,
                        hh_int_obra : hh_int_obra ,
                        hh_int_totales : hh_int_ing + hh_int_dib + hh_int_cord + hh_int_imasd +hh_int_obra ,
                        hh_ext_ingenieria : hh_ext_ing,
                        hh_ext_dibujo : hh_ext_dib,
                        hh_ext_coordinacion : hh_ext_cord,
                        hh_ext_imasd : hh_ext_imasd,
                        hh_ext_obra : hh_ext_obra,
                        hh_ext_totales : hh_ext_ing + hh_ext_dib + hh_ext_cord +hh_ext_imasd +hh_ext_obra,
                        metro_por_plano : metro_por_plano,
                        cst_int_ing :cst_int_ing,
                        cst_int_dib : cst_int_dib,
                        cst_int_cord : cst_int_cord,
                        cst_int_imasd : cst_int_imasd,
                        cst_int_obra :  cst_int_obra,
                        cst_int_total : cst_int_ing + cst_int_dib +cst_int_cord +cst_int_imasd +cst_int_obra,
                        cst_ext_ing: cst_ext_ing,
                        cst_ext_dib : cst_ext_dib,
                        cst_ext_cord : cst_ext_cord,
                        cst_ext_imasd :  cst_ext_imasd,
                        cst_ext_obra : cst_ext_obra,
                        cst_ext_total : cst_ext_ing + cst_ext_dib + cst_ext_cord + cst_ext_imasd +cst_ext_obra,
                        hh_ing_plano :hh_ing_plano,
                        hh_dib_plano :hh_dib_plano,
                        hh_cord_plano : hh_cord_plano,
                        hh_imasd_plano : hh_imasd_plano,
                        hh_obra_plano : hh_obra_plano,
                        hh_total_plano : hh_ing_plano + hh_dib_plano + hh_cord_plano + hh_imasd_plano + hh_obra_plano ,
                        m2_hh_ing: m2_hh_ing,
                        m2_hh_dib: m2_hh_dib,
                        m2_hh_cord: m2_hh_cord,
                        m2_hh_imasd: m2_hh_imasd,
                        m2_hh_obra: m2_hh_obra,
                        m2_hh_total : m2_hh_ing + m2_hh_dib +m2_hh_cord +  m2_hh_imasd + m2_hh_obra,
                        cst_ing_plano : cst_ing_plano,
                        cst_dib_plano : cst_dib_plano,
                        cst_cord_plano : cst_cord_plano,
                        cst_imasd_plano : cst_imasd_plano,
                        cst_obra_plano : cst_obra_plano,
                        cst_total_plano : cst_ing_plano + cst_dib_plano +  cst_cord_plano + cst_imasd_plano + cst_obra_plano,
                        cst_ing_hh : cst_ing_hh,
                        cst_dib_hh : cst_dib_hh,
                        cst_cord_hh : cst_cord_hh,
                        cst_imasd_hh : cst_imasd_hh,
                        cst_obra_hh : cst_obra_hh,
                        cst_total_hh : cst_ing_hh + cst_dib_hh + cst_cord_hh + cst_imasd_hh + cst_obra_hh,
                        total_horas_proyecto : total_horas_proyecto,
                        total_horas_proyecto_moficiacion : total_horas_proyecto_moficiacion,
                        porc_mod : porc_mod,
                        valor_proyecto : p.valor_proyecto,
                        adicionales : total_facturacion["adicional"],
                        adicionales_ingresados :total_facturacion["adicional_ingresado"],
                        total_proyecto : totalProyecto,
                        total_facturado :total_facturacion["total_facturado"] , 
                        total_facturado_pagado :total_facturacion["total_pagado"] , 
                        costo_totales : costoTotal,
                        margen_proyecto : margen_proyecto

                };
                
                msj_registro = registro;
                const idLogIngreso = await pool.query('INSERT INTO pro_proyectos_info set ?', [registro]);


                }catch(err)
                {

                        mensajeria.MensajerErroresDBENITES("\n\n Archivo : reporteria.js \n Error en el directorio: /proyectos \n" + err + "\n  Proyecto id : "+ msj_proyecto + " \n Generado por : Proceso Automatico ");
                        
                }
                
                
        }

        
        
        res.send("PROYECTOS");


        });

        function getHorasInternaProyecto(id) // sacar las Horas del proyecto. 
        {
          
                const detalleInterno = pool.query("SELECT " +
                                        //" SUBSTRING(t1.date,1,7) AS fecha, " +
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
                                        " GROUP BY centroCosto "+
                                        " UNION " +
                                        " SELECT " +
                                                        //" SUBSTRING(t1.ini_time,1,7) AS fecha,"+
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
                                        " GROUP BY  centroCosto " +
                                        "",[id,id]);

                return new Promise((resolve,reject)=>{
                        setTimeout(()=>{
                                resolve(detalleInterno);
                        },100);
                });

        }

        function getHorasExternoProyecto(id) // sacar las Horas del proyecto. 
        {
          
                const cexternos = pool.query("SELECT " +
                                                            " t1.cc_a_pagar 	AS ccosto, " +
                                                            " t2.descripcion AS moneda, " +
                                                            " t2.simbolo AS simbolo, " +
                                                            " t1.def_trabajo AS descripcion, " +
                                                            " t1.num_occ AS numoc, "+
                                                            " t1.num_hh 		AS numhh, " +
                                                            " FORMAT(t1.costo,0,'de_DE') AS costo, " +
                                                            " t1a.nombre as nNombre, " +
                                                            " FORMAT(costo / t1b.valor,2) AS totPro, " +
                                                            " (SELECT format(t1a.valor,2, 'de_DE') " +
                                                                   " FROM  " +
                                                                                " moneda_valor AS t1a  " +
                                                                    " WHERE   " +
                                                                                " t1a.id_moneda = 4  " +
                                                                        " AND  " +
                                                                                " t1a.fecha_valor = DATE_FORMAT( t1.fecha_carga, '%Y-%m-%d') " +
                                                                        " LIMIT 1) AS 'uf_valor', " +
                                                             " (  SELECT format(t1b.valor,2, 'de_DE')   " +
                                                                        " FROM  moneda_valor AS t1b  WHERE   t1b.id_moneda = 2  AND  t1b.fecha_valor = DATE_FORMAT( t1.fecha_carga, '%Y-%m-%d')  LIMIT 1  ) "+
                                                                        " AS 'dolar_valor', " +
                                                             " 1 as punitario ," +
                                                             " 1 as pcambio" +
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
                                                            " t3a.simbolo AS simbolo, " +
                                                            " t3.descripcion AS descripcion,"+
                                                            " t1.folio AS numoc,"+
                                                            " t3.cantidad AS numhh,"+
                                                            " if (t3.id_moneda = 4,FORMAT( t3.precio_unitario * t3.tipo_cambio,0,'de_DE'), 0) AS costo, "+
                                                            //" if (t1.id_tipo = 3 , 'Empresa' , (SELECT t1c.nombre FROM prov_externo AS t1c WHERE t1c.id = t1.id_razonsocialpro)) as nNombre , "+
                                                            " if (t1.id_tipo = 3 , 'Empresa' , "+
                                                            " if (t1.id_tipo = 2 , (SELECT t1c.nombre FROM prov_externo AS t1c WHERE t1c.id = t1.id_razonsocialpro)," +
                                                            " if (t1.id_tipo = 1 , (SELECT t1d.nombre FROM sys_usuario AS t1d WHERE t1d.idUsuario = t1.id_razonsocialpro), '2'))) as nNombre ,  " +
                                                            " if (t3.id_moneda = 4, t3.cantidad * t3.precio_unitario,0) AS totPro, " +
                                                            " 1 AS 'uf_valor'," +
                                                            " (  SELECT format(t1b.valor,2, 'de_DE')   " +
                                                                        " FROM  moneda_valor AS t1b  WHERE   t1b.id_moneda = 2  AND  t1b.fecha_valor = DATE_FORMAT( t1.fecha_aprobacion, '%Y-%m-%d')  LIMIT 1  ) "+
                                                                        " AS 'dolar_valor', " +
                                                            " t3.precio_unitario as punitario ," +
                                                            " t3.tipo_cambio as pcambio" +
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

                return new Promise((resolve,reject)=>{
                        setTimeout(()=>{
                                resolve(cexternos);
                        },100);
                });

        }

        function getCostosInternoProyecto(id) // sacar el costo asociado a un proyecto por centro de costos  
        {
                // agregar en alguna parte del codigo si logrammos encontrar que falte algun llenado de valores de la UF para que sea poblado. 
                const detalleCostoInterno = pool.query(" SELECT " +
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
                
                
                return new Promise((resolve,reject)=>{
                        setTimeout(()=>{
                                resolve(detalleCostoInterno);
                        },100);
                });


        }

        function getDataCostoInterno ( datos , valoresUF)
        {
                let centroCosto = [];
                let erroresCostoUsuario = [];
                let erroresValorUF = [];

                let costoColaborador = []; // registrar los valores por mes para el mes actual. 
                datos.forEach(element => {
                        // validar que exista el valor de la UF
                        let valorDelMesUF = 0;
                        const containsValorUF = !!valoresUF.find(fecha => {return fecha.fecha === element.fecha });
                        if (containsValorUF === true)
                               {
                                const colUF = valoresUF.find(fecha => {return fecha.fecha === element.fecha });
                                valorDelMesUF = colUF.valor;
                               }
                        else
                                {
                                        erroresValorUF.push({
                                                fecha : element.fecha 
                                        });
                                }


                        const containsCentro = !!centroCosto.find(centro => {return centro.nombre === element.centroCosto });

                        if ( element.costoMes === null || element.costoMes === undefined) {

                                let costoColaboradorUserValor = costoColaborador.find(user => {return user.nombre === element.nombre });

                                if (costoColaboradorUserValor !== undefined) // coloco el valor de de la hh anterior.
                                {
                                        element.costoMes = costoColaboradorUserValor.costo;
                                }
                                else{ element.costoMes = 15000;} // si no tiene registrado nada le coloco 15000
                                }
                        
                        if (containsCentro === false)
                                        {
                                                centroCosto.push(
                                                        { 
                                                                nombre : element.centroCosto,
                                                                numHH : element.numHH,
                                                                numHHE : element.numHE,
                                                                costoPesos : element.numHH * element.costoMes + element.numHE * element.costoMes * 1.5,
                                                                costoUF : (element.numHH * element.costoMes + element.numHE * element.costoMes * 1.5) / valorDelMesUF
                                                        }
                                                      );
                                        }
                        else{
                                

                                const colCentroCosto = centroCosto.find(centro => {return centro.nombre === element.centroCosto });
                                colCentroCosto.numHH = colCentroCosto.numHH + element.numHH;
                                colCentroCosto.numHHE = colCentroCosto.numHHE + element.numHE;
                                colCentroCosto.costoPesos = colCentroCosto.costoPesos + element.numHH * element.costoMes + element.numHE * element.costoMes * 1.5;
                                colCentroCosto.costoUF = colCentroCosto.costoUF + (element.numHH * element.costoMes + element.numHE * element.costoMes * 1.5) / valorDelMesUF

                                if (colCentroCosto.costoUF === Infinity)
                                {
                                        if (valorDelMesUF == 0)
                                        {
                                                
                                        }
                                        
                                }

                            }

                      const costoColaboradorUser = !!costoColaborador.find(user => {return user.nombre === element.nombre });

                                if (costoColaboradorUser === false)
                                {
                                        costoColaborador.push({
                                                nombre :  element.nombre,
                                                costo : element.costoMes
                                        });
                                }

                });


                return new Promise((resolve,reject)=>{
                        setTimeout(()=>{
                                resolve(centroCosto);
                        },100);
                });

                
        }

        function getCostoExternoProyecto(id)
        {

                const costos_externos = pool.query("SELECT " +
                                                " t1.cc_a_pagar 	AS ccosto, " +
                                                " t2.descripcion AS moneda, " +
                                                " t2.simbolo AS simbolo, " +
                                                " t1.def_trabajo AS descripcion, " +
                                                " t1.num_occ AS numoc, "+
                                                " t1.num_hh 		AS numhh, " +
                                                " FORMAT(t1.costo,0,'de_DE') AS costo, " +
                                                " t1a.nombre as nNombre, " +
                                                " FORMAT(costo / t1b.valor,2) AS totPro, " +
                                                " (SELECT format(t1a.valor,2, 'de_DE') " +
                                                " FROM  " +
                                                                " moneda_valor AS t1a  " +
                                                        " WHERE   " +
                                                                " t1a.id_moneda = 4  " +
                                                        " AND  " +
                                                                " t1a.fecha_valor = DATE_FORMAT( t1.fecha_carga, '%Y-%m-%d') " +
                                                        " LIMIT 1) AS 'uf_valor', " +
                                                " (  SELECT format(t1b.valor,2, 'de_DE')   " +
                                                        " FROM  moneda_valor AS t1b  WHERE   t1b.id_moneda = 2  AND  t1b.fecha_valor = DATE_FORMAT( t1.fecha_carga, '%Y-%m-%d')  LIMIT 1  ) "+
                                                        " AS 'dolar_valor', " +
                                                " 1 as punitario ," +
                                                " 1 as pcambio" +
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
                                                " t3a.simbolo AS simbolo, " +
                                                " t3.descripcion AS descripcion,"+
                                                " t1.folio AS numoc,"+
                                                " t3.cantidad AS numhh,"+
                                                " if (t3.id_moneda = 4,FORMAT( t3.precio_unitario * t3.tipo_cambio,0,'de_DE'), 0) AS costo, "+
                                                //" if (t1.id_tipo = 3 , 'Empresa' , (SELECT t1c.nombre FROM prov_externo AS t1c WHERE t1c.id = t1.id_razonsocialpro)) as nNombre , "+
                                                " if (t1.id_tipo = 3 , 'Empresa' , "+
                                                            " if (t1.id_tipo = 2 , (SELECT t1c.nombre FROM prov_externo AS t1c WHERE t1c.id = t1.id_razonsocialpro)," +
                                                            " if (t1.id_tipo = 1 , (SELECT t1d.nombre FROM sys_usuario AS t1d WHERE t1d.idUsuario = t1.id_razonsocialpro), '2'))) as nNombre ,  " +
                                                " if (t3.id_moneda = 4, t3.cantidad * t3.precio_unitario,0) AS totPro, " +
                                                " 1 AS 'uf_valor'," +
                                                " (  SELECT format(t1b.valor,2, 'de_DE')   " +
                                                        " FROM  moneda_valor AS t1b  WHERE   t1b.id_moneda = 2  AND  t1b.fecha_valor = DATE_FORMAT( t1.fecha_aprobacion, '%Y-%m-%d')  LIMIT 1  ) "+
                                                        " AS 'dolar_valor', " +
                                                " t3.precio_unitario as punitario ," +
                                                " t3.tipo_cambio as pcambio" +
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

                // analizar los costos externos y agrupar por cenbtros de costos.

                return new Promise((resolve,reject)=>{
                        setTimeout(()=>{
                                resolve(costos_externos);
                        },100);
                });       
        }

        function getDataCostoExterno( datos)
        {
            let centroCosto = [];

            datos.forEach(element => {
                let costoUF = 0;
                switch(element.simbolo)
                {
                        case "UF":
                              costoUF =   element.totPro;
                        break;
                        case "$":
                              costoUF =   element.totPro;
                        break;
                        case "US$":
                              costoUF =   element.totPro;
                        break;

                }

                const containsCentro = !!centroCosto.find(centro => {return centro.nombre === element.ccosto });

                if (containsCentro === true)    
                         {
                                const centro = centroCosto.find(centro => {return centro.nombre === element.ccosto });
                                centro.totalUF = parseFloat(centro.totalUF) + parseFloat(costoUF);
                                
                                

                         }
                else{
                        centroCosto.push({
                                nombre : element.ccosto,
                                totalUF :  parseFloat(costoUF)
                        }); 
                }


            });



            return new Promise((resolve,reject)=>{
                setTimeout(()=>{
                        resolve(centroCosto);
                },100);
        });


        }

        function getDataTotalHorasProyecto( id)
        {

                const total_horas_proyecto = pool.query(" SELECT " +
                                        " (SUM(t1.nHH) / 6 + SUM(t1.nHE) / 6) AS t " +	 
                                        " FROM  " +
                                        " bitacora AS t1 " +
                                        " WHERE  " +
                                        " t1.project = ? " +
                                        " GROUP BY t1.project " +
                                        " UNION " +
                                        " SELECT  " +
                                                "  SUM(TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600) AS t " +
                                        " FROM  " +
                                                "  bita_horas AS t1 " +
                                        " WHERE  " +
                                                " t1.id_project = ? " +
                                        " GROUP BY t1.id_project " +
                                        "",[id,id]);


                return new Promise((resolve,reject)=>{
                                setTimeout(()=>{
                                                resolve(total_horas_proyecto);
                                        },100);
                });

        }

        function getTotalHorasProyecto(datos)
        {
                let numHoras = 0;
                datos.forEach(element => {
                        numHoras = numHoras + parseFloat(element.t);
                });
                return numHoras;
        }

        function getDataTotalHorasProyectoModificacion(id)
        {

                const total_horas_proyecto_modificacion = pool.query(" SELECT " +
                " (SUM(t1.nHH) / 6 + SUM(t1.nHE) / 6) AS t " +	 
                " FROM  " +
                " bitacora AS t1 " +
                " WHERE  " +
                " t1.project = ? AND t1.modificacion = 1 " +
                " GROUP BY t1.project " +
                " UNION " +
                " SELECT  " +
                        "  SUM(TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600) AS t " +
                " FROM  " +
                        "  bita_horas AS t1 " +
                " WHERE  " +
                        " t1.id_project = ? AND t1.modificacion = 1 " +
                " GROUP BY t1.id_project " +
                "",[id,id]);


                return new Promise((resolve,reject)=>{
                        setTimeout(()=>{
                                        resolve(total_horas_proyecto_modificacion);
                                },100);
                });


        }

        function getDataFacturacionProyecto(id)
        {

                const facturacion_proyecto = pool.query("SELECT *, t5.descripcion AS tipoCobro, if(t1.es_roc = 1 ,'SI','No' ) as roc, t4.descripcion AS moneda, t2.descripcion AS estadoFac,  " +
                                                " ( " +
                                                " SELECT format(t1a.valor,2, 'de_DE') " +
                                                " FROM " +
                                                        " moneda_valor AS t1a " +
                                                " WHERE  " +
                                                        " t1a.id_moneda = 4 " +
                                                " AND " +
                                                        " t1a.fecha_valor = t1.fecha_factura " +
                                                " LIMIT 1 " +
                                                " ) AS 'uf_valor'," +
                                                " (  SELECT format(t1b.valor,2, 'de_DE')   " +
                                                " FROM  moneda_valor AS t1b  WHERE   t1b.id_moneda = 2  AND  t1b.fecha_valor = t1.fecha_factura  LIMIT 1  ) "+
                                                " AS 'dolar_valor' " +
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
                                                " t1.id_estado in (1,2,3,4,6) "+
                                        " AND  " +
                                                " t1.id_tipo_moneda = t4.id_moneda" +
                                        " AND " +
                                                "t1.id_tipo_cobro = t5.id",[id]);

                return new Promise((resolve,reject)=>{
                                                        setTimeout(()=>{
                                                                        resolve(facturacion_proyecto);
                                                                },100);
                                                });

        }

        function getTotalFacturacionProyecto( facturas, valorUF, valorUSD, valorSOL )
        {
                //estadoFac
                let totalFacturado = 0;
                let totalFacturadoPagado = 0;
                let totalfacturadoAdicional = 0;
                let totalfacturadoIngresado = 0;
                    
                let facturacion = [];
                facturas.forEach(element => {  

                        
                        if (element.monto_a_facturar == "")
                                {
                                        element.monto_a_facturar = 0;     
                                }

                        if (element.estadoFac == "Ingresado")
                        {
                                let fechaBuscar = dateFormat(element.fecha_solicitud, "yyyy-mm");
                                let containsFechaSol = !!valorSOL.find(fecha => {return fecha.fecha === fechaBuscar});
                                let containsFechaUf = !!valorUF.find(fecha => {return fecha.fecha === fechaBuscar});
                                let containsFechaUsd = !!valorUSD.find(fecha => {return fecha.fecha === fechaBuscar});
                                // adicionales informados. 
                                switch(element.simbolo)
                                {
                                        case "UF":
                                                totalfacturadoIngresado = totalfacturadoIngresado + parseFloat(element.monto_a_facturar);
                                        break;
                                        case "$":
                                                if (containsFechaUf === true){
                                                        const colUF = valorUF.find(fecha => {return fecha.fecha === fechaBuscar });
                                                        let valor = colUF.valor;
                                                        let aux = parseFloat( element.monto_a_facturar / valor);

                                                       totalfacturadoIngresado = totalfacturadoIngresado + aux;
                                                }
                                        break;
                                        case "US$":
                                                if (containsFechaUsd === true){
                                                        const colUF = valorUF.find(fecha => {return fecha.fecha === fechaBuscar });
                                                        const colUSD = valorUSD.find(fecha => {return fecha.fecha === fechaBuscar });
                                                        let valor_UF = colUF.valor;
                                                        let valor_USD = colUSD.valor;

                                                        let auxUSD_TO_PESO = element.monto_a_facturar  * valor_USD;
                                                        let PESO_TO_UF = parseFloat( auxUSD_TO_PESO / valor_UF);
                                                        totalfacturadoIngresado = totalfacturadoIngresado + PESO_TO_UF;
                                                }
                                        break;
                                        case "S/":
                                                if (containsFechaSol === true){
                                                        const colUF = valorUF.find(fecha => {return fecha.fecha === fechaBuscar });
                                                        const colSOL = valorSOL.find(fecha => {return fecha.fecha === fechaBuscar });
                                                        let valor_UF = colUF.valor;
                                                        let valor_SOL = colSOL.valor;

                                                        let auxSOL_TO_PESO = element.monto_a_facturar  * valor_SOL;
                                                        let PESO_TO_UF = parseFloat( auxSOL_TO_PESO / valor_UF);
                                                        totalfacturadoIngresado = totalfacturadoIngresado + PESO_TO_UF;
                                                }
                                        break;
                                        
                                }
                        }
                        else
                        {
                                switch(element.simbolo)
                                {
                                        case "UF":
        
                                                totalFacturado = totalFacturado + parseFloat(element.monto_a_facturar);
                                                if (element.es_roc === 1)
                                                {
                                                        if (element.estadoFac != "Ingresado")
                                                        {
                                                                totalfacturadoAdicional = totalfacturadoAdicional + parseFloat(element.monto_a_facturar);
                                                        }
                                                        
                                                }
        
                                                if (element.estadoFac == "Pagada")
                                                {
                                                        totalFacturadoPagado = totalFacturadoPagado +  parseFloat(element.monto_a_facturar);
                                                }
        
                                        break;
                                        case "$":
                                                if (element.uf_valor != null)
                                                {
                                                        let peso_uf = parseFloat(element.monto_a_facturar) /  parseFloat(element.uf_valor.replace(".","").replace(",","."));
                                                        totalFacturado = totalFacturado + peso_uf;
                                                        if (element.es_roc === 1)
                                                        {
                                                                if (element.estadoFac != "Ingresado")
                                                                        {
                                                                                totalfacturadoAdicional = totalfacturadoAdicional + peso_uf; 
                                                                        }
                                                                
                                                        }
                                                        if (element.estadoFac == "Pagada")
                                                        {
                                                                totalFacturadoPagado = totalFacturadoPagado +  peso_uf;
                                                        }
                                                        
                                                }
                                        break;
                                        case "US$":
                                                if (element.dolar_valor != null)
                                                {
                                                        let peso_dolar = parseFloat(element.monto_a_facturar) *  parseFloat(element.dolar_valor.replace(".","").replace(",",".")) / parseFloat(element.uf_valor.replace(".","").replace(",","."));
                                                        totalFacturado = totalFacturado + peso_dolar;
                                                        if (element.es_roc === 1)
                                                        {
                                                                if (element.estadoFac != "Ingresado")
                                                                {
                                                                        totalfacturadoAdicional = totalfacturadoAdicional + peso_dolar; 
                                                                }
                                                        }
                                                        if (element.estadoFac == "Pagada")
                                                        {
                                                                totalFacturadoPagado = totalFacturadoPagado +  peso_dolar;
                                                        }
                                                        
        
                                                }
                                        break;
                                        // agregar soles. 
        
                                }
                        }

                });

                facturacion["total_facturado"]          = totalFacturado;
                facturacion["adicional"]                = totalfacturadoAdicional; 
                facturacion["total_pagado"]             = totalFacturadoPagado;
                facturacion["adicional_ingresado"]      = totalfacturadoIngresado;
                

                return facturacion;
        }


//finanzas
router.get('/finanzas',isLoggedIn,  async (req, res) => {

        
        
        let servicioProyectos = await pool.query("SELECT * FROM proyecto_servicio AS t1");

        let monedas = await pool.query("SELECT * FROM moneda_tipo AS t1 WHERE t1.id_moneda IN (2,4,10)");

        let estadoProyectos = await pool.query("SELECT * FROM proyecto_estado AS t1");

        let directorProyectos = await pool.query(" SELECT * FROM " +
	                                         " sys_usuario AS t2  " +
                                                 " WHERE  " +
		                                        " t2.idUsuario IN ( SELECT t1.id_director FROM pro_proyectos AS t1 GROUP BY t1.id_director) " +
                                                 " AND " +
		                                        " t2.idUsuario != 1 " );
        
        res.render('reporteria/finanzas', {servicioProyectos, directorProyectos , estadoProyectos,  monedas, res, req, layout: 'template' });


});

router.post('/buscarListadoProyectos',isLoggedIn,  async (req, res) => {

        

        let {servicio,moneda,estado,director,desde,hasta} = req.body;
        let sqlDirector = "";
        let sqlEstado = "";
        let sqlServicio = "";

        // verificamos valores desde y hasta 
        if (desde === ""){ desde = 1000;} //
        if (hasta === ""){ hasta = 3000;} //


        if ( director != 0)
        {
                sqlDirector = " AND t1.id_director = "+director+"";
        }
        if ( estado != 0)
        {
                sqlEstado = " AND t1.id_estado = "+estado+"";
        }
        if ( servicio != 0)
        {
                sqlServicio = " AND t1.id_tipo_servicio = "+servicio+"";
        }
        
        let sql = "SELECT " +
                        " t1.nombre, " +
                        " t1.id, " +
                        " t1.`year`, " +
                        " t1.code, " +
                        " t1.id_director, " +
                        " t2.Nombre  as nomDirector," +
                        " t3.descripcion as tipoServicio," +
                        " t4.name AS nomCliente, " +
                        " t5.descripcion AS estado, " +
                        " t1.superficie_pre ,"+
                        " t1.valor_metro_cuadrado ,"+
                        " t1.valor_proyecto "+
                   " FROM  " +
                        " pro_proyectos AS t1 " +
                        " LEFT JOIN contacto AS t4 ON t1.id_cliente = t4.id," +
                        " sys_usuario AS t2, " +
                        " proyecto_servicio AS t3," +
                        //" contacto AS t4, " +
                        " proyecto_estado AS t5 " + 
                   " WHERE  " +
                        " t1.`year` BETWEEN "+ desde +" AND "+hasta +" "+
                        " AND   t1.id_director = t2.idUsuario " +
                        " AND   t1.id_tipo_servicio = t3.id  " +
                       // " AND   t1.id_cliente = t4.id " +
                        " AND 	t1.id_estado = t5.id " +
                        sqlDirector +
                        sqlEstado + 
                        sqlServicio +
                        " ";



        

        let infoProyectos = [];
        let proyectos = await pool.query(sql);

        let infoAnalisis ={
                vpresupuesto : 0,
                adicionales : 0,
                totalcontrado : 0,
                facturadao :0,
                penPago : 0,
                pendFact : 0
        };

        for (let p of proyectos) {
                let facturacion = await getFacturasProyecto(p.id); 
                
                //#region VARIABLES PARA SUMATORIAS
                let paraCobro_uf = 0;
                let cobranza_uf = 0;
                let pagada_uf = 0;

                let paraCobro_clp = 0;
                let cobranza_clp = 0;
                let pagada_clp = 0;

                let paraCobro_usd = 0;
                let cobranza_usd = 0;
                let pagada_usd = 0;

                let paraCobro_sol = 0;
                let cobranza_sol = 0;
                let pagada_sol = 0;


                let adicional_uf = 0;
                let adicional_clp = 0;
                let adicional_usd = 0;
                let adicional_sol = 0;
                //#endregion

                facturacion.forEach(factura => {
                        
                        switch(factura.id_estado)
                        {
                            case 0: // 
                                if (factura.esroc === 1)
                                {
                                        adicional_uf = adicional_uf + parseFloat(factura.monto_uf);
                                        adicional_clp = adicional_clp + parseFloat(factura.monto_clp);
                                        adicional_usd = adicional_usd + parseFloat(factura.monto_dolar);
                                        adicional_sol = adicional_sol + parseFloat(factura.monto_sol);
                                }
                                else
                                {
                                        paraCobro_uf = paraCobro_uf + parseFloat(factura.monto_uf);
                                        paraCobro_clp = paraCobro_clp + parseFloat(factura.monto_clp);
                                        paraCobro_usd = paraCobro_usd + parseFloat(factura.monto_dolar);
                                        paraCobro_sol = paraCobro_sol + parseFloat(factura.monto_sol);
                                }
                            break;
                            case 2:
                                if (factura.esroc === 1)
                                {
                                        adicional_uf = adicional_uf + parseFloat(factura.monto_uf);
                                        adicional_clp = adicional_clp + parseFloat(factura.monto_clp);
                                        adicional_usd = adicional_usd + parseFloat(factura.monto_dolar);
                                        adicional_sol = adicional_sol + parseFloat(factura.monto_sol);
                                }
                                else
                                {
                                        cobranza_uf = cobranza_uf + parseFloat(factura.monto_uf);
                                        cobranza_clp = cobranza_clp + parseFloat(factura.monto_clp);
                                        cobranza_usd = cobranza_usd + parseFloat(factura.monto_dolar);
                                        cobranza_sol = cobranza_sol + parseFloat(factura.monto_sol);       
                                }
                            break;
                            case 3:
                                if (factura.esroc === 1)
                                {
                                        adicional_uf = adicional_uf + parseFloat(factura.monto_uf);
                                        adicional_clp = adicional_clp + parseFloat(factura.monto_clp);
                                        adicional_usd = adicional_usd + parseFloat(factura.monto_dolar);
                                        adicional_sol = adicional_sol + parseFloat(factura.monto_sol);
                                }
                                else
                                {
                                        pagada_uf = pagada_uf + parseFloat(factura.monto_uf);
                                        pagada_clp = pagada_clp + parseFloat(factura.monto_uf);
                                        pagada_usd = pagada_usd + parseFloat(factura.monto_dolar);
                                        pagada_sol = pagada_sol + parseFloat(factura.monto_sol);
                                }
                                
                            break;
                        }   
                });
                p.facturado_uf = cobranza_uf + pagada_uf;
                p.facturado_clp = cobranza_clp + pagada_clp;
                p.facturado_usd = cobranza_usd + pagada_usd;
                p.facturado_sol = cobranza_sol + pagada_sol;

                //#region ASIGNACION FACTURADO
                if (p.valor_proyecto === ""){p.valor_proyecto = 0;}

                switch(moneda)
                {
                        case 1:
                        case "1":
                          p.facturado =  Intl.NumberFormat('de-DE').format(p.facturado_clp.toFixed(0));
                          p.adicional = Intl.NumberFormat('de-DE').format(adicional_clp.toFixed(0));
                          p.valor_proyecto = Intl.NumberFormat('de-DE').format( parseFloat(p.valor_proyecto).toFixed(0));
                          p.cobranza = cobranza_clp;
                          p.pagado = pagada_clp;
                        break;
                        case 2:
                        case "2":
                          p.facturado =  Intl.NumberFormat('de-DE').format(p.facturado_usd.toFixed(2));
                          p.adicional = Intl.NumberFormat('de-DE').format(adicional_usd.toFixed(2));
                          p.valor_proyecto = Intl.NumberFormat('de-DE').format(parseFloat(p.valor_proyecto).toFixed(2));
                          p.cobranza = cobranza_usd;
                          p.pagado = pagada_usd;
                        break;
                        case 4:
                        case "4":
                          p.facturado =  Intl.NumberFormat('de-DE').format(p.facturado_uf.toFixed(2));
                          p.adicional = Intl.NumberFormat('de-DE').format(adicional_uf.toFixed(2));
                          p.valor_proyecto = Intl.NumberFormat('de-DE').format(parseFloat(p.valor_proyecto).toFixed(2));
                          p.contratado = p.valor_proyecto + p.adicional ;
                          p.cobranza = cobranza_uf;
                          p.pagado = pagada_uf;
                        break;
                        case 10:
                        case "10":
                          p.facturado =  Intl.NumberFormat('de-DE').format(p.facturado_sol.toFixed(2));
                          p.adicional = Intl.NumberFormat('de-DE').format(adicional_sol.toFixed(2));
                          p.valor_proyecto = Intl.NumberFormat('de-DE').format(parseFloat(p.valor_proyecto).toFixed(2));
                          p.cobranza = cobranza_sol;
                          p.pagado = pagada_sol;
                        break;
                        default:
                          
                          p.facturado =  Intl.NumberFormat('de-DE').format(p.facturado_uf.toFixed(2));
                          p.adicional = Intl.NumberFormat('de-DE').format(adicional_uf.toFixed(2));
                          p.valor_proyecto = Intl.NumberFormat('de-DE').format(parseFloat(p.valor_proyecto).toFixed(2));
                          p.cobranza = cobranza_uf;
                          p.pagado = pagada_uf;
                        break;
                }
                //#endregion
                
                let aux =  parseFloat(p.adicional.replace(".","").replace(",",".")) + 
                           parseFloat(p.valor_proyecto.replace(".","").replace(",","."));
                

                let pendPago =   aux -  p.pagado;        
                let pendienteFacturacion =aux - p.pagado - p.cobranza;

                p.contratado = Intl.NumberFormat('de-DE').format(aux.toFixed(2));
                p.pendientePago = Intl.NumberFormat('de-DE').format(pendPago.toFixed(2));
                p.pendienteFacturacion = Intl.NumberFormat('de-DE').format(pendienteFacturacion.toFixed(2));


                //#region Analisis general.
                infoAnalisis.vpresupuesto = infoAnalisis.vpresupuesto + parseFloat(p.valor_proyecto.replace(".","").replace(".","").replace(".","").replace(",","."));
                infoAnalisis.adicionales = infoAnalisis.adicionales + parseFloat(p.adicional.replace(".","").replace(".","").replace(".","").replace(",","."));
                infoAnalisis.totalcontrado = infoAnalisis.totalcontrado + parseFloat(p.contratado.replace(".","").replace(".","").replace(".","").replace(",","."));
                infoAnalisis.facturadao = infoAnalisis.facturadao + parseFloat(p.facturado.replace(".","").replace(".","").replace(".","").replace(",","."));
                infoAnalisis.penPago = infoAnalisis.penPago + parseFloat(p.pendientePago.replace(".","").replace(".","").replace(".","").replace(",","."));
                infoAnalisis.pendFact = infoAnalisis.pendFact + parseFloat(p.pendienteFacturacion.replace(".","").replace(".","").replace(".","").replace(",","."));


                //#endregion
                 
        }
        
        infoAnalisis.vpresupuesto = Intl.NumberFormat('de-DE').format(infoAnalisis.vpresupuesto.toFixed(2));
        infoAnalisis.adicionales = Intl.NumberFormat('de-DE').format(infoAnalisis.adicionales.toFixed(2));
        infoAnalisis.totalcontrado = Intl.NumberFormat('de-DE').format(infoAnalisis.totalcontrado.toFixed(2));
        infoAnalisis.facturadao = Intl.NumberFormat('de-DE').format(infoAnalisis.facturadao.toFixed(2));
        infoAnalisis.penPago = Intl.NumberFormat('de-DE').format(infoAnalisis.penPago.toFixed(2));
        infoAnalisis.pendFact = Intl.NumberFormat('de-DE').format(infoAnalisis.pendFact.toFixed(2));

        res.render('reporteria/tablaproyectos', { infoAnalisis, proyectos, req , layout: 'blanco'});   
});


const formatNumberES = (n, d=0) => {
        n=new Intl.NumberFormat("es-ES").format(parseFloat(n).toFixed(d))
        if (d>0) {
            // Obtenemos la cantidad de decimales que tiene el numero
            const decimals=n.indexOf(",")>-1 ? n.length-1-n.indexOf(",") : 0;
     
            // añadimos los ceros necesios al numero
            n = (decimals==0) ? n+","+"0".repeat(d) : n+"0".repeat(d-decimals);
        }
        return n;
    }

function getFacturasProyecto(id) // sacar las Horas del proyecto. 
{
  
        let factProyecto = pool.query("SELECT * FROM fact_facturas_equivalencias as t1 WHERE t1.id_proyecto = ? AND t1.id_estado IN (2,3)", [id]);

        return new Promise((resolve,reject)=>{
                setTimeout(()=>{
                        resolve(factProyecto);
                },100);
        });

}


function getRequerimientosOC(id)
{

        let requerimientos = pool.query("SELECT * FROM orden_compra_requerimiento as t1 WHERE t1.id_solicitud = ? ", [id]);


        return new Promise((resolve,reject)=>{
                setTimeout(()=>{
                        resolve(requerimientos);
                },100);
        });

}

// mostrar información para chequeos. 
router.get('/chequeos',isLoggedIn,  async (req, res) => {


  res.render('reporteria/chequeos', {  req, layout: 'template' });

});

// mostrar información para chequeos. 
router.get('/pruebas',isLoggedIn,  async (req, res) => {

        //#region  SQL PARA INFORMACION DE LAS PRUEBAS 
        let sqlFacCob = " SELECT  "+
        " t1.id_proyecto,"+
        " SUM(t1.monto_clp) AS c_clp,"+
        " SUM(t1.monto_uf)  AS c_uf,"+
        " SUM(t1.monto_sol) AS c_sol,"+
        " SUM(t1.monto_dolar) AS c_usd"+
        " FROM "+
        "        fact_facturas_equivalencias AS t1"+
        " WHERE "+
        "        t1.id_proyecto IN (SELECT "+
        "        t1c.id_proyecto"+
        " FROM "+
        "       bita_horas_equivalencia AS t1c"+
        " WHERE "+
        "        t1c.fecha BETWEEN DATE_FORMAT((date_add(now(), INTERVAL -1 YEAR)),'%Y-%m') AND DATE_FORMAT( NOW(),'%Y-%m') "+
        " GROUP BY t1c.id_proyecto) "+
        " AND t1.id_estado IN(2,3) " +
        " GROUP BY t1.id_proyecto ";


    let sqlFacPag = " SELECT  "+
        " t1.id_proyecto,"+
        " SUM(t1.monto_clp) AS c_clp,"+
        " SUM(t1.monto_uf)  AS c_uf,"+
        " SUM(t1.monto_sol) AS c_sol,"+
        " SUM(t1.monto_dolar) AS c_usd"+
        " FROM "+
        "        fact_facturas_equivalencias AS t1"+
        " WHERE "+
        "        t1.id_proyecto IN (SELECT "+
        "        t1c.id_proyecto"+
        " FROM "+
        "       bita_horas_equivalencia AS t1c"+
        " WHERE "+
        "        t1c.fecha BETWEEN DATE_FORMAT((date_add(now(), INTERVAL -1 YEAR)),'%Y-%m') AND DATE_FORMAT( NOW(),'%Y-%m') "+
        " GROUP BY t1c.id_proyecto) "+
        " AND t1.id_estado = 3 " +
        " GROUP BY t1.id_proyecto ";


   let sqlcep = " SELECT  "+
        " t1.id_proyecto,"+
        " SUM(t1.monto_clp) AS c_clp,"+
        " SUM(t1.monto_uf)  AS c_uf,"+
        " SUM(t1.monto_sol) AS c_sol,"+
        " SUM(t1.monto_usd) AS c_usd"+
        " FROM "+
        "        pro_costo_externo_equivalencias AS t1"+
        " WHERE "+
        "        t1.id_proyecto IN (SELECT "+
        "        t1c.id_proyecto"+
        " FROM "+
        "       bita_horas_equivalencia AS t1c"+
        " WHERE "+
        "        t1c.fecha BETWEEN DATE_FORMAT((date_add(now(), INTERVAL -1 YEAR)),'%Y-%m') AND DATE_FORMAT( NOW(),'%Y-%m') "+
        " GROUP BY t1c.id_proyecto) "+
        " GROUP BY t1.id_proyecto ";

   
     let sqlce = " SELECT  "+
        " t1.id_proyecto,"+
        " SUM(t1.monto_clp) AS c_clp,"+
        " SUM(t1.monto_uf)  AS c_uf,"+
        " SUM(t1.monto_sol) AS c_sol,"+
        " SUM(t1.monto_usd) AS c_usd"+
        " FROM "+
        "        proyecto_costo_externo_equivalencias AS t1"+
        " WHERE "+
        "        t1.id_proyecto IN (SELECT "+
        "        t1c.id_proyecto"+
        " FROM "+
        "       bita_horas_equivalencia AS t1c"+
        " WHERE "+
        "        t1c.fecha BETWEEN DATE_FORMAT((date_add(now(), INTERVAL -1 YEAR)),'%Y-%m') AND DATE_FORMAT( NOW(),'%Y-%m') "+
        " GROUP BY t1c.id_proyecto) "+
        " GROUP BY t1.id_proyecto ";

   let sqlOC = " SELECT  "+
                        " t1.id_proyecto,"+
                        " SUM(t1.monto_cpl) AS c_clp,"+
                        " SUM(t1.monto_uf)  AS c_uf,"+
                        " SUM(t1.monto_sol) AS c_sol,"+
                        " SUM(t1.monto_usd) AS c_usd"+
                        " FROM "+
                        "        orden_compra_equivalencias AS t1"+
                        " WHERE "+
                        "        t1.id_proyecto IN (SELECT "+
                        "        t1c.id_proyecto"+
                        " FROM "+
                        "       bita_horas_equivalencia AS t1c"+
                        " WHERE "+
                        "        t1c.fecha BETWEEN DATE_FORMAT((date_add(now(), INTERVAL -1 YEAR)),'%Y-%m') AND DATE_FORMAT( NOW(),'%Y-%m') "+
                        " GROUP BY t1c.id_proyecto) "+
                        " GROUP BY t1.id_proyecto ";

   let sql = " SELECT  " +
                "  t1b.Nombre AS director, "+
                " t1a.nombre,"+
	        " t1a.`year`," +
	        " t1a.code, " +
                " t1.id_proyecto," +
                " SUM(t1.costo_clp) AS c_clp," +
                " SUM(t1.costo_uf)  AS c_uf," +
                " SUM(t1.costo_sol) AS c_sol,"+
                " SUM(t1.costo_usd) AS c_usd"+
                " FROM "+
                "                bita_horas_equivalencia AS t1"+
                " LEFT JOIN pro_proyectos AS t1a ON t1.id_proyecto = t1a.id " +
                " LEFT JOIN sys_usuario AS t1b ON t1a.id_director = t1b.idUsuario " +
                " WHERE "+
               // "                t1.fecha BETWEEN DATE_FORMAT((date_add(now(), INTERVAL -1 YEAR)),'%Y-%m') AND DATE_FORMAT( NOW(),'%Y-%m') "+
                " t1.id_proyecto IN (SELECT  "+
                                        " t1c.id_proyecto " +
                                " FROM  " +
                                           "     bita_horas_equivalencia AS t1c "+
                                " WHERE  "+
                                           "     t1c.fecha BETWEEN DATE_FORMAT((date_add(now(), INTERVAL -1 YEAR)),'%Y-%m') AND DATE_FORMAT( NOW(),'%Y-%m') "+
                                " GROUP BY t1c.id_proyecto) "+
                " GROUP BY t1.id_proyecto "; 
        //#endregion

    

        const proyectos = await pool.query(sql);
        const infoOc = await pool.query(sqlOC);
        const infoCE = await pool.query(sqlce);
        const infoCEP = await pool.query(sqlcep); 
        const infoFacP = await pool.query(sqlFacPag);
        const infoFacC = await pool.query(sqlFacCob);

        
        proyectos.forEach(p => {

                let bOrdenCompra = infoOc.find(oc => {return oc.id_proyecto === p.id_proyecto }); 
                let valorOC = 0;
                if (bOrdenCompra != undefined){valorOC = Intl.NumberFormat('de-DE').format(bOrdenCompra.c_uf.toFixed(2));}

                let bCostoExterno = infoCE.find(oc => {return oc.id_proyecto === p.id_proyecto }); 
                let valorCE = 0;
                if (bCostoExterno != undefined){valorCE = Intl.NumberFormat('de-DE').format(bCostoExterno.c_uf.toFixed(2));}

                let bCostoExternoP = infoCEP.find(oc => {return oc.id_proyecto === p.id_proyecto }); 
                let valorCEP = 0;
                if (bCostoExternoP != undefined){valorCEP = Intl.NumberFormat('de-DE').format(bCostoExternoP.c_uf.toFixed(2));}

                let bFacturaPagada = infoFacP.find(oc => {return oc.id_proyecto === p.id_proyecto }); 
                let valorFacPagada = 0;
                if (bFacturaPagada != undefined){valorFacPagada = Intl.NumberFormat('de-DE').format(bFacturaPagada.c_uf.toFixed(2));}

                let bFacturaCobranza = infoFacC.find(oc => {return oc.id_proyecto === p.id_proyecto }); 
                let valorFacCobranza = 0;
                if (bFacturaCobranza != undefined){valorFacCobranza = Intl.NumberFormat('de-DE').format(bFacturaCobranza.c_uf.toFixed(2));}

                p.oc = valorOC;
                p.ce = valorCE;
                p.cep = valorCEP;
                p.fp = valorFacPagada;
                p.fc = valorFacCobranza;
                p.tote = sumaFormateada(valorOC,valorCE,valorCEP);
                p.c_uf = Intl.NumberFormat('de-DE').format(p.c_uf.toFixed(2));

                p.totp = sumaFormateada(p.tote,p.c_uf);
                p.df = restaFormateada(valorFacCobranza , valorFacPagada);

        });


        res.render('reporteria/pruebas', { proyectos, req, layout: 'template' });
      
      });

      function sumaFormateada(n1=0,n2=0,n3=0)
      {

        let n01 = parseFloat( n1.toString().replace(".","").replace(".","").replace(".","").replace(".","").replace(",","."));
        let n02 = parseFloat( n2.toString().replace(".","").replace(".","").replace(".","").replace(".","").replace(",","."));
        let n03 = parseFloat( n3.toString().replace(".","").replace(".","").replace(".","").replace(".","").replace(",","."));
        
        let total = n01 + n02 + n03;
        return   Intl.NumberFormat('de-DE').format(total.toFixed(2));

      }
      function restaFormateada(n1=0,n2=0)
      {

        let n01 = parseFloat( n1.toString().replace(".","").replace(".","").replace(".","").replace(".","").replace(",","."));
        let n02 = parseFloat( n2.toString().replace(".","").replace(".","").replace(".","").replace(".","").replace(",","."));
        
        
        let total = n01 - n02;
        return   Intl.NumberFormat('de-DE').format(total.toFixed(2));

      }
//analisisMonedaCostoExternoPlanner
router.post('/analisisMonedaCostoExternoPlanner',isLoggedIn,  async (req, res) => {

        //#region VALORES DE LAS MONEDAS 
        let valorUfMensual = []; 
        let valorUsdMensual = [];
        let valorSolMensual = [];

        const valorUFMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,10) AS fecha," +
                                            " MAX(t1.valor) as valor" +
                                            " FROM " + 
                                            " moneda_valor AS t1 " +
                                            " WHERE t1.id_moneda = 4 GROUP BY SUBSTRING(t1.fecha_valor,1,10)");
        
        const valorUSDMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,10) AS fecha," +
                                            " MAX(t1.valor) as valor" +
                                            " FROM " + 
                                            " moneda_valor AS t1 " +
                                            " WHERE t1.id_moneda = 2 GROUP BY SUBSTRING(t1.fecha_valor,1,10)");

        const valorSOLMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,10) AS fecha," +
                                            " MAX(t1.valor) as valor" +
                                            " FROM " + 
                                            " moneda_valor AS t1 " +
                                            " WHERE t1.id_moneda = 10 GROUP BY SUBSTRING(t1.fecha_valor,1,10)");                                         
                            
        valorUFMes.forEach(element => {    
                                        const containsFecha = !!valorUfMensual.find(fecha => {return fecha.fecha === element.fecha });
                                                if (containsFecha === false)
                                                        {
                                                                valorUfMensual.push({ 
                                                                                            fecha : element.fecha,
                                                                                            valor : element.valor
                                                                                    });
                                                        }
                                        }
                           );

        valorUSDMes.forEach(element => {    
                                const containsFecha = !!valorUsdMensual.find(fecha => {return fecha.fecha === element.fecha });
                                        if (containsFecha === false)
                                                {
                                                        valorUsdMensual.push({ 
                                                                                    fecha : element.fecha,
                                                                                    valor : element.valor
                                                                            });
                                                }
                                }
                   );

        valorSOLMes.forEach(element => {    
                        const containsFecha = !!valorSolMensual.find(fecha => {return fecha.fecha === element.fecha });
                                if (containsFecha === false)
                                        {
                                                valorSolMensual.push({ 
                                                                            fecha : element.fecha,
                                                                            valor : element.valor
                                                                    });
                                        }
                        }
           );



        //#endregion

        let sql = " SELECT * "  +
                " FROM  " +
                        " pro_costo_externo AS t1 " +
                " WHERE  " +
                        " t1.costo != 0 ";

        let costoExternos = await pool.query(sql);


        costoExternos.forEach(ce => {
                let fechaAnalisis = dateFormat(ce.fecha_ingreso, "yyyy-mm-dd");
                const colUSD = valorUsdMensual.find(fecha => {return fecha.fecha === fechaAnalisis});
                const colUF = valorUfMensual.find(fecha => {return fecha.fecha === fechaAnalisis});
                const colSOL = valorSolMensual.find(fecha => {return fecha.fecha === fechaAnalisis});

                if (colUSD === undefined || colUF === undefined || colSOL === undefined )
                {
                        console.log("ERROR EN LA CARGA DE ALGUN VALOR DE MONEDA");
                }
                else
                {
                        let registro;
                        let ist;
                        switch(ce.id_tipo_moneda)
                        {
                                case 1:
                                registro = {
                                                
                                                id_proyecto : ce.id_proyecto,
                                                id_moneda_base : ce.id_tipo_moneda,
                                                fecha : fechaAnalisis,
                                                monto_base : ce.costo,
                                                monto_uf : ce.costo / colUF.valor,
                                                monto_clp : ce.costo,
                                                monto_usd : ce.costo / colUSD.valor,
                                                monto_sol : ce.costo / colSOL.valor,
                                                valor_uf : colUF.valor,
                                                valor_usd : colUSD.valor,
                                                valor_sol : colSOL.valor
                
                                        }
                                
                                ist =  pool.query('INSERT INTO pro_costo_externo_equivalencias set ?', [registro]);
                                break;
                        }
                }

        });

        res.send('ok');

});
//bitacatoraPlanner
router.post('/bitacoraPlanner',isLoggedIn,  async (req, res) => {

       const valorUFMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha, MAX(t1.valor) as valor FROM moneda_valor AS t1 WHERE t1.id_moneda = 4 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");
       const valorDolarMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha, MAX(t1.valor) as valor FROM moneda_valor AS t1 WHERE t1.id_moneda = 2 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");
       const valorSolMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha, MAX(t1.valor) as valor FROM moneda_valor AS t1 WHERE t1.id_moneda = 10 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");

       const costoUsuario =await pool.query(" SELECT " +
                                                " CONCAT(t1.annio,'-',t1.mes) AS fecha, " +
                                                " t1.costo, " +
                                                " t1.idUsuario " +
                                                " FROM  " +
                                                                " sys_usuario_costo AS t1 " +
                                                " GROUP BY t1.idUsuario, fecha ");

        let bitacora = await pool.query("SELECT "+
                                        " t1.id_project , "+
                                        " t1.id_session AS id_usuario,"+
                                        " SUBSTRING(t1.ini_time,1,7) AS fecha,"+
                                        " SUM(TIME_TO_SEC(timediff(t1.fin_time, t1.ini_time))/ 3600) AS numHH "+
                                        " FROM "+
                                        "                bita_horas AS t1 "+
                                        " WHERE "+
                                        "                t1.id_project != 0 AND t1.id_project > 0 AND t1.id_session not in (1 )"+
                                        " GROUP BY fecha, id_usuario	");

                                                
        
        let errores = [];
        bitacora.forEach(b => {
                let fechaAnalisis = b.fecha;
                const colUSD = valorDolarMes.find(fecha => {return fecha.fecha === fechaAnalisis});
                const colUF = valorUFMes.find(fecha => {return fecha.fecha === fechaAnalisis});
                const colSOL = valorSolMes.find(fecha => {return fecha.fecha === fechaAnalisis});

                        if (colUSD === undefined || colUF === undefined || colSOL === undefined)
                        {
                               
                                errores.push({
                                        tipo : "Valor moneda",
                                        fecha : fechaAnalisis,
                                        usuario : usuarioID
                                });
                        }
                        else
                        {
                                let usuarioID = b.id_usuario;
                                let bValorUsuario = costoUsuario.find(fecha => {return fecha.fecha === fechaAnalisis && fecha.idUsuario === usuarioID}); 


                                if (bValorUsuario === undefined)
                                {
                                        errores.push({
                                                tipo : "Costo Usuario",
                                                fecha : fechaAnalisis,
                                                usuario : usuarioID
                                        });   
                                        
                                        registro = {   
                                                id_user : usuarioID,
                                                fecha : fechaAnalisis,
                                                }

                                        
                                }
                                else
                                {
                                        let costo = bValorUsuario.costo;

                                        let valorMes = b.numHH * costo;
                                        let costo_cpl = parseInt(valorMes);
                                        let costo_uf = costo_cpl / colUF.valor ;
                                        let costo_sol = costo_cpl / colSOL.valor ;
                                        let costo_usd = costo_cpl / colUSD.valor ;

                                        registro = {   
                                                id_user : usuarioID,
                                                id_proyecto : b.id_project,
                                                fecha : fechaAnalisis,
                                                hh : b.numHH,
                                                costo_hh : costo,
                                                costo_clp : costo_cpl,
                                                costo_uf : costo_uf,
                                                costo_sol : costo_sol,
                                                costo_usd : costo_usd,
                                                valor_uf : colUF.valor,
                                                valor_sol : colSOL.valor,
                                                valor_usd : colUSD.valor,
                                                }
                                
                                        let ist =  pool.query('INSERT INTO bita_horas_equivalencia set ?', [registro]);

                                }

                                
                        }

                });

        res.send('ok');
});

// bitacatoraAnterior
router.post('/bitacatoraAnterior',isLoggedIn,  async (req, res) => {

       // VALORES MAXIMOS DE LAS MONEDAS 

       const valorUFMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha, MAX(t1.valor) as valor FROM moneda_valor AS t1 WHERE t1.id_moneda = 4 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");
       const valorDolarMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha, MAX(t1.valor) as valor FROM moneda_valor AS t1 WHERE t1.id_moneda = 2 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");
       const valorSolMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha, MAX(t1.valor) as valor FROM moneda_valor AS t1 WHERE t1.id_moneda = 10 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");

       let sql = " SELECT " +
                                " t1.owner AS idUser, " +
                                " t1.project AS proyecto, " +
                                " DATE_FORMAT(t1.date,'%Y-%m') AS mes, "+
                                " SUM(t1.nHH) / 6 AS hh, " +
                                " SUM(t1.nHE) / 6 AS he, " +
                                " t1.costoHH " +
                " FROM  " +
                                " bitacora AS t1 " +
                " WHERE  " +
                                " t1.project != 0 AND t1.owner != 0" +
                " GROUP BY mes,idUser  " +
                " ORDER BY t1.id ASC"; 

        const costoUsuario =await pool.query(" SELECT " +
                                                " CONCAT(t1.annio,'-',t1.mes) AS fecha, " +
                                                " t1.costo, " +
                                                " t1.idUsuario " +
                                                " FROM  " +
                                                                " sys_usuario_costo AS t1 " +
                                                " GROUP BY t1.idUsuario, fecha "); 

        let bitacora = await pool.query(sql);
        let errores = [];
        bitacora.forEach(b => {

                //let fechaAnalisis = '2100-10';
                let fechaAnalisis = b.mes;
                const colUSD = valorDolarMes.find(fecha => {return fecha.fecha === fechaAnalisis});
                const colUF = valorUFMes.find(fecha => {return fecha.fecha === fechaAnalisis});
                const colSOL = valorSolMes.find(fecha => {return fecha.fecha === fechaAnalisis});

                

                
                if (colUSD === undefined || colUF === undefined || colSOL === undefined)
                {
                       
                        errores.push({
                                tipo : "Valor moneda",
                                fecha : fechaAnalisis,
                                usuario : usuarioID
                        });
                }
                else
                {
                        let usuarioID = b.idUser;
                        let bValorUsuario = costoUsuario.find(fecha => {return fecha.fecha === fechaAnalisis && fecha.idUsuario === usuarioID}); 

                        if (bValorUsuario === undefined)
                        {
                                errores.push({
                                        tipo : "Costo Usuario",
                                        fecha : fechaAnalisis,
                                        usuario : usuarioID
                                });   
                                
                                registro = {   
                                        id_user : b.idUser,
                                        fecha : fechaAnalisis,
                                        }

                                let ist =  pool.query('INSERT INTO bitacora_equivalencia_error set ?', [registro]);
                        }
                        else
                        {
                                /// CARGA de valores. 

                                let costo = bValorUsuario.costo;

                                let valorMes = b.hh * costo + b.he * costo * 1.5;
                                let costo_cpl = parseInt(valorMes);
                                let costo_uf = costo_cpl / colUF.valor ;
                                let costo_sol = costo_cpl / colSOL.valor ;
                                let costo_usd = costo_cpl / colUSD.valor ;


                                registro = {   
                                        id_user : b.idUser,
                                        id_proyecto : b.proyecto,
                                        fecha : fechaAnalisis,
                                        hh : b.hh,
                                        he : b.he,
                                        costo_hh : costo,
                                        costo_clp : costo_cpl,
                                        costo_uf : costo_uf,
                                        costo_sol : costo_sol,
                                        costo_usd : costo_usd,
                                        valor_uf : colUF.valor,
                                        valor_sol : colSOL.valor,
                                        valor_usd : colUSD.valor,
                                        }
                        
                        let ist =  pool.query('INSERT INTO bitacora_equivalencia set ?', [registro]);

                        }
                }
        });

       

        res.send("ok");
});



router.post('/analisisMonedaCostoExterno',isLoggedIn,  async (req, res) => {

        //#region VALORES DE LAS MONEDAS 
        let valorUfMensual = []; 
        let valorUsdMensual = [];
        let valorSolMensual = [];

        const valorUFMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,10) AS fecha," +
                                            " MAX(t1.valor) as valor" +
                                            " FROM " + 
                                            " moneda_valor AS t1 " +
                                            " WHERE t1.id_moneda = 4 GROUP BY SUBSTRING(t1.fecha_valor,1,10)");
        
        const valorUSDMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,10) AS fecha," +
                                            " MAX(t1.valor) as valor" +
                                            " FROM " + 
                                            " moneda_valor AS t1 " +
                                            " WHERE t1.id_moneda = 2 GROUP BY SUBSTRING(t1.fecha_valor,1,10)");

        const valorSOLMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,10) AS fecha," +
                                            " MAX(t1.valor) as valor" +
                                            " FROM " + 
                                            " moneda_valor AS t1 " +
                                            " WHERE t1.id_moneda = 10 GROUP BY SUBSTRING(t1.fecha_valor,1,10)");                                         
                            
        valorUFMes.forEach(element => {    
                                        const containsFecha = !!valorUfMensual.find(fecha => {return fecha.fecha === element.fecha });
                                                if (containsFecha === false)
                                                        {
                                                                valorUfMensual.push({ 
                                                                                            fecha : element.fecha,
                                                                                            valor : element.valor
                                                                                    });
                                                        }
                                        }
                           );

        valorUSDMes.forEach(element => {    
                                const containsFecha = !!valorUsdMensual.find(fecha => {return fecha.fecha === element.fecha });
                                        if (containsFecha === false)
                                                {
                                                        valorUsdMensual.push({ 
                                                                                    fecha : element.fecha,
                                                                                    valor : element.valor
                                                                            });
                                                }
                                }
                   );

        valorSOLMes.forEach(element => {    
                        const containsFecha = !!valorSolMensual.find(fecha => {return fecha.fecha === element.fecha });
                                if (containsFecha === false)
                                        {
                                                valorSolMensual.push({ 
                                                                            fecha : element.fecha,
                                                                            valor : element.valor
                                                                    });
                                        }
                        }
           );



        //#endregion

       
        let sql = " SELECT * "  +
                " FROM  " +
                        " proyecto_costo_externo AS t1 " +
                " WHERE  " +
                        " t1.costo != 0 ";

        let costoExternos = await pool.query(sql);

        costoExternos.forEach(ce => {

                let fechaAnalisis = dateFormat(ce.fecha_carga, "yyyy-mm-dd");
                const colUSD = valorUsdMensual.find(fecha => {return fecha.fecha === fechaAnalisis});
                const colUF = valorUfMensual.find(fecha => {return fecha.fecha === fechaAnalisis});
                const colSOL = valorSolMensual.find(fecha => {return fecha.fecha === fechaAnalisis});

                if (colUSD === undefined || colUF === undefined || colSOL === undefined )
                        {
                                console.log("ERROR EN LA CARGA DE ALGUN VALOR DE MONEDA");
                        }
                        else
                        {
                                let registro;
                                let ist;
                                switch(ce.id_moneda)
                                {
                                        case 1: // Pesos
                                        registro = {
                                                
                                                id_proyecto : ce.id_proyecto,
                                                id_moneda_base : ce.id_moneda,
                                                fecha : fechaAnalisis,
                                                monto_base : ce.costo,
                                                monto_uf : ce.costo / colUF.valor,
                                                monto_clp : ce.costo,
                                                monto_usd : ce.costo / colUSD.valor,
                                                monto_sol : ce.costo / colSOL.valor,
                                                valor_uf : colUF.valor,
                                                valor_usd : colUSD.valor,
                                                valor_sol : colSOL.valor
                
                                        }
                                        ist =  pool.query('INSERT INTO proyecto_costo_externo_equivalencias set ?', [registro]);
                                        break;
                                        case 2: // USD
                                        registro = {
                                                
                                                id_proyecto : ce.id_proyecto,
                                                id_moneda_base : ce.id_moneda,
                                                fecha : fechaAnalisis,
                                                monto_base : ce.costo,
                                                monto_uf : ce.costo * colUSD.valor / colUF.valor,
                                                monto_clp : ce.costo * colUSD.valor,
                                                monto_usd : ce.costo,
                                                monto_sol : ce.costo * colUSD.valor / colSOL.valor,
                                                valor_uf : colUF.valor,
                                                valor_usd : colUSD.valor,
                                                valor_sol : colSOL.valor
                
                                        }
                                        ist =  pool.query('INSERT INTO proyecto_costo_externo_equivalencias set ?', [registro]);
                                        break;
                                        case 4: // UF
                                        registro = {
                                                id_proyecto : ce.id_proyecto,
                                                id_moneda_base : ce.id_moneda,
                                                fecha : fechaAnalisis,
                                                monto_base : ce.costo,
                                                monto_uf : ce.costo,
                                                monto_clp : ce.costo * colUF.valor,
                                                monto_usd : ce.costo * colUF.valor / colUSD.valor,
                                                monto_sol : ce.costo * colUF.valor / colSOL.valor,
                                                valor_uf : colUF.valor,
                                                valor_usd : colUSD.valor,
                                                valor_sol : colSOL.valor
                
                                        }
                                        ist =  pool.query('INSERT INTO proyecto_costo_externo_equivalencias set ?', [registro]);
                                        break;
                
                                }
                                
                        }
                
                
        });


        res.send('');

});
//analisisMonedaOC
router.post('/analisisMonedaOC',isLoggedIn,  async (req, res) => {


        //#region VALORES DE LAS MONEDAS 
let valorUfMensual = []; 
let valorUsdMensual = [];
let valorSolMensual = [];

const valorUFMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,10) AS fecha," +
                                    " MAX(t1.valor) as valor" +
                                    " FROM " + 
                                    " moneda_valor AS t1 " +
                                    " WHERE t1.id_moneda = 4 GROUP BY SUBSTRING(t1.fecha_valor,1,10)");

const valorUSDMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,10) AS fecha," +
                                    " MAX(t1.valor) as valor" +
                                    " FROM " + 
                                    " moneda_valor AS t1 " +
                                    " WHERE t1.id_moneda = 2 GROUP BY SUBSTRING(t1.fecha_valor,1,10)");

const valorSOLMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,10) AS fecha," +
                                    " MAX(t1.valor) as valor" +
                                    " FROM " + 
                                    " moneda_valor AS t1 " +
                                    " WHERE t1.id_moneda = 10 GROUP BY SUBSTRING(t1.fecha_valor,1,10)");                                         
                    
valorUFMes.forEach(element => {    
                                const containsFecha = !!valorUfMensual.find(fecha => {return fecha.fecha === element.fecha });
                                        if (containsFecha === false)
                                                {
                                                        valorUfMensual.push({ 
                                                                                    fecha : element.fecha,
                                                                                    valor : element.valor
                                                                            });
                                                }
                                }
                   );

valorUSDMes.forEach(element => {    
                        const containsFecha = !!valorUsdMensual.find(fecha => {return fecha.fecha === element.fecha });
                                if (containsFecha === false)
                                        {
                                                valorUsdMensual.push({ 
                                                                            fecha : element.fecha,
                                                                            valor : element.valor
                                                                    });
                                        }
                        }
           );

valorSOLMes.forEach(element => {    
                const containsFecha = !!valorSolMensual.find(fecha => {return fecha.fecha === element.fecha });
                        if (containsFecha === false)
                                {
                                        valorSolMensual.push({ 
                                                                    fecha : element.fecha,
                                                                    valor : element.valor
                                                            });
                                }
                }
   );
//#endregion

                let sql = " SELECT * "  +
                        " FROM  " +
                                " orden_compra AS t1 " +
                        " WHERE  " +
                                " t1.id_proyecto != 0 " +
                        " AND  " +
                                " t1.id_estado IN (2,3,5)";
                        //" AND " +
                        //        " t1.id = 122";
        

        let orden_compra = await pool.query(sql);
        

        //let oc = [];
        let info = [];
        for (let oc of orden_compra) {

                let detOC = [];
                let req_oc = await getRequerimientosOC(oc.id); 

                let id_moneda = 0;
                let monto_base = 0; 
                let cambio = 0;

                let bmoneda = true;

                req_oc.forEach(infoReq => {
                        id_moneda = infoReq.id_moneda;
                        monto_base = parseFloat(infoReq.precio_unitario) * parseFloat(infoReq.cantidad);
                        cambio = infoReq.tipo_cambio;

                        if (id_moneda != 0)
                        {
                              if (id_moneda != infoReq.id_moneda)  
                              {
                                bmoneda = false;
                              }
                        }
                });

                if (bmoneda === true)
                {
                        let fechaAnalisis = dateFormat(oc.fecha, "yyyy-mm-dd");
			const colUSD = valorUsdMensual.find(fecha => {return fecha.fecha === fechaAnalisis});
                        const colUF = valorUfMensual.find(fecha => {return fecha.fecha === fechaAnalisis});
                        const colSOL = valorSolMensual.find(fecha => {return fecha.fecha === fechaAnalisis});

                        if (colUSD === undefined || colUF === undefined || colSOL === undefined )
                        {
                                console.log("ERROR EN LA CARGA DE ALGUN VALOR DE MONEDA");
                        }
                        else
                        {
                                let registro;
                                let ist;
                                switch(id_moneda)
                                {
                                        case 4:
                                                registro ={
                                                        id_proyecto :oc.id_proyecto,
                                                        fecha : fechaAnalisis,
                                                        moneda_base : id_moneda,
                                                        monto : monto_base,
                                                        cambio : cambio,
                                                        odid : oc.id,
                                                        monto_uf : monto_base,
                                                        monto_cpl : parseInt(monto_base * cambio),
                                                        monto_usd : ((monto_base * cambio) / colUSD.valor),
                                                        monto_sol : ((monto_base * cambio) / colSOL.valor),
                                                        valor_uf : cambio,
                                                        valor_usd :colUSD.valor,
                                                        valor_sol :colSOL.valor
                                                };
                                                info.push(registro);
                                                ist =  pool.query('INSERT INTO orden_compra_equivalencias set ?', [registro]);
                                        break;
                                        case 2:
                                                registro ={
                                                        id_proyecto :oc.id_proyecto,
                                                        fecha : fechaAnalisis,
                                                        moneda_base : id_moneda,
                                                        monto : monto_base,
                                                        cambio : cambio,
                                                        odid : oc.id,
                                                        monto_uf : ((monto_base * cambio) / colUF.valor),
                                                        monto_cpl : parseInt(monto_base * cambio),
                                                        monto_usd : monto_base,
                                                        monto_sol : ((monto_base * cambio) / colSOL.valor) ,
                                                        valor_uf : colUF.valor,
                                                        valor_usd :cambio,
                                                        valor_sol :colSOL.valor
                                                }
                                                info.push(registro);
                                                ist =  pool.query('INSERT INTO orden_compra_equivalencias set ?', [registro]);
                                                
                                        break;
                                        case 10:
                                                registro ={
                                                        id_proyecto :oc.id_proyecto,
                                                        fecha : fechaAnalisis,
                                                        moneda_base : id_moneda,
                                                        monto : monto_base,
                                                        cambio : cambio,
                                                        odid : oc.id,
                                                        monto_uf : ((monto_base * cambio) / colUF.valor),
                                                        monto_cpl : parseInt(monto_base * cambio),
                                                        monto_usd : ((monto_base * cambio) / colUSD.valor) ,
                                                        monto_sol : monto_base,
                                                        valor_uf : colUF.valor,
                                                        valor_usd :colUSD.valor,
                                                        valor_sol :cambio
                                                };
                                                info.push(registro);
                                                ist =  pool.query('INSERT INTO orden_compra_equivalencias set ?', [registro]);
                                        break;
                                        case 1:
                                                registro ={
                                                        id_proyecto :oc.id_proyecto,
                                                        fecha : fechaAnalisis,
                                                        moneda_base : id_moneda,
                                                        monto : monto_base,
                                                        cambio : cambio,
                                                        odid : oc.id,
                                                        monto_uf : ((monto_base * cambio) / colUF.valor),
                                                        monto_cpl : parseInt(monto_base * cambio),
                                                        monto_usd : ((monto_base * cambio) / colUSD.valor) ,
                                                        monto_sol : ((monto_base * cambio) / colSOL.valor),
                                                        valor_uf : colUF.valor,
                                                        valor_usd :colUSD.valor,
                                                        valor_sol :colSOL.valor
                                                };
                                                info.push(registro); 
                                                ist =  pool.query('INSERT INTO orden_compra_equivalencias set ?', [registro]);
                                        break;
                                        default:
                                        break;
                                }
                        }
                        
                }
                else{
                        console.log("ERROR " + oc.id_proyecto);
                }

        }

        //oc.log();
       

        res.send('ok');
});

//analisisMoneda
router.post('/analisisMonedaFactura',isLoggedIn,  async (req, res) => {

        // variable donde almaceno los errores 
        let errores = [];
        //#region VALORES DE LAS MONEDAS 
        let valorUfMensual = []; 
        let valorUsdMensual = [];
        let valorSolMensual = [];

        const valorUFMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,10) AS fecha," +
                                            " MAX(t1.valor) as valor" +
                                            " FROM " + 
                                            " moneda_valor AS t1 " +
                                            " WHERE t1.id_moneda = 4 GROUP BY SUBSTRING(t1.fecha_valor,1,10)");
        
        const valorUSDMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,10) AS fecha," +
                                            " MAX(t1.valor) as valor" +
                                            " FROM " + 
                                            " moneda_valor AS t1 " +
                                            " WHERE t1.id_moneda = 2 GROUP BY SUBSTRING(t1.fecha_valor,1,10)");

        const valorSOLMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,10) AS fecha," +
                                            " MAX(t1.valor) as valor" +
                                            " FROM " + 
                                            " moneda_valor AS t1 " +
                                            " WHERE t1.id_moneda = 10 GROUP BY SUBSTRING(t1.fecha_valor,1,10)");                                         
                            
        valorUFMes.forEach(element => {    
                                        const containsFecha = !!valorUfMensual.find(fecha => {return fecha.fecha === element.fecha });
                                                if (containsFecha === false)
                                                        {
                                                                valorUfMensual.push({ 
                                                                                            fecha : element.fecha,
                                                                                            valor : element.valor
                                                                                    });
                                                        }
                                        }
                           );

        valorUSDMes.forEach(element => {    
                                const containsFecha = !!valorUsdMensual.find(fecha => {return fecha.fecha === element.fecha });
                                        if (containsFecha === false)
                                                {
                                                        valorUsdMensual.push({ 
                                                                                    fecha : element.fecha,
                                                                                    valor : element.valor
                                                                            });
                                                }
                                }
                   );

        valorSOLMes.forEach(element => {    
                        const containsFecha = !!valorSolMensual.find(fecha => {return fecha.fecha === element.fecha });
                                if (containsFecha === false)
                                        {
                                                valorSolMensual.push({ 
                                                                            fecha : element.fecha,
                                                                            valor : element.valor
                                                                    });
                                        }
                        }
           );



        //#endregion
        

        

        // bloque Facturas 
        let sqlFacturas = " SELECT * " +
                          " FROM  " +
                                        " fact_facturas AS t2 " +
                           " WHERE  " +
                                        " t2.id NOT IN ( " +
                                                            "    SELECT  " +
                                                                        " t1.id_factura " +
                                                                " FROM  " +
                                                                        " fact_facturas_equivalencias AS t1 "+
                                                          ")";

        let listadoProyectosAnalisisFactura = await pool.query(sqlFacturas);
 
        
        listadoProyectosAnalisisFactura.forEach(factura => {
                
                

                let monedaBase = factura.id_tipo_moneda;

                let fechaAnalisisFactura = "";
                let fechaFactura = factura.fecha_factura;
                let fechaCobro   = factura.fecha_cobro;
                let fechaIngreso   = dateFormat(factura.fecha_solicitud, "yyyy-mm-dd");

                // orden de las fechas para sacar las equivalencias de las monedas. 
                if (fechaFactura != ""){fechaAnalisisFactura = fechaFactura;}
                else if (fechaCobro != ""){fechaAnalisisFactura = fechaCobro;}
                else if (fechaIngreso != ""){fechaAnalisisFactura = fechaIngreso;}


                 // VALORES UF

                 let valorUF = "";
                 let valorUSD = "";
                 let valorSOL = "";
                
                //#region VALORES DE UF // USD // SOL SEGUN FECHA ANALISIS 
                 const colUF = valorUfMensual.find(fecha => {return fecha.fecha === fechaAnalisisFactura});
                 const colUSD = valorUsdMensual.find(fecha => {return fecha.fecha === fechaAnalisisFactura});
                 const colSOL = valorSolMensual.find(fecha => {return fecha.fecha === fechaAnalisisFactura});
                if (colUF === undefined) {
                        errores.push(
                                {
                                        tipo : "Factura",
                                        id : factura.id,
                                        fecha : fechaAnalisisFactura,
                                        desc : "No se encontro el valor UF"
                                }
                        )
                }
                else{valorUF =   colUF.valor; }
                if (colUSD === undefined) {
                        errores.push(
                                {
                                        tipo : "Factura",
                                        id : factura.id,
                                        fecha : fechaAnalisisFactura,
                                        desc : "No se encontro el valor USD"
                                }
                        )
                }
                else{valorUSD =   colUSD.valor; }
                if (colSOL === undefined) {
                        errores.push(
                                {
                                        tipo : "Factura",
                                        id : factura.id,
                                        fecha : fechaAnalisisFactura,
                                        desc : "No se encontro el valor SOL"
                                }
                        )
                }
                else{valorSOL =   colSOL.valor; }
                 //#endregion
                
                 
                let equiUF = "";
                let equiUSD = "";
                let equiSOL = "";
                let equiCPL = "";
                
                factura.monto_a_facturar = factura.monto_a_facturar.replace(",",".");
                switch(factura.id_tipo_moneda)
                {
                     // INGRESO DE LA FACTURA ES EN PESOS 
                     case 1: 
                     case "1":
                        equiUF  = parseInt(factura.monto_a_facturar) / valorUF;
                        equiUSD = parseInt(factura.monto_a_facturar) / valorUSD;
                        equiSOL = parseInt(factura.monto_a_facturar) / valorSOL;
                        equiCPL = parseInt(factura.monto_a_facturar);
                     break;
                     case 2:
                     case "2":
                        equiUSD = factura.monto_a_facturar;
                        equiUF  = factura.monto_a_facturar * valorUSD / valorUF;
                        equiSOL = factura.monto_a_facturar * valorUSD / valorSOL;
                        equiCPL = parseInt(factura.monto_a_facturar * valorUSD);
                     break;
                     case 4:
                     case "4":
                        equiUF  = factura.monto_a_facturar;
                        equiUSD = factura.monto_a_facturar * valorUF / valorUSD;
                        equiSOL = factura.monto_a_facturar * valorUF / valorSOL;
                        equiCPL = parseInt(factura.monto_a_facturar * valorUF);
                     break;
                     case 10:
                     case "10":
                        equiSOL = factura.monto_a_facturar;
                        equiUSD = factura.monto_a_facturar * valorSOL / valorUSD;
                        equiUF  = factura.monto_a_facturar * valorSOL / valorUF;
                        equiCPL = parseInt(factura.monto_a_facturar * valorSOL);
                     break;
                }
                
                
                if (valorUF === '' || valorUSD === '' || valorSOL === '')
                {
                        
                }
                else
                {
                        let registroEquivalencia = {
                                id_factura : factura.id,
                                id_proyecto : factura.id_proyecto,
                                id_moneda_base :factura.id_tipo_moneda,
                                esroc :factura.es_roc,
                                monto_base : factura.monto_a_facturar,
                                monto_uf :equiUF,
                                monto_dolar:equiUSD,
                                monto_sol:equiSOL,
                                monto_clp : equiCPL,
                                id_estado : factura.id_estado,
                                fecha : fechaAnalisisFactura,
                                valor_uf :valorUF,
                                valor_usd :valorUSD,
                                valor_sol :valorSOL
                        }
                        const insertEquivalencia =  pool.query('INSERT INTO fact_facturas_equivalencias set ?', [registroEquivalencia]);
                }


                

        });   

        res.send("ok");
});


module.exports = router;
