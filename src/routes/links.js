const express = require('express');
const router = express.Router();

const pool = require('../database'); // es mi archivo es base de datos 


router.get('/add',(req,res) => {
    //res.send("MENSAJE ADD");
    res.render('links/add');
});

router.post('/add', async (req, res) => {
    //console.log(req.body);
    const {title, url , description } = req.body;
    const newLink = {
        title,
        url,
        description
    };
    //console.log(newLink);
    await pool.query('INSERT INTO links set ?',[newLink]); // await se tomara su tiempo
    req.flash('success', 'Link saved');
    res.redirect('/links'); // redirigo a la ruta 
});

router.get('/',async(req,res) => {
    const links = await pool.query('SELECT * FROM links');
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
    
    res.render('links/list',{links,modulosHTML});
    
});

router.get('/delete/:id',async(req,res) => {
    //console.log(req.params.id);
    const {id} = req.params;
    await pool.query('DELETE FROM links WHERE ID = ?',[id]);
    res.redirect('/links');
});
router.get('/edit/:id',async(req,res) => {
    //console.log(req.params.id);
    const {id} = req.params;
    const links = await pool.query('SELECT * FROM links WHERE id = ?', [id])
    console.log(links);
    res.render('links/edit',{ link:links[0]});
    //await pool.query('DELETE FROM links WHERE ID = ?',[id]);
    //res.redirect('/links');
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