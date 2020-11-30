const express = require('express');
const router = express.Router();


//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/ploteo', isLoggedIn, async (req, res) => {

    const proyectos =  await pool.query("SELECT * FROM pro_proyectos as t1 ORDER BY year DESC, code DESC");       
    const usuarios = await pool.query('SELECT * FROM sys_usuario');                             
    res.render('ploter/ingresar', { proyectos,usuarios, req ,layout: 'template'});
}); 

router.post('/addSolicitud', isLoggedIn, async (req, res) => {

                                                
    //res.render('ploter/ingresar', { req ,layout: 'template'});

    console.log(req.body);

    res.send("Mensaje");
}); 



module.exports = router;