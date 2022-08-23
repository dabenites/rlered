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

//cargaPagoAdiocional
router.post('/cargaPagoAdiocional', isLoggedIn, async (req, res) => {

    //let informacion = {idProyecto,  tipoCobro, numero,motivo,porcentaje,monto,moneda, observacion};

    const { idProyecto , tipoCobro,numero, motivo, porcentaje , monto , moneda , observacion ,presupuesto , edificiotorre} = req.body;

    let registro = {
        id_proyecto : idProyecto,
        id_presupuesto : presupuesto,
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
    
        const infoSubStructura = await pool.query('INSERT INTO contrato_metodologia  set ? ', [registro]);



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
        substructura =await pool.query("SELECT * FROM metod_subestructura as t1 where t1.id_proyecto = ? ", [idProyecto]);
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

    //console.log(substructura);


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
        let sql = " SELECT t2.codigo AS codigo, "  +
                    " 'Metodologia Pago' AS tipo,  " +
                    " t3.descripcion AS substructura, " +
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
                    " where t1.id_proyecto = "+id+" " +
                    " UNION " +
                    " SELECT t2a.codigo AS codigo, " +
                            " 'Pago Adicional' AS tipo,  " +
                            " t3a.descripcion AS substructura," +
                            "  t4a.descripcion AS  motivohito, "+
                            " t5a.descripcion AS moneda, " +
                            " t1a.porcentaje AS porcentaje, " +
                            " t1a.monto AS monto, " +
                            " t1a.observacion AS observacion, " +
                            " 2 AS tiporegistro, " + 
                            " t1a.id AS id " + 
                    " FROM contrato_pago_adicional as t1a  " +
                        " LEFT JOIN ppto_presupuesto AS t2a ON   t1a.id_presupuesto = t2a.id_presupuesto " +
                        " LEFT JOIN metod_subestructura AS t3a ON t1a.id_substructura = t3a.id "+
                        " LEFT JOIN contrato_motivo_del_cobro AS t4a ON t1a.id_motivo = t4a.id " +
                        " LEFT JOIN moneda_tipo AS t5a ON t1a.id_moneda = t5a.id_moneda " +
                        " where t1a.id_proyecto = "+id+" "

        //let cobros_pago_adiocionales = await pool.query("SELECT * FROM contrato_metodologia as t1 where t1.id_proyecto = ? ", [id]); 
        //console.log(sql);
        let cobros_pago_adiocionales = await pool.query(sql); 

        let presupuestos =await pool.query("SELECT * FROM ppto_presupuesto as t1 where t1.id_proyecto = ? ", [id]);

        let proyecto =await pool.query("SELECT * FROM pro_proyectos as t1 where t1.id = ? ", [id]);

        
        res.render('finanzas/proyecto', { req ,proyecto:proyecto[0] ,presupuestos,  cobros_pago_adiocionales, layout: 'template'}); 
        

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