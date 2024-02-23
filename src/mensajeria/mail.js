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
        
       
        var infoDias = "";
                      objeto.dias.forEach(element => {
                                               infoDias += " " + element.fecha + ", es medio dia  " + element.medioDia + "\n";
                                             });

         let generico = "Estimado/a:\n" +
                          " \t Se informa que " + objeto.solicitante + " ha solicitado Vacaciones. \n" +
                          " Comentario : " + objeto.comentario + "\n"+
                          " Dias : \n";
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
                          " Servicio : "+objeto.servicio +" \n"+
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
" Servicio : "+objeto.servicio +" \n"+
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
                          " Servicio : "+objeto.servicio +" \n"+
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
                          " Costo Actual : "+objeto.costo +" \n"+
                          " Facturado : "+objeto.facturado +" \n"+
                          " Moneda : "+objeto.nomMoneda +" \n"+
                          " Monto : "+objeto.monto +" \n"+
                          " Comentario : "+objeto.comentario +" \n"+
                          " Director Proyecto : "+objeto.director +" \n"+
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             //to : "dbenites@renelagos.com",
             cc : objeto.mailopt1+","+objeto.mailopt2+","+objeto.mailsolicitante,
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
                          port : 465,
                          secure:true,
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

         const result = await   transporter.sendMail(
            mailOptions
            , (err, info) => {
                if (err) {
                    console.error('Error al enviar el correo electrónico:', err);
                } else {
                    console.log('Correo electrónico enviado:', info);
                }
            });
  
        
  

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

  module.exports.MensajerErroresDBENITES =  async function (objeto) {
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
             to : "dbenites@renelagos.com",
             subject : "RLE - Planner - Proceso Automatico.",
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


module.exports.NotificacionOCReparos =  async function (objeto) {
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
                          " \t La solicitud de OC con Nº : " +objeto.folio +". tiene observaciones ingresadas por el aprobador. \n" +
                          " Observaciones : " + objeto.comentario +"\n" +
                          " Actualizar la OC para que sea aprobada. \n" +
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Observaciones OC.",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }


module.exports.NotificacionCheckFirmaOC =  async function (objeto) {
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
                          " \t La solicitud de OC con Nº : " +objeto.folio +". tiene que ser aprobada para continuar con el proceso. \n" +
                          " Observaciones : " + objeto.comentario +"\n" +
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Firma OC",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }

  module.exports.NotificacionCheckFirmaAprobOC =  async function (objeto) {
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
                          " \t La solicitud de OC con Nº : " +objeto.folio +". ya fue aprobada la firma. \n" +
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Firma OC",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }

  module.exports.NotificacionOCClaudio =  async function (objeto) {
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
                          " \t La solicitud de OC con Nº : " +objeto.folio +". Esta disponible para ser aprobada. \n" +
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Firma OC",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }


  module.exports.NotificacionOCClaudioRechazada =  async function (objeto) {
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
                          " \t La solicitud de OC con Nº : " +objeto.folio +". fue rechazada. \n" +
                          " Comentario : "+ objeto.comentario +" \n"+
                          " Rechazada por : "+ objeto.rechazada +" \n"+
                          " Saludos, \n"+
                          " RLE - Planner";
  
         const mailOptions = {
             from : "RLE - Planner <planner@renelagos.com>",
             to : objeto.to,
             subject : "RLE - Planner - Rechazo OC",
             text : generico
         };
  
         const result = await transporter.sendMail(mailOptions);
  
  }


  module.exports.NotificacionBitacoraSemanal =  async function (objeto) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    try {

        

        const oAuthClient = new google.auth.OAuth2(CLIENTD_ID,
            CLIENTD_SECRET,
            REDIRECT_URI);

            oAuthClient.setCredentials({refresh_token:REFRESH_TOKEN});

            const accessToken = await oAuthClient.getAccessToken();
            const transporter = nodemailer.createTransport({
            service : "gmail",
            maxConnections: 30,
            maxMessages: 500,
            auth : {
            type : "OAuth2",
            user : "planner@renelagos.com",
            clientId :CLIENTD_ID,
            clientSecret : CLIENTD_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken : accessToken,
            },
            });


            const tabla = " <html><head> " +
            " <style> " +
            " table { " +
            " font-family: arial, sans-serif; " +
            " border-collapse: collapse; " +
            "  width: 50%; " +
            " } " +
            " td, th { "  +
            " border: 1px solid #dddddd; "  +
            "  text-align: left; " +
            " padding: 8px; " +
            " } " +
            " tr:nth-child(even) { " +
            " background-color: #dddddd; " +
            " } " +
            " </style> " +
            " </head> " +
            " <body>"+
            " <p> Estimado/a "+objeto.nombre+" </br> </p>\n"  +
            " <p> La información del llenado de bitácora del equipo, desde el "+objeto.inicio+" hasta el "+objeto.termino+", es la siguiente: </br> \n </p>" +
            "<table><tr><th>Colaborador</th>   <th>Centro Costo</th>   <th>HH Semana</th>   <th>HH Ingresadas</th>   <th>% Cumplimiento</th> </tr>" +
            objeto.tabla +        
            " </table></body></html>";

            const mailOptions = {
                                from : "RLE - Planner <planner@renelagos.com>",
                                //to : "dbenites@renelagos.com",
                                to : objeto.to,
                                subject : "AVISO - BITACORA",
                                html : tabla
                                };

            const result = await transporter.sendMail(mailOptions);
            
            //console.log("####");
            //await sleep(1500);

    } catch (error) {
                console.log(error);
        }

  }

  /*
  async function sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
  */


//NotificacionOCReparos

//main().catch(console.error);