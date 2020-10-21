const express = require('express');
const { render } = require('timeago.js');
const router = express.Router();

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/', isLoggedIn, async (req, res) => {
    
    /*
    switch(req.user.idCategoria)
    {
        case 1: 
            res.render('dashboard/idi', { req ,layout: 'template'});
        break;
        case 2:
            res.render('dashboard/jp', { req ,layout: 'template'});
        break;
        default:
        break;
    }
    */
   res.render('dashboard/idi', { req ,layout: 'template'});
});

module.exports = router;