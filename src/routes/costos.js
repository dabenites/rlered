const express = require('express');
const router = express.Router();
const Excel = require('exceljs');
var formidable = require('formidable');
var fs = require('fs');


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
                        //console.log("Row " + rowNumber + " = " + JSON.stringify(row.values));
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

    console.log(req.query);
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
    const costos  = await pool.query("SELECT * " +
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


module.exports = router;