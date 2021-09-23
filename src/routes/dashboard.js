const express = require('express');
const { render } = require('timeago.js');
const router = express.Router();

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/', isLoggedIn, async (req, res) => {
   res.render('dashboard/idi', { req ,layout: 'template'});
  
});

module.exports = router;