const express = require('express');
const { render } = require('timeago.js');
const router = express.Router();

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/', isLoggedIn, async (req, res) => {

    const modulos = await pool.query('SELECT t1.*,t2.Nombre as grupoNombre , t2.icon as grupoIcon FROM sys_modulo as t1, sys_grupo_modulo as t2 WHERE t1.idGrupo = t2.idGrupo');
    const modulosHTML = {};
    modulos.forEach(function(elemento, indice, array) {
        if (modulosHTML[elemento.Nombre_Grupo] === undefined)
        {
            modulosHTML[elemento.Nombre_Grupo] = [];
            modulosHTML[elemento.Nombre_Grupo]["grupo"] = elemento.grupoNombre;
            modulosHTML[elemento.Nombre_Grupo]["icono"] = elemento.grupoIcon;
        }
        if (modulosHTML[elemento.Nombre_Grupo]["modulos"] === undefined)
        {
            modulosHTML[elemento.Nombre_Grupo]["modulos"] = [];
        }

        const unMudulo ={ //Se gurdaran en un nuevo objeto
            nombre : elemento.Nombre ,
            icon : elemento.icon ,
            aref : elemento.aref
                        };

        
        modulosHTML[elemento.Nombre_Grupo]["modulos"].push(unMudulo);
    });
    res.render('mantenedores/creacionUsuarios', { modulosHTML , req ,layout: 'template'});

});

module.exports = router;