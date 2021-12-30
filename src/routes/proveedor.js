const express = require('express');
const { render } = require('timeago.js');
const router = express.Router();

//importar una conexión a DB
const pool = require('../database');
var url = require('url');

const { isLoggedIn } = require('../lib/auth');

router.get('/externo', isLoggedIn, async (req, res) => {
    
   const proveedores = await pool.query("SELECT * FROM prov_externo ");

  // res.render('proveedor/externo', { proveedores, req ,layout: 'template'});
  if (req.query.a === undefined)
    {
        res.render('proveedor/externo', { proveedores, req ,layout: 'template'});
    }
    else
        {
            var verToask = {};
            switch(req.query.a)
            {
                case 1:
                case "1":
                    verToask= {
                        titulo : "Mensaje",
                        body   : "Proveedor cargado correctamente.",
                        tipo   : "Crear"
                            };
                    res.render('proveedor/externo', { verToask, proveedores, req ,layout: 'template'});
                break;
                case 2:
                case "2":
                        verToask= {
                            titulo : "Mensaje",
                            body   : "Proveedor actualizado correctamente.",
                            tipo   : "Editar"
                                };
                        res.render('proveedor/externo', { verToask, proveedores, req ,layout: 'template'});
                break;
                case 3:
                case "3":
                        verToask= {
                            titulo : "Mensaje",
                            body   : "Proveedor eliminado correctamente.",
                            tipo   : "Eliminar"
                                };
                        res.render('proveedor/externo', { verToask, proveedores, req ,layout: 'template'});
                break;
            }
        }

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
    res.redirect(   url.format({
        pathname:'/proveedor/externo',
                query: {
                "a": 2
                }
            }));


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
   // res.redirect('../proveedor/externo');
   res.redirect(   url.format({
    pathname:'/proveedor/externo',
            query: {
            "a": 1
            }
        }));


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
    //res.redirect('/proveedor/externo');
    res.redirect(   url.format({
        pathname:'/proveedor/externo',
                query: {
                "a": 3
                }
            }));

});

module.exports = router;