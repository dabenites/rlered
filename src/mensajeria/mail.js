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

       const generico = "Estimado/a:\n" +
                        " \t Se ha generado una solicitud de aprobacion de vacaciones por " + objeto.solicitante + "\n" +
                        " Comentario : " + objeto.comentario + "\n"+
                        " Saludos, \n"+
                        " RLE - Planner";

       const mailOptions = {
           from : "RLE - Planner <planner@renelagos.com>",
           to : objeto.to,
           subject : "RLE - Planner - Solicitud de vacaciones.",
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
  
         const generico = "Estimado/a:\n" +
                          " \t Se informa que " + objeto.solicitante + " ha solicitado Vacaciones. \n" +
                          " Comentario : " + objeto.comentario + "\n"+
                          " Saludos, \n"+
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
                          " \t Se informa que se ha generado un proyecto nuevo en planner con el siguiente código. \n" +
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
                          " \t Se informa que se ha generado un proyecto nuevo en planner con el siguiente código. \n" +
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

//main().catch(console.error);