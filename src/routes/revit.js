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

            //console.log(fields);
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
        //console.log(informacionCarperta);

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
        //console.log(informacionCarperta);

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

        //console.log(licencias);

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

    //console.log(respuesta);

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

    //console.log(infoUsuario);

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
               // console.log(aps);
              // let info =[];
              // info.revit = rev.version;

               
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

      // console.log(permisos);
       // sys_usuario_revit_permisos
       let permisosActuales = await pool.query("SELECT * FROM sys_usuario_revit_permisos as t1 WHERE t1.idUsuario = ? ", [id]);

       //console.log(permisosActuales);


       permisos.forEach(permisos => {
        permisosActuales.forEach(actuales => {
                    if (permisos.id_usuario == actuales.idUsuario && permisos.id == actuales.id_tab_Button && permisos.id_revit == actuales.id_revit)
                    {
                        permisos.estado = "checked";
                    }
            });
       });


      // console.log(permisos);


    res.render('revit/permisos', { infoUsuario:infoUsuario[0], permisos, req ,res, layout: 'template'});

});

///DescargarRutina
router.get('/DescargarRutina/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;

    let rutina = await pool.query('SELECT * FROM sist_revit WHERE id_revit = ? ;', [id]);
    let nombre = rutina[0].version + ".rar";
    let informacionDownload =  downloadRarFile(id);

    informacionDownload.then((informacion)=>{

        //console.log(nombreArchivo);

             res.setHeader('Content-Type', 'application/zip');
             res.setHeader('Content-Disposition', 'inline;filename='+nombre+''); 
             
             var file = fs.createReadStream(''+nombre+'');
             var stat = fs.statSync(''+nombre+'');
             res.setHeader('Content-Length', stat.size);
             res.setHeader('Content-Type', 'application/zip');
             res.setHeader('Content-Disposition', 'attachment; filename='+nombre+'');
            file.pipe(res);


});


    //console.log(rutina);
});
router.get('/DescargarLicencia/:id', isLoggedIn, async (req, res) => {

    const { id } = req.params;

    let licencia = await pool.query('SELECT * FROM sys_usuario_licencias_revit WHERE id = ? ;', [id]);

    //console.log(licencia);
    let informacionDownload =  downloadJsonFile(id);

    informacionDownload.then((informacion)=>{

        //console.log(nombreArchivo);

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
    
             console.log("AQUI 1");
             await client.cd("licencias/"+ idUsuario.toString()  + "/");
             console.log("AQUI 2");
             let name = nombreServidor + ".json";
             await client.uploadFrom(nombreArchivoServidor, name); // esto tiene que ser dinamico. 
             console.log("AQUI 3");
            estado = true;
        }
        catch(err) {
            console.log("EEOOOOOOOOOOOOOORRRR cargaDocumentoServidorContrato");
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
        //console.log('An error has occurred ', error);
        mensajeria.MensajerErroresDBENITES("crearLicencia 349")
        return - 1;
      }
      //console.log('Data written successfully to disk');
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
            console.log("ERROR ====> " + err +  "checkYearFolder")
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
        
      //  console.log(permiso.id_revit);

        let registro = {
            idUsuario : id_usuario,
            id_tab_Button : permiso.id,
            id_revit : permiso.id_revit
        };

        const cargaDocumento = pool.query('INSERT INTO sys_usuario_revit_permisos  set ? ', [registro]);

       // console.log(registro);

    });

    res.send("OK");
});


module.exports = router;