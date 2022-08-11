const express = require('express');
const router = express.Router();
var util = require('util');
var dateFormat = require('dateformat');
//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

var url = require('url');

const mensajeria = require('../mensajeria/mail');


//proyecto
//metodologia
router.get('/proyecto/:id', isLoggedIn, async (req, res) => {
    try {


        const { id } = req.params; // id del proyecto que deseamos cargar la información. 
        //* IMPORTANTE */
        // por el momento lo vamos a dejar ligado al id del proyecto pero a tu futuro tiene que estar ligado al presupuesto. 
        /// ________________________________________________________________________________________________________________

        // traerme la informacion del proyecto. 
        let presupuestos =await pool.query("SELECT * FROM ppto_presupuesto as t1 where t1.id_proyecto = ? ", [id]);

        let proyecto =await pool.query("SELECT * FROM pro_proyectos as t1 where t1.id = ? ", [id]);

        
        res.render('finanzas/proyecto', { req ,proyecto:proyecto[0] ,presupuestos,  layout: 'template'}); 
        

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

        // console.log("asdadssad");
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