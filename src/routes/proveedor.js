const express = require('express');
const { render } = require('timeago.js');
const router = express.Router();

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/externo', isLoggedIn, async (req, res) => {
    
   const proveedores = await pool.query("SELECT * FROM prov_externo ");
   res.render('proveedor/externo', { proveedores, req ,layout: 'template'});
});

router.post('/editExterno', async (req,res) => {
    const {  id, rut , nombre , razon_social,fono,mail,direccion} = req.body; //Obtener datos title,url,description

    const newProveedor  ={ //Se gurdaran en un nuevo objeto
        rut : rut,
        nombre : nombre,
        razon_social : razon_social,
        fono : fono,
        mail : mail,
        direccion : direccion
    };
    //Guardar datos en la BD     
    await pool.query('UPDATE prov_externo set ? WHERE id = ?', [newProveedor, id]);
    res.redirect('../proveedor/externo');

});

router.post('/addExterno', async (req,res) => {
    const {   rut , nombre , razon_social,fono,mail,direccion} = req.body; 

    const newProveedor  ={ //Se gurdaran en un nuevo objeto
        rut : rut,
        nombre : nombre,
        razon_social : razon_social,
        fono : fono,
        mail : mail,
        direccion : direccion
    };
    //Guardar datos en la BD     
    const result = await pool.query('INSERT INTO prov_externo set ?', [newProveedor]);//Inserción
    res.redirect('../proveedor/externo');

});

router.get('/externo/edit/:id', async (req, res) => {
    const { id } = req.params;

    const proveedores = await pool.query("SELECT * FROM prov_externo ");
    const proveedor =  await pool.query("SELECT * FROM prov_externo as t1 WHERE t1.id = ?", [id]);
    res.render('proveedor/externo', { proveedores, proveedor: proveedor[0], req ,layout: 'template'});
    
});

router.get('/externo/delete/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM prov_externo WHERE id = ?', [id]);
    res.redirect('/proveedor/externo');
});

module.exports = router;