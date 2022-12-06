const express = require('express');
const router = express.Router();
const pool = require('../database');
var dateFormat = require('dateformat');
var url = require('url');

const { writeFile } = require('fs');
const ftp = require("basic-ftp");

const { isLoggedIn } = require('../lib/auth');
const fs = require('fs');
const mensajeria = require('../mensajeria/mail');
var formidable = require('formidable');


router.post('/cargaRutinas', isLoggedIn, async (req, res) => {

    try {

        var form = new formidable.IncomingForm();
        let id = "";
        form.parse(req, async function (err, fields, files) {

            
            let id_version = fields.id_version;
            id = id_version;
            let version = fields.version;
            let comentario = fields.comentario;

            // informacion del revit en cuestion 
            let rutina = await pool.query("SELECT * from sist_revit as t1 where t1.id_revit = ? " , [id_version]);
            let oldpath = "";

            //informacionDownload.then((informacion)=>{

            let primerPaso =     eliminarRespaldoAnterior(rutina[0]);

            primerPaso.then((pPaso)=>{

                let segundoPaso = moverVigenteRespaldo(rutina[0]);

                segundoPaso.then((sPaso)=>{


                    let segundoPaso2 = EliminoArchivoVigente(rutina[0]);

                    segundoPaso2.then((sPaso)=>{
                        if (files.archivo.size > 0)
                        {
                            oldpath = files.archivo.path;
    
                            let tercerPaso = cargaRutinaServidor(rutina[0], oldpath);
                            
                            tercerPaso.then( async (erPaso)=>{
    
                                await pool.query("UPDATE sist_revit_publicacion set vigente = 'N'  WHERE id_revit = ?", [id_version]);
    
                                let registro = {
                                    id_revit : id_version,
                                    id_user_carga : req.user.idUsuario,
                                    fecha_publicacion: new Date(),
                                    version :  version,
                                    vigente : "Y",
                                    comentario : comentario
                                }
    
                                const cargaPublicacion = await pool.query('INSERT INTO sist_revit_publicacion  set ? ', [registro]);
    
    
                            });
                        }
                    });
                });


            });


        });

        

        res.redirect(   url.format({
            pathname:'/revit/rutinas/'+id,
                    query: {
                    "a": 1
                    }
                }));


    }catch (error) {
        mensajeria.MensajerErrores("\n\n Archivo : rutinas.js \n Error en el directorio: /cargaRutinas \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                })); 
      }



});

async function cargaRutinaServidor(rutina , oldpath)
{
    let version = rutina.version;
    let opciones = await pool.query("SELECT * FROM servicios_ftp as t1 where t1.estado = 'Y' ");

    const client = new ftp.Client()
    client.ftp.verbose = true;
    informacionSalida = {};
    try {
            await client.access({
                                host: opciones[0].ip,
                                user: opciones[0].usuario,
                                password: opciones[0].password,
                                secure: false
            });

        let pathArchivoVigente = "rutinas/revit/" +version.toString()+ "/vigente/";

        await client.cd(pathArchivoVigente);

        let nombreArchivo = "RLE_Suite_"+version+".rar";
        await client.uploadFrom(oldpath, nombreArchivo);


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


async function moverVigenteRespaldo(rutina)
{

    let version = rutina.version;
    let opciones = await pool.query("SELECT * FROM servicios_ftp as t1 where t1.estado = 'Y' ");

    const client = new ftp.Client()
    client.ftp.verbose = true;
    informacionSalida = {};
    try {
            await client.access({
                                host: opciones[0].ip,
                                user: opciones[0].usuario,
                                password: opciones[0].password,
                                secure: false
            });

         /// ######################################################### PRIMER PASO ELIMINAR SI EXISTE EN CARPETA DE RESPALDO 
         let pathArchivoRespaldo = "rutinas/revit/" +version.toString()+ "/respaldo/";
         let pathArchivoVigente = "rutinas/revit/" +version.toString()+ "/vigente/";

         let fileFind = "RLE_Suite_"+version+".rar";
         await client.cd(pathArchivoVigente);

         // preguntar si existe el archivo. 
        //let info =  await client.remove("RLE_Suite_2022.rar");

        // verifico que el archivo exista
        let informacionCarperta  = await client.list();
        let existeArchivo = false;
        informacionCarperta.forEach(carpetaFile => {
            if (carpetaFile.type == 1)
            {
                if (carpetaFile.name == fileFind)
                {
                    existeArchivo = true;
                }
            }
        });

        let info = {};
        if (existeArchivo)
        {
            let archivoVigente = pathArchivoVigente + fileFind;
            let archivoReslapdo = pathArchivoRespaldo + fileFind;

            info =  await client.rename(fileFind, "../respaldo/"+fileFind);

            //await client.remove(fileFind);
        }
        informacionSalida = {
            info
        };
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
    
   //        return true;
}

async function EliminoArchivoVigente(rutina)
{
    let version = rutina.version;
    let opciones = await pool.query("SELECT * FROM servicios_ftp as t1 where t1.estado = 'Y' ");

    const client = new ftp.Client()
    client.ftp.verbose = true;
    informacionSalida = {};
    try {
            await client.access({
                                host: opciones[0].ip,
                                user: opciones[0].usuario,
                                password: opciones[0].password,
                                secure: false
            });

         /// ######################################################### PRIMER PASO ELIMINAR SI EXISTE EN CARPETA DE RESPALDO 
         let pathArchivoRespaldo = "rutinas/revit/" +version.toString()+ "/respaldo/";
         let pathArchivoVigente = "rutinas/revit/" +version.toString()+ "/vigente/";

         let fileFind = "RLE_Suite_"+version+".rar";
         await client.cd(pathArchivoVigente);

        let informacionCarperta  = await client.list();
        let existeArchivo = false;
        
        informacionCarperta.forEach(carpetaFile => {
            if (carpetaFile.type == 1)
            {
                if (carpetaFile.name == fileFind)
                {
                    existeArchivo = true;
                }
            }
        });

        let info = {};
        if (existeArchivo)
        {
            await client.remove(fileFind);
        }
        informacionSalida = {
            info
        };
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
    
   //        return true

}


async function eliminarRespaldoAnterior(rutina)
{

    let version = rutina.version;
    let opciones = await pool.query("SELECT * FROM servicios_ftp as t1 where t1.estado = 'Y' ");

    const client = new ftp.Client()
    client.ftp.verbose = true;
    informacionSalida = {};
    try {
            await client.access({
                                host: opciones[0].ip,
                                user: opciones[0].usuario,
                                password: opciones[0].password,
                                secure: false
            });

         /// ######################################################### PRIMER PASO ELIMINAR SI EXISTE EN CARPETA DE RESPALDO 
         let pathArchivo = "rutinas/revit/" +version.toString()+ "/respaldo/";
         let pathArchivoVigente = "rutinas/revit/" +version.toString()+ "/vigente/";

         let fileFind = "RLE_Suite_"+version+".rar";
         await client.cd(pathArchivo);

         // preguntar si existe el archivo. 
        //let info =  await client.remove("RLE_Suite_2022.rar");

        // verifico que el archivo exista
        let informacionCarperta  = await client.list();
        let existeArchivo = false;


        informacionCarperta.forEach(carpetaFile => {
            if (carpetaFile.type == 1)
            {
                if (carpetaFile.name == fileFind)
                {
                    existeArchivo = true;
                }
            }
        });

        let info = {};
        if (existeArchivo)
        {
             info =  await client.remove(fileFind);
        }
        informacionSalida = {
            info
        };
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


router.get('/rutinas', isLoggedIn, async (req, res) => {

    try {

        let sql = "SELECT * from sist_revit";

        let rutinas = await pool.query(sql);

        let estadoPublicar = false;

        switch(req.user.idCategoria)
        {
            case 1:
            case 29:
            case 30:
            case 39:
            case 40:
            case 53:
                estadoPublicar = true;
            break;
        }


        const isEqualHelperHandlerbar = function(a, b, opts) {
            if (a == b) {
                return true
            } else { 
                return false
            } 
        };

        let publicar = true;
        if (estadoPublicar)
        {
            res.render('revit/rutinas', {  req ,rutinas, publicar, res, layout: 'template', helpers : {
                if_equal : isEqualHelperHandlerbar
            }});
        }
        else
        {
            res.render('revit/rutinas', {  req ,rutinas, res, layout: 'template', helpers : {
                if_equal : isEqualHelperHandlerbar
            }});
        }


    }catch (error) {
        mensajeria.MensajerErrores("\n\n Archivo : rutinas.js \n Error en el directorio: /rutinas \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                })); 
      }

});

router.get('/rutinas/:id', isLoggedIn, async (req, res) => {

    try {

        const { id } = req.params;

        let sql = "SELECT * from sist_revit";
        let rutinas = await pool.query(sql);
        let rutina = await pool.query("SELECT * from sist_revit as t1 where t1.id_revit = ? " , [id]);

        let publicaciones = await pool.query("SELECT DATE_FORMAT(t1.fecha_publicacion , '%Y-%m-%d') as fpublicacion, t1.*, t2.* " +
                                             " FROM sist_revit_publicacion as t1 ,sys_usuario as t2  where t1.id_revit = ? AND t1.id_user_carga = t2.idUsuario ", [id]);


        res.render('revit/rutinas', {  req ,rutinas, rutina:rutina[0], publicaciones, res, layout: 'template'});

    }catch (error) {
        mensajeria.MensajerErrores("\n\n Archivo : rutinas.js \n Error en el directorio: /rutinas \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                })); 
      }

});

router.get('/licencias', isLoggedIn, async (req, res) => {

    try {

        // ir a buscar las licencias nombre del servidor. 

        let sql = "SELECT "+
                           " t1.id_usuario,"+
                           " t1.id,"+
                           " t1.email,"+
                           " t1.comentario,"+
                           " t1.id_usuario,"+
                           " t2.Nombre as nombreCol,"+
                           " t3.Nombre as nombreIng,"+
                           " DATE_FORMAT(t1.fecha_inicio , '%Y-%m-%d') as fecha_inicio,"+
                           " DATE_FORMAT(t1.fecha_termino , '%Y-%m-%d') as fecha_termino " +
                   " FROM " +
                            " sys_usuario_licencias_revit AS t1,"+
                            " sys_usuario AS t2, " +
                            " sys_usuario AS t3 " +
                   " WHERE  " +
                            " t1.id_usuario = t2.idUsuario " +
                    " AND  " +
                            " t1.id_ingreso = t3.idUsuario";

        let licencias = await pool.query(sql);


        res.render('revit/licencias', {  req ,res,licencias , layout: 'template'});

    }catch (error) {
        mensajeria.MensajerErrores("\n\n Archivo : revit.js \n Error en el directorio: /licencias \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                })); 
      }
});

// verificoLicencia
router.post('/verificoLicencia', isLoggedIn, async (req, res) => {

    const { email, hdserial } = req.body;


    // Preguntar si esta informacion esta registrada en la BD serial y email. 
    // sys_usuario_licencias_revit
    
    //  let licencia = await pool.query("SELECT * FROM sys_usuario_licencias_revit as t1 where t1.email = ? AND t1.",[iId]);

    //  primero pregunto si existe el usuario con el mail ingresado. 

    let respuesta = {
        error : 0,
        tipo : ""
    }
        
    let usuario = await pool.query("SELECT * FROM sys_usuario as t1 where t1.Email = ? ",[email]);

    if (usuario.length == 0 )
    {
        respuesta.error = 1;
        respuesta.tipo = "No encuentro mail en los registros.";
    }
    else
    {
        //   
        let idUsuario = usuario[0].idUsuario;

        // preguntar si existe o no 
        let licencia = await pool.query("SELECT * FROM sys_usuario_licencias_revit as t1 where t1.id_usuario = ? AND t1.harddisk = ? ",[idUsuario,hdserial ]);

        if (licencia.length > 0)
        {
            respuesta.error = 2;
            respuesta.tipo = "Usuario encontrado pero registros de Disco duro duplicado.";
        }

        checkFolderUsuario(usuario[0].idUsuario);
    }


    res.send(respuesta);

});
//eliminarLicencia
router.post('/eliminarLicencia', isLoggedIn, async (req, res) => {

    const { id } = req.body;

    //let licencia = await pool.query("SELECT * FROM sys_usuario_licencias_revit as t1 where t1.Email = ? ",[email]);
    let licencia = await pool.query('DELETE FROM sys_usuario_licencias_revit WHERE id = ? LIMIT 1;', [id]);

    let respuesta = {
        error : 0,
        tipo : ""
    }

    res.send(respuesta);
});


router.get('/permisosRevit/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;



    let infoUsuario = await pool.query("SELECT * FROM sys_usuario as t1 WHERE t1.idUsuario=?", [id]);


     let sql =   "  SELECT " +
                  "  t1.id_tab_Button AS id, " +
                  "  t3.nombre_apps AS grupo1, " +
                  "  t2.nombre_apps AS grupo, " +
                  "  t1.nombre " +
                  "  FROM  " +
                  "          tab_button AS t1, " +
                  "          tab_ribbonpanel AS t2, " +
                  "          tab_ribbon AS t3 " +
                  "  WHERE  " +
                  "          t1.estado = 'Y' " +
                  "  AND " +
                  "          t1.id_tab_ribbonPanel = t2.id_tab_ribbonPanel " +
                  "  AND " +
                  "      t2.id_tab_ribbon = t3.id_tab_ribbon   " +
                  "  ORDER BY grupo1, grupo  DESC" ;


       let aplicativos = await pool.query(sql);

       let revits = await pool.query("SELECT * FROM sist_revit");

       let permisos =[];


       aplicativos.forEach(aps => {
            revits.forEach(rev => {

               
               permisos.push({
                id : aps.id,
                id_usuario : id,
                grupo : aps.grupo1,
                subgrupo : aps.grupo,
                aplicativo : aps.nombre,
                revit: rev.version,
                id_revit: rev.id_revit,
                estado : ""
               });
               
              //permisos.push(info);

            });
       });

       // sys_usuario_revit_permisos
       let permisosActuales = await pool.query("SELECT * FROM sys_usuario_revit_permisos as t1 WHERE t1.idUsuario = ? ", [id]);


       permisos.forEach(permisos => {
        permisosActuales.forEach(actuales => {
                    if (permisos.id_usuario == actuales.idUsuario && permisos.id == actuales.id_tab_Button && permisos.id_revit == actuales.id_revit)
                    {
                        permisos.estado = "checked";
                    }
            });
       });


    res.render('revit/permisos', { infoUsuario:infoUsuario[0], permisos, req ,res, layout: 'template'});

});

///DescargarRutina
router.get('/DescargarRutina/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;

    let rutina = await pool.query('SELECT * FROM sist_revit WHERE id_revit = ? ;', [id]);
    let nombre = rutina[0].version + ".rar";
    let informacionDownload =  downloadRarFile(id);

    informacionDownload.then((informacion)=>{


             res.setHeader('Content-Type', 'application/zip');
             res.setHeader('Content-Disposition', 'inline;filename='+nombre+''); 
             
             var file = fs.createReadStream(''+nombre+'');
             var stat = fs.statSync(''+nombre+'');
             res.setHeader('Content-Length', stat.size);
             res.setHeader('Content-Type', 'application/zip');
             res.setHeader('Content-Disposition', 'attachment; filename='+nombre+'');
            file.pipe(res);


});


});
router.get('/DescargarLicencia/:id', isLoggedIn, async (req, res) => {

    const { id } = req.params;

    let licencia = await pool.query('SELECT * FROM sys_usuario_licencias_revit WHERE id = ? ;', [id]);

    let informacionDownload =  downloadJsonFile(id);

    informacionDownload.then((informacion)=>{


             res.setHeader('Content-Type', 'application/json');
             res.setHeader('Content-Disposition', 'inline;filename=key.json'); 
             
             var file = fs.createReadStream('key.json');
             var stat = fs.statSync('key.json');
             res.setHeader('Content-Length', stat.size);
             res.setHeader('Content-Type', 'application/json');
             res.setHeader('Content-Disposition', 'attachment; filename=key.json');
            file.pipe(res);


});

});


async function downloadJsonFile( iId) {

    let opciones = await pool.query("SELECT * FROM servicios_ftp as t1 where t1.estado = 'Y' "); // informacion vigente del FTP 
    let informacionDocumento = await pool.query("SELECT * FROM sys_usuario_licencias_revit as t1 WHERE t1.id = ? ", [iId]);

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

         let pathArchivo = "licencias/" + informacionDocumento[0].id_usuario.toString()+ "/";
         await client.cd(pathArchivo);

         await client.downloadTo ( "key.json", informacionDocumento[0].nombre_servidor+".json",0);

         informacionSalida = {
                                cadena : "key.json",
                                extension : informacionDocumento[0].ext_archivo,
                                nombreSalida : informacionDocumento[0].nombre_real
         };


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

  async function downloadRarFile( iId) {

    let opciones = await pool.query("SELECT * FROM servicios_ftp as t1 where t1.estado = 'Y' "); // informacion vigente del FTP 
    let informacionDocumento = await pool.query("SELECT * FROM sist_revit as t1 WHERE t1.id_revit = ? ", [iId]);

    let version = informacionDocumento[0].version;

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

         let pathArchivo = "rutinas/revit/" + version+ "/vigente/";

         let nSalida = version + ".rar";
         let nomServidor = "RLE_Suite_"+nSalida;

         await client.cd(pathArchivo);

         await client.downloadTo ( nSalida,nomServidor,0);

         informacionSalida = {
                                cadena : nSalida,
                                extension : ".rar",
                                nombreSalida : nSalida
         };


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


  //downloadRarFile

//crearLicencia
// verificoLicencia
//validarCodigo
router.post('/validarCodigo', isLoggedIn, async (req, res) => {

    const { id_proyecto, id_origen,codigo } = req.body;

    // partes del codigo del proyecto 
    var partesCodigo = codigo.split("_");

    let verificacion =  await pool.query("SELECT * FROM rvt_origen_proyecto as t1 WHERE t1.annio = ? AND t1.code = ? ",[partesCodigo[0],partesCodigo[1]]);


    let respuesta = {
        error : 0,
        tipo : ""
    }


    if (verificacion.length == 0)
    {
        let origen = {
            id_proyecto : id_proyecto,
            id_origen : id_origen,
            annio: partesCodigo[0],
            code :  partesCodigo[1],
            fecha_asociacion : new Date()
        }

        const infoOrigen = await pool.query('INSERT INTO rvt_origen_proyecto  set ? ', [origen]);

    }
    else
    {
        respuesta.error = 1;
        respuesta.tipo = "El codigo del proyecto ya esta en uso";
    }



    res.send(respuesta);

});


router.post('/crearLicencia', isLoggedIn, async (req, res) => {

    const { email, hdserial,comentario } = req.body;

    // lo primero que tenemos que registrar es la información. 
    try {

        let usuario = await pool.query("SELECT * FROM sys_usuario as t1 where t1.Email = ? ",[email]);

    let nombreServidor = getCadenaAletoria();

    const licencia  ={ //Se gurdaran en un nuevo objeto

        email :  email,
        id_usuario: usuario[0].idUsuario,
        id_ingreso : req.user.idUsuario,
        harddisk : hdserial,
        nombre_servidor : nombreServidor,
        fecha_ingreso : new Date(),
        activo:"Y",
        comentario : comentario,
        fecha_inicio : new Date()
      }

      let respuesta = {
        error : 0,
        tipo : ""
    }


    const infoLicencia = await pool.query('INSERT INTO sys_usuario_licencias_revit  set ? ', [licencia]);

    if (crearLicencia(email, hdserial,nombreServidor))
    {
 
        cargaDocumentoServidorContrato(nombreServidor,usuario[0].idUsuario );
    
    }
    else
    {
        mensajeria.MensajerErroresDBENITES("Problema al generar la licencia");
        respuesta.error = 1;
        respuesta.tipo = "Se genero un problema al crear la licencia.";
    }

    res.send(respuesta);
    
    }
    catch(err) {
        mensajeria.MensajerErrores("\n\n Error en el directorio: /revit/crearLicencia \n" + err + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));

    }
});

async function cargaDocumentoServidorContrato( nombreServidor, idUsuario )
{


    let estado = false;
    let opciones = await pool.query("SELECT * FROM servicios_ftp as t1 where t1.estado = 'Y' "); // informacion vigente del FTP 

        let nombreArchivoServidor = './src/uploads/licencias/'+nombreServidor+'.json';
      
        const client = new ftp.Client();

        client.ftp.verbose = true;
        try {
            let informacion = await client.access({
                                            host: opciones[0].ip,
                                            user: opciones[0].usuario,
                                            password: opciones[0].password,
                                            secure: false
                                        });
    
             
             await client.cd("licencias/"+ idUsuario.toString()  + "/");
             
             let name = nombreServidor + ".json";
             await client.uploadFrom(nombreArchivoServidor, name); // esto tiene que ser dinamico. 
             
            estado = true;
        }
        catch(err) {
            console.log(err);

            estado = false;
        }
        client.close();


        return estado;
}

function crearLicencia(email, hdserial , nombreServidor)
{
    const path = './src/uploads/licencias/'+nombreServidor+'.json';
    
    const config = { mail: email, 
                     hdserial: hdserial };
    
    writeFile(path, JSON.stringify(config, null, 2), (error) => {
      if (error) {
        
        mensajeria.MensajerErroresDBENITES("crearLicencia 349")
        return - 1;
      }
    });
    return 1;
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


async function checkFolderUsuario( id_usuario )
{
    let estado = false;
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
                                        
             
             // vamos a la carpeta base de finanzas
             await client.cd("licencias/");
             
             let carpetas  = await client.list(); // listados las carpetas que estan dentro de este directorio. 
    
             let existeCarpetaUsuario = false;
             carpetas.forEach(carpeta => {
                    
                    if (carpeta.type == 2)
                    {
                        if (carpeta.name == id_usuario.toString())
                        {
                            existeCarpetaUsuario = true;
                        }
                    }
             });
             
             if (existeCarpetaUsuario == false)
             {
                await client.ensureDir(id_usuario.toString());
             }
    
            
            estado = true;
        }
        catch(err) {
            estado = false;
        }
        client.close();


        return estado;
}

//cargarPermisos
router.post('/cargarPermisos', isLoggedIn, async (req, res) => {

    const { id_usuario, jsonString } = req.body;



    const permisos = JSON.parse(jsonString);


    let borroAnteriores = await pool.query('DELETE FROM sys_usuario_revit_permisos WHERE idUsuario = ? ', [id_usuario]);


    permisos.forEach(permiso => {
        

        let registro = {
            idUsuario : id_usuario,
            id_tab_Button : permiso.id,
            id_revit : permiso.id_revit
        };

        const cargaDocumento = pool.query('INSERT INTO sys_usuario_revit_permisos  set ? ', [registro]);


    });

    res.send("OK");
});



//configuracion 
router.get('/configuracion', isLoggedIn, async (req, res) => {

    // proyectos. 
    let proyectos = await pool.query("SELECT * FROM pro_proyectos as t1  order by t1.year DESC, t1.code desc");

    let origenes = await pool.query("SELECT * FROM rvt_origen_fierro ");


    // proyectos anteriores.

    let codigos = await pool.query(" SELECT "+
                                    " t1.id_origen_proyecto AS id," +
                                    " t3.nombre, " +
                                    " t2.descripcion, " +
                                    " t1.annio, " +
                                    " t1.code " +
                                    " FROM  " +
                                            " rvt_origen_proyecto AS t1 " +
                                            " LEFT JOIN rvt_origen_fierro AS t2 ON t1.id_origen = t2.id_origen " +
                                            " LEFT JOIN pro_proyectos AS t3 ON t1.id_proyecto = t3.id");
    
    res.render('revit/seteo', { proyectos,origenes, req ,res,codigos, layout: 'template'});


});


//
router.get('/seteoProyecto/:id', isLoggedIn, async (req, res) => {

    const { id } = req.params;

    // buscar la informacion del proyecto. 
    //
    let informacion = await pool.query("SELECT " +
                                        " t1.id_origen_proyecto, " +
                                        " t2.nombre, " +
                                        " t2.`year`, " +
                                        " t2.code, " +
                                        " t1.code AS codigo " +
                                        " FROM  " +
                                                " rvt_origen_proyecto AS t1 " +
                                                " LEFT JOIN pro_proyectos AS t2 ON t1.id_proyecto = t2.id " +
                                        " WHERE  " +
                                                "t1.id_origen_proyecto = ?", [id]);

    

    res.render('revit/configuracionProyecto', { informacion:informacion[0], req ,res, layout: 'template'});

    
});


router.post('/cargaCriterio', isLoggedIn, async (req, res) => {

    const {id,tipo} = req.body;

    
    let origen =  await pool.query("SELECT * FROM rvt_origen_proyecto as t1 where t1.id_origen_proyecto =  ? ",[id]); // pasar esto a dinamico 
    let codigo = origen[0].annio + "_" + origen[0].code;
    let fierros = await pool.query("SELECT * FROM rvt_fierros as t1 where t1.id_origen =  ? order by t1.mm asc",[origen[0].id_origen]); // pasar esto a dinamico 

    let tipoObjetos = await pool.query("SELECT * FROM rvt_tipo_objeto ");

    switch(tipo)
    {
        case 1: // Empalmes 
        case "1":
            res.render('revit/empalmes', { id, tipoObjetos, req ,res, layout: 'blanco'});

        break;

        case 2: // Emapalme Malla 
        case "2":
            // Mallas Cargadas 
            let empalmeMallasCargadas =  await pool.query("SELECT * FROM rvt_cfg_empalme_malla_proyecto as t1 where t1.codigo_proyecto =  ? ",[codigo]);
            res.render('revit/empalmesMallas', { empalmeMallasCargadas, codigo,fierros, id,  req ,res, layout: 'blanco'});
        break;

        case 3: // Anclajes
        case "3": 
            res.render('revit/anclajes', {  tipoObjetos,id, req ,res, layout: 'blanco'});
        break;

        case 4:
        case "4":// Empotramiento
            res.render('revit/empotramientos', { id, tipoObjetos, req ,res, layout: 'blanco'});
        break;

        case 5: // Patas
        case "5": 
            
        let infoFierros = await pool.query( " SELECT * " +
                                            "  FROM " +
                                                    " rvt_fierros AS t1 " +
                                                    " LEFT JOIN rvt_cfg_largo_patas_detalle AS t2 ON t2.id_cfg_largo_patas = (SELECT t3.id_configuracion_largo_patas " +
                                                " FROM " +
                                                " rvt_cfg_largo_patas AS t3 " +
                                                " WHERE " +
                                                        " t3.estado = 'SI' " +
                                                " AND  " +
                                                        " t3.codigo_proyecto = ? )  " +
                                                        " AND t1.id_fierros = t2.id_fierro " +
                                                " WHERE  " +
                                                    "t1.id_origen = ?", [codigo, origen[0].id_origen]);

            res.render('revit/Patas', {  infoFierros, origen:origen[0].id_origen, codigo,id, req ,res, layout: 'blanco'});
        break;

        case 6:
        case "6":// Laterales 
            let laterales = await pool.query(" SELECT * " +
                                             " FROM  " +
                                                    "    rvt_cfg_laterales AS t1, " +
                                                    "    rvt_cfg_laterales_info AS t2 " +
                                             " WHERE  " +
                                                    " t1.codigo_proyecto = ?" +
                                             " AND  " +
                                                    " t1.estado = 'SI' " +
                                             " AND  " +
                                                    " t1.id_cfg_laterales = t2.id_configuracion_empalme",[codigo]);

            //console.log(laterales.length);
            let mensaje = "";
            let opcion = "Actualizar";
            if (laterales.length == 0 )
            {
                // no existen laterales condigurados. 
                laterales = await pool.query(" SELECT * " +
                                            " FROM  " +
                                                "    rvt_cfg_laterales AS t1, " +
                                                "    rvt_cfg_laterales_info AS t2 " +
                                            " WHERE  " +
                                                " t1.codigo_proyecto = ?" +
                                            " AND  " +
                                                " t1.estado = 'DEF' " +
                                            " AND  " +
                                                " t1.id_cfg_laterales = t2.id_configuracion_empalme",["GENERICOCL"]);

                mensaje = "Informacion por defecto";
                opcion = "Ingresar";
            }

            res.render('revit/laterales', {opcion, codigo,  mensaje, laterales,  req ,res, layout: 'blanco'});

        break;

        case 7:
        case "7": //Largos Fe
            res.render('revit/largoFe', {  tipoObjetos,id, req ,res, layout: 'blanco'});
        break;

    }

    //res.send("asdadsa");

});

//cargaOpcionesEmpalme
router.post('/cargaOpcionesEmpalme', isLoggedIn, async (req, res) => {

    const {idCodigo,  opt } = req.body;

    
    //
    let infoOrigen = await pool.query("SELECT * FROM rvt_origen_proyecto as t1 WHERE t1.id_origen_proyecto = ? ", [idCodigo]);

    let origen = infoOrigen[0].id_origen;

    let opcionesDefecto = await pool.query("SELECT * FROM rvt_opcion_tipo as t1 WHERE t1.id_origen = ? AND t1.id_tipo_objeto = ?" , [origen,opt])

    let codigo = infoOrigen[0].annio + "_" + infoOrigen[0].code;
    //codigo = "2022_04"; // estatico para que muestre informacion

    let opcionesCargadas = await pool.query("SELECT * FROM rvt_cfg_empalme as t1 WHERE t1.codigo_proyecto = ? AND t1.id_tipo_objeto = ? ", [codigo,opt]); 

    res.render('revit/optDefectoCargadas', { idCodigo, codigo, opt, opcionesDefecto,opcionesCargadas,  req ,res, layout: 'blanco'});
   

});

router.post('/cargaOpcionesEmpalmeTabla', isLoggedIn, async (req, res) => {

    const { tipo,  idCargada , codigo} = req.body;

    let infoOpcionTipo = await pool.query("SELECT * FROM rvt_opcion_tipo as t1 WHERE t1.id_opcion = ? ", [idCargada]);

    let hormigones = await pool.query("SELECT * FROM rvt_hormigon ");
    let fierros = await pool.query("SELECT * FROM rvt_fierros as t1 where t1.id_origen =  ? order by t1.mm asc",[infoOpcionTipo[0].id_origen]);

    let informacion = await pool.query("SELECT * FROM rvt_opcion_tipo_valor as t1 where t1.id_opcion_tipo = ? ", [idCargada]);


    switch(infoOpcionTipo[0].id_origen)
    {
        case 1:
        case "1":

            let infoHormigonfierro = [];
            let cabecera = {
                hormigon : "Hormigon",
                opt_1 : "Ø8",
                opt_2 : "Ø10",
                opt_3 : "Ø12",
                opt_4 : "Ø16",
                opt_5 : "Ø18",
                opt_6 : "Ø22",
                opt_7 : "Ø25",
                opt_8 : "Ø28",
                opt_9 : "Ø32",
                opt_10 : "Ø36"

            };
            
            //infoHormigonfierro.push(cabecera);    

            hormigones.forEach(element => {
                let info = {
                    hormigon : element.descripcion,
                    hormigon_id : element.id_hormigon,
                    opt_k1 : fierros[0].id_fierros,
                    opt_k1v : buscaValorDefecto(informacion, element.id_hormigon,fierros[0].id_fierros),
                    opt_k2 : fierros[1].id_fierros,
                    opt_k2v : buscaValorDefecto(informacion, element.id_hormigon,fierros[1].id_fierros),
                    opt_k3 : fierros[2].id_fierros,
                    opt_k3v : buscaValorDefecto(informacion, element.id_hormigon,fierros[2].id_fierros),
                    opt_k4 : fierros[3].id_fierros,
                    opt_k4v : buscaValorDefecto(informacion, element.id_hormigon,fierros[3].id_fierros),
                    opt_k5 : fierros[4].id_fierros,
                    opt_k5v : buscaValorDefecto(informacion, element.id_hormigon,fierros[4].id_fierros),
                    opt_k6 : fierros[5].id_fierros,
                    opt_k6v : buscaValorDefecto(informacion, element.id_hormigon,fierros[5].id_fierros),
                    opt_k7 : fierros[6].id_fierros,
                    opt_k7v : buscaValorDefecto(informacion, element.id_hormigon,fierros[6].id_fierros),
                    opt_k8 : fierros[7].id_fierros,
                    opt_k8v : buscaValorDefecto(informacion, element.id_hormigon,fierros[7].id_fierros),
                    opt_k9 : fierros[8].id_fierros,
                    opt_k9v : buscaValorDefecto(informacion, element.id_hormigon,fierros[8].id_fierros),
                    opt_k10 : fierros[9].id_fierros,
                    opt_k10v : buscaValorDefecto(informacion, element.id_hormigon,fierros[9].id_fierros),
                };

                infoHormigonfierro.push(info);    
            });

            res.render('revit/tablaIngresoCL', { codigo, tipo , cabecera, hormigones,infoHormigonfierro, req ,res, layout: 'blanco'});
        break;
        case 2:
        case "2":
        break;
    }

});


router.post('/cargaOpcionesEmpalmeTablaIngresada', isLoggedIn, async (req, res) => {

    const { tipo,  idCargada , codigo , idCodigo}  = req.body;

    let infoOpcionTipo = await pool.query("SELECT * FROM rvt_origen_proyecto as t1 WHERE t1.id_origen_proyecto = ? ", [idCodigo]);

    let hormigones = await pool.query("SELECT * FROM rvt_hormigon ");
    let fierros = await pool.query("SELECT * FROM rvt_fierros as t1 where t1.id_origen =  ? order by t1.mm asc",[infoOpcionTipo[0].id_origen]);

    let informacion = await pool.query("SELECT * FROM rvt_cfg_empalme_proyecto as t1 where t1.id_configuracion_empalme = ? ", [idCargada]);


    switch(infoOpcionTipo[0].id_origen)
    {
        case 1:
        case "1":

            let infoHormigonfierro = [];
            let cabecera = {
                hormigon : "Hormigon",
                opt_1 : "Ø8",
                opt_2 : "Ø10",
                opt_3 : "Ø12",
                opt_4 : "Ø16",
                opt_5 : "Ø18",
                opt_6 : "Ø22",
                opt_7 : "Ø25",
                opt_8 : "Ø28",
                opt_9 : "Ø32",
                opt_10 : "Ø36"

            };
            
            //infoHormigonfierro.push(cabecera);    

            hormigones.forEach(element => {
                let info = {
                    hormigon : element.descripcion,
                    hormigon_id : element.id_hormigon,
                    opt_k1 : fierros[0].id_fierros,
                    opt_k1v : buscaValorDefecto(informacion, element.id_hormigon,fierros[0].id_fierros),
                    opt_k2 : fierros[1].id_fierros,
                    opt_k2v : buscaValorDefecto(informacion, element.id_hormigon,fierros[1].id_fierros),
                    opt_k3 : fierros[2].id_fierros,
                    opt_k3v : buscaValorDefecto(informacion, element.id_hormigon,fierros[2].id_fierros),
                    opt_k4 : fierros[3].id_fierros,
                    opt_k4v : buscaValorDefecto(informacion, element.id_hormigon,fierros[3].id_fierros),
                    opt_k5 : fierros[4].id_fierros,
                    opt_k5v : buscaValorDefecto(informacion, element.id_hormigon,fierros[4].id_fierros),
                    opt_k6 : fierros[5].id_fierros,
                    opt_k6v : buscaValorDefecto(informacion, element.id_hormigon,fierros[5].id_fierros),
                    opt_k7 : fierros[6].id_fierros,
                    opt_k7v : buscaValorDefecto(informacion, element.id_hormigon,fierros[6].id_fierros),
                    opt_k8 : fierros[7].id_fierros,
                    opt_k8v : buscaValorDefecto(informacion, element.id_hormigon,fierros[7].id_fierros),
                    opt_k9 : fierros[8].id_fierros,
                    opt_k9v : buscaValorDefecto(informacion, element.id_hormigon,fierros[8].id_fierros),
                    opt_k10 : fierros[9].id_fierros,
                    opt_k10v : buscaValorDefecto(informacion, element.id_hormigon,fierros[9].id_fierros),
                };

                infoHormigonfierro.push(info);    
            });


            res.render('revit/tablaIngresoCL', { codigo, tipo , cabecera, hormigones,infoHormigonfierro, req ,res, layout: 'blanco'});
        break;
        case 2:
        case "2":
        break;
    }

});
//cargaOpcionesEmpalmeTablaDatos
router.post('/cargaOpcionesEmpalmeTablaDatos', isLoggedIn, async (req, res) => {

    const { codigo,  tipo ,nombre , infoData} = req.body;


    let registro = {
        login : req.user.login,
        fecha_ingreso : new Date(),
        estado : "SI",
        esPredeterminada : "NO",
        codigo_proyecto : codigo,
        id_tipo_objeto : tipo,
        descripcion : nombre

    }


    const insertCabecera = pool.query('INSERT INTO rvt_cfg_empalme  set ? ', [registro]);



    let data = JSON.parse(infoData);

    insertCabecera.then( function(rest) {

            let idInsertCabecera = rest.insertId;


            data.forEach(element => {
        
                if (element.id === "fnombre")
                {
                }
                else
                {
                   let informacion =   element.id.split("_");
        
                   let registroDato = {
                    id_configuracion_empalme :idInsertCabecera,
                    id_fierros :informacion[2],
                    id_hormigon :informacion[1],
                    valor : element.valor
                   }

                   const insertDato = pool.query('INSERT INTO rvt_cfg_empalme_proyecto  set ? ', [registroDato]);

                }
        
            });


    }

    );


    res.send("ok");

});

router.post('/cargaOpcionesEmpalmeMallaTablaDatos', isLoggedIn, async (req, res) => {

    const { codigo,  nombre , infoData} = req.body;

    let registro = {
        tipo_configuracion : 2,
        codigo_proyecto : codigo,
        nombre : nombre,
        esPredeterminada : "NO"
    }

    const insertCabecera = pool.query('INSERT INTO rvt_cfg_empalme_malla_proyecto  set ? ', [registro]);

    let data = JSON.parse(infoData);

    insertCabecera.then( function(rest) {

            let idInsertCabecera = rest.insertId;


            data.forEach(element => {
        
                console.log(element.id );
                if (element.id == "fnombre" || element.id == "veces" || element.id == "suma")
                {

                }
                else
                {
                    let informacion =   element.id.split("_");

                    let registroDato = {
                        id_empalme_malla :idInsertCabecera,
                        id_fierro :informacion[1],
                        valor : element.valor
                       }
    
                       const insertDato = pool.query('INSERT INTO rvt_cfg_empalme_malla_proyecto_detalle  set ? ', [registroDato]);

                }
        
            });


    }

    );

res.send("OK");
});

router.post('/verTablaMallaEmpalme', isLoggedIn, async (req, res) => {

    const { id } = req.body;

    let infoMallaEmpalme = await pool.query("  SELECT * " +
                                            " FROM " +
                                                     " rvt_cfg_empalme_malla_proyecto_detalle AS t1, " +
                                                     " rvt_fierros AS t2 " +
                                            " WHERE  " +
                                                     " t1.id_empalme_malla = ? "  +
                                            " AND  " +
                                                     " t1.id_fierro = t2.id_fierros " +
                                            " ORDER BY t2.mm ASC ", [id]);
    
   
    res.render('revit/tablaEmpalmeMalla', { infoMallaEmpalme, req ,res, layout: 'blanco'});
});

router.post('/cargaOpcionesAnclaje', isLoggedIn, async (req, res) => {

    const {idCodigo,  opt } = req.body;

        //
        let infoOrigen = await pool.query("SELECT * FROM rvt_origen_proyecto as t1 WHERE t1.id_origen_proyecto = ? ", [idCodigo]);
        let origen = infoOrigen[0].id_origen;
        let codigo = infoOrigen[0].annio + "_" + infoOrigen[0].code;



        

        let infoFierros = await pool.query( " SELECT * " +
                                            " FROM " +
                                                " rvt_fierros AS t1 " +
                                                " LEFT JOIN rvt_cfg_largo_anclaje_detalle AS t2 ON t2.id_configuracion_largo_anclaje = (SELECT t3.id_configuracion_largo_anclaje "+
                                            " FROM " +
                                            " rvt_cfg_largo_anclaje AS t3 " +
                                            " WHERE " +
                                                    " t3.estado = 'SI' " +
                                            " AND  " +
                                                    " t3.codigo_proyecto = ?"+
                                            " AND  " +
		                                            " t3.id_tipo_objeto = ? )"+
                                            "  AND t1.id_fierros = t2.id_fierro " +
                                            " WHERE  "  +
                                                " t1.id_origen = ?", [codigo, opt, origen]);

        

        /*
        let infoFierros = await pool.query( " SELECT * " +
                                                 " FROM " +
                                                            " rvt_fierros AS t1 " +
                                                 " WHERE " +
                                                            " t1.id_origen = ? ", [origen]);

        */
                                    


    
    res.render('revit/tablaFierros', { origen,  infoFierros, codigo,opt, req ,res, layout: 'blanco'});

});



router.post('/cargaOpcionesAnclajeTablaDatos', isLoggedIn, async (req, res) => {

    const { codigo,  nombre , infoData,ftipo , forigen} = req.body;

    let registro = {
        login : req.user.login,
        fecha_ingreso : new Date(),
        estado : "SI",
        codigo_proyecto : codigo,
        id_tipo_objeto : ftipo,
        id_origen_fierro : forigen
    }


    const updateCabecera = pool.query("UPDATE  rvt_cfg_largo_anclaje  set  estado = 'NO' WHERE  codigo_proyecto = ? ", [codigo]);

    const insertCabecera = pool.query('INSERT INTO rvt_cfg_largo_anclaje  set ? ', [registro]);

    let data = JSON.parse(infoData);

    insertCabecera.then( function(rest) {

            let idInsertCabecera = rest.insertId;


            data.forEach(element => {
        
                console.log(element.id );
                if (element.id == "fnombre" || element.id == "veces" || element.id == "suma")
                {

                }
                else
                {
                    let informacion =   element.id.split("_");

                    let registroDato = {
                        id_configuracion_largo_anclaje :idInsertCabecera,
                        id_fierro :informacion[1],
                        largo : element.valor
                       }
    
                       const insertDato = pool.query('INSERT INTO rvt_cfg_largo_anclaje_detalle  set ? ', [registroDato]);

                }
        
            });


    }

    );

res.send("OK");
});

//cargaOpcionesAnclajeTablaDatos

router.post('/cargaOpcionPatas', isLoggedIn, async (req, res) => {

    const { codigo, infoData, forigen} = req.body;

    let registro = {
        login : req.user.login,
        fecha_ingreso : new Date(),
        estado : "SI",
        codigo_proyecto : codigo
    }


    const updateCabecera = pool.query("UPDATE  rvt_cfg_largo_patas  set  estado = 'NO' WHERE  codigo_proyecto = ? ", [codigo]);

    const insertCabecera = pool.query('INSERT INTO rvt_cfg_largo_patas  set ? ', [registro]);

    let data = JSON.parse(infoData);

    insertCabecera.then( function(rest) {

            let idInsertCabecera = rest.insertId;


            data.forEach(element => {
        
                if (element.id == "fnombre" || element.id == "veces" || element.id == "suma")
                {

                }
                else
                {
                    let informacion =   element.id.split("_");

                    let registroDato = {
                        id_cfg_largo_patas :idInsertCabecera,
                        id_fierro :informacion[1],
                        largo : element.valor
                       }
    
                       const insertDato = pool.query('INSERT INTO rvt_cfg_largo_patas_detalle  set ? ', [registroDato]);

                }
        
            });


    }

    );

res.send("OK");
});

//Largo Fe


//cargaOpcionesLargoFe

router.post('/cargaOpcionesLargoFe', isLoggedIn, async (req, res) => {

    const {idCodigo,  opt } = req.body;

        //
        let infoOrigen = await pool.query("SELECT * FROM rvt_origen_proyecto as t1 WHERE t1.id_origen_proyecto = ? ", [idCodigo]);
        let origen = infoOrigen[0].id_origen;
        let codigo = infoOrigen[0].annio + "_" + infoOrigen[0].code;



        

        let infoFierros = await pool.query( " SELECT * " +
                                            " FROM " +
                                                " rvt_fierros AS t1 " +
                                                " LEFT JOIN rvt_cfg_largo_fierro_detalle AS t2 ON t2.id_configuracion_largo_fierro = (SELECT t3.id_configuracion_largo_fierro "+
                                            " FROM " +
                                            " rvt_cfg_largo_fierro AS t3 " +
                                            " WHERE " +
                                                    " t3.estado = 'SI' " +
                                            " AND  " +
                                                    " t3.codigo_proyecto = ?"+
                                            " AND  " +
		                                            " t3.id_tipo_objeto = ? )"+
                                            "  AND t1.id_fierros = t2.id_fierro " +
                                            " WHERE  "  +
                                                " t1.id_origen = ?", [codigo, opt, origen]);
                                    


    
    res.render('revit/tablaFierrosLargoFe', { origen,  infoFierros, codigo,opt, req ,res, layout: 'blanco'});

});


router.post('/cargaOpcionLargosFe', isLoggedIn, async (req, res) => {

    const { codigo, infoData, forigen, ftipo} = req.body;

    

    let registro = {
        login : req.user.login,
        fecha_ingreso : new Date(),
        estado : "SI",
        codigo_proyecto : codigo,
        id_tipo_objeto : ftipo,
        id_origen_fierro : forigen,
    }

    const updateCabecera = pool.query("UPDATE  rvt_cfg_largo_fierro  set  estado = 'NO' WHERE  codigo_proyecto = ? ", [codigo]);

    const insertCabecera = pool.query('INSERT INTO rvt_cfg_largo_fierro  set ? ', [registro]);

    let data = JSON.parse(infoData);


    insertCabecera.then( function(rest) {

        let idInsertCabecera = rest.insertId;

        data.forEach(element => {
            if (element.id == "fnombre" || element.id == "veces" || element.id == "suma")
            {

            }
            else
            {
                let informacion =   element.id.split("_");

                let registroDato = {
                    id_configuracion_largo_fierro :idInsertCabecera,
                    id_fierro :informacion[1],
                    largo : element.valor
                   }

                   const insertDato = pool.query('INSERT INTO rvt_cfg_largo_fierro_detalle  set ? ', [registroDato]);

            }
        });
    });

    res.send("OK");
});


router.post('/cargaOpcionesEmpotramiento', isLoggedIn, async (req, res) => {

    const {idCodigo,  opt } = req.body;

    
    //
    let infoOrigen = await pool.query("SELECT * FROM rvt_origen_proyecto as t1 WHERE t1.id_origen_proyecto = ? ", [idCodigo]);

    let origen = infoOrigen[0].id_origen;

    let opcionesDefecto = await pool.query("SELECT * FROM rvt_opcion_tipo_empotramiento as t1 WHERE t1.id_origen = ? AND t1.id_tipo_objeto = ?" , [origen,opt])

    let codigo = infoOrigen[0].annio + "_" + infoOrigen[0].code;
    //codigo = "2022_04"; // estatico para que muestre informacion

    let opcionesCargadas = await pool.query("SELECT * FROM rvt_cfg_empotramiento as t1 WHERE t1.codigo_proyecto = ? AND t1.id_tipo_objeto = ? ", [codigo,opt]); 

    res.render('revit/optDefectoCargadasEmpotramiento', { idCodigo, codigo, opt, opcionesDefecto,opcionesCargadas,  req ,res, layout: 'blanco'});
   

});


router.post('/cargaOpcionesEmpalmeTablaEmpotramiento', isLoggedIn, async (req, res) => {

    const { tipo,  idCargada , codigo} = req.body;

    let infoOpcionTipo = await pool.query("SELECT * FROM rvt_opcion_tipo_empotramiento as t1 WHERE t1.id_opcion = ? ", [idCargada]);

    let hormigones = await pool.query("SELECT * FROM rvt_hormigon ");

    let fierros = await pool.query("SELECT * FROM rvt_fierros as t1 where t1.id_origen =  ? order by t1.mm asc",[infoOpcionTipo[0].id_origen]);

    let informacion = await pool.query("SELECT * FROM rvt_opcion_tipo_valor_empotramiento as t1 where t1.id_opcion_tipo = ? ", [idCargada]);


    switch(infoOpcionTipo[0].id_origen)
    {
        case 1:
        case "1":

            let infoHormigonfierro = [];
            let cabecera = {
                hormigon : "Hormigon",
                opt_1 : "Ø8",
                opt_2 : "Ø10",
                opt_3 : "Ø12",
                opt_4 : "Ø16",
                opt_5 : "Ø18",
                opt_6 : "Ø22",
                opt_7 : "Ø25",
                opt_8 : "Ø28",
                opt_9 : "Ø32",
                opt_10 : "Ø36"

            };
            
            //infoHormigonfierro.push(cabecera);    

            hormigones.forEach(element => {
                let info = {
                    hormigon : element.descripcion,
                    hormigon_id : element.id_hormigon,
                    opt_k1 : fierros[0].id_fierros,
                    opt_k1v : buscaValorDefecto(informacion, element.id_hormigon,fierros[0].id_fierros),
                    opt_k2 : fierros[1].id_fierros,
                    opt_k2v : buscaValorDefecto(informacion, element.id_hormigon,fierros[1].id_fierros),
                    opt_k3 : fierros[2].id_fierros,
                    opt_k3v : buscaValorDefecto(informacion, element.id_hormigon,fierros[2].id_fierros),
                    opt_k4 : fierros[3].id_fierros,
                    opt_k4v : buscaValorDefecto(informacion, element.id_hormigon,fierros[3].id_fierros),
                    opt_k5 : fierros[4].id_fierros,
                    opt_k5v : buscaValorDefecto(informacion, element.id_hormigon,fierros[4].id_fierros),
                    opt_k6 : fierros[5].id_fierros,
                    opt_k6v : buscaValorDefecto(informacion, element.id_hormigon,fierros[5].id_fierros),
                    opt_k7 : fierros[6].id_fierros,
                    opt_k7v : buscaValorDefecto(informacion, element.id_hormigon,fierros[6].id_fierros),
                    opt_k8 : fierros[7].id_fierros,
                    opt_k8v : buscaValorDefecto(informacion, element.id_hormigon,fierros[7].id_fierros),
                    opt_k9 : fierros[8].id_fierros,
                    opt_k9v : buscaValorDefecto(informacion, element.id_hormigon,fierros[8].id_fierros),
                    opt_k10 : fierros[9].id_fierros,
                    opt_k10v : buscaValorDefecto(informacion, element.id_hormigon,fierros[9].id_fierros),
                };

                infoHormigonfierro.push(info);    
            });

            res.render('revit/tablaIngresoEmpoCL', { codigo, tipo , cabecera, hormigones,infoHormigonfierro, req ,res, layout: 'blanco'});
        break;
        case 2:
        case "2":
        break;
    }

});

//cargaOpcionesEmpotramientoTablaDatos

router.post('/cargaOpcionesEmpotramientoTablaDatos', isLoggedIn, async (req, res) => {

    const { codigo,  tipo ,nombre , infoData} = req.body;


    let registro = {
        login : req.user.login,
        fecha_ingreso : new Date(),
        estado : "SI",
        esPredeterminada : "NO",
        codigo_proyecto : codigo,
        id_tipo_objeto : tipo,
        descripcion : nombre

    }


    const insertCabecera = pool.query('INSERT INTO rvt_cfg_empotramiento  set ? ', [registro]);



    let data = JSON.parse(infoData);

    insertCabecera.then( function(rest) {

            let idInsertCabecera = rest.insertId;


            data.forEach(element => {
        
                if (element.id === "fnombre")
                {
                }
                else
                {
                   let informacion =   element.id.split("_");
        
                   let registroDato = {
                    id_configuracion_empotramiento :idInsertCabecera,
                    id_fierros :informacion[2],
                    id_hormigon :informacion[1],
                    valor : element.valor
                   }

                   const insertDato = pool.query('INSERT INTO rvt_cfg_empotramiento_proyecto  set ? ', [registroDato]);

                }
        
            });


    }

    );


    res.send("ok");

});

//cargaOpcionesEmpotramientoTablaIngresada
router.post('/cargaOpcionesEmpotramientoTablaIngresada', isLoggedIn, async (req, res) => {

    const { tipo,  idCargada , codigo , idCodigo}  = req.body;

    let infoOpcionTipo = await pool.query("SELECT * FROM rvt_origen_proyecto as t1 WHERE t1.id_origen_proyecto = ? ", [idCodigo]);

    let hormigones = await pool.query("SELECT * FROM rvt_hormigon ");
    let fierros = await pool.query("SELECT * FROM rvt_fierros as t1 where t1.id_origen =  ? order by t1.mm asc",[infoOpcionTipo[0].id_origen]);

    let informacion = await pool.query("SELECT * FROM rvt_cfg_empotramiento_proyecto as t1 where t1.id_configuracion_empotramiento = ? ", [idCargada]);


    switch(infoOpcionTipo[0].id_origen)
    {
        case 1:
        case "1":

            let infoHormigonfierro = [];
            let cabecera = {
                hormigon : "Hormigon",
                opt_1 : "Ø8",
                opt_2 : "Ø10",
                opt_3 : "Ø12",
                opt_4 : "Ø16",
                opt_5 : "Ø18",
                opt_6 : "Ø22",
                opt_7 : "Ø25",
                opt_8 : "Ø28",
                opt_9 : "Ø32",
                opt_10 : "Ø36"

            };
            
            //infoHormigonfierro.push(cabecera);    

            hormigones.forEach(element => {
                let info = {
                    hormigon : element.descripcion,
                    hormigon_id : element.id_hormigon,
                    opt_k1 : fierros[0].id_fierros,
                    opt_k1v : buscaValorDefecto(informacion, element.id_hormigon,fierros[0].id_fierros),
                    opt_k2 : fierros[1].id_fierros,
                    opt_k2v : buscaValorDefecto(informacion, element.id_hormigon,fierros[1].id_fierros),
                    opt_k3 : fierros[2].id_fierros,
                    opt_k3v : buscaValorDefecto(informacion, element.id_hormigon,fierros[2].id_fierros),
                    opt_k4 : fierros[3].id_fierros,
                    opt_k4v : buscaValorDefecto(informacion, element.id_hormigon,fierros[3].id_fierros),
                    opt_k5 : fierros[4].id_fierros,
                    opt_k5v : buscaValorDefecto(informacion, element.id_hormigon,fierros[4].id_fierros),
                    opt_k6 : fierros[5].id_fierros,
                    opt_k6v : buscaValorDefecto(informacion, element.id_hormigon,fierros[5].id_fierros),
                    opt_k7 : fierros[6].id_fierros,
                    opt_k7v : buscaValorDefecto(informacion, element.id_hormigon,fierros[6].id_fierros),
                    opt_k8 : fierros[7].id_fierros,
                    opt_k8v : buscaValorDefecto(informacion, element.id_hormigon,fierros[7].id_fierros),
                    opt_k9 : fierros[8].id_fierros,
                    opt_k9v : buscaValorDefecto(informacion, element.id_hormigon,fierros[8].id_fierros),
                    opt_k10 : fierros[9].id_fierros,
                    opt_k10v : buscaValorDefecto(informacion, element.id_hormigon,fierros[9].id_fierros),
                };

                infoHormigonfierro.push(info);    
            });


            res.render('revit/tablaIngresoEmpoCL', { codigo, tipo , cabecera, hormigones,infoHormigonfierro, req ,res, layout: 'blanco'});
            
        break;
        case 2:
        case "2":
        break;
    }

});

//cargaInformacionLaterales
router.post('/cargaInformacionLaterales', isLoggedIn, async (req, res) => {

    const { codigo,  tipo ,nombre , infoData} = req.body;

    let data = JSON.parse(infoData);    

    let registros= [];

    data.forEach(element => {

        let informacion =   element.id.split("_");

        console.log(informacion[1]);

        const containsKey = !!registros.find(dato => {return dato.id === informacion[1]});

        if (containsKey ===false)
        {
            registros.push({
                id :informacion[1],
                ai : "",
                af : "",
                nl : "",
                dt : ""
                });
        }

        // 

        let editRegistro = registros.find(dato => {return dato.id === informacion[1] });

        switch(informacion[0])
        {
            case "ai":
                editRegistro.ai = element.valor;
            break;
            case "af":
                editRegistro.af = element.valor;
            break;
            case "nl":
                editRegistro.nl = element.valor;
            break;
            case "dt":
                editRegistro.dt = element.valor;
            break;
        }

    });


    



    const updateCabecera = pool.query("UPDATE  rvt_cfg_laterales  set  estado = 'NO' WHERE  codigo_proyecto = ? ", [codigo]);

    let registro = {
        login : req.user.login,
        fecha_ingreso : new Date(),
        estado : "SI",
        codigo_proyecto : codigo
    };

    const insertCabecera = pool.query('INSERT INTO rvt_cfg_laterales  set ? ', [registro]);

    let idInsertCabecera = 0;

    insertCabecera.then( function(rest) {

        idInsertCabecera = rest.insertId;

       registros.forEach( element => {
            //rvt_cfg_laterales_info 
            let dato = {
                id_configuracion_empalme : idInsertCabecera,
                altura_inicial : element.ai,
                altura_final : element.af,
                num_laterales : element.nl,
                distancia : element.dt
            };

            const datoCabecera = pool.query('INSERT INTO rvt_cfg_laterales_info  set ? ', [dato]);

        }
       );

    });


    const upt = pool.query("UPDATE  rvt_cfg_laterales  set  estado = 'SI' WHERE  id_cfg_laterales = ? ", [idInsertCabecera]);

    //console.log(registros);

    res.send("OK");

});



function buscaValorDefecto(informacion , id_hormigon, id_fierro)
{
    let v = 0;

    informacion.forEach(element => {
        
        if (element.id_hormigon ==id_hormigon && element.id_fierros ==  id_fierro)
        {
            v = element.valor;
        }

    });
 
    return v;
}


module.exports = router;