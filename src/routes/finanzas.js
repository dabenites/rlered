const express = require('express');
const router = express.Router();
var util = require('util');
var dateFormat = require('dateformat');
//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
var formidable = require('formidable');

var url = require('url');
const path    = require('path');

const mensajeria = require('../mensajeria/mail');
const fs = require('fs');

// Administracion del FTP 

const ftp = require("basic-ftp");


//proyecto
//metodologia

//actualizaPagoAdicional

router.get('/download/:id', isLoggedIn, async (req, res) => {

    const { id } = req.params;

    let informacionDownload =  example(id); // function tiene que dejar el archivo de forma temporal en el servidor en alguna carpeta temporal 


    informacionDownload.then((informacion)=>{

            //console.log(nombreArchivo);

                 res.setHeader('Content-Type', 'application/pdf');
                 res.setHeader('Content-Disposition', 'inline;filename='+informacion.nombreSalida+''); 
                 
                 var file = fs.createReadStream(''+informacion.cadena+'.pdf');
                 var stat = fs.statSync(''+informacion.cadena+'.pdf');
                 res.setHeader('Content-Length', stat.size);
                 res.setHeader('Content-Type', 'application/pdf');
                 res.setHeader('Content-Disposition', 'attachment; filename='+informacion.nombreSalida+'');
                file.pipe(res);


    });

});

async function example( iId) {

    let opciones = await pool.query("SELECT * FROM servicios_ftp as t1 where t1.estado = 'Y' "); // informacion vigente del FTP 
    let informacionDocumento = await pool.query("SELECT * FROM contrato_documento as t1 WHERE t1.id = ? ", [iId]);

    let cadenaSalida = getCadenaAletoria();
    let informacionSalida = {};
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
            await client.access({
                                host: opciones[0].ip,
                                user: opciones[0].usuario,
                                password: opciones[0].password,
                                secure: false
            });

      await client.cd(informacionDocumento[0].path_file);
     /*
      await client.downloadTo ( fs.createWriteStream("LpTBPxZ.pdf"), "prueba.pdf", 0).then(()=> { let casst = "dsadas";})
                                                                            .catch(err=>{
                                                                                console.log(err);
                                                                            });
                                                                            */
         await client.downloadTo ( cadenaSalida +".pdf", "LpTBPxZ.pdf",0);
         informacionSalida = {
                                cadena : cadenaSalida,
                                extension : informacionDocumento[0].ext_archivo,
                                nombreSalida : informacionDocumento[0].nombre_real
         }

    }
    catch(err) {
      console.log(err)
    }
    client.close();


    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
                        resolve(informacionSalida);
                },100);
});

  }



function getExtension(filename) {
    var ext = path.extname(filename||'').split('.');
    return ext[ext.length - 1];
}

function getCadenaAletoria()
{
    const banco = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let aleatoria = "";
    for (let i = 0; i < 7; i++) {
        aleatoria += banco.charAt(Math.floor(Math.random() * banco.length));
    }
    return aleatoria;
}
router.post('/proyecto/cargaDocumento', isLoggedIn, async (req, res) => {

    //const { id_proyecto,tipoDocumento,montodoc,numerodoc,archivo } = req.body;

    let {tipoDocumento,numerodoc,montodoc,id_proyecto,oldpath, oldname , extension} = "";
   

    var form = new formidable.IncomingForm();
        form.parse(req, async function (err, fields, files) {
            oldpath = files.archivo.path;
            oldname = files.archivo.name;
            extension = getExtension(oldname);

             tipoDocumento  = fields.tipoDocumento;
             numerodoc      = fields.numerodoc;
             montodoc       = fields.montodoc;
             id_proyecto    = fields.id_proyecto;

             let proyecto = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ? ", [id_proyecto]);
             let annio = proyecto[0].year;
             let code = proyecto[0].code;
             let cadena = getCadenaAletoria();
         
             
             if (checkYearFolder(id_proyecto)) // verifico la carpeta
             {
                 if (checkCodeFolder(id_proyecto)) // verifico el codigo.
                 {
                     let numeroArchivosCargados = getNumberFile(id_proyecto);
                    

                     numeroArchivosCargados.then((num)=>{
                            
                             // crear la carpeta y el registro en la base de datos correspondiente a este path. 

                             checkDocFolder(id_proyecto, num).then( (respuesta) =>{

                                // registrar en la base de datos y subir el archivo. 
                                let directorio = "finanzas/"+annio+"/"+code+"/"+num+"/";
                                let registro = {
                                                    id_proyecto : id_proyecto,
                                                    id_tipo : tipoDocumento,
                                                    id_carga_doc : req.user.idUsuario,
                                                    path_file : directorio,
                                                    nombre_real : oldname,
                                                    nombre_servidor : cadena,
                                                    ext_archivo : extension,
                                                    numero : numerodoc,
                                                    monto : montodoc
                                                }
        
        
                                const cargaDocumento = pool.query('INSERT INTO contrato_documento  set ? ', [registro]);
        
                                cargaDocumentoServidor(id_proyecto, num , cadena, "."+extension, oldpath );


                                res.redirect(   url.format({
                                   pathname:'/finanzas/proyecto/'+id_proyecto,
                                           query: {
                                           "a": 1
                                           }
                                       }));
                             }
                             );
                     });
                 }
             }

        });

});

async function cargaDocumentoServidor( id_proyecto, num, cadena, extension , oldpath)
{


    let estado = false;
    let proyecto = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ? ", [id_proyecto]);
    let opciones = await pool.query("SELECT * FROM servicios_ftp as t1 where t1.estado = 'Y' "); // informacion vigente del FTP 

        console.log("####################################");
        let annio = proyecto[0].year;
        let code = proyecto[0].code;

        let directorio = "finanzas/"+annio+"/"+code+"/" + num + "/";
      //  console.log(directorio);
        const client = new ftp.Client();

        client.ftp.verbose = true;
        try {
            let informacion = await client.access({
                                            host: opciones[0].ip,
                                            user: opciones[0].usuario,
                                            password: opciones[0].password,
                                            secure: false
                                        });
    
             // nombre de la carpeta a buscar. 
            
             // vamos a la carpeta base de finanzas
             await client.cd("finanzas/"+ annio.toString() +"/" + code.toString()+"/" + num.toString() + "/");
             let name = cadena + extension;
             await client.uploadFrom(oldpath, name);
            estado = true;
        }
        catch(err) {
            console.log("EEOOOOOOOOOOOOOORRRR cargaDocumentoServidor");
            console.log(err);

            estado = false;
        }
        client.close();


        return estado;
}


async function checkYearFolder( id_proyecto)
{


    let estado = false;
    let proyecto = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ? ", [id_proyecto]);
    let opciones = await pool.query("SELECT * FROM servicios_ftp as t1 where t1.estado = 'Y' "); // informacion vigente del FTP 


        const client = new ftp.Client();

        client.ftp.verbose = false;
        try {
            let informacion = await client.access({
                                            host: opciones[0].ip,
                                            user: opciones[0].usuario,
                                            password: opciones[0].password,
                                            secure: false
                                        });
    
             // nombre de la carpeta a buscar. 
             let annio = proyecto[0].year;
             let code = proyecto[0].code;
             // vamos a la carpeta base de finanzas
             await client.cd("finanzas/");
    
             let carpetas  = await client.list(); // listados las carpetas que estan dentro de este directorio. 
    
             let existeCarpetaAnnio = false;
             carpetas.forEach(carpeta => {
                    
                    if (carpeta.type == 2)
                    {
                        if (carpeta.name == annio.toString())
                        {
                            existeCarpetaAnnio = true;
                        }
                    }
             });
             
             if (existeCarpetaAnnio == false)
             {
                await client.ensureDir(annio.toString());
             }
    
            
            estado = true;
        }
        catch(err) {
            console.log("ERROR ====> " +  "checkYearFolder")
            estado = false;
        }
        client.close();


        return estado;
}

async function checkCodeFolder( id_proyecto)
{


    let estado = false;
    let proyecto = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ? ", [id_proyecto]);
    let opciones = await pool.query("SELECT * FROM servicios_ftp as t1 where t1.estado = 'Y' "); // informacion vigente del FTP 


        const client = new ftp.Client();

        client.ftp.verbose = false;
        try {
            let informacion = await client.access({
                                            host: opciones[0].ip,
                                            user: opciones[0].usuario,
                                            password: opciones[0].password,
                                            secure: false
                                        });
    
             // nombre de la carpeta a buscar. 
             let annio = proyecto[0].year;
             let code = proyecto[0].code;
             // vamos a la carpeta base de finanzas
             await client.cd("finanzas/"+annio+"/");
    
             let carpetas  = await client.list(); // listados las carpetas que estan dentro de este directorio. 
    
             let existeCarpetaCode = false;
             carpetas.forEach(carpeta => {
                    
                    if (carpeta.type == 2)
                    {
                        if (carpeta.name == code.toString())
                        {
                            existeCarpetaCode = true;
                        }
                    }
             });
             
             if (existeCarpetaCode == false)
             {
                await client.ensureDir(code.toString());
             }
    
            
            estado = true;
        }
        catch(err) {
            console.log("ERROR ====> " +  "checkCodeFolder");
            console.log(err);
            estado = false;
        }
        client.close();


        return estado;
}

async function checkDocFolder( id_proyecto, num)
{    
    let estado = false;
    let proyecto = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ? ", [id_proyecto]);
    let opciones = await pool.query("SELECT * FROM servicios_ftp as t1 where t1.estado = 'Y' "); // informacion vigente del FTP 


        const client = new ftp.Client();

        client.ftp.verbose = false;
        try {
            let informacion = await client.access({
                                            host: opciones[0].ip,
                                            user: opciones[0].usuario,
                                            password: opciones[0].password,
                                            secure: false
                                        });
    
             // nombre de la carpeta a buscar. 
             let annio = proyecto[0].year;
             let code = proyecto[0].code;
             // vamos a la carpeta base de finanzas
             await client.cd("finanzas/"+annio+"/"+code+"/");
    
             let carpetas  = await client.list(); // listados las carpetas que estan dentro de este directorio. 
    
             let existeCarpetaDoc = false;
             carpetas.forEach(carpeta => {
                    
                    if (carpeta.type == 2)
                    {
                        if (carpeta.name == num.toString())
                        {
                            existeCarpetaDoc = true;
                        }
                    }
             });
             
             if (existeCarpetaDoc == false)
             {
                await client.ensureDir(num.toString());
             }
    
            
            estado = true;
        }
        catch(err) {
            console.log("ERROR ====> " +  "checkDocFolder");
            console.log(err);
            estado = false;
        }
        client.close();


        return estado;
}

async function getNumberFile( id_proyecto )
{
    let numCarpetaActual = 0;



    let estado = false;
    let proyecto = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ? ", [id_proyecto]);
    let opciones = await pool.query("SELECT * FROM servicios_ftp as t1 where t1.estado = 'Y' "); // informacion vigente del FTP 


        const client = new ftp.Client();
        

        client.ftp.verbose = false;
        try {
            let informacion = await client.access({
                                            host: opciones[0].ip,
                                            user: opciones[0].usuario,
                                            password: opciones[0].password,
                                            secure: false
                                        });
    
             // nombre de la carpeta a buscar. 
             let annio = proyecto[0].year;
             let code = proyecto[0].code;
             // vamos a la carpeta base de finanzas

             await client.cd("finanzas/"+annio+"/"+code+"/");
             //await client.ensureDir("/my/remote/directory")
             numCarpetaActual = await (await client.list()).length;
            

           //  let numCarpetas = await (await client.list()).length;
/*
             let carpetas  = await client.list();

             carpetas.forEach(carpeta => {

                    
                    if (carpeta.type == 2)
                    {
                        numCarpetaActual++;
                    }
             });*/
          


        }
        catch(err) {
            numCarpetaActual = 0;
        }
        client.close();


        return new Promise((resolve,reject)=>{
            setTimeout(()=>{
                            resolve(numCarpetaActual);
                    },100);
    });

}

router.post('/actualizaPagoAdicional', isLoggedIn, async (req, res) => {


      const { idProyecto, edificiotorre ,tipoCobro,  numero,motivo, porcentaje, monto,moneda,observacion,id } = req.body;


    // cargando

    let registro = {
        id_proyecto : idProyecto,
        id_substructura : edificiotorre,
        id_moneda : moneda,
        id_tipo_cobro : tipoCobro,
        id_motivo : motivo,
        numero : numero,
        porcentaje : porcentaje,
        monto : monto,
        observacion : observacion
    }

    await pool.query('UPDATE contrato_pago_adicional set ? WHERE id = ?', [registro, id]);

    res.send("ok");

});


router.post('/actualizaMetodologiaPago', isLoggedIn, async (req, res) => {


    const { id, edificiotorre , hito,idProyecto, idppto, moneda,monto,observacion,porcentaje } = req.body;


    // cargando

    let registro = {
        id_proyecto : idProyecto,
        id_presupuesto : idppto,
        id_substructura : edificiotorre,
        id_hitopago : hito,
        id_moneda : moneda,
        porcentaje : porcentaje,
        monto : monto,
        observacion : observacion
    }

    await pool.query('UPDATE contrato_metodologia set ? WHERE id = ?', [registro, id]);

    res.send("ok");

});

router.post('/cargaFormularioEditar', isLoggedIn, async (req, res) => {

    const {  tipo , iId,idProyecto } = req.body;


    let hitos = await pool.query("SELECT * FROM fact_tipo_cobro as t1 where t1.id != 0 ");
    let monedas = await pool.query("SELECT * FROM moneda_tipo as t1 where t1.factura = 'Y' ");
    let motivos = await pool.query("SELECT * FROM metod_motivo_cobro as t1  ");

    let presupuestos =await pool.query("SELECT * FROM ppto_presupuesto as t1 where t1.id_proyecto = ? ", [idProyecto]);
    let tipoCobro = await pool.query("SELECT * FROM contrato_tipo_cobro_adicional as t1  ");
    let substructura =await pool.query("SELECT * FROM metod_subestructura as t1 where t1.id_proyecto = ? ", [idProyecto]);


    const isEqualHelperHandlerbar = function(a, b, opts) {
        if (a == b) {
            return true
        } else { 
            return false
        } 
    };
    

    switch(tipo)
    {
        case 1:
        case "1":
            let contrato_metodologia =await pool.query("SELECT * FROM contrato_metodologia as t1 where t1.id = ? ", [iId]);

            res.render('finanzas/editarformMetodologia', { req, hitos,monedas,motivos,presupuestos,tipoCobro,  contrato_metodologia : contrato_metodologia[0], 
                        layout: 'blanco', helpers : {
                            if_equal : isEqualHelperHandlerbar
                        }}); 
        break;
        case 2:
        case "2":
            let pago_adcional =await pool.query("SELECT * FROM contrato_pago_adicional as t1 where t1.id = ? ", [iId]);

            res.render('finanzas/editarPagoAdicional', { req, substructura,tipoCobro,motivos,monedas, pago_adcional : pago_adcional[0], layout: 'blanco', helpers : {
                if_equal : isEqualHelperHandlerbar
            }}); 
        break;
    }


});

//cargaFormularioEditarDocRespaldo

router.post('/cargaFormularioEditarDocRespaldo', isLoggedIn, async (req, res) => {

    const { iId,idProyecto } = req.body;


    let documento = await pool.query("SELECT * FROM contrato_documento as t1 where t1.id = ? ",[iId]);
    let tipoDocumentos = await pool.query("SELECT * FROM contrato_tipo_documento as t1 ");


    //console.log(iId);
    //console.log("SELECT * FROM contrato_documento as t1 where t1.id = ? ");

    const isEqualHelperHandlerbar = function(a, b, opts) {
        if (a == b) {
            return true
        } else { 
            return false
        } 
    };
    



            res.render('finanzas/editarformMetodologiaDocRespaldo', { req, documento : documento[0], tipoDocumentos,
                        layout: 'blanco', helpers : {
                            if_equal : isEqualHelperHandlerbar
                        }}); 
    
});


router.post('/cargaOpcionesSubStructuraAll', isLoggedIn, async (req, res) => {

    const { idProyecto } = req.body;


    // Si el Id esdistinto de 0 tiene que buscar la informacion del proyecto. 

let sql = "";

    sql = "SELECT * FROM metod_subestructura as t1 where t1.id_proyecto = "+idProyecto+"";

    
let opciones = await pool.query(sql);

res.render('finanzas/opciones', { req,opciones, layout: 'blanco'}); 


});



router.post('/cargaOpcionesSubStructura', isLoggedIn, async (req, res) => {

    const { idProyecto , iId} = req.body;


    // Si el Id esdistinto de 0 tiene que buscar la informacion del proyecto. 

let sql = "";
if (iId > 0)
{
    // esta asociada a un presupuesto y mandar a buscar la informacion de la lista. 
    sql = "SELECT * FROM metod_subestructura as t1 where t1.id_ppto = "+iId+" ";
}
else
{
    sql = "SELECT * FROM metod_subestructura as t1 where t1.id_proyecto = "+idProyecto+" AND t1.id_ppto = 0 ";
}
    
let opciones = await pool.query(sql);

res.render('finanzas/opciones', { req,opciones, layout: 'blanco'}); 


});


router.post('/cargaPagoAdiocional', isLoggedIn, async (req, res) => {

    //let informacion = {idProyecto,  tipoCobro, numero,motivo,porcentaje,monto,moneda, observacion};

    const { idProyecto , tipoCobro,numero, motivo, porcentaje , monto , moneda , observacion , edificiotorre} = req.body;

    let registro = {
        id_proyecto : idProyecto,
        id_substructura : edificiotorre,
        id_moneda : moneda,
        id_tipo_cobro : tipoCobro,
        id_motivo : motivo,
        numero : numero,
        porcentaje : porcentaje,
        monto : monto,
        observacion : observacion
    }

    const infoSubStructura = await pool.query('INSERT INTO contrato_pago_adicional  set ? ', [registro]);

    res.send("OK");


});

router.post('/cargaMetodologiaPago', isLoggedIn, async (req, res) => {

    
    const { edificiotorre , hito,idProyecto, idppto, moneda,monto,observacion,porcentaje } = req.body;


        // cargando

        let registro = {
            id_proyecto : idProyecto,
            id_presupuesto : idppto,
            id_substructura : edificiotorre,
            id_hitopago : hito,
            id_moneda : moneda,
            porcentaje : porcentaje,
            monto : monto,
            observacion : observacion
        }
    
        const metodologiapago = await pool.query('INSERT INTO contrato_metodologia  set ? ', [registro]);



        res.send("OK");

});

router.post('/cargaFormIngreso', isLoggedIn, async (req, res) => {

    
    const { tipo , idppto,idProyecto } = req.body;

    let substructura = "";

    if (idppto > 0)
    {
        substructura =await pool.query("SELECT * FROM metod_subestructura as t1 where t1.id_ppto = ? ", [idppto]);
    }
    else
    {
        substructura =await pool.query("SELECT * FROM metod_subestructura as t1 where t1.id_proyecto = ? AND t1.id_ppto = 0", [idProyecto]);
    }

    let hitos = await pool.query("SELECT * FROM fact_tipo_cobro as t1 where t1.id != 0 ");
    let monedas = await pool.query("SELECT * FROM moneda_tipo as t1 where t1.factura = 'Y' ");
    let motivos = await pool.query("SELECT * FROM metod_motivo_cobro as t1  ");

    let presupuestos =await pool.query("SELECT * FROM ppto_presupuesto as t1 where t1.id_proyecto = ? ", [idProyecto]);
    let tipoCobro = await pool.query("SELECT * FROM contrato_tipo_cobro_adicional as t1  ");

    
    

    switch(tipo)
    {
        case 1:
        case "1":
            res.render('finanzas/formMetodologia', { req,substructura,presupuestos, tipoCobro , hitos, motivos, monedas, layout: 'blanco'}); 
            break;
        case 2:
        case "2":
            res.render('finanzas/formAdicional', { req,substructura, presupuestos, tipoCobro , hitos, motivos,  monedas, layout: 'blanco'}); 
            break;
    }



});

//EliminarRegistroMetoPago
router.post('/EliminarRegistroMetoPago', isLoggedIn, async (req, res) => {

    const { tipo, id } = req.body;


    switch(tipo)
    {
        case 1:
        case "1":
            let borradoMetodologia = await pool.query('DELETE FROM contrato_metodologia WHERE id = ?', [id]);
            break;
        case 2:
        case "2":
            let borradoCondicion = await pool.query('DELETE FROM contrato_pago_adicional WHERE id = ?', [id]);
            break;
    }

    res.send("ok");

});


router.post('/EliminarSubStructura', isLoggedIn, async (req, res) => {

    const { Id, idppto,idProyecto } = req.body;

    let borrado = await pool.query('DELETE FROM metod_subestructura WHERE id = ?', [Id]);

    let substructura = "";

    if (idppto > 0)
    {
        substructura =await pool.query("SELECT * FROM metod_subestructura as t1 where t1.id_ppto = ? ", [idppto]);
    }
    else
    {
        substructura =await pool.query("SELECT * FROM metod_subestructura as t1 where t1.id_proyecto = ? ", [idProyecto]);
    }


    res.render('finanzas/tablaSub', { req, substructura,  layout: 'blanco'}); 

});


router.post('/cargaNombreSub', isLoggedIn, async (req, res) => {

    const { nombre, idppto,idProyecto } = req.body;

    // cargando

    let registro = {
        id_ppto : idppto,
        id_proyecto : idProyecto,
        descripcion : nombre
    }

    const infoSubStructura = await pool.query('INSERT INTO metod_subestructura  set ? ', [registro]);

    let substructura = "";

    if (idppto > 0)
    {
        substructura =await pool.query("SELECT * FROM metod_subestructura as t1 where t1.id_ppto = ? ", [idppto]);
    }
    else
    {
        substructura =await pool.query("SELECT * FROM metod_subestructura as t1 where t1.id_proyecto = ? ", [idProyecto]);
    }


    res.render('finanzas/tablaSub', { req, substructura,  layout: 'blanco'}); 


});



router.post('/cargaListadoPpto', isLoggedIn, async (req, res) => {

    const { idPPto, idProyecto } = req.body;

    let substructura = "";

    if (idPPto > 0)
    {
        substructura =await pool.query("SELECT * FROM metod_subestructura as t1 where t1.id_ppto = ? ", [idPPto]);
    }
    else
    {
        substructura =await pool.query("SELECT * FROM metod_subestructura as t1 where t1.id_proyecto = ? ", [idProyecto]);
    }


    res.render('finanzas/tablaSub', { req, substructura,  layout: 'blanco'}); 
});


router.get('/proyecto/:id', isLoggedIn, async (req, res) => {
    try {


        const { id } = req.params; // id del proyecto que deseamos cargar la información. 
        //* IMPORTANTE */
        // por el momento lo vamos a dejar ligado al id del proyecto pero a tu futuro tiene que estar ligado al presupuesto. 
        /// ________________________________________________________________________________________________________________

        // traerme la informacion del proyecto. 

        // traerme los posibles cobros relacionados con la metodologia o pago adicional.
        let sql = " SELECT if (t2.codigo IS NULL , 'N/A',t2.codigo ) AS codigo, "  +
                    " 'Metodologia Pago' AS tipo,  " +
                    "  if (t3.descripcion IS NULL , 'N/A', t3.descripcion ) AS substructura, " +
                    " t4.descripcion AS motivohito, " +
                    " t5.descripcion AS moneda, " +
                    " t1.porcentaje AS porcentaje, " +
                    " t1.monto AS monto, " + 
                    " t1.observacion AS observacion, " + 
                    " 1 AS tiporegistro, " + 
                    " t1.id AS id " + 
                    " FROM contrato_metodologia as t1  " +
                    " LEFT JOIN ppto_presupuesto AS t2 ON   t1.id_presupuesto = t2.id_presupuesto " +
                    " LEFT JOIN metod_subestructura AS t3 ON t1.id_substructura = t3.id " +
                    " LEFT JOIN fact_tipo_cobro AS t4 ON t1.id_hitopago = t4.id " +
                    " LEFT JOIN moneda_tipo AS t5 ON t1.id_moneda = t5.id_moneda " +
                    " where t1.id_proyecto = "+id+" ";

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


        let metodologia_pago = await pool.query(sql); 
        let pago_adicional   = await pool.query(sql2); 

        let presupuestos =await pool.query("SELECT * FROM ppto_presupuesto as t1 where t1.id_proyecto = ? ", [id]);

        let proyecto = await pool.query("SELECT * FROM pro_proyectos as t1 where t1.id = ? ", [id]);

        let tipoDocumentos =await pool.query("SELECT * FROM contrato_tipo_documento "); 


        let respaldo_doc = await pool.query("SELECT *, t1.id as idDoc FROM contrato_documento as t1, " + 
                                            " contrato_tipo_documento as t2 " +
                                            " where  " +
                                            " t1.id_tipo = t2.id AND " +
                                            " t1.id_proyecto = ? ", [id]);
        res.render('finanzas/proyecto', { req ,proyecto:proyecto[0] ,presupuestos, tipoDocumentos,  metodologia_pago, pago_adicional,respaldo_doc, layout: 'template'}); 
        

    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : finanzas.js \n Error en el directorio: /proyecto/:id \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  
    }
}); 

//metodologia
router.get('/metodologia', isLoggedIn, async (req, res) => {
    try {

        // __________________________________________________
        let sql = "SELECT t3.Nombre AS nomJefe, t4.Nombre AS nomDir, t2.name AS nomCli, t1.* FROM pro_proyectos AS t1 "+ 
                    "LEFT JOIN contacto AS t2 ON t1.id_cliente = t2.id " +
                    " LEFT JOIN sys_usuario AS t3 ON t1.id_jefe = t3.idUsuario " + 
                    " LEFT JOIN sys_usuario AS t4 ON t1.id_director = t4.idUsuario" +
                    " ORDER BY t1.id";

        const proyectos = await pool.query(sql);


        // 
        res.render('finanzas/listado', { req ,proyectos , layout: 'template'});        

    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : finanzas.js \n Error en el directorio: /metodologia \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  


    }

}); 


module.exports = router;