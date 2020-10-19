const express = require('express');
const { render } = require('timeago.js');
const router = express.Router();

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/usuario', isLoggedIn, async (req, res) => {
    res.render('mantenedores/creacionUsuarios', { req ,layout: 'template'});
});

router.get('/valoruf', isLoggedIn, async (req, res) => {
    
    var https = require('https');
    https.get('https://mindicador.cl/api', function(res) {
        res.setEncoding('utf-8');
        var data = '';
     
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            var dailyIndicators = JSON.parse(data); // JSON to JavaScript object
            //res.send('El valor actual de la UF es $' + dailyIndicators.uf.valor);
            console.log('El valor actual de la UF es $' + dailyIndicators.uf.valor);
        });
     
    }).on('error', function(err) {
        console.log('Error al consumir la API!');
    });


    
    res.render('mantenedores/valoruf', { req ,layout: 'template'});
});


router.get('/pais', isLoggedIn, async (req, res) => {
    const paises = await pool.query('SELECT * FROM pais');
    res.render('mantenedores/pais', { req ,paises, layout: 'template'});
});



router.post('/addPais', async (req,res) => {
    const { name } = req.body; //Obtener datos title,url,description

    const newPais  ={ //Se gurdaran en un nuevo objeto
        pais : name 
    };
    //Guardar datos en la BD     
    const result = await pool.query('INSERT INTO pais set ?', [newPais]);//Inserción
    res.redirect('../mantenedores/pais');

});

router.post('/editPais', async (req,res) => {
    const {  id, name } = req.body; //Obtener datos title,url,description

    const newPais  ={ //Se gurdaran en un nuevo objeto
        pais : name 
    };
    //Guardar datos en la BD     
    await pool.query('UPDATE pais set ? WHERE id = ?', [newPais, id]);
    res.redirect('../mantenedores/pais');

});


router.get('/pais/edit/:id', async (req, res) => {
    const { id } = req.params;
    const paises = await pool.query('SELECT * FROM pais');
    const pais = await pool.query('SELECT * FROM pais WHERE id = ?', [id]);
    res.render('mantenedores/pais', { req , paises, pais: pais[0], layout: 'template'});
    
});
router.get('/pais/delete/:id', async (req, res) => {
    const { id } = req.params;
    
    await pool.query('DELETE FROM pais WHERE ID = ?', [id]);
    const paises = await pool.query('SELECT * FROM pais');
    res.render('mantenedores/pais', { req ,paises, layout: 'template'});
    
});

router.get('/centrocosto', isLoggedIn, async (req, res) => {
    const centrosCostos = await pool.query('SELECT * FROM centro_costo');
    res.render('mantenedores/centrocosto', { req ,centrosCostos, layout: 'template'});
});

router.post('/addCentroCosto', async (req,res) => {
    const { name } = req.body; //Obtener datos title,url,description

    const newCenctroCosto  ={ //Se gurdaran en un nuevo objeto
        centroCosto : name 
    };
    //Guardar datos en la BD     
    const result = await pool.query('INSERT INTO centro_costo set ?', [newCenctroCosto]);//Inserción
    res.redirect('../mantenedores/centrocosto');

});
router.get('/centrocosto/edit/:id', async (req, res) => {
    const { id } = req.params;
    const centrosCostos = await pool.query('SELECT * FROM centro_costo');
    const centro = await pool.query('SELECT * FROM centro_costo WHERE id = ?', [id]);
    //console.log(centro);
    
    res.render('mantenedores/centrocosto', { req , centrosCostos, centro: centro[0], layout: 'template'});
    
});
router.post('/editCentroCosto', async (req,res) => {
    const {  id, name } = req.body; //Obtener datos title,url,description

    const newCentroCosto  ={ //Se gurdaran en un nuevo objeto
        centroCosto : name 
    };
    //Guardar datos en la BD     
    await pool.query('UPDATE centro_costo set ? WHERE id = ?', [newCentroCosto, id]);
    res.redirect('../mantenedores/centrocosto');

});


router.get('/categoria', isLoggedIn, async (req, res) => {
    const categorias = await pool.query('SELECT * FROM categorias as t1 , centro_costo as t2 where t1.idCentroCosto = t2.id');
    const centrosCostos = await pool.query('SELECT * FROM centro_costo');
    const isEqualHelperHandlerbar = function(a, b, opts) {
        if (a == b) {
            return true
        } else { 
            return false
        } 
    };
    //console.log(centrosCostos);
    res.render('mantenedores/categoria', { req ,categorias,centrosCostos, layout: 'template', helpers : {
        if_equal : isEqualHelperHandlerbar
    }});
});

router.get('/categoria/edit/:id', async (req, res) => {
    const { id } = req.params;
    const categorias = await pool.query('SELECT * FROM categorias as t1 , centro_costo as t2 where t1.idCentroCosto = t2.id');
    const centrosCostos = await pool.query('SELECT * FROM centro_costo');
    const categoria = await pool.query('SELECT * FROM categorias WHERE id = ?', [id]);
    console.log(categoria[0]);
    const isEqualHelperHandlerbar = function(a, b, opts) {
        console.log(a + "----" + b);
        if (a == b) {
            return true
        } else { 
            return false
        } 
    };
    
    res.render('mantenedores/categoria', { req , categorias, centrosCostos, categoria: categoria[0], 
                                           layout: 'template', helpers : {
                                            if_equal : isEqualHelperHandlerbar
                                        }});
    
});



module.exports = router;