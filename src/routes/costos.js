const express = require('express');
const router = express.Router();

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/usuario', isLoggedIn, async (req, res) => {
    var fecha = new Date();
    var year = fecha.getFullYear();
    var mes = fecha.getMonth() + 1;
    const annios = [];


    if (req.query.anio !== undefined)
    {
        year = req.query.anio;
    }
    if (req.query.mes !== undefined)
    {
        mes = req.query.mes;
    }
    

    for (let step = 0; step < 10; step++) {
        annios.push(year - step);
      }

    const listadoMeses = [ 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const messes = [];
    listadoMeses.forEach((element, i) => {
        if ((i+1) === mes)
        {
            const Mes = {
                id : (i + 1),
                nombre : element,
                actual : true
            }
            messes.push(Mes);
        }
        else
        {
            const Mes = {
                id : (i + 1),
                nombre : element,
                actual : false
            }
            messes.push(Mes);
        }
    });

    // Buscar la informacion de los usuarios.
    const costos  = await pool.query("SELECT * " +
                                    " FROM    " +
                                                    " sys_usuario_costo AS t1," + 
                                                    " sys_usuario  AS t2 " +
                                    " WHERE     " + 
                                                    " t1.annio = "+ year +" " +
                                    " AND       " +
                                                    " t1.mes = "+ mes +"  " +
                                    " AND       " +
                                                    "t1.idUsuario = t2.idUsuario");
    //console.log("annio" + year + "   MES " + mes);
    //console.log(costos);
    res.render('costos/usuario', { annios, messes, costos, req ,layout: 'template'});
}); 


module.exports = router;