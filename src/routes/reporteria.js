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
                }

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
                const indicadoresAvancesUser = await pool.query("SELECT *, DATE_FORMAT( t1.fecha, '%Y-%m-%d') as fecha " +
                                                                " FROM pro_proyecto_avance AS t1 " +
                                                                " WHERE  " +
                                                                " t1.id_proyecto = ? ", [id] );


                // valores de moneda de UF 
                const valorUFMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha, MAX(t1.valor) as valor FROM moneda_valor AS t1 WHERE t1.id_moneda = 4 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");
                const valorDolarMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha, MAX(t1.valor) as valor FROM moneda_valor AS t1 WHERE t1.id_moneda = 2 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");

                
                let valorUfMensual = []; 
                let valorDolarMensual = [];

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

                  
   
                /// buscar la informacion del proyecto con el id que viene por la ruta GET
            
                const proyecto = await pool.query("SELECT t1.year, t1.nombre, t1.code, t2.descripcion , t1a.name AS nomCliente,t1.valor_metro_cuadrado,t1.num_plano_estimado,"+
                                                  " t1b.Nombre AS nomDire, t1c.Nombre AS nomJefe, t3.descripcion AS tipologia,t1.superficie_pre,t1.id, t4.descripcion AS tipoServicio," +
                                                  " t1.valor_proyecto, t3.porcentaje_costo, t3.limite_rojo, t3.limite_amarillo, " +
                                                  " t1e.valor AS valorDolar, "+
                                                  " t1e2.valor AS valorUF " +
                                                  " FROM pro_proyectos as t1 " +
                                                  " LEFT JOIN moneda_valor AS t1e ON t1.fecha_inicio = t1e.fecha_valor AND t1e.id_moneda = 2  " +
                                                  " LEFT JOIN moneda_valor AS t1e2 ON t1.fecha_inicio = t1e2.fecha_valor AND t1e2.id_moneda = 4 " +
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
                                                            " t1.id_estado in (1,2,3) "+
                                                    " AND  " +
                                                            " t1.id_tipo_moneda = t4.id_moneda" +
                                                    " AND " +
                                                            "t1.id_tipo_cobro = t5.id",[id]);

                //console.log(facturas);




                const cexternos = await pool.query("SELECT " +
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
                                                            " if (t1.id_tipo = 3 , 'Empresa' , (SELECT t1c.nombre FROM prov_externo AS t1c WHERE t1c.id = t1.id_razonsocialpro)) as nNombre , "+
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
      
                 
                var numHH = 0;
                let centroCostoHH = [];

                

                cexternos.forEach(element => {
                                        
                                let costoIngresado = element.costo.replace(".","");
                                                                        
                                        switch(moneda) // moneda visualizacion por defecto UF
                                        {
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
                                                                                element.totPro = parseFloat(costoUF_Pesos / element.dolar_valor.replace(",",".")).toFixed(2); 
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

                               let valorDelMesUF = 0;
                               let valorDelMesDolar = 0;

                               if (containsValorUF === true)
                               {
                                const colUF = valorUfMensual.find(fecha => {return fecha.fecha === element.fecha });
                                valorDelMesUF = colUF.valor;
                               }

                               if (containsValorDolar === true)
                               {
                                const colDolar = valorDolarMensual.find(fecha => {return fecha.fecha === element.fecha });
                                valorDelMesDolar = colDolar.valor;
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
                                                                valorDolar : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesDolar
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
                                   }
                                   else
                                   {
                                        colaboradoresCentroCosto.push(
                                                { 
                                                        nombre : element.centroCosto,
                                                        horas : element.t,
                                                        horasCosto : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesUF,
                                                        horasCostoDolar : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesDolar,
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
                                   }
                                   else
                                   {
                                        colaboradoresCentroCostoGeneral.push(
                                                { 
                                                        nombre : element.centroCosto,
                                                        horas : element.t,
                                                        horasCosto : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesUF,
                                                        horasCostoDolar : (element.costoMes * element.numHH + element.costoMes * element.numHE * 1.5 ) / valorDelMesDolar,
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

            centroCostoHH.forEach(
                    
                element => {
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
            let costoDolar = 0;

            let internaGeneral = 0;
            let externaGeneral = 0;
            let totalGeneral = 0;
            let costoUFGeneral = 0;
            let costoDolarGeneral = 0;
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
                        horasCostoDolar :costoDolar
                });

            colaboradoresCentroCostoGeneral.push({nombre : 'TOTALES',
                        horas : internaGeneral,
                        externo :externaGeneral,
                        total :totalGeneral,
                        costoUFExterno : costoUFExteroGeneral,
                        horasCosto :costoUFGeneral,
                        horasCostoDolar :costoDolarGeneral
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
                                let costoDolarLinea = parseFloat(col.costoUFExterno) + parseFloat(col.horasCostoDolar);

                                col.costoTotal = parseFloat( costoUfLinea).toFixed(2);

                                col.costoTotalDolar = parseFloat( costoDolarLinea).toFixed(2);


                                });


            let porcentaje = proyecto[0].porcentaje_costo / 100;
            let costoEsperado = (parseFloat( proyecto[0].valor_proyecto) * porcentaje).toFixed(2);

          
            // facturas. 
            let totalFacturado = 0;
            let totalFacturadoDolar = 0;
            let totalPagado = 0;
            let totalPagadoDolar = 0;

            facturas.forEach(element => {  


                if (element.simbolo !== moneda) // la moneda de pago de la factura es distinta a la que se esta viendo en pantalla revisar los montos.
                {
                        let montoFacturar = 0;
                        let valorUF = 0;
                        let valorDolar = 0;

                        if (element.monto_a_facturar !== null){ montoFacturar = parseFloat(element.monto_a_facturar.replace(".",""));}else{ montoFacturar =element.monto_a_facturar;}
                        if (element.uf_valor !== null){valorUF = parseFloat(element.uf_valor.replace(".","")); }else{valorUF =element.uf_valor; }
                        if (element.dolar_valor !== null){valorDolar = parseFloat(element.dolar_valor.replace(".",""));}else {valorDolar = element.dolar_valor;}
                        // intentar traer el valor del dolar 
                
                   switch(element.simbolo) // simbolo de la entrada de la factura 
                   {
                       case("US$"): // entrada en dolares
                        switch(moneda) // de salida en pantalla 
                        {
                                case "UF":
                                        let montoUSD_UF = montoFacturar * valorDolar / valorUF;
                                        element.monto_a_facturar = parseFloat(montoUSD_UF).toFixed(2); // cambiar los DOLARES A UF 
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
                       
                   }
                }
                if (element.estadoFac === "Pagada")
                {
                        // ___
                        totalPagado = parseFloat(totalPagado) + parseFloat( element.monto_a_facturar.replace(",","."));
                }

                totalFacturado = parseFloat(totalFacturado) + parseFloat( element.monto_a_facturar);
            });
            
            totalFacturado = parseFloat(totalFacturado).toFixed(2);
            totalPagado = parseFloat(totalPagado).toFixed(2);


            // console revisar los valores de las de las facturas. 
            const isEqualHelperHandlerbar = function(a, b, opts) {
                if (a == b) {
                    return true
                } else { 
                    return false
                } 
            };

            let proGeneral = proyecto[0];
            proGeneral.valorUSD =  parseFloat(proGeneral.valor_proyecto * proGeneral.valorUF / proGeneral.valorDolar).toFixed(2);

            let costoEsperadoDolar = (parseFloat(proGeneral.valorUSD) * porcentaje).toFixed(2);


            if (mensaje === "")
            {
                    res.render('reporteria/dashboard', {selectUF,selectUSD,selectSOL ,proGeneral, moneda, indicadoresAvancesUser, totalPagado, totalFacturado, 
                                                        modificaciones:modificaciones[0], costoEsperado,costoEsperadoDolar,colaboradoresCentroCostoGeneral, 
                                                        colaboradoresCentroCosto, colaboradores, erroresCosto, varTotalProyecto, numHH, 
                                                        centro_costo, cexternos,facturas, proyecto:proyecto[0], req , layout: 'template', helpers : {
                                                                if_equal : isEqualHelperHandlerbar
                                                            }});
            }
            else
            {
                    res.render('reporteria/dashboard', {selectUF,selectUSD,selectSOL , proGeneral, moneda, indicadoresAvancesUser, totalPagado, totalFacturado,
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

router.get('/analisisProyectos',  async (req, res) => {

        // listado de los proyectos 
        // inicialmente filtrare los proyectos de un jefe de proyecto Francisco Cordero como ejemplo 

        const valorUFMes = await pool.query("SELECT SUBSTRING(t1.fecha_valor,1,7) AS fecha," +
                                            " MAX(t1.valor) as valor" +
                                            " FROM " + 
                                            " moneda_valor AS t1 " +
                                            " WHERE t1.id_moneda = 4 GROUP BY SUBSTRING(t1.fecha_valor,1,7)");

        let valorUfMensual = []; 
                                          
                            
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
                        " WHERE "+
                                " t1.id_jefe in (8 , 52 , 73, 81 , 39, 21, 25,27,18,40,86,43,35,6,15,174,80,104,28,65,127,46,114,132,48,139,200,97) ";//+
                      //        " t1.id_jefe in ( 81 ) ";
                      // " AND " +
                      //        " t1.id = 1977";

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
                        metro_por_plano = ""; 
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
                        hh_ing_plano = "";
                        hh_dib_plano = "";
                        hh_cord_plano = "";
                        hh_imasd_plano = "";
                        hh_obra_plano = "";
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
                        cst_ing_plano = "";
                        cst_dib_plano = "";
                        cst_cord_plano = "";
                        cst_imasd_plano = "";
                        cst_obra_plano = "";
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
                
                
                let data_facturacion_proyecto = await getDataFacturacionProyecto(p.id);;
                let total_facturacion = await getTotalFacturacionProyecto(data_facturacion_proyecto);

                let totalProyecto = "";
                let margen_proyecto = "";
                if (p.valor_proyecto == "" || p.valor_proyecto == null)
                {
                        totalProyecto = "";
                        margen_proyecto = "";
                }
                else
                {
                        totalProyecto = parseFloat( p.valor_proyecto) + parseFloat( total_facturacion["adicional"]);
                        margen_proyecto = parseFloat( p.valor_proyecto) + parseFloat( total_facturacion["adicional"]) - parseFloat(costoTotal);
                }
                
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
                        hh_ext_ingenieria : hh_ext_ing,
                        hh_ext_dibujo : hh_ext_dib,
                        hh_ext_coordinacion : hh_ext_cord,
                        hh_ext_imasd : hh_ext_imasd,
                        hh_ext_obra : hh_ext_obra,
                        metro_por_plano : metro_por_plano,
                        cst_int_ing :cst_int_ing,
                        cst_int_dib : cst_int_dib,
                        cst_ext_cord : cst_int_cord,
                        cst_int_imasd : cst_int_imasd,
                        cst_int_obra :  cst_int_obra,
                        cst_ext_ing: cst_ext_ing,
                        cst_ext_dib : cst_ext_dib,
                        cst_ext_cord : cst_ext_cord,
                        cst_ext_imasd :  cst_ext_imasd,
                        cst_ext_obra : cst_ext_obra,
                        hh_ing_plano :hh_ing_plano,
                        hh_dib_plano :hh_dib_plano,
                        hh_cord_plano : hh_cord_plano,
                        hh_imasd_plano : hh_imasd_plano,
                        hh_obra_plano : hh_obra_plano,
                        m2_hh_ing: m2_hh_ing,
                        m2_hh_dib: m2_hh_dib,
                        m2_hh_cord: m2_hh_cord,
                        m2_hh_imasd: m2_hh_imasd,
                        m2_hh_obra: m2_hh_obra,
                        cst_ing_plano : cst_ing_plano,
                        cst_dib_plano : cst_dib_plano,
                        cst_cord_plano : cst_cord_plano,
                        cst_imasd_plano : cst_imasd_plano,
                        cst_obra_plano : cst_obra_plano,
                        cst_ing_hh : cst_ing_hh,
                        cst_dib_hh : cst_dib_hh,
                        cst_cord_hh : cst_cord_hh,
                        cst_imasd_hh : cst_imasd_hh,
                        cst_obra_hh : cst_obra_hh,
                        total_horas_proyecto : total_horas_proyecto,
                        total_horas_proyecto_moficiacion : total_horas_proyecto_moficiacion,
                        porc_mod : porc_mod,
                        valor_proyecto : p.valor_proyecto,
                        adicionales : total_facturacion["adicional"],
                        total_proyecto : totalProyecto,
                        total_facturado :total_facturacion["total_facturado"] ,
                        costo_totales : costoTotal,
                        margen_proyecto : margen_proyecto

                };

                const idLogIngreso = await pool.query('INSERT INTO pro_proyectos_info set ?', [registro]);


                }catch(err)
                {
                        mensajeria.MensajerErroresDBENITES("\n\n Archivo : reporteria.js \n Error en el directorio: /proyectos \n" + err + "\n Generado por : Proceso Automatico ");
                        
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
                                                            " if (t1.id_tipo = 3 , 'Empresa' , (SELECT t1c.nombre FROM prov_externo AS t1c WHERE t1c.id = t1.id_razonsocialpro)) as nNombre , "+
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
                                                " if (t1.id_tipo = 3 , 'Empresa' , (SELECT t1c.nombre FROM prov_externo AS t1c WHERE t1c.id = t1.id_razonsocialpro)) as nNombre , "+
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
                                                " t1.id_estado in (1,2,3) "+
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

        function getTotalFacturacionProyecto( facturas )
        {

                let totalFacturado = 0;
                let totalFacturadoPagado = 0;
                let totalfacturadoAdicional = 0;
                    
                let facturacion = [];
                facturas.forEach(element => {  

                        
                        switch(element.simbolo)
                        {
                                case "UF":

                                        totalFacturado = totalFacturado + parseFloat(element.monto_a_facturar);
                                        if (element.es_roc === 1)
                                        {
                                                totalfacturadoAdicional = totalfacturadoAdicional + parseFloat(element.monto_a_facturar);
                                        }
                                break;
                                case "$":
                                        if (element.uf_valor != null)
                                        {
                                                let peso_uf = parseFloat(element.monto_a_facturar) /  parseFloat(element.uf_valor.replace(".","").replace(",","."));
                                                totalFacturado = totalFacturado + peso_uf;
                                                if (element.es_roc === 1)
                                                {
                                                        totalfacturadoAdicional = totalfacturadoAdicional + peso_uf; 
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
                                                        totalfacturadoAdicional = totalfacturadoAdicional + peso_dolar; 
                                                }
                                        }
                                break;

                        }

                });

                facturacion["total_facturado"] = totalFacturado;
                facturacion["adicional"] = totalfacturadoAdicional;

                return facturacion;
        }
        module.exports = router;
