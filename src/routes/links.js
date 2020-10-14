const express = require('express');
const router = express.Router();

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');


//para la pteción add, luego devolver algo
router.get('/add', (req,res) => {
    res.render('links/add.hbs')//.hbs
});

router.post('/add', async (req,res) => {
    const { title, url, description } = req.body; //Obtener datos title,url,description

    const newlink ={ //Se gurdaran en un nuevo objeto
        title : title ,
        url : url ,
        description : description,
        user_id: req.user.id

    };

    //console.log(newlink);

    //Guardar datos en la BD     
const result = await pool.query('INSERT INTO links set ?', [newlink]);//Inserción
    req.flash('success', 'Link Saved Successfully');
    res.redirect('/links');

});
 

router.get('/', isLoggedIn, async (req, res) => {
    const links = await pool.query('SELECT * FROM links WHERE user_id = ?', [req.user.id]);
    const modulos = await pool.query('SELECT * FROM sys_modulo as t1, sys_grupo_modulo as t2 WHERE t1.sys_Grupo_modulo_idGrupo_modulo = t2.idGrupo_modulo');
    const modulosHTML = {};
    modulos.forEach(function(elemento, indice, array) {
        if (modulosHTML[elemento.Nombre_Grupo] === undefined)
        {
            modulosHTML[elemento.Nombre_Grupo] = [];
        }
        if (modulosHTML[elemento.Nombre_Grupo]["modulos"] === undefined)
        {
            modulosHTML[elemento.Nombre_Grupo]["modulos"] = [];
        }
        modulosHTML[elemento.Nombre_Grupo]["modulos"].push(elemento.Descripcion);
    });
    console.log(modulosHTML);
    res.render('links/list', { links , modulosHTML}); //.hbs
});

router.get('/delete/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM links WHERE ID = ?', [id]);
    req.flash('success', 'Link Removed Successfully');
    res.redirect('/links');
});

router.get('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const links = await pool.query('SELECT * FROM links WHERE id = ?', [id]);
    console.log(links);
    res.render('links/edit', {link: links[0]});
});

router.post('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, url} = req.body; 
    const newLink = {
        title,
        description,
        url
    };
    await pool.query('UPDATE links set ? WHERE id = ?', [newLink, id]);
    req.flash('success', 'Link Updated Successfully');
    res.redirect('/links');
});

module.exports = router;
