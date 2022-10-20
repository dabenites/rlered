const express = require('express');
const router = express.Router();
const pool = require('../database');
var dateFormat = require('dateformat');
var url = require('url');

const { writeFile } = require('fs');
const ftp = require("basic-ftp");

const { isLoggedIn } = require('../lib/auth');
const fs = require('fs');


router.get('/licencias', isLoggedIn, async (req, res) => {

    try {

        // ir a buscar las licencias nombre del servidor. 

        let sql = "SELECT "+
                           " t1.id_usuario,"+
                           " t1.id,"+
                           " t1.email,"+
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

    res.send("ok");
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
                grupo : aps.grupo1,
                subgrupo : aps.grupo,
                aplicativo : aps.nombre,
                revit: rev.version,
                id_revit: rev.id_revit,
               });
               
              //permisos.push(info);

            });
       });

      // console.log(permisos);
       // sys_usuario_revit_permisos
       let permisosActuales = await pool.query("SELECT * FROM sys_usuario_revit_permisos as t1 WHERE t1.idUsuario = ? ", [id]);

       console.log(permisosActuales);

    res.render('revit/permisos', { infoUsuario:infoUsuario[0], permisos, req ,res, layout: 'template'});

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

//crearLicencia
// verificoLicencia
router.post('/crearLicencia', isLoggedIn, async (req, res) => {

    const { email, hdserial } = req.body;

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
        fecha_inicio : new Date()
      }


    const infoLicencia = await pool.query('INSERT INTO sys_usuario_licencias_revit  set ? ', [licencia]);

    if (crearLicencia(email, hdserial,nombreServidor))
    {
        // cargador correctamente.
        // console.log("cargador correctamente en el servidor");
        // mover el archivo al servidor. 
        cargaDocumentoServidorContrato(nombreServidor,usuario[0].idUsuario );
    
    }
    else
    {
        mensajeria.MensajerErroresDBENITES("Problema al generar la licencia");
    }

    res.send("respuesta");
    
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


module.exports = router;