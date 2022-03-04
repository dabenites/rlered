const express = require('express');
const router = express.Router();
const Excel = require('exceljs');
var formidable = require('formidable');
var fs = require('fs');
var dateFormat = require('dateformat');

var url = require('url');

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { isArray } = require('util');
const { isEmptyObject } = require('jquery');

const mensajeria = require('../mensajeria/mail');

const ftp = require("basic-ftp")

async function cargarArchivoFTPbyArchivo(archivo, name,req) {
    let numeroAsignado;
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: "190.196.223.100",
            user: "planner",
            password: "rLPlaner15",
            secure: false
        });

        await client.cd("Costo Usuario/");
        let numCarpetaActual = await (await client.list()).length;

        //console.log(numCarpetaActual);

        let nuevaCarpeta = numCarpetaActual + 1;
        numeroAsignado = nuevaCarpeta;
        await client.ensureDir(nuevaCarpeta.toString());
        await client.uploadFrom(archivo, name);
    }
    catch(err) {
        console.log(err);
    }
    client.close();
   
    executeLogic(archivo, name,numeroAsignado,req);
}

function  executeLogic(archivo, name,numeroAsignado,req)
{

   // console.log(numeroAsignado);
    var workbook = new Excel.Workbook(); 
    const lectura = [];
    var idLogDetalle = 0 ;

    workbook.xlsx.readFile(archivo)
        .then(function() {
            var worksheet = workbook.getWorksheet(1);
            worksheet.eachRow({ includeEmpty: true }, async function(row, rowNumber) {
            
            if (rowNumber == 2)
            {
                lectura["ano"] = row.values[3];
            }
            if (rowNumber == 3)
            {
                lectura["mes"] = row.values[3];
            }
            if (rowNumber > 5 )
            {
                if (lectura["informacion"] === undefined)
                {
                    lectura["informacion"]  = [];
                }

                if (rowNumber >= 6 )
                {
                    // Cargar el log de carga de la información
                    if (rowNumber == 6)
                    {
                        unLogIngreso = {
                            id_user : req.user.idUsuario,
                            fecha : new Date(),
                            annio : lectura["ano"] ,
                            mes : lectura["mes"],
                            nomCarpeta : numeroAsignado,
                            nomArchivo : name


                        };
                       const idLogIngreso = await pool.query('INSERT INTO sys_usuario_costo_ingreso set ?', [unLogIngreso]);
                       idLogDetalle = idLogIngreso.insertId;
                    }
                    


                    const existeCosto =  await pool.query("SELECT * FROM sys_usuario_costo AS t1 WHERE t1.annio = "+ lectura["ano"] +" AND t1.mes = "+lectura["mes"]+" AND t1.idUsuario = "+row.values[2]+"");
                    const unCosto ={ 
                        annio :  lectura["ano"],
                        mes   :  lectura["mes"],
                        idUsuario :  row.values[2] ,
                        costo : row.values[7]
                       }; 
                       
                    const unCostoLog ={ 
                        id_costo_ingreso : idLogDetalle,
                        annio :  lectura["ano"],
                        mes   :  lectura["mes"],
                        idUsuario :  row.values[2] ,
                        costo : row.values[7]
                       };

                    var tieneResitros = false;        
                    existeCosto.forEach(function(elemento, indice, array) {
                        tieneResitros = true;
                    });
                    
                    if(tieneResitros)
                    {
                        const result = await pool.query("UPDATE sys_usuario_costo set costo = '"+row.values[7]+"' WHERE annio = '"+lectura["ano"]+"' AND  mes = '"+lectura["mes"]+"' AND idUsuario = "+row.values[2]+" ");
                        const result2 = await pool.query('INSERT INTO sys_usuario_costo_ingreso_detalle set ?', [unCostoLog]);
                    }
                    else
                    {
                        const result = await pool.query('INSERT INTO sys_usuario_costo set ?', [unCosto]);
                        const result2 = await pool.query('INSERT INTO sys_usuario_costo_ingreso_detalle set ?', [unCostoLog]);
                    }  
                }          
                //
            }
        });
    });
}

router.post('/fileupload', async (req,res) => {
    
   
    try {
        //cargarArchivoFTPbyArchivo();
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldpath = files.filetoupload.path;
            var name = files.filetoupload.name;
            cargarArchivoFTPbyArchivo(oldpath,name,req);
        });

        res.redirect(   url.format({
            pathname:"../costos/usuario",
            query: {
               "a": 1
             }
          }));
          
        
    } catch (error) {
        mensajeria.MensajerErrores("\n\n Archivo : costos.js \n Error en el directorio: /fileupload \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  
    }

});

router.get('/duplicarAnterior', isLoggedIn, async (req, res) => {

    try {
        var year = req.query.anio;
        var mes = req.query.mes;

        var yearA = "";
        var mesA = "";
        if (mes == 1)
        {
            yearA = year - 1;
            mesA  = 12;
        }
        else
        {
            yearA = year;
            mesA  = mes -1;
        }
        
        //Buscar la informacion de los usuarios.
        const costos  = await pool.query(" SELECT " +
                                                        " t2.*, " +
                                                        " t1.idUsuario," +
                                                        " t1.Nombre," +
                                                        " t4.categoria," +
                                                        " t5.centroCosto, " +
                                                        " t6.pais, " +
                                                        " t2.costo " +
                                            " FROM  " +
                                                        " sys_usuario AS t1 " +
                                            " LEFT JOIN sys_usuario_costo AS t2 ON ( t1.idUsuario = t2.idUsuario AND t2.annio =  "+ yearA +" AND t2.mes = "+ mesA +"), "+
                                            " sys_sucursal AS t3, " +
                                            " sys_categoria AS t4, " +
                                            " centro_costo AS t5, " +
                                            " pais AS t6 "  +
                                            " WHERE  " +
                                                    " t1.idSucursal = t3.id_Sucursal " +
                                            " AND  " +
                                                    " t1.idCategoria = t4.id " +
                                            " AND  " +
                                                    " t3.id_pais = t6.id " +
                                            " AND  " +
                                                    " t4.idCentroCosto = t5.id ");

            // borro la informacion completa del mes para duplicar el anterior
            const result = pool.query("DELETE FROM sys_usuario_costo WHERE annio = "+year+" AND mes = "+mes+""); 
            //console.log(costos);

            costos.forEach(function(elemento, indice, array) {
                // carga la informacion del mes anterior.
                const newCostoMes  ={ //Se gurdaran en un nuevo objeto
                                    annio :year, 
                                    mes : mes,
                                    idUsuario : elemento.idUsuario,
                                    costo : elemento.costo
                                    };
                const result = pool.query('INSERT INTO sys_usuario_costo set ?', [newCostoMes]);

                });

        res.redirect("../costos/usuario?anio="+year+"&mes="+mes+"");
    } catch (error) {
        mensajeria.MensajerErrores("\n\n Archivo : costos.js \n Error en el directorio: /duplicarAnterior \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                })); 
    }
});

router.get('/historial', isLoggedIn, async (req, res) => {
  
    try {

        const costos =  await pool.query("SELECT * ,DATE_FORMAT(t1.fecha, '%Y-%m-%d') AS fecha FROM sys_usuario_costo_ingreso AS t1, sys_usuario AS t2 WHERE t1.id_user = t2.idUsuario ORDER BY t1.id DESC");

        res.render('costos/historial', { costos,req ,layout: 'template'});  
        
    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : costos.js \n Error en el directorio: /historial \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                })); 

    }


}); 

router.get('/historial/:id', async (req, res) => {

    try {
        const { id } = req.params;
    
    const costos =  await pool.query("SELECT * ,DATE_FORMAT(t1.fecha, '%Y-%m-%d') AS fecha FROM sys_usuario_costo_ingreso AS t1, sys_usuario AS t2 WHERE t1.id_user = t2.idUsuario ORDER BY t1.id DESC");
    const detalle = await pool.query("SELECT * FROM sys_usuario_costo_ingreso_detalle AS t1, sys_usuario AS t2 WHERE t1.id_costo_ingreso = "+id+" AND  t1.idUsuario = t2.idUsuario");

    // Detalle del historial de la carga.
    

    res.render('costos/historial', { costos,detalle,req ,layout: 'template'});

        
    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : costos.js \n Error en el directorio: /historial/:id \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                })); 

    }
});

router.get('/descargarPlanilla', isLoggedIn, async (req, res) => {

try {

    var year = req.query.anio;
    var mes = req.query.mes;

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Costo Mensual");
  
    worksheet.getCell('B2').value = "Año";
    worksheet.getCell('B3').value = "Mes";

    worksheet.getCell('C2').value = year;
    worksheet.getCell('C3').value = mes;

    worksheet.getCell('B5').value = "Id Usuario";
    worksheet.getCell('C5').value = "Nombre";
    worksheet.getCell('D5').value = "Categoria";
    worksheet.getCell('E5').value = "Centro Costo";
    worksheet.getCell('F5').value = "Pais";
    worksheet.getCell('G5').value = "Costo";

    
    const usuarios  = await pool.query(" SELECT " +
                                                    " *, " +
                                                    " t1.idUsuario," +
                                                    " t1.Nombre," +
                                                    " t4.categoria," +
                                                    " t5.centroCosto, " +
                                                    " t6.pais, " +
                                                    " t2.costo " +
                                        " FROM  " +
                                                    " sys_usuario AS t1 " +
                                        " LEFT JOIN sys_usuario_costo AS t2 ON ( t1.idUsuario = t2.idUsuario AND t2.annio =  "+ year +" AND t2.mes = "+ mes +"), "+
                                        " sys_sucursal AS t3, " +
                                        " sys_categoria AS t4, " +
                                        " centro_costo AS t5, " +
                                        " pais AS t6 "  +
                                        " WHERE  " +
                                                " t1.idSucursal = t3.id_Sucursal " +
                                        " AND  " +
                                                " t1.idCategoria = t4.id " +
                                        " AND  " +
                                                " t1.id_estado = 1 " +
                                        " AND  " +
                                                " t3.id_pais = t6.id " +
                                        " AND  " +
                                                " t4.idCentroCosto = t5.id ");

    usuarios.forEach((element, i) => {
        worksheet.getCell('B'+ (i + 6)).value = element.idUsuario;
        worksheet.getCell('C'+ (i + 6)).value = element.Nombre;
        worksheet.getCell('D'+ (i + 6)).value = element.categoria;
        worksheet.getCell('E'+ (i + 6)).value = element.centroCosto;
        worksheet.getCell('F'+ (i + 6)).value = element.pais;
        worksheet.getCell('G'+ (i + 6)).value = element.costo;
    });


  
  // save under export.xlsx
  await workbook.xlsx.writeFile(''+year+'_'+mes+'.xlsx');

  //_____________________________________________________________________________________
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="`+year+`_`+mes+`.xlsx"`,
  });
  //_____________________________________________________________________________________
  
  // write into response
  workbook.xlsx.write(res);
    
} catch (error) {
    mensajeria.MensajerErrores("\n\n Archivo : costos.js \n Error en el directorio: /descargarPlanilla \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  
}
  
}); 

router.get('/usuario', isLoggedIn, async (req, res) => {

    try {
        var fecha = new Date();
    var year = fecha.getFullYear();
    var mes = fecha.getMonth() + 1;
    const annios = [];

    var mensaje = -1;

    
    if (req.query.anio !== undefined)
    {
        year = req.query.anio;
    }
    if (req.query.mes !== undefined)
    {
        mes = req.query.mes;
    }
    if (req.query.a !== undefined)
    {
        mensaje = req.query.a;
    }
    
    /// revisar si viene el mensaje de aleta 
    //console.log(req.query);


    for (let step = 0; step < 10; step++) {
        annios.push(year - step);
      }

    const listadoMeses = [ 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const messes = [];
    listadoMeses.forEach((element, i) => {
        if ((i+1) == mes)
        {
            const Mes = {
                id : (i + 1),
                nombre : element,
                actual : true
            }
            messes.push(Mes);
        }
        else
        {
            const Mes = {
                id : (i + 1),
                nombre : element,
                actual : false
            }
            messes.push(Mes);
        }
    });


        const costos  = await pool.query(" SELECT " +
                                                    " *, " +
                                        " FORMAT(t2.costo,2) AS costoFormat " +
                                        " FROM  " +
                                                    " sys_usuario AS t1 " +
                                        " LEFT JOIN sys_usuario_costo AS t2 ON ( t1.idUsuario = t2.idUsuario AND t2.annio =  "+ year +" AND t2.mes = "+ mes +"), "+
                                        " sys_sucursal AS t3, " +
                                        " sys_categoria AS t4, " +
                                        " centro_costo AS t5, " +
                                        " sys_usuario_estado as t6 "+
                                        " WHERE  " +
                                                " t1.idSucursal = t3.id_Sucursal " +
                                        " AND  " +
                                                " t1.idCategoria = t4.id " +
                                        " AND  " +
                                                " t4.idCentroCosto = t5.id "+
                                        " AND " +
                                                "t6.id = t1.id_estado"+
                                        " AND " +
                                                "t1.id_estado = 1");
    // Revisar la Query de los costos.
    
    //conectarFTP();
    // mostrar function para ver si me conecto al FTP 
    
    if (mensaje !== -1)
    { 
        const verToask = {
        titulo : "Mensaje",
        body   : "Planilla cargada correctamente.",
        tipo   : "Crear"
            };
    
       res.render('costos/usuario', { annios, messes,verToask, costos,year,mes, req ,layout: 'template'});
    }
    else
    {
        res.render('costos/usuario', { annios, messes, costos,year,mes, req ,layout: 'template'});
    }
    } catch (error) {
        mensajeria.MensajerErrores("\n\n Archivo : costos.js \n Error en el directorio: /usuario \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));
    }
}); 

async function conectarFTP() {
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: "190.196.223.100",
            user: "planner",
            password: "rLPlaner15",
            secure: false
        })
        await client.uploadFrom("export.xlsx", "export.xlsx");
    }
    catch(err) {
        console.log(err);
    }
    client.close()
}

router.get('/eproyectos', isLoggedIn, async (req, res) => {

    try {
        const proveedores =  await pool.query("SELECT * FROM prov_externo ORDER BY nombre ASC");
        const centros =  await pool.query("SELECT * FROM centro_costo ORDER BY centroCosto ASC");
        const monedas =  await pool.query("SELECT * FROM moneda_tipo as t1 WHERE  t1.factura = 'Y'");
        const proyectos =  await pool.query("SELECT * FROM pro_proyectos as t1 ORDER BY year DESC, code DESC");
    
    
        // Seleccicionar los costos que el ha ingresado
        const costosExternos = await pool.query("SELECT " + 
                                                "* " +
                                                " , DATE_FORMAT(t1.fecha_ingreso, '%Y-%m-%d') as fechaIngreso " +
                                                " , t4.nombre as proveedor, t2.nombre as nomProyecto, t1.id as idCosto, t1.descripcion as comentarioIngreso ," +
                                                " t1a.descripcion as comentarioAProbador"+
                                                " FROM pro_costo_externo as t1 "+
                                                " LEFT JOIN pro_costo_externo_tracking as t1a ON t1.id = t1a.id_pro_costo_externo ," +
                                                " pro_proyectos as t2, " +
                                                " prov_externo as t4, " +
                                                " pro_costo_externo_estado as t3 " +
                                                " WHERE t1.id_ingreso = "+req.user.idUsuario+"" + 
                                                " AND t1.id_proyecto = t2.id" +
                                                " AND t1.id_prov_externo = t4.id" +
                                                " AND t1.id_estado = t3.id");
    
        res.render('proyecto/costoexterno', {proveedores,centros,monedas, proyectos ,costosExternos, req ,layout: 'template'});
    
    } catch (error) {
        mensajeria.MensajerErrores("\n\n Archivo : costos.js \n Error en el directorio: /eproyectos \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));
    }

   
});

router.get('/aproyectos', isLoggedIn, async (req, res) => {
 
    try {
    // Seleccicionar los costos que el ha ingresado
    const costosExternos = await pool.query("SELECT " + 
                                            "* , t1.id as idCostoExterno,  DATE_FORMAT(t1.fecha_ingreso, '%Y-%m-%d') as fechaIngreso ,"+
                                            " t5.nombre as proveedor,  t2.nombre as nomProyecto, t4.nombre AS nomSol" +
                                            " FROM pro_costo_externo as t1, "+
                                            " pro_proyectos as t2, " +
                                            " pro_costo_externo_estado as t3, " +
                                            " sys_usuario as t4, " +
                                            " prov_externo as t5 " + 
                                            " WHERE t1.id_estado = 1" + 
                                            " AND t1.id_proyecto = t2.id" +
                                            " AND t1.id_estado = t3.id"+ 
                                            " AND t1.id_ingreso = t4.idUsuario" + 
                                            " AND t5.id = t1.id_prov_externo" );


    res.render('proyecto/acostoexterno', {costosExternos, req ,layout: 'template'});    
    } catch (error) {
        mensajeria.MensajerErrores("\n\n Archivo : costos.js \n Error en el directorio: /aproyectos \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));
    }
    

});

router.get('/costoexterno/revisar/:id', async (req, res) => {

    try {
        const { id } = req.params;
    
    const costosExternos = await pool.query("SELECT " + 
    "* , t1.id as idCostoExterno,  DATE_FORMAT(t1.fecha_ingreso, '%Y-%m-%d') as fechaIngreso , t5.nombre as proveedor, t2.nombre as nomProyecto, t4.nombre AS nomSol" +
    " FROM pro_costo_externo as t1, "+
    " pro_proyectos as t2, " +
    " pro_costo_externo_estado as t3, " +
    " sys_usuario as t4, " +
    " prov_externo as t5 " + 
    " WHERE t1.id_estado = 1" + 
    " AND t1.id_proyecto = t2.id" +
    " AND t1.id_estado = t3.id"+ 
    " AND t1.id_ingreso = t4.idUsuario" + 
    " AND t5.id = t1.id_prov_externo" );

    const costoExterno = await pool.query("SELECT " + 
    "* , t1.id as idCostoExterno,t1.descripcion as desTra,  t5.nombre as nomProveedor,t2.nombre As nomPro, t2.id As idPro, t4.nombre AS nomSol FROM pro_costo_externo as t1, "+
    " pro_proyectos as t2, " +
    " pro_costo_externo_estado as t3, " +
    " sys_usuario as t4, " + 
    " prov_externo as t5, " + 
    " centro_costo as t6 " +
    " WHERE t1.id = "+id+"" + 
    " AND t1.id_proyecto = t2.id" +
    " AND t1.id_estado = t3.id"+ 
    " AND t1.id_prov_externo = t5.id"+ 
    " AND t1.id_centro_costo = t6.id"+
    " AND t1.id_ingreso = t4.idUsuario");

    const costosAnteriores = await pool.query("SELECT " + 
    "* , t1.id as idCostoExterno,t1.descripcion as desTra, t5.nombre as nomProveedor,t2.nombre As nomPro,  DATE_FORMAT(t1.fecha_ingreso, '%Y-%m-%d') as fechaIngreso, t4.nombre AS nomSol FROM pro_costo_externo as t1, "+
    " pro_proyectos as t2, " +
    " pro_costo_externo_estado as t3, " +
    " sys_usuario as t4, " + 
    " prov_externo as t5, " + 
    " centro_costo as t6 " +
    " WHERE t1.id_proyecto = "+ costoExterno[0].idPro + "" + 
    " AND t1.id_proyecto = t2.id" +
    " AND t1.id_estado = t3.id"+ 
    " AND t1.id_prov_externo = t5.id"+ 
    " AND t1.id_centro_costo = t6.id"+
    " AND t1.id_ingreso = t4.idUsuario");
    
    //console.log(costosExternos[0]);
    res.render('proyecto/acostoexterno', {costosExternos,  costoExterno: costoExterno[0],costosAnteriores, req ,layout: 'template'});
    } catch (error) {
        mensajeria.MensajerErrores("\n\n Archivo : costos.js \n Error en el directorio: /costoexterno/revisar/:id \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));
    }
});

router.post('/updateCostoExterno', isLoggedIn, async (req, res) => {

    try {

        //res.send("mostrar mensaje para la carga");
    
    const { Observacion,estado,id_costo_externo} = req.body;
    // estado 0 rechazado
    // estado 1 aprobado 
    var estadoBD = 0;
    switch(estado)
    {
        case 0:
        case "0":
            estadoBD = 3;
            break;
        case 1:
        case "1":
            estadoBD = 2;
            break;
    }
    var fecha_ingreso = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");
    const newTrackingCosto  ={ //Se gurdaran en un nuevo objeto
        id_pro_costo_externo:id_costo_externo,
        id_estado:estadoBD,
        descripcion:Observacion,
        fecha_cambio_estado : fecha_ingreso
    };

    const resultTracking = await pool.query('INSERT INTO pro_costo_externo_tracking set ? ', [newTrackingCosto]); // actualizo el tracking
    
    const result = await pool.query('UPDATE pro_costo_externo set id_estado = ? WHERE id = ? ', [estadoBD,id_costo_externo]);

    // Ponerle el toask.
    const costosExternos = await pool.query("SELECT " + 
                                            "* , t1.id as idCostoExterno,  DATE_FORMAT(t1.fecha_ingreso, '%Y-%m-%d') as fechaIngreso , t5.nombre as proveedor,  t2.nombre as nomProyecto" +
                                            " FROM pro_costo_externo as t1, "+
                                            " pro_proyectos as t2, " +
                                            " pro_costo_externo_estado as t3, " +
                                            " sys_usuario as t4, " +
                                            " prov_externo as t5 " + 
                                            " WHERE t1.id_estado = 1" + 
                                            " AND t1.id_proyecto = t2.id" +
                                            " AND t1.id_estado = t3.id"+ 
                                            " AND t1.id_ingreso = t4.idUsuario" + 
                                            " AND t5.id = t1.id_prov_externo" );

    res.render('proyecto/acostoexterno', {costosExternos, req ,layout: 'template'});

        
    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : costos.js \n Error en el directorio: /updateCostoExterno \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));

    }
});

router.post('/addCostoExterno', isLoggedIn, async (req, res) => {

    try {

        const { idProyecto,idProveedor,idCentroCosto,idTipoMoneda,costo,numhh,numoc,descripcion} = req.body;
    var fecha_ingreso = dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");

    const newCostoExterno  ={ //Se gurdaran en un nuevo objeto
        id_proyecto:idProyecto,
        id_prov_externo:idProveedor,
        id_centro_costo:idCentroCosto,
        id_tipo_moneda:idTipoMoneda,
        costo:costo,
        numHH:numhh ,
        numOC:numoc,
        descripcion:descripcion,
        fecha_ingreso:fecha_ingreso,
        id_ingreso:req.user.idUsuario,
        id_estado : 1
    };
    
    const result = await pool.query('INSERT INTO pro_costo_externo set ? ', [newCostoExterno]);

    const proveedores =  await pool.query("SELECT * FROM prov_externo ORDER BY nombre ASC");
    const proveedor =  await pool.query("SELECT * FROM prov_externo as t1 WHERE t1.id = ?",[idProveedor]);
    const centros =  await pool.query("SELECT * FROM centro_costo ORDER BY centroCosto ASC");
    const monedas =  await pool.query("SELECT * FROM moneda_tipo as t1 WHERE  t1.id_moneda in (1,2,4)");
    const proyectos =  await pool.query("SELECT * FROM pro_proyectos as t1 ORDER BY year DESC, code DESC");

       // Seleccicionar los costos que el ha ingresado
    const costosExternos = await pool.query("SELECT " + 
       "* " +
       " , DATE_FORMAT(t1.fecha_ingreso, '%Y-%m-%d') as fechaIngreso " +
       " FROM pro_costo_externo as t1,"+
       " pro_proyectos as t2, " +
       " pro_costo_externo_estado as t3 " +
       " WHERE t1.id_ingreso = "+req.user.idUsuario+"" + 
       " AND t1.id_proyecto = t2.id" +
       " AND t1.id_estado = t3.id");

    const verToask = {
        titulo : "Costo Externo",
        body   : "Se ha ingresado correctamente",
        tipo   : "Crear"
    };

    const infoProyecto = await pool.query("SELECT * FROM pro_proyectos as t1 where t1.id =  ? ",[idProyecto]);

    const mailContabilidad = {
       to : "contabilidad@renelagos.com",
       // to : "dbenites@renelagos.com",
        proveedor : proveedor[0].nombre,
        orden : numoc,
        descripcion : descripcion,
        proyecto : infoProyecto[0].year + "-" + infoProyecto[0].code + " : " + infoProyecto[0].nombre,
        solicitante : req.user.Nombre
      }


    // Enviar notificaciones a finanzas.
    mensajeria.EnvioMailSolicitudCostoExterno(mailContabilidad);


    res.render('proyecto/costoexterno', {verToask, proveedores,centros,monedas, proyectos , costosExternos, req ,layout: 'template'});

        
    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : costos.js \n Error en el directorio: /addCostoExterno \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));

    }

    
});

router.post('/ajax', express.json({type: '*/*'}), async (req,res) => {
    //res.json(req.body);

    try {
        var id = req.body[0].vid;
        var valor = req.body[0].vvalor;
        var nombre = req.body[0].vnombre;
        var annio = req.body[0].vannio;
        var mes = req.body[0].vmes;

        //console.log("ID" + id + "VALOR" + valor + "NOIMBRE" + nombre + "ANNIO" + annio + "MEs" + mes);

        const result = await pool.query('UPDATE sys_usuario_costo set costo  = ? WHERE annio = ? AND mes = ? AND idUsuario = ?', [valor,annio,mes,id]);



        res.send("OK");

    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : costos.js \n Error en el directorio: /ajax \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));

    }

});

//ajaxNombre

router.post('/ajaxNombre', express.json({type: '*/*'}), async (req,res) => {
    try {
       // validar no exista un valor con el mismo nombre que se ingreso. 

        const {NombreContacto} =     req.body;

        //console.log(NombreContacto);
        const contactos = await pool.query("SELECT  * FROM contacto where name = '"+NombreContacto+"'"  );
        if (contactos.length === 0)
        {
            if (NombreContacto === "")
            {
                res.send("Ingresar un nombre de contacto valido");
            }
            else
            {
                res.send("1");
            }
            
        }
        else
        {
            //alert("Existe un contacto con el mismo nombre");
            //console.log("existe un contacto con el mismo nombre");
            res.send("Existe un contacto con el mismo nombre");
        }
    
    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : costos.js \n Error en el directorio: /ajaxNombre \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));


    }
    
});

module.exports = router;