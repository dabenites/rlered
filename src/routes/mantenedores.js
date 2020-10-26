const express = require('express');
const { render } = require('timeago.js');
const router = express.Router();
const bodyParser = require('body-parser');

//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { chdir } = require('process');

router.get('/sucursal', isLoggedIn, async (req, res) => {
    const paises = await pool.query("SELECT * FROM pais");
    const sucursales = await pool.query("SELECT t1.*, t2.pais FROM sys_sucursal as t1, pais as t2 where t1.id_pais = t2.id");

    res.render('mantenedores/sucursal', { paises , sucursales, req ,layout: 'template'});
}); 

router.get('/usuario', isLoggedIn, async (req, res) => {
    const usuarios = await pool.query("SELECT * FROM sys_usuario as t1, sys_categoria as t2,sys_sucursal as t3  WHERE t1.idCategoria = t2.id_Categoria AND t3.id_Sucursal = t1.idSucursal");
    res.render('mantenedores/usuarios', { usuarios, req ,layout: 'template'});
}); 

router.get('/usuario/editar/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    //console.log(req.params);
    const usuarios = await pool.query('SELECT * FROM sys_usuario');
    const usuario = await pool.query('SELECT * FROM sys_usuario WHERE idUsuario = ?', [id]);
    const categoria = await pool.query('SELECT * FROM sys_categoria');
    const sucursal = await pool.query('SELECT * FROM sys_sucursal');

    const isEqualHelperHandlerbar = function(a, b, opts) {
         if (a == b) {
             return true
         } else { 
             return false
         } 
     };
     console.log(usuario);
    res.render('mantenedores/editarUsuario', { req , usuarios,categoria,sucursal, usuario: usuario[0], layout: 'template', helpers : {
        if_equal : isEqualHelperHandlerbar
    }});
}); 

router.get('/usuario/crear/', isLoggedIn, async (req, res) => {
    const usuarios = await pool.query('SELECT * FROM sys_usuario');
    const categoria = await pool.query('SELECT * FROM sys_categoria');
    const sucursal = await pool.query('SELECT * FROM sys_sucursal');
    
    res.render('mantenedores/crearUsuario', { req ,usuarios,categoria,sucursal, layout: 'template'});
});


router.post('/editarUsuarios', async (req, res) => {
    const { idUsuario,Nombre,NombreCompleto,Email,Telefono,login,idCategoria,idSucursal,aPaterno,aMaterno,
    pNombre,sNombre,titulo } = req.body;

   const newUsario  ={ //Se gurdaran en un nuevo objeto
    Nombre:Nombre,
    NombreCompleto:NombreCompleto,
    Email:Email,
    Telefono:Telefono,
    login:login,
    idCategoria:idCategoria,
    idSucursal:idSucursal ,
    aPaterno:aPaterno,
    aMaterno:aMaterno,
    pNombre:pNombre,
    sNombre :sNombre,
    titulo:titulo
};

    //console.log(req.body);
   const result = await pool.query('UPDATE sys_usuario set ? WHERE idUsuario = ?', [newUsario, idUsuario]);
   res.redirect('/mantenedores/usuario');

});

router.post('/addUsuario', async (req, res) => {
    const { Nombre,NombreCompleto,Email,Telefono,login,idCategoria,idSucursal,aPaterno,aMaterno,
    pNombre,sNombre,titulo } = req.body;

   const newUsario  ={ //Se gurdaran en un nuevo objeto
    Nombre:Nombre,
    NombreCompleto:NombreCompleto,
    Email:Email,
    Telefono:Telefono,
    login:login,
    idCategoria:idCategoria,
    idSucursal:idSucursal ,
    aPaterno:aPaterno,
    aMaterno:aMaterno,
    pNombre:pNombre,
    sNombre :sNombre,
    titulo:titulo
};

    console.log(req.body);
   const result = await pool.query('INSERT INTO sys_usuario set ? ', [newUsario]);
   res.redirect('/mantenedores/usuario');

});


router.get('/usuario/delete/:id', async (req, res) => {
    const { id } = req.params;
    
    await pool.query('DELETE FROM sys_usuario WHERE idUsuario = ?', [id]);
    res.redirect('/mantenedores/usuario');
    
});

router.get('/usuario/permisos/:id', async (req, res) => {
    const { id } = req.params;
    const usuario = await pool.query('SELECT * FROM sys_usuario WHERE idUsuario = ?', [id]);

    //const permisos = await pool.query("SELECT t1.*, t2.Nombre AS nomGrupo FROM sys_modulo AS t1, sys_grupo_modulo AS t2 WHERE t1.idGrupo = t2.idGrupo");

    var query = "SELECT t1.*, t2.Nombre AS nomGrupo, if (t3.idPermiso > 0,1,0) AS estado " +
                " FROM sys_grupo_modulo AS t2 , sys_modulo AS t1 " +
                " LEFT JOIN sys_permiso AS t3 ON t3.idUsuario = "+ id +" AND t3.idModulo = t1.idModulo   WHERE t1.idGrupo = t2.idGrupo ";
    
    const permisos = await pool.query(query);

    const isEqualHelperHandlerbar = function(a, b, opts) {
        // console.log(a + "----" + b);
         if (a == b) {
             return true
         } else { 
             return false
         } 
     };

    res.render('mantenedores/permisos', { permisos, usuario: usuario[0],req ,layout: 'template', helpers : {
        if_equal : isEqualHelperHandlerbar
    }});

});

router.post('/usuario/permisos', async (req,res) => {
    //console.log(req.body.items);
    
    //console.log(res.json(req.body));
    var parametros = JSON.stringify(req.body);
    var informacion = parametros.split(',');
    
    var permisosUsuario = [];
    var idUsuario = 0;
    informacion.forEach(element => {
        var datos = element.split(':');
        var especificos = datos[0].split('_');
        //permisosUsuario.push(datos[1]);
        idUsuario = especificos[2].replace(/["']/g, "");
        const permiso = {
            idUsuario : idUsuario,
            idModulo  : especificos[1]
        }
        permisosUsuario.push(permiso);
    });

   // console.log(permisosUsuario);
    const borrar = pool.query(' DELETE FROM  sys_permiso WHERE  idUsuario = ?', [idUsuario]); 
    permisosUsuario.forEach(permiso => {
    const result = pool.query('INSERT INTO  sys_permiso set ?', [permiso]);
    });

    res.redirect('/mantenedores/usuario');

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
                            const result = pool.query('INSERT INTO INTO moneda_valor set ?', [newValor]);
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
    //console.log(categoria[0]);
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


router.post('/addSucursal', async (req,res) => {
    const {  id_pais, direccion , fono } = req.body;//Obtener datos title,url,description

    const newSucursal  ={ //Se gurdaran en un nuevo objeto
        id_pais : id_pais,
        direccion : direccion,
        fono : fono
    };
    //Guardar datos en la BD     
    const result = await pool.query('INSERT INTO sys_sucursal set ?', [newSucursal]);//Inserción
    res.redirect('../mantenedores/sucursal');

});

router.get('/sucursal/edit/:id', async (req, res) => {
    const { id } = req.params;
    const paises = await pool.query("SELECT * FROM pais");
    const sucursales = await pool.query("SELECT t1.*, t2.pais FROM sys_sucursal as t1, pais as t2 where t1.id_pais = t2.id");
    const sucursal = await pool.query("SELECT t1.*, t2.pais FROM sys_sucursal as t1, pais as t2 where t1.id_pais = t2.id AND t1.id_Sucursal = ?", [id]);
    const isEqualHelperHandlerbar = function(a, b, opts) {
        // console.log(a + "----" + b);
         if (a == b) {
             return true
         } else { 
             return false
         } 
     };
    res.render('mantenedores/sucursal', { paises , sucursales, sucursal: sucursal[0], req ,layout: 'template', 
                                helpers : {
                                            if_equal : isEqualHelperHandlerbar
                                        }});
    
});

router.post('/editSucursal', async (req,res) => {
    const {  id, id_pais , direccion , fono} = req.body; //Obtener datos title,url,description

    const newSucursal  ={ //Se gurdaran en un nuevo objeto
        id_pais : id_pais,
        direccion : direccion,
        fono : fono
    };
    //Guardar datos en la BD     
    await pool.query('UPDATE sys_sucursal set ? WHERE id_Sucursal = ?', [newSucursal, id]);
    res.redirect('../mantenedores/sucursal');

});


module.exports = router;