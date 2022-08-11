const express = require('express');
const router = express.Router();
var util = require('util');
var dateFormat = require('dateformat');
//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

var url = require('url');

const mensajeria = require('../mensajeria/mail');


router.get('/listado', isLoggedIn, async (req, res) => {
    try {

        
        res.render('presupuesto/presupuesto', { req ,layout: 'template'});


    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : presupuesto.js \n Error en el directorio: /presupuesto \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  


    }

}); 



router.get('/agregarPpto', isLoggedIn, async (req, res) => {
    try {

        
        //res.render('presupuesto/presupuesto', { req ,layout: 'template'});

        const tipos_presupuesto =  await pool.query("SELECT * FROM proyecto_servicio as t1 WHERE t1.esPresupuesto = 'Y'");

        const socios =  await pool.query("SELECT * FROM ppto_socios as t1");

        const tipos =  await pool.query("SELECT * FROM proyecto_tipo as t1");

        const clientes =  await pool.query("SELECT * FROM contacto as t1");

        const monedas =  await pool.query("SELECT * FROM moneda_tipo as t1 where t1.factura = 'Y'");


        res.render('presupuesto/ingresoppto', { tipos_presupuesto, socios,tipos, clientes, monedas, req ,layout: 'template'});


    } catch (error) {
        
        mensajeria.MensajerErrores("\n\n Archivo : presupuesto.js \n Error en el directorio: /agregarPpto \n" + error + "\n Generado por : " + req.user.login);
        res.redirect(   url.format({
            pathname:'/dashboard',
                    query: {
                    "a": 1
                    }
                }));  


    }

}); 

//presupuesto/agregarPpto


module.exports = router;
