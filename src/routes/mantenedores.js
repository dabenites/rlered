const express = require('express');
const { render } = require('timeago.js');
const router = express.Router();

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/usuario', isLoggedIn, async (req, res) => {
    res.render('mantenedores/creacionUsuarios', { req ,layout: 'template'});
}); 

router.post('/actualizarUF', isLoggedIn, async (req, ress) => {
    const { year } = req.body; 

    // valores de la UF por el año actual
    const valoresUF = await pool.query("SELECT * FROM moneda_valor AS t1 WHERE t1.fecha_valor LIKE '"+ year +"-%' AND id_moneda = 4");
    
    const infoUF = {};
    valoresUF.forEach(function(elemento, indice, array) {
        if (infoUF[elemento.fecha_valor] === undefined)
        {
            infoUF[elemento.fecha_valor] = elemento.valor;
        }
    });
    
    var https = require('https');

    https.get('https://mindicador.cl/api/uf/'+ year +'', function(res) {
        res.setEncoding('utf-8');
        var data = '';
     
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            var informacion = JSON.parse(data);
            var dateFormat = require('dateformat');
            var actualizarUF = false;
            for (var i=0; i< informacion.serie.length; i++){
                        if (infoUF[dateFormat(informacion.serie[i].fecha,"yyyy-mm-dd")] === undefined)
                        {
                            const newValor  ={ //Se gurdaran en un nuevo objeto
                                id_moneda : 4, 
                                fecha_valor : dateFormat(informacion.serie[i].fecha,"yyyy-mm-dd"),
                                valor : informacion.serie[i].valor
                            };
                            const result = pool.query('INSERT INTO moneda_valor set ?', [newValor]);
                        }
              }
            ress.redirect('../mantenedores/valoruf');
        });
     
    }).on('error', function(err) {
        console.log('Error al consumir la API!' + err.message);
    });


}); 

router.get('/valoruf', isLoggedIn, async (req, ress) => {
    
    var fecha = new Date();
    var year = fecha.getFullYear();
    const annios = [];

    for (let step = 0; step < 10; step++) {
        annios.push(year - step);
      }

    if (req.query.anio === undefined)
    {

    }
    else
    {
        year = req.query.anio
    }    
    //[uf, ivp, dolar, dolar_intercambio, euro, ipc, utm, imacec, tpm, libra_cobre, tasa_desempleo, bitcoin]
    var https = require('https');
    //var informacion = JSON.parse();
    const indicacoresCL =  {};

    // valores de la UF por el año actual
    const valoresUF = await pool.query("SELECT * FROM moneda_valor AS t1 WHERE t1.fecha_valor LIKE '"+ year +"-%' AND id_moneda = 4");
    
    const infoUF = {};
    valoresUF.forEach(function(elemento, indice, array) {
        if (infoUF[elemento.fecha_valor] === undefined)
        {
            infoUF[elemento.fecha_valor] = elemento.valor;
        }
    });
    

    https.get('https://mindicador.cl/api/uf/'+ year +'', function(res) {
        res.setEncoding('utf-8');
        var data = '';
     
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            var informacion = JSON.parse(data);
            var dateFormat = require('dateformat');
            var actualizarUF = false;
            for (var i=0; i< informacion.serie.length; i++){
                if (indicacoresCL[dateFormat(informacion.serie[i].fecha,"yyyy-mm-dd")] === undefined)
                    {
                        var valorUF = 'No ingresado';
                        if (infoUF[dateFormat(informacion.serie[i].fecha,"yyyy-mm-dd")] !== undefined)
                        {
                            //console.log(infoUF[dateFormat(informacion.serie[i].fecha,"yyyy-mm-dd")]);
                            valorUF = infoUF[dateFormat(informacion.serie[i].fecha,"yyyy-mm-dd")];
                        }
                        else
                        {
                            actualizarUF = true;
                        }
                        const unValor ={ //Se gurdaran en un nuevo objeto
                            fecha  : dateFormat(informacion.serie[i].fecha,"yyyy-mm-dd"),
                            nombre : informacion.nombre ,
                            unidad : informacion.unidad_medida,
                            valor : informacion.serie[i].valor,
                            valor_UF : valorUF};

                        indicacoresCL[dateFormat(informacion.serie[i].fecha,"yyyy-mm-dd")] = unValor;
                    }
              }
            ress.render('mantenedores/valoruf', { annios , actualizarUF , indicacoresCL, year , req ,layout: 'template'});
        });
     
    }).on('error', function(err) {
        console.log('Error al consumir la API!' + err.message);
    });
      
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
    res.redirect('/mantenedores/pais');
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

router.get('/centrocosto/delete/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM centro_costo WHERE ID = ?', [id]);
    res.redirect('/mantenedores/centrocosto');
});

router.get('/categoria', isLoggedIn, async (req, res) => {
    const categorias = await pool.query('SELECT t1.*, t2.centroCosto FROM categorias as t1 , centro_costo as t2 where t1.idCentroCosto = t2.id');
    const centrosCostos = await pool.query('SELECT * FROM centro_costo');
    //console.log(centrosCostos);
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
       // console.log(a + "----" + b);
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

router.post('/editCategoria', async (req,res) => {
    const {  id, name , idCentroCosto , valorhh} = req.body; //Obtener datos title,url,description

    const newCategoria  ={ //Se gurdaran en un nuevo objeto
        idCentroCosto : idCentroCosto,
        categoria : name,
        valorHH : valorhh
    };
    //Guardar datos en la BD     
    await pool.query('UPDATE categorias set ? WHERE id = ?', [newCategoria, id]);
    res.redirect('../mantenedores/categoria');

});

router.post('/eddCategoria', async (req,res) => {
    const {  id, name , idCentroCosto , valorhh} = req.body;//Obtener datos title,url,description

    const newCategoria  ={ //Se gurdaran en un nuevo objeto
        idCentroCosto : idCentroCosto,
        categoria : name,
        valorHH : valorhh
    };
    //Guardar datos en la BD     
    const result = await pool.query('INSERT INTO categorias set ?', [newCategoria]);//Inserción
    res.redirect('../mantenedores/categoria');

});
router.get('/categoria/delete/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM categorias WHERE ID = ?', [id]);
    res.redirect('/mantenedores/categoria');
});

module.exports = router;