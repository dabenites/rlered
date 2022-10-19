const express = require('express');
const router = express.Router();
const pool = require('../database');
var dateFormat = require('dateformat');
var url = require('url');

const { writeFile } = require('fs');
const ftp = require("basic-ftp");

const { isLoggedIn } = require('../lib/auth');


router.get('/licencias', isLoggedIn, async (req, res) => {

    try {

        // ir a buscar las licencias nombre del servidor. 

        let sql = "SELECT "+
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

    console.log(respuesta);

    res.send(respuesta);

});

//crearLicencia
// verificoLicencia
router.post('/crearLicencia', isLoggedIn, async (req, res) => {

    const { email, hdserial } = req.body;

    // lo primero que tenemos que registrar es la información. 

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
        //console.log("cargador correctamente en el servidor");
        // mover el archivo al servidor. 
        cargaDocumentoServidorContrato(nombreServidor,usuario[0].idUsuario );
    
    }

    res.send("respuesta");



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