const nodemailer = require("nodemailer");

const {google} = require("googleapis");

const CLIENTD_ID = "1096192584894-n9encon9n4e7ik1gf00jhibc0ita3pqs.apps.googleusercontent.com";
const CLIENTD_SECRET = "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";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN = "1//04twuXyG2R72LCgYIARAAGAQSNwF-L9IrjbhkRCc_UMyezv2L9ULgzv732TXvK3BYCs06HbzJAF9LDTYWC52rFY_huFgXnfxma8Y";


// async..await is not allowed in global scope, must use a wrapper
module.exports.EnvioMailSolicitudVacaciones =  async function (objeto) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing

const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
                                            CLIENTD_SECRET,
                                            REDIRECT_URI);

      oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});

      const accessToken = await oAuthClient.getAccessToken();
      const transporter = nodemailer.createTransport({
                        service : "gmail",
                        auth : {
                            type : "OAuth2",
                            user : "planner@renelagos.com",
                            clientId :CLIENTD_ID,
                            clientSecret : CLIENTD_SECRET,
                            refreshToken: REFRESH_TOKEN,
                            accessToken : accessToken,
                        },
                    });
    
       
    var infoDias = "";
           objeto.dias.forEach(element => {
                                    infoDias += " " + element.fecha + ", es medio dia  " + element.medioDia + "\n";
                                  });

       let  generico = "Estimado/a:\n" +
                        " \t Se ha generado una solicitud de aprobacion de vacaciones por " + objeto.solicitante + "\n" +
                        " Comentario : " + objeto.comentario + "\n";
                        " Dias  : \n";
            generico +=   infoDias;
            generico +=   " Saludos, \n"+
                        " RLE - Planner";

       const mailOptions = {
           from : "RLE - Planner <planner@renelagos.com>",
           to : objeto.to,
           subject : "RLE - Planner - Solicitud de vacaciones.",
           text : generico
       };

       const result = await transporter.sendMail(mailOptions);

}

module.exports.EnvioMailSolicitudPermiso =  async function (objeto) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
  
  const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
                                              CLIENTD_SECRET,
                                              REDIRECT_URI);
  
        oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});
  
        const accessToken = await oAuthClient.getAccessToken();
        const transporter = nodemailer.createTransport({
                          service : "gmail",
                          auth : {
                              type : "OAuth2",
                              user : "planner@renelagos.com",
                              clientId :CLIENTD_ID,
                              clientSecret : CLIENTD_SECRET,
                              refreshToken: REFRESH_TOKEN,
                              accessToken : accessToken,
                          },
                      });
  
         const generico = "Estimado/a:\n" +
                          " \t Se ha generado una solicitud de aprobacion de permiso por " + objeto.solicitante + "\n" +
                          " Comentario : " + objeto.comentario + "\n"+
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Solicitud de Permiso.",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }

module.exports.EnvioMailSolicitudVacacionesNotificar =  async function (objeto) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
  
  const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
                                              CLIENTD_SECRET,
                                              REDIRECT_URI);
  
        oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});
  
        const accessToken = await oAuthClient.getAccessToken();
        const transporter = nodemailer.createTransport({
                          service : "gmail",
                          auth : {
                              type : "OAuth2",
                              user : "planner@renelagos.com",
                              clientId :CLIENTD_ID,
                              clientSecret : CLIENTD_SECRET,
                              refreshToken: REFRESH_TOKEN,
                              accessToken : accessToken,
                          },
                      });
        
       

         let generico = "Estimado/a:\n" +
                          " \t Se informa que " + objeto.solicitante + " ha solicitado Vacaciones. \n" +
                          " Comentario : " + objeto.comentario + "\n"+
                          " Dias : \n";
                generico += " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Solicitud de vacaciones.",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }

module.exports.EnvioMailCreacionProyectoDocumentos =  async function (objeto) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
  
  const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
                                              CLIENTD_SECRET,
                                              REDIRECT_URI);
  
        oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});
  
        const accessToken = await oAuthClient.getAccessToken();
        const transporter = nodemailer.createTransport({
                          service : "gmail",
                          auth : {
                              type : "OAuth2",
                              user : "planner@renelagos.com",
                              clientId :CLIENTD_ID,
                              clientSecret : CLIENTD_SECRET,
                              refreshToken: REFRESH_TOKEN,
                              accessToken : accessToken,
                          },
                      });
  
         const generico = "Estimado/a:\n" +
                          " \t Se informa que se ha generado un proyecto nuevo en planner. \n" +
                          " Nombre : "+objeto.nombre +" \n"+
                          " Codigo : "+objeto.codigo +" \n"+
                          " Ingresado por : "+ objeto.ingresado +" \n"+
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Nuevo Proyecto.",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }

module.exports.EnvioMailCreacion= async function(objeto){
    const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
        CLIENTD_SECRET,
        REDIRECT_URI);

oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});

const accessToken = await oAuthClient.getAccessToken();
const transporter = nodemailer.createTransport({
service : "gmail",
auth : {
type : "OAuth2",
user : "planner@renelagos.com",
clientId :CLIENTD_ID,
clientSecret : CLIENTD_SECRET,
refreshToken: REFRESH_TOKEN,
accessToken : accessToken,
},
});

const generico = "Estimado/a:\n" +
" \t Ha generado un proyecto, Se ha informado a TI y Documentos para crear los permisos y carpetas correspondientes a las carpetas. Proyecto con código : \n" +
""+objeto.codigo +" \n"+
" Saludos, \n"+
" RLE - Planner";

const mailOptions = {
from : "RLE - Planner <planner@renelagos.com>",
to : objeto.to,
subject : "RLE - Planner - Nuevo Proyecto.",
text : generico
};

const result = await transporter.sendMail(mailOptions);
}

module.exports.EnvioMailCreacionProyectoTI =  async function (objeto) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
  
  const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
                                              CLIENTD_SECRET,
                                              REDIRECT_URI);
  
        oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});
  
        const accessToken = await oAuthClient.getAccessToken();
        const transporter = nodemailer.createTransport({
                          service : "gmail",
                          auth : {
                              type : "OAuth2",
                              user : "planner@renelagos.com",
                              clientId :CLIENTD_ID,
                              clientSecret : CLIENTD_SECRET,
                              refreshToken: REFRESH_TOKEN,
                              accessToken : accessToken,
                          },
                      });
  
         const generico = "Estimado/a:\n" +
                          " \t Se informa que se ha generado un proyecto nuevo en planner. \n" +
                          " Nombre : "+objeto.nombre +" \n"+
                          " Codigo : "+objeto.codigo +" \n"+
                          " Ingresado por : "+ objeto.ingresado +" \n"+
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Nuevo Proyecto.",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }

module.exports.EnvioMailHorasIngresoFinanzas =  async function (objeto) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
  
  const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
                                              CLIENTD_SECRET,
                                              REDIRECT_URI);
  
        oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});
  
        const accessToken = await oAuthClient.getAccessToken();
        const transporter = nodemailer.createTransport({
                          service : "gmail",
                          auth : {
                              type : "OAuth2",
                              user : "planner@renelagos.com",
                              clientId :CLIENTD_ID,
                              clientSecret : CLIENTD_SECRET,
                              refreshToken: REFRESH_TOKEN,
                              accessToken : accessToken,
                          },
                      });
  
         const generico = "Estimado/a:\n" +
                          " \t Solicitud de horas extras en el proyecto "+ objeto.proyecto +", ingresado por "+ objeto.solicitante+" \n" +
                          " Comentario : "+objeto.comentario +" \n"+
                          " asignadas : "+objeto.realizada +" \n"+
                          " Nº HH : "+objeto.numhh +" \n"+
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Horas Extras.",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }

module.exports.EnvioMailHorasRespuesta =  async function (objeto) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
  
  const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
                                              CLIENTD_SECRET,
                                              REDIRECT_URI);
  
        oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});
  
        const accessToken = await oAuthClient.getAccessToken();
        const transporter = nodemailer.createTransport({
                          service : "gmail",
                          auth : {
                              type : "OAuth2",
                              user : "planner@renelagos.com",
                              clientId :CLIENTD_ID,
                              clientSecret : CLIENTD_SECRET,
                              refreshToken: REFRESH_TOKEN,
                              accessToken : accessToken,
                          },
                      });
  
         const generico = "Estimado/a:\n" +
                          " \t Solicitud de horas extras en el proyecto "+ objeto.proyecto +", asignadas ha : "+ objeto.solicitante+" ha sido procesada. \n" +
                          " Estado : "+objeto.estado +" \n"+
                          " Comentario : "+objeto.comentario +" \n"+
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Horas Extras.",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }

module.exports.EnvioMailHorasRespuestaAsignado =  async function (objeto) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
  
  const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
                                              CLIENTD_SECRET,
                                              REDIRECT_URI);
  
        oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});
  
        const accessToken = await oAuthClient.getAccessToken();
        const transporter = nodemailer.createTransport({
                          service : "gmail",
                          auth : {
                              type : "OAuth2",
                              user : "planner@renelagos.com",
                              clientId :CLIENTD_ID,
                              clientSecret : CLIENTD_SECRET,
                              refreshToken: REFRESH_TOKEN,
                              accessToken : accessToken,
                          },
                      });
  
         const generico = "Estimado/a:\n" +
                          " \t Solicitud de horas extras en el proyecto "+ objeto.proyecto +", han sido aprobadas. Numero de horas : "+ objeto.numhh +" \n" +
                          " Comentario : "+objeto.comentario +" \n"+
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Horas Extras.",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }


module.exports.EnvioMailIngresoFactura =  async function (objeto) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
  
  const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
                                              CLIENTD_SECRET,
                                              REDIRECT_URI);
  
        oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});
  
        const accessToken = await oAuthClient.getAccessToken();
        const transporter = nodemailer.createTransport({
                          service : "gmail",
                          auth : {
                              type : "OAuth2",
                              user : "planner@renelagos.com",
                              clientId :CLIENTD_ID,
                              clientSecret : CLIENTD_SECRET,
                              refreshToken: REFRESH_TOKEN,
                              accessToken : accessToken,
                          },
                      });
  
         const generico = "Estimado/a:\n" +
                          " \t Solicitud de facturación "+ objeto.proyecto +", ingresado por "+ objeto.solicitante+" \n" +
                          " Moneda : "+objeto.nomMoneda +" \n"+
                          " Monto : "+objeto.monto +" \n"+
                          " Comentario : "+objeto.comentario +" \n"+
                          " Director Proyecto : "+objeto.director +" \n"+
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Ingreso Facturación.",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }

module.exports.EnvioMailIngresoPloter =  async function (objeto) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
  
  const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
                                              CLIENTD_SECRET,
                                              REDIRECT_URI);
  
        oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});
  
        const accessToken = await oAuthClient.getAccessToken();
        const transporter = nodemailer.createTransport({
                          service : "gmail",
                          auth : {
                              type : "OAuth2",
                              user : "planner@renelagos.com",
                              clientId :CLIENTD_ID,
                              clientSecret : CLIENTD_SECRET,
                              refreshToken: REFRESH_TOKEN,
                              accessToken : accessToken,
                          },
                      });
  
         const generico = "Estimado/a:\n" +
                          " \t Solicitud de ploteo en el proyecto :  "+ objeto.proyecto +", ingresado por "+ objeto.solicitante+" \n" +
                          " Destinatario  : "+objeto.destinario +" \n"+
                          " Trabajo  : "+objeto.trabajo +" \n"+
                          " Impresión : "+objeto.impresion +" \n"+
                          " Ruta : "+objeto.ruta +" \n"+
                          " Fecha Entrega : "+objeto.fecha_entrega +" \n"+
                          " Fecha Solicitud : "+objeto.fecha_solicitud +" \n"+
                          " Comentario : "+objeto.comentario +" \n"+
                          " Serie : "+objeto.serie +" \n"+
                          " Serie Especial : "+objeto.serieespecial +" \n"+
                          " Escala : "+objeto.escala +" \n"+
                          " Nº Impresion : "+objeto.nimpresion +" \n"+
                          " Nº Copias : "+objeto.ncopias +" \n"+
                          " Formato Papel : "+objeto.formatoPapel +" \n"+
                          " Formato Entrega : "+objeto.formatoEntrega +" \n\n"+

                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Solicitud Ploteo.",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }

module.exports.EnvioMailSolicitudCostoExterno =  async function (objeto) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
  
  const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
                                              CLIENTD_SECRET,
                                              REDIRECT_URI);
  
        oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});
  
        const accessToken = await oAuthClient.getAccessToken();
        const transporter = nodemailer.createTransport({
                          service : "gmail",
                          auth : {
                              type : "OAuth2",
                              user : "planner@renelagos.com",
                              clientId :CLIENTD_ID,
                              clientSecret : CLIENTD_SECRET,
                              refreshToken: REFRESH_TOKEN,
                              accessToken : accessToken,
                          },
                      });
  
         const generico = "Estimado/a:\n" +
                          " \t Solicitud de aprobacion costo externo en el proyecto :  "+ objeto.proyecto +", ingresado por "+ objeto.solicitante+" \n" +
                          " Proveedor  : "+objeto.proveedor +" \n"+
                          " Nº Orden Compra : "+objeto.orden +" \n"+
                          " Descripcion : "+objeto.descripcion +" \n"+
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Solicitud Aprobación Costo Externo.",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }

module.exports.EnviaAvisoTerminoPloteo =  async function (objeto) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
  
  const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
                                              CLIENTD_SECRET,
                                              REDIRECT_URI);
  
        oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});
  
        const accessToken = await oAuthClient.getAccessToken();
        const transporter = nodemailer.createTransport({
                          service : "gmail",
                          auth : {
                              type : "OAuth2",
                              user : "planner@renelagos.com",
                              clientId :CLIENTD_ID,
                              clientSecret : CLIENTD_SECRET,
                              refreshToken: REFRESH_TOKEN,
                              accessToken : accessToken,
                          },
                      });
  
         const generico = "Estimado/a:\n" +
                          " \t Solicitud de ploteo fue terminada.\n" +
                          " Proyecto : " + objeto.proyecto + "\n" +
                          " favor revisar. \n" +
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Solicitud Ploteo Terminada.",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }

module.exports.MensajerErrores =  async function (objeto) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
  
  const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
                                              CLIENTD_SECRET,
                                              REDIRECT_URI);
  
        oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});
  
        const accessToken = await oAuthClient.getAccessToken();
        const transporter = nodemailer.createTransport({
                          service : "gmail",
                          auth : {
                              type : "OAuth2",
                              user : "planner@renelagos.com",
                              clientId :CLIENTD_ID,
                              clientSecret : CLIENTD_SECRET,
                              refreshToken: REFRESH_TOKEN,
                              accessToken : accessToken,
                          },
                      });
  
    // const generico = objeto.consulta;
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : "soporteplanner@renelagos.com",
             subject : "RLE - Planner - Alertas.",
             text : objeto
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }

module.exports.EnvioMailCambioEstadoVacaciones =  async function (objeto) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
  
  const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
                                              CLIENTD_SECRET,
                                              REDIRECT_URI);
  
        oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});
  
        const accessToken = await oAuthClient.getAccessToken();
        const transporter = nodemailer.createTransport({
                          service : "gmail",
                          auth : {
                              type : "OAuth2",
                              user : "planner@renelagos.com",
                              clientId :CLIENTD_ID,
                              clientSecret : CLIENTD_SECRET,
                              refreshToken: REFRESH_TOKEN,
                              accessToken : accessToken,
                          },
                      });
  
         const generico = "Estimado/a:\n" +
                          " \t Se informa que se ha cambiado el estado de una solicitud de vacaciones ingresada po " +objeto.nombre +". \n" +
                          " Encargado de actualizacion : " + objeto.aprobador +"\n" +
                          " Comentario Aprobacion : " + objeto.comentario +"\n" +
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Solicitud Vacaciones.",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }



//main().catch(console.error);