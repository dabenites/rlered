const express = require('express');
const router = express.Router();
//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');


router.get('/facturas', isLoggedIn, async (req, res) => {

    // buscar el listado de todas las facturas.

    const estados =  await pool.query("SELECT * FROM fact_estados as t1");
    const facturacion =  await pool.query("SELECT " +
                                                    " *, " +
                                                    " t2.nombre As nomPro ," +
                                                    " DATE_FORMAT(t1.fecha_solicitante, '%Y-%m-%d') as fechaSolicitante ," +
                                                    " t5.descripcion As estadoDes," +
                                                    " t6.descripcion As tipoCobroDes" +
                                          " FROM " +
                                                      "fact_facturas as t1, " +
                                                      "pro_proyectos as t2, "+ 
                                                      "moneda_tipo as t3, "+ 
                                                      "sys_usuario as t4, "+  
                                                      "fact_estados as t5, "+ 
                                                      "fact_tipo_cobro as t6 "+
                                        " WHERE " + 
                                                    " t1.id_proyecto = t2.id"+
                                        " AND " + 
                                                    " t1.id_tipo_moneda = t3.id_moneda"+
                                        " AND " + 
                                                    " t4.idUsuario = t1.id_solicitante" +
                                        " AND " + 
                                                    " t5.id = t1.id_estado"+
                                        " AND " + 
                                                    " t5.id = 0"+
                                        " AND " + 
                                                    " t6.id = t1.id_tipo_cobro"+
                                        " ORDER BY fechaSolicitante DESC");



    res.render('facturacion/facturas', {facturacion , estados, req ,layout: 'template'});


});

router.post('/facturas', isLoggedIn, async (req, res) => {

    // buscar el listado de todas las facturas.
    const { estado } = req.body; 
    //console.log(estado);
    const estados =  await pool.query("SELECT * FROM fact_estados as t1");
    const facturacion =  await pool.query("SELECT " +
                                                    " *, " +
                                                    " t2.nombre As nomPro ," +
                                                    " DATE_FORMAT(t1.fecha_solicitante, '%Y-%m-%d') as fechaSolicitante ," +
                                                    " t5.descripcion As estadoDes," +
                                                    " t6.descripcion As tipoCobroDes" +
                                          " FROM " +
                                                      "fact_facturas as t1, " +
                                                      "pro_proyectos as t2, "+ 
                                                      "moneda_tipo as t3, "+ 
                                                      "sys_usuario as t4, "+  
                                                      "fact_estados as t5, "+ 
                                                      "fact_tipo_cobro as t6 "+
                                        " WHERE " + 
                                                    " t1.id_proyecto = t2.id"+
                                        " AND " + 
                                                    " t1.id_tipo_moneda = t3.id_moneda"+
                                        " AND " + 
                                                    " t4.idUsuario = t1.id_solicitante" +
                                        " AND " + 
                                                    " t5.id = t1.id_estado"+
                                        " AND " + 
                                                    " t5.id = "+estado+""+
                                        " AND " + 
                                                    " t6.id = t1.id_tipo_cobro"+
                                        " ORDER BY fechaSolicitante DESC");



    res.render('facturacion/facturas', {facturacion , estados, req ,layout: 'template'});


});
module.exports = router;