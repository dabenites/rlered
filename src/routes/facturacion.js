const express = require('express');
const router = express.Router();
//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
var dateFormat = require('dateformat');

const mensajeria = require('../mensajeria/mail');

var url = require('url');
var Excel = require('exceljs');

//exportOCExcel
router.post('/exportFacturasExcel', isLoggedIn, async function (req, res) {

    try {
  
        const facturacion =  await pool.query("SELECT " +
                                                        " *, " +
                                                        " t1.id as idFacturacion," +
                                                        " t4.nombre As nomSol ," +
                                                        " t2.nombre As nomPro ," +
                                                        " DATE_FORMAT(t1.fecha_solicitud, '%Y-%m-%d') as fechaSolicitante ," +
                                                        " t5.descripcion As estadoDes," +
                                                        " t5.color as color ," +
                                                        " t6.descripcion As tipoCobroDes ," +  
                                                        " t2a.name As nameCliente " +
                                                " FROM " +
                                                        "fact_facturas as t1 LEFT JOIN  sys_usuario as t4 ON t1.id_solicitante = t4.idUsuario, " +
                                                        "pro_proyectos as t2 LEFT JOIN  contacto as t2a ON t2.id_cliente = t2a.id, "+ 
                                                        "moneda_tipo as t3, "+ 
                                                        "fact_estados as t5, "+ 
                                                        "fact_tipo_cobro as t6 "+
                                                " WHERE " + 
                                                        " t1.id_proyecto = t2.id"+
                                                " AND " + 
                                                        " t1.id_tipo_moneda = t3.id_moneda"+
                                                " AND " + 
                                                        " t5.id = t1.id_estado"+
                                                " AND " + 
                                                        " t5.id in ( 0,1,2,3,4,5,6) "+
                                                " AND " + 
                                                        " t6.id = t1.id_tipo_cobro"+
                                                " ORDER BY fechaSolicitante DESC");
                
  
  
      res.writeHead(200, {
      'Content-Disposition': 'attachment; filename="Facturacion.xlsx"',
      'Transfer-Encoding': 'chunked',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
  
      var workbook = new Excel.stream.xlsx.WorkbookWriter({ stream: res });
  
      var worksheet = workbook.addWorksheet('some-worksheet');
  
      worksheet.addRow(['Fecha Solicitud', 'Cliente', 'Nº Proyecto' , 'Proyecto', 'Nº Presupuesto',
                        'Unidad', 'Monto', '% Ppto', 'Solicitante', 'Inicio Cobro', 'Nº Factura', 'Roc Asociada', 'Estado','Tipo Cobro']).commit();
  
      for (const f of facturacion) {
  
          worksheet.addRow([f.fechaSolicitante,
                            f.nameCliente,
                            f.year+"-"+f.code,
                            f.nomPro,
                            f.num_ppto,
                            f.simbolo,
                            f.monto_a_facturar,
                            f.porc_ppto,
                            f.nomSol,
                            f.fecha_cobro,
                            f.num_factura, 
                            f.roc,
                            f.estadoDes,
                            f.tipoCobroDes]);
                        }
  
  
      worksheet.commit();
      workbook.commit();
  
  
  } catch (error) 
  {
  mensajeria.MensajerErrores("\n\n Archivo : facturacion.js \n Error en el directorio: /exportFacturasExcel \n" + error + "\n Generado por : " + req.user.login);
  res.redirect(   url.format({
    pathname:'/dashboard',
            query: {
            "a": 1
            }
        })); 
  
  }
  
  
  
  });

router.post('/ingresoTrackingFactura', isLoggedIn, async (req, res) => {

    try {
        const { estado ,id}    = req.body;    
    //console.log(req.body);
    switch(estado)
    {
        case "0":
            var fecha_ingreso = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");
            const newTrackingFacturacion3  ={ //Se gurdaran en un nuevo objeto
                id_factura:id,
                id_usuario:req.user.idUsuario,
                fecha_cambio:fecha_ingreso,
                estado_inicial:"0",
                estado_final:"4",
                empresa:req.body.empresa,
                num_factura:req.body.numFactura,
                valor_uf:req.body.valorUF,
                fecha_emision:req.body.fechaFactura,
                comentario:req.body.comentario
            };
            //    
            //console.log(req.body);
            const result = await pool.query('INSERT INTO fact_facturas_tracking set ? ', [newTrackingFacturacion3]); // pasar a informacion 
            const result1 = await pool.query("UPDATE " +
            " fact_facturas " +
            " set id_estado = 4 , " +
            " motivo_rechazo = '" + req.body.comentario+ "' " +
            " WHERE id = "+id+"");

        break;
        case "1":
            //console.log(req.body);
            var fecha_ingreso = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");
            const newTrackingFacturacion4  ={ //Se gurdaran en un nuevo objeto
                id_factura:id,
                id_usuario:req.user.idUsuario,
                fecha_cambio:fecha_ingreso,
                estado_inicial:"0",
                estado_final:"2",
                empresa:req.body.empresa,
                num_factura:req.body.numFactura,
                valor_uf:req.body.valorUF,
                fecha_emision:req.body.fechaFactura,
                comentario:req.body.comentario
            };
            //    
            //console.log(req.body);
            const result6 = await pool.query('INSERT INTO fact_facturas_tracking set ? ', [newTrackingFacturacion4]); // pasar a informacion 
            const result7 = await pool.query("UPDATE " +
            " fact_facturas " +
            " set id_estado = 2 , " +
            " num_factura = '" + req.body.numFactura+ "', " +
            " fecha_factura = '" + req.body.fechaFactura+ "', " +
            " uf_dia = '" + req.body.valorUF+ "' " +
            " WHERE id = "+id+"");

        break;
        case "2":
            // cargar la información al tracking  
            var fecha_ingreso = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");
            const newTrackingFacturacion  ={ //Se gurdaran en un nuevo objeto
                id_factura:id,
                id_usuario:req.user.idUsuario,
                fecha_cambio:fecha_ingreso,
                estado_inicial:"2",
                estado_final:"3",
                fecha_pago_factura:req.body.fechaPagoFactura,
                comentario:req.body.comentarioCobranza
            };
            //    
            const result2 = await pool.query('INSERT INTO fact_facturas_tracking set ? ', [newTrackingFacturacion]); // pasar a informacion 
            const result3 = await pool.query("UPDATE " +
                                            " fact_facturas " +
                                            " set id_estado = 3 , " +
                                            " fecha_pago = '" + req.body.fechaPagoFactura+ "' " +
                                            " WHERE id = "+id+"");

        break;
        case "3":
            var fecha_ingreso = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");
            const newTrackingFacturacion2  ={ //Se gurdaran en un nuevo objeto
                id_factura:id,
                id_usuario:req.user.idUsuario,
                fecha_cambio:fecha_ingreso,
                estado_inicial:"2",
                estado_final:"5",
                fecha_pago_factura:req.body.fechaPagoFactura,
                comentario:req.body.comentarioCobranza
            };
            const result4 = await pool.query('INSERT INTO fact_facturas_tracking set ? ', [newTrackingFacturacion2]); // pasar a informacion 
            const result5 = await pool.query("UPDATE " +
            " fact_facturas " +
            " set id_estado = 5 , " +
            " motivo_rechazo = '" + req.body.comentarioCobranza+ "' " +
            " WHERE id = "+id+"");        
            break;

    }


    
    const estados =  await pool.query("SELECT * FROM fact_estados as t1");
    const facturacion =  await pool.query("SELECT " +
                                                    " *, " +
                                                    " t1.id as idFacturacion," +
                                                    " t2.nombre As nomPro ," +
                                                    " DATE_FORMAT(t1.fecha_solicitud, '%Y-%m-%d') as fechaSolicitante ," +
                                                    " t5.descripcion As estadoDes," +
                                                    " t6.descripcion As tipoCobroDes" +
                                          " FROM " +
                                                      "fact_facturas as t1 LEFT JOIN  sys_usuario as t4 ON t1.id_solicitante = t4.idUsuario, " +
                                                      "pro_proyectos as t2, "+ 
                                                      "moneda_tipo as t3, "+ 
                                                      "fact_estados as t5, "+ 
                                                      "fact_tipo_cobro as t6 "+
                                        " WHERE " + 
                                                    " t1.id_proyecto = t2.id"+
                                        " AND " + 
                                                    " t1.id_tipo_moneda = t3.id_moneda"+
                                        " AND " + 
                                                    " t5.id = t1.id_estado"+
                                        " AND " + 
                                                    " t5.id = 0"+
                                        " AND " + 
                                                    " t6.id = t1.id_tipo_cobro"+
                                        " ORDER BY fechaSolicitante DESC");


    //console.log(facturacion);
    const isEqualHelperHandlerbar = function(a, b, opts) {
        // console.log(a + "----" + b);
         if (a == b) {
             return true
         } else { 
             return false
         } 
     };


     
    res.render('facturacion/facturas', {facturacion , estados, req ,layout: 'template', helpers : {
        if_equal : isEqualHelperHandlerbar
    }});
    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : facturacion.js \n Error en el directorio: /ingresoTrackingFactura \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  

    }

    
    


}); 


router.get('/facturas', isLoggedIn, async (req, res) => {

    try {
        // buscar el listado de todas las facturas.

    const estados =  await pool.query("SELECT * FROM fact_estados as t1 UNION SELECT '%', 'Todos' ,'color' FROM fact_estados WHERE id = 0");
    const facturacion =  await pool.query("SELECT " +
                                                    " *, " +
                                                    " t1.id as idFacturacion," +
                                                    " t4.nombre As nomSol ," +
                                                    " t2.nombre As nomPro ," +
                                                    " DATE_FORMAT(t1.fecha_solicitud, '%Y-%m-%d') as fechaSolicitante ," +
                                                    " t5.descripcion As estadoDes," +
                                                    " t5.color as color ," +
                                                    " t6.descripcion As tipoCobroDes ," +  
                                                    " t2a.name As nameCliente " +
                                          " FROM " +
                                                      "fact_facturas as t1 LEFT JOIN  sys_usuario as t4 ON t1.id_solicitante = t4.idUsuario, " +
                                                      "pro_proyectos as t2 LEFT JOIN  contacto as t2a ON t2.id_cliente = t2a.id, "+ 
                                                      "moneda_tipo as t3, "+ 
                                                      "fact_estados as t5, "+ 
                                                      "fact_tipo_cobro as t6 "+
                                        " WHERE " + 
                                                    " t1.id_proyecto = t2.id"+
                                        " AND " + 
                                                    " t1.id_tipo_moneda = t3.id_moneda"+
                                        " AND " + 
                                                    " t5.id = t1.id_estado"+
                                        " AND " + 
                                                    " t5.id = 0"+
                                        " AND " + 
                                                    " t6.id = t1.id_tipo_cobro"+
                                        " ORDER BY fechaSolicitante DESC");


   // console.log(facturacion);

    const isEqualHelperHandlerbar = function(a, b, opts) {
        // console.log(a + "----" + b);
         if (a == b) {
             return true
         } else { 
             return false
         } 
     };

     //console.log(facturacion);

    res.render('facturacion/facturas', {facturacion , estados, req ,layout: 'template', helpers : {
        if_equal : isEqualHelperHandlerbar
    }});

    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : facturacion.js \n Error en el directorio: /facturas \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  

    }

    

});

router.post('/facturas', isLoggedIn, async (req, res) => {

    try {
        
        // buscar el listado de todas las facturas.
    const { estado } = req.body; 
    //console.log(estado);

    var estadoLogica =  " AND t5.id = "+estado+" ";
    if (estado == "%")
    {
        estadoLogica = " ";
    }

    const estados =  await pool.query("SELECT * FROM fact_estados as t1 UNION SELECT '%', 'Todos','color'  FROM fact_estados WHERE id = 0");

    const facturacion =  await pool.query("SELECT " +
                                                    " *, " +
                                                    " t1.id as idFacturacion," +
                                                    " t2.nombre As nomPro ," +
                                                    " DATE_FORMAT(t1.fecha_solicitud, '%Y-%m-%d') as fechaSolicitante ," +
                                                    " t5.descripcion As estadoDes," +
                                                    " t6.descripcion As tipoCobroDes," +
                                                    " t2a.name As nameCliente" +
                                          " FROM " +
                                                      "fact_facturas as t1 LEFT JOIN  sys_usuario as t4 ON t1.id_solicitante = t4.idUsuario, " +
                                                      "pro_proyectos as t2 LEFT JOIN  contacto as t2a ON t2.id_cliente = t2a.id, "+ 
                                                      "moneda_tipo as t3, "+ 
                                                      "fact_estados as t5, "+ 
                                                      "fact_tipo_cobro as t6 "+
                                        " WHERE " + 
                                                    " t1.id_proyecto = t2.id"+
                                        " AND " + 
                                                    " t1.id_tipo_moneda = t3.id_moneda"+
                                        " AND " + 
                                                    " t5.id = t1.id_estado"+
                                                    estadoLogica +
                                        " AND " + 
                                                    " t6.id = t1.id_tipo_cobro"+
                                        " ORDER BY fechaSolicitante DESC");
    
    const isEqualHelperHandlerbar = function(a, b, opts) {
                                            // console.log(a + "----" + b);
                                             if (a == b) {
                                                 return true
                                             } else { 
                                                 return false
                                             } 
                                         };

    res.render('facturacion/facturas', {facturacion , estados, estado, req ,layout: 'template', helpers : {
        if_equal : isEqualHelperHandlerbar
    }});

    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : facturacion.js \n Error en el directorio: /facturas \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  
    }

});

router.get('/facturas/edit/:idFacturacion', isLoggedIn, async (req, res) => {

    try {
        const { idFacturacion } = req.params;

    // HISTORIAL DE LA FACTURACION 
    const historial =  await pool.query( " SELECT  " +
                                            "    t2a.Nombre AS solicitante," +
                                            "    t2.fecha_solicitud, " +
                                            "    t2.monto_a_facturar, " +
                                            "    t2.num_factura, " +
                                            "    t2.porc_ppto, " +
                                            "    t3.descripcion AS estado, " +
                                            "    t2.id AS id_factura, " +
                                            "    t4.descripcion AS tipoCobro " +
                                        " FROM  " +
		                                        " fact_facturas AS t2 LEFT JOIN sys_usuario AS t2a ON t2.id_solicitante = t2a.idUsuario, " +
		                                " fact_estados AS t3, " +
		                                " fact_tipo_cobro AS t4 " +
                                        " WHERE  " +
		                                        " t2.id_proyecto = ( SELECT t1.id_proyecto FROM fact_facturas AS t1 WHERE t1.id = "+idFacturacion+" ) " +
                                        " AND  " +
	                                            " t2.id_proyecto != "+idFacturacion+" " +
                                        " AND  " +
		                                        " t3.id = t2.id_estado " +
                                        " AND " +
		                                        " t4.id = t2.id_tipo_cobro");

    // informacion del proyecto 
    
    const proyecto = await pool.query( " SELECT  " +
                                            "    t3.nombre,"+
                                            "    t3.year, "+
                                            "    t3.code, "+
                                            "    t3a.Nombre AS jefeProyecto, "+
                                            "    t3b.Nombre AS directorProyecto "+
                                       " FROM " +
                                                " fact_facturas AS t2, " +
                                                " pro_proyectos AS t3 LEFT JOIN sys_usuario AS t3a ON (t3.id_jefe = t3a.idUsuario) "+
                                                " LEFT JOIN sys_usuario AS t3b ON (t3.id_director = t3b.idUsuario) "+
                                       " WHERE  " +
                                                " t2.id = "+idFacturacion+"  " +
                                        " AND  " +
                                                " t2.id_proyecto = t3.id " );

    // factura 
    const factura = await pool.query( " SELECT t1.*,t2.*,t1z.Nombre, " +
                                      " t1.id as id_facturacion, " +
                                      " t1z2.rut as rutEmpresa"+
                                      " FROM fact_facturas AS t1 " +
                                      " LEFT JOIN sys_usuario as t1z on t1.id_solicitante = t1z.idUsuario   " +
                                      " LEFT JOIN sys_empresa as t1z2 on t1.id_empresa = t1z2.id ,  " +
                                      " fact_estados AS t2 WHERE t1.id = "+idFacturacion+" AND t1.id_estado = t2.id");

    const isEqualHelperHandlerbar = function(a, b, opts) {
        // console.log(a + "----" + b);
         if (a == b) {
             return true
         } else { 
             return false
         } 
     };


    //console.log( req.user.idUsuario);

    res.render('facturacion/editar', { factura:factura[0],proyecto:proyecto[0],historial,req ,layout: 'template', helpers : {
        if_equal : isEqualHelperHandlerbar
    }});
    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : facturacion.js \n Error en el directorio: /facturas/edit/:idFacturacion \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  

    }
});


router.post('/editarFacturaTemplate', isLoggedIn, async (req, res) => {

    try {

        const { id } = req.body;

        const estados =  await pool.query("SELECT * FROM fact_estados as t1");
        const empresas =  await pool.query("SELECT * FROM sys_empresa as t1");
        const facturas =  await pool.query("SELECT * FROM fact_facturas as t1 WHERE t1.id = ?",[id]);

        const isEqualHelperHandlerbar = function(a, b, opts) {
            // console.log(a + "----" + b);
             if (a == b) {
                 return true
             } else { 
                 return false
             } 
         };


        res.render('facturacion/editarFactura', { estados, empresas, factura:facturas[0], layout: 'blanco', helpers : {
                    if_equal : isEqualHelperHandlerbar
                }});

    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : facturacion.js \n Error en el directorio: /editarFacturaTemplate \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  

    }
});

router.post('/editarFacturaTemplateIngreso', isLoggedIn, async (req, res) => {

    try {

        const { id } = req.body;

        const estados =  await pool.query("SELECT * FROM fact_estados as t1");
        const empresas =  await pool.query("SELECT * FROM sys_empresa as t1");
        const facturas =  await pool.query("SELECT * FROM fact_facturas as t1 WHERE t1.id = ?",[id]);

        const isEqualHelperHandlerbar = function(a, b, opts) {
            // console.log(a + "----" + b);
             if (a == b) {
                 return true
             } else { 
                 return false
             } 
         };


        res.render('facturacion/editarFacturaIngreso', { estados, empresas, factura:facturas[0], layout: 'blanco', helpers : {
                    if_equal : isEqualHelperHandlerbar
                }});

    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : facturacion.js \n Error en el directorio: /editarFacturaTemplate \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  

    }
});


router.post('/editarFactura', isLoggedIn, async (req, res) => {

    try {

        const {id_factura,id_estado,id_estado_actual,id_empresa,fechaEmision,numFactura,valoruf,fechaPago,comentarioParaCobro,comentarioEnCobranza,id} = req.body;
        var fecha_ingreso = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");

        const tracking  ={ //Se gurdaran en un nuevo objeto
            id_factura:id_factura,
            id_usuario:req.user.idUsuario,
            fecha_cambio:fecha_ingreso,
            estado_inicial:id_estado_actual,
            estado_final:id_estado,
            empresa:id_empresa,
            fecha_emision:fechaEmision,
            num_factura:numFactura,
            valor_uf:valoruf,
            fecha_pago_factura : fechaPago,
            comentario:comentarioParaCobro,
            comentario_2:comentarioEnCobranza
        };
        //    
        //console.log(req.body);
        const result = await pool.query('INSERT INTO fact_facturas_tracking set ? ', [tracking]); // pasar a informacion 

       // console.log(req.body );
       
       const result1 = await pool.query("UPDATE " +
            " fact_facturas " +
            " set id_estado = ? , " +
            " id_empresa = ? , " + 
            " num_factura = ? , " +
            " uf_dia = ? , " +
            " motivo_rechazo = ? , " +
            " comentario_2 = ?,  " +
            " fecha_factura = ?,  " +
            " fecha_pago = ?  " +
            " WHERE id = ? ",[id_estado,id_empresa,numFactura,valoruf,comentarioParaCobro,comentarioEnCobranza,fechaEmision,fechaPago,id]);
       

        res.sendStatus(200);
       

    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : facturacion.js \n Error en el directorio: /editarFactura \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  

    }
});

router.post('/editarFacturaIngreso', isLoggedIn, async (req, res) => {

    try {

        const {monto,porcentajeppto,roc,comentario,id_factura,id_estado_actual, numppto} = req.body;

        var fecha_ingreso = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");

        let esroc = 0;
        if (roc != "")
        {
            esroc = 1;
        }
      
       const result1 = await pool.query("UPDATE " +
            " fact_facturas " +
            " set monto_a_facturar = ? , " +
            " porc_ppto = ? , " + 
            " comentarios = ? , " +
            " es_roc = ? , " +
            " roc = ?,  " +
            " num_ppto = ?  " +
            " WHERE id = ? ",[monto,porcentajeppto,comentario,esroc,roc,numppto,id_factura]);
       

        res.sendStatus(200);
       

    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : facturacion.js \n Error en el directorio: /editarFactura \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  

    }
});

//editarFacturaIngreso


//editarFactura
//editarFacturaTemplate
module.exports = router;