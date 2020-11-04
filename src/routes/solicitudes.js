const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

// vacaciones 
router.get('/vacaciones', isLoggedIn, async (req, res) => {
    // buscar los datos del usuario en las variables req

    res.send("crear sistema de ingreso de vacaciones");
}); 


module.exports = router;