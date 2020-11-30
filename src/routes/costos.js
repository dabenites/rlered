const express = require('express');
const router = express.Router();
const Excel = require('exceljs');
var formidable = require('formidable');
var fs = require('fs');
var dateFormat = require('dateformat');

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { isArray } = require('util');

router.post('/fileupload', async (req,res) => {
   
    var form = new formidable.IncomingForm();
    const lectura = [];
    form.parse(req, function (err, fields, files) {
        var oldpath = files.filetoupload.path;
        var newpath =  "../rlered/src/uploads/planillaCostos/"+ files.filetoupload.name;
        rutaArchivoCargado = newpath;
        fs.rename(oldpath, newpath, function (err) {
            if (err) throw err;
            var workbook = new Excel.Workbook(); 
            workbook.xlsx.readFile(newpath)
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
                            if (rowNumber == 7 )
                            {
                                const existeCosto =  await pool.query("SELECT * FROM sys_usuario_costo AS t1 WHERE t1.annio = "+ lectura["ano"] +" AND t1.mes = "+lectura["mes"]+" AND t1.idUsuario = "+row.values[2]+"");
                                const unCosto ={ 
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
                                    const result = await pool.query('UPDATE sys_usuario_costo set costo = ? WHERE annio = ? , mes = ? , idUsuario = ? ', [row.values[7],lectura["ano"],lectura["mes"],row.values[2]]);
                                }
                                else
                                {
                                    const result = await pool.query('INSERT INTO sys_usuario_costo set ?', [unCosto]);
                                }  
                            }          
                            //
                        }
                    });
                });
                res.redirect("../costos/usuario");
          });
    })

});


router.get('/duplicarAnterior', isLoggedIn, async (req, res) => {
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

    //res.send("Mensaje de informacion year" + year + " MEs " + mes);

    // Primero preguntar si tengo la informacion en el mes mencionado.
    
        // Buscar la informacion de los usuarios.
        const costos  = await pool.query("SELECT t1.* " +
        " FROM    " +
                        " sys_usuario_costo AS t1," + 
                        " sys_usuario  AS t2, " +
                        " sys_categoria AS t3," +
                        " centro_costo AS t4, " +
                        " sys_sucursal AS t5" + 
        " WHERE     " + 
                        " t1.annio = "+ yearA +" " +
        " AND       " +
                        " t1.mes = "+ mesA +"  " +
        " AND       " +
                        " t1.idUsuario = t2.idUsuario" +
        " AND       " + 
                        " t2.idCategoria = t3.id_Categoria"+
        " AND       " +
                        "t3.idCentroCosto = t4.id" +
        " AND       " +
                        "t5.id_Sucursal = t2.idSucursal");

        // borro la informacion completa del mes para duplicar el anterior
        const result = pool.query("DELETE FROM sys_usuario_costo WHERE annio = "+year+" AND mes = "+mes+""); 
        //console.log(result);

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

});

router.get('/descargarPlanilla', isLoggedIn, async (req, res) => {

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

    const usuarios  = await pool.query(" SELECT  " +
		                                        " *  " +
                                     " FROM  " +
                                                " sys_usuario  	AS t2 ,  " +
                                                " sys_categoria 	AS t3 ,  " +
                                                " centro_costo 	AS t4  " +
                                    " WHERE  " +
	 	                                        " t2.idCategoria = t3.id_Categoria  " +
                                    " AND  " +
		                                        " t3.idCentroCosto = t4.id ");
    
     usuarios.forEach((element, i) => {
        worksheet.getCell('B'+ (i + 6)).value = element.idUsuario;
        worksheet.getCell('C'+ (i + 6)).value = element.NombreCompleto;
        worksheet.getCell('D'+ (i + 6)).value = element.categoria;
        worksheet.getCell('E'+ (i + 6)).value = element.categoria;
        worksheet.getCell('F'+ (i + 6)).value = "Pais";
        worksheet.getCell('G'+ (i + 6)).value = "";
    });


  
  // save under export.xlsx
  await workbook.xlsx.writeFile('export.xlsx');

  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="export.xlsx"`,
  });
  
  // write into response
  workbook.xlsx.write(res);


  
}); 

router.get('/usuario', isLoggedIn, async (req, res) => {
    var fecha = new Date();
    var year = fecha.getFullYear();
    var mes = fecha.getMonth() + 1;
    const annios = [];

    
    if (req.query.anio !== undefined)
    {
        year = req.query.anio;
    }
    if (req.query.mes !== undefined)
    {
        mes = req.query.mes;
    }
    

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

    // Buscar la informacion de los usuarios.
    const costos  = await pool.query("SELECT * ," +
                                     "FORMAT(t1.costo, 0, 'de_DE') AS costoFormat" +
                                    " FROM    " +
                                                    " sys_usuario_costo AS t1," + 
                                                    " sys_usuario  AS t2, " +
                                                    " sys_categoria AS t3," +
                                                    " centro_costo AS t4, " +
                                                    " sys_sucursal AS t5" + 
                                    " WHERE     " + 
                                                    " t1.annio = "+ year +" " +
                                    " AND       " +
                                                    " t1.mes = "+ mes +"  " +
                                    " AND       " +
                                                    " t1.idUsuario = t2.idUsuario" +
                                    " AND       " + 
                                                    " t2.idCategoria = t3.id_Categoria"+
                                    " AND       " +
                                                    "t3.idCentroCosto = t4.id" +
                                    " AND       " +
                                                    "t5.id_Sucursal = t2.idSucursal");
                                                    
    res.render('costos/usuario', { annios, messes, costos,year,mes, req ,layout: 'template'});
}); 

router.get('/eproyectos', isLoggedIn, async (req, res) => {

    const proveedores =  await pool.query("SELECT * FROM prov_externo ORDER BY nombre ASC");
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

    res.render('proyecto/costoexterno', {proveedores,centros,monedas, proyectos ,costosExternos, req ,layout: 'template'});

});

router.get('/aproyectos', isLoggedIn, async (req, res) => {

    


    // Seleccicionar los costos que el ha ingresado
    const costosExternos = await pool.query("SELECT " + 
                                            "* , t1.id as idCostoExterno,  DATE_FORMAT(t1.fecha_ingreso, '%Y-%m-%d') as fechaIngreso , t5.nombre as proveedor" +
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

});

router.get('/costoexterno/revisar/:id', async (req, res) => {
    const { id } = req.params;
    
    const costosExternos = await pool.query("SELECT " + 
    "* , t1.id as idCostoExterno,  DATE_FORMAT(t1.fecha_ingreso, '%Y-%m-%d') as fechaIngreso , t5.nombre as proveedor" +
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
    "* , t1.id as idCostoExterno,t1.descripcion as desTra,  t5.nombre as nomProveedor,t2.nombre As nomPro, t2.id As idPro FROM pro_costo_externo as t1, "+
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
    "* , t1.id as idCostoExterno,t1.descripcion as desTra, t5.nombre as nomProveedor,t2.nombre As nomPro,  DATE_FORMAT(t1.fecha_ingreso, '%Y-%m-%d') as fechaIngreso FROM pro_costo_externo as t1, "+
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
    

    res.render('proyecto/acostoexterno', {costosExternos,  costoExterno: costoExterno[0],costosAnteriores, req ,layout: 'template'});


});



router.post('/updateCostoExterno', isLoggedIn, async (req, res) => {
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
                                            "* , t1.id as idCostoExterno FROM pro_costo_externo as t1, "+
                                            " pro_proyectos as t2, " +
                                            " pro_costo_externo_estado as t3, " +
                                            " sys_usuario as t4 " +
                                            " WHERE t1.id_estado = 1" + 
                                            " AND t1.id_proyecto = t2.id" +
                                            " AND t1.id_estado = t3.id"+ 
                                            " AND t1.id_ingreso = t4.idUsuario");

    res.render('proyecto/acostoexterno', {costosExternos, req ,layout: 'template'});





});

router.post('/addCostoExterno', isLoggedIn, async (req, res) => {

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

    res.render('proyecto/costoexterno', {verToask, proveedores,centros,monedas, proyectos , costosExternos, req ,layout: 'template'});


});

router.post('/ajax', express.json({type: '*/*'}), async (req,res) => {
    //res.json(req.body);

    
    var id = req.body[0].vid;
    var valor = req.body[0].vvalor;
    var nombre = req.body[0].vnombre;
    var annio = req.body[0].vannio;
    var mes = req.body[0].vmes;

    //console.log("ID" + id + "VALOR" + valor + "NOIMBRE" + nombre + "ANNIO" + annio + "MEs" + mes);

    const result = await pool.query('UPDATE sys_usuario_costo set costo  = ? WHERE annio = ? AND mes = ? AND idUsuario = ?', [valor,annio,mes,id]);



    res.send("OK");
});


module.exports = router;