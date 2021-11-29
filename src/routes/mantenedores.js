const express = require('express');
const { render } = require('timeago.js');
const router = express.Router();
const bodyParser = require('body-parser');
var util = require("util");
var url = require('url');
const helpers = require('../lib/helpers');
const bcrypt = require('bcryptjs');


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
    //const usuarios = await pool.query('SELECT * FROM sys_usuario');
    const usuarios = await pool.query("SELECT * FROM sys_usuario as t1, sys_categoria as t2,sys_sucursal as t3  WHERE t1.idCategoria = t2.id_Categoria AND t3.id_Sucursal = t1.idSucursal");
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
    // console.log(usuario);
    res.render('mantenedores/editarUsuario', { req , usuarios,categoria,sucursal, usuario: usuario[0], layout: 'template', helpers : {
        if_equal : isEqualHelperHandlerbar
    }});
}); 

router.get('/usuario/crear/', isLoggedIn, async (req, res) => {
    const usuarios = await pool.query('SELECT * FROM sys_usuario');
    const categoria = await pool.query('SELECT * FROM sys_categoria');
    const sucursal = await pool.query('SELECT * FROM sys_sucursal');
    
    //const hash = bcrypt.hashSync("dav", 10);


    res.render('mantenedores/crearUsuario', { req ,usuarios,categoria,sucursal, layout: 'template'});
});

router.post('/editarUsuarios', async (req, res) => {
    const { idUsuario,Nombre,Email,Telefono,login,idCategoria,idSucursal,titulo } = req.body;

   const newUsario  ={ //Se gurdaran en un nuevo objeto
    Nombre:Nombre,
    Email:Email,
    Telefono:Telefono,
    login:login,
    idCategoria:idCategoria,
    idSucursal:idSucursal ,
    titulo:titulo
};

   const result = await pool.query('UPDATE sys_usuario set ? WHERE idUsuario = ?', [newUsario, idUsuario]);

  // const usuarios = await pool.query('SELECT * FROM sys_usuario');
  const usuarios = await pool.query("SELECT * FROM sys_usuario as t1, sys_categoria as t2,sys_sucursal as t3  WHERE t1.idCategoria = t2.id_Categoria AND t3.id_Sucursal = t1.idSucursal");
   //console.log(usuarios);

   
   const verToask = {
       titulo : Nombre,
       body   : "Se ha editado correctamente",
       tipo   : "Editar"
   };
   //console.log(verToask);
   res.render('mantenedores/usuarios', { verToask, req ,usuarios,layout: 'template'});

})

router.post('/addUsuario', async (req, res) => {


    const { Nombre,Email,Telefono,login,idCategoria,idSucursal, titulo } = req.body;

   const newUsario  ={ //Se gurdaran en un nuevo objeto
    Nombre:Nombre,
    Email:Email,
    Telefono:Telefono,
    login:login,
    idCategoria:idCategoria,
    idSucursal:idSucursal ,
    titulo:titulo
};

   // console.log(req.body);
   const result = await pool.query('INSERT INTO sys_usuario set ? ', [newUsario]);
   
   
   const newPassword  ={
    idUsuario : result.insertId,
    password : bcrypt.hashSync("RL$"+login,10)
   };

   const result2 = await pool.query('INSERT INTO sys_password set ? ', [newPassword]);

   const usuarios = await pool.query("SELECT * FROM sys_usuario as t1, sys_categoria as t2,sys_sucursal as t3  WHERE t1.idCategoria = t2.id_Categoria AND t3.id_Sucursal = t1.idSucursal");
   //console.log(usuarios);
    


   
   const verToask = {
       titulo : Nombre,
       body   : "Se ha creado correctamente",
       tipo   : "Crear"
   };
   //console.log(verToask);
   res.render('mantenedores/usuarios', { verToask, req ,usuarios,layout: 'template'});
 
 })


router.get('/usuario/delete/:id', async (req, res) => {
    const { id } = req.params;
    
    const nombre = await pool.query('SELECT nombre FROM sys_usuario WHERE idUsuario = ?', [id]);
   //console.log(nombre);

    await pool.query('DELETE FROM sys_usuario WHERE idUsuario = ?', [id]);
    //res.redirect('/mantenedores/usuario');

    
    const usuarios = await pool.query("SELECT * FROM sys_usuario as t1, sys_categoria as t2,sys_sucursal as t3  WHERE t1.idCategoria = t2.id_Categoria AND t3.id_Sucursal = t1.idSucursal");
    //console.log(usuarios);


    const verToask = {
    
        titulo : nombre[0].Nombre,
        body   : "Se ha eliminado correctamente ",
        tipo   : "Eliminar"
    };
    //console.log(verToask);
    res.render('mantenedores/usuarios', { verToask, req ,usuarios,layout: 'template'});

    
});


router.get('/usuario/permisos/:id', async (req, res) => {
    const { id } = req.params;
    const usuario = await pool.query('SELECT * FROM sys_usuario WHERE idUsuario = ?', [id]);

    //const permisos = await pool.query("SELECT t1.*, t2.Nombre AS nomGrupo FROM sys_modulo AS t1, sys_grupo_modulo AS t2 WHERE t1.idGrupo = t2.idGrupo");

    var query = "SELECT t1.*, t2.Nombre AS nomGrupo, if (t3.idPermiso > 0,1,0) AS estado " +
                " FROM sys_grupo_modulo AS t2 , sys_modulo AS t1 " +
                " LEFT JOIN sys_permiso AS t3 ON t3.idUsuario = "+ id +" AND t3.idModulo = t1.idModulo   WHERE t1.idGrupo = t2.idGrupo AND t1.operativo = 'Y' ORDER BY nomGrupo ASC,t1.Nombre ASC ";
    
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
    
    
    //console.log(res.json(req.body));
    //__________________

    
    var parametros = JSON.stringify(req.body);
    var informacion = parametros.split(',');
    //console.log(informacion);

    var permisosUsuario = [];
    var idUsuario = 0;
    informacion.forEach(element => {
        var datos = element.split(':');
        var especificos = datos[0].split('_');
        //var especificos_2 = datos[0].split(',');
        //console.log(especificos[1] + "////" + especificos[2]);
        //___________________________________
        if (esNumero(especificos[1]))
        {
            const permiso = {
            idUsuario : especificos[2].substring(0, especificos[2].length - 1) ,
            idModulo  : especificos[1]
            }
       
            permisosUsuario.push(permiso);

        }
    });
//    permisosUsuario[0].idUsuario;
   // console.log(permisosUsuario);
    const borrar = pool.query(' DELETE FROM  sys_permiso WHERE  idUsuario = ?', [permisosUsuario[0].idUsuario]); 
    permisosUsuario.forEach(permiso => {
       // console.log(permiso);
    const result = pool.query('INSERT INTO  sys_permiso set ?', [permiso]);
    });

    const usuario = await pool.query('SELECT * FROM sys_usuario WHERE idUsuario = ?', [permisosUsuario[0].idUsuario]);
    
    const verToask = {
        titulo : usuario[0].Nombre,
        body   : "Se le han dado los permisos necesarios ",
        tipo   : "Permisos"
    };
    //console.log(verToask);

    //const usuarios = await pool.query('SELECT * FROM sys_usuario');
    const usuarios = await pool.query("SELECT * FROM sys_usuario as t1, sys_categoria as t2,sys_sucursal as t3  WHERE t1.idCategoria = t2.id_Categoria AND t3.id_Sucursal = t1.idSucursal");

    

    res.render('mantenedores/usuarios', { verToask, req ,usuarios,layout: 'template'});

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
    
    //console.log(valoresUF);

    var https = require('https');

    https.get('https://mindicador.cl/api/uf/'+ year +'', function(res) {
        res.setEncoding('utf-8');
        var data = '';
     
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', async function() {
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
                            //console.log(newValor);
                            //console.log("INSERT INTO moneda_valor (id_moneda,fecha_valor) VALUES (4,'"+ dateFormat(informacion.serie[i].fecha,"yyyy-mm-dd")+"')");
                            //const r = await pool.query("INSERT INTO moneda_valor (id_moneda,fecha_valor) VALUES (4,'"+ dateFormat(informacion.serie[i].fecha,"yyyy-mm-dd")+"')");
                            const result = await pool.query('INSERT INTO moneda_valor set ?', [newValor]);
                        }
              }
            //ress.redirect('../mantenedores/valoruf');
            ress.redirect(   url.format({
                pathname:'../mantenedores/valoruf',
                query: {
                "a": 1
                }
            }));
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
    const valoresUF = await pool.query("SELECT *, FORMAT( t1.valor , 2) AS valorFormateado  FROM moneda_valor AS t1 WHERE t1.fecha_valor LIKE '"+ year +"-%' AND id_moneda = 4");
    
    const infoUF = {};
    valoresUF.forEach(function(elemento, indice, array) {
        if (infoUF[elemento.fecha_valor] === undefined)
        {
            infoUF[elemento.fecha_valor] = elemento.valorFormateado;
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
            if (req.query.a === undefined)
            {
                ress.render('mantenedores/valoruf', { annios , actualizarUF , indicacoresCL, year , req ,layout: 'template'});
            }
            else
            {
                const verToask = {
                    titulo : "Mensaje",
                    body   : "Información cargada",
                    tipo   : "Crear"
                        };

                ress.render('mantenedores/valoruf', { annios , verToask, actualizarUF , indicacoresCL, year , req ,layout: 'template'});
            }
        });
     
    }).on('error', function(err) {
        console.log('Error al consumir la API!' + err.message);
    });
      
});


router.get('/pais', isLoggedIn, async (req, res) => {
    const paises = await pool.query('SELECT * FROM pais as t1 ORDER BY t1.pais');
    res.render('mantenedores/pais', { req ,paises, layout: 'template'});
});

router.get('/valorufmanual', isLoggedIn, async (req, res) => {
    
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
        if ((i+1) == mes)
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

    // ir a buscar toda la informacion de los varoles ingresados.
    
    var numeroDias = diasEnUnMes(mes,year);
    const diasPorMes = [];
    for (let step = 1; step <= numeroDias; step++) {
        if (step < 10)
        {
            step = "0" + step;
        }

        const valorUFDia = await pool.query("SELECT * FROM moneda_valor AS t1 WHERE t1.fecha_valor = '"+ year+"-"+mes+"-"+step +"' AND id_moneda = 4");
        
        if(!isEmpty(valorUFDia))
        {
            const dia = {
                fecha : year+"-"+mes+"-"+step,
                valor : valorUFDia[0].valor
            }
            diasPorMes.push(dia);
        }
        else
        {
            const dia = {
                fecha : year+"-"+mes+"-"+step,
                valor : ""
            }
            diasPorMes.push(dia);
        }

      }


    res.render('mantenedores/valorufmanual' ,{ annios,messes,diasPorMes, req ,layout: 'template'});
});

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
function diasEnUnMes(mes, año) {
	return new Date(año, mes, 0).getDate();
}

router.post('/ajax', express.json({type: '*/*'}), async (req,res) => {
    //res.json(req.body);

    //console.log(req.body);
    for (let i in req.body)
    {
        var fecha = req.body[i].fecha;
        var valor = req.body[i].valor;


        const monedaValor  ={ //Se gurdaran en un nuevo objeto
            id_moneda : 4,
            fecha_valor : fecha,
            valor :  valor
        };
        //console.log(monedaValor);
        if (monedaValor.valor !== "")
        {
            const result0 = await pool.query('DELETE FROM moneda_valor WHERE id_moneda = ? AND fecha_valor = ?', [4,fecha]);
            const result = await pool.query('INSERT INTO moneda_valor set ?', [monedaValor]);//Inserción
        }       
    }
    res.send("OK");
});
    
router.post('/addPais', async (req,res) => {
    const { name } = req.body; //Obtener datos title,url,description

    const newPais  ={ //Se gurdaran en un nuevo objeto
        pais : name 
    };
    //Guardar datos en la BD     
    const result = await pool.query('INSERT INTO pais set ?', [newPais]);//Inserción
 


    const paises = await pool.query('SELECT * FROM pais');
 

    
    const verToask = {
        titulo : name,
        body   : "Se ha creado correctamente",
        tipo   : "Crear"
    };
    //console.log(verToask);
    res.render('mantenedores/pais', { verToask, req ,paises,layout: 'template'});

});

router.post('/editPais', async (req,res) => {
    const {  id, name } = req.body; //Obtener datos title,url,description

    const newPais  ={ //Se gurdaran en un nuevo objeto
        pais : name 
    };
    //Guardar datos en la BD     
    await pool.query('UPDATE pais set ? WHERE id = ?', [newPais, id]);
  

   const paises = await pool.query('SELECT * FROM pais');

   
   const verToask = {
       titulo : name,
       body   : "Se ha editado correctamente",
       tipo   : "Editar"
   };
   //console.log(verToask);
   res.render('mantenedores/pais', { verToask, req ,paises,layout: 'template'});

});


router.get('/pais/edit/:id', async (req, res) => {
    const { id } = req.params;
    const paises = await pool.query('SELECT * FROM pais');
    const pais = await pool.query('SELECT * FROM pais WHERE id = ?', [id]);
    res.render('mantenedores/pais', { req , paises, pais: pais[0], layout: 'template'});
    
});
router.get('/pais/delete/:id', async (req, res) => {
    const { id } = req.params;
    const nombre = await pool.query('SELECT pais FROM pais WHERE id = ?', [id]);
    //console.log(nombre);

    await pool.query('DELETE FROM pais WHERE ID = ?', [id]);


    const paises = await pool.query('SELECT * FROM pais');



    const verToask = {
    
        titulo : nombre[0].pais,
        body   : "Se ha eliminado correctamente ",
        tipo   : "Eliminar"
    };
    //console.log(verToask);
    res.render('mantenedores/pais', { verToask, req ,paises,layout: 'template'});


});



router.get('/centrocosto', isLoggedIn, async (req, res) => {
    const centrosCostos = await pool.query('SELECT * FROM centro_costo as t1 ORDER BY t1.centroCosto ASC');
    res.render('mantenedores/centrocosto', { req ,centrosCostos, layout: 'template'});
});

router.post('/addCentroCosto', async (req,res) => {
    const { name } = req.body; //Obtener datos title,url,description

    const newCenctroCosto  ={ //Se gurdaran en un nuevo objeto
        centroCosto : name 
    };
    //Guardar datos en la BD     
    const result = await pool.query('INSERT INTO centro_costo set ?', [newCenctroCosto]);//Inserción
    //res.redirect('../mantenedores/centrocosto');

    const centrosCostos = await pool.query('SELECT * FROM centro_costo');
    //console.log(usuarios);

    
    const verToask = {
        titulo : name,
        body   : "Se ha creado correctamente",
        tipo   : "Crear"
    };
    //console.log(verToask);
    res.render('mantenedores/centrocosto', { verToask, req ,centrosCostos,layout: 'template'});


})

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
  

    const centrosCostos = await pool.query('SELECT * FROM centro_costo');
    //console.log(usuarios);

    
    const verToask = {
        titulo : name,
        body   : "Se ha editado correctamente",
        tipo   : "Editar"
    };
    //console.log(centro_costo);
    res.render('mantenedores/centrocosto', { verToask, req ,centrosCostos,layout: 'template'});
  
})

router.get('/centrocosto/delete/:id', async (req, res) => {
    const { id } = req.params;


    const nombre = await pool.query('SELECT centroCosto FROM centro_costo WHERE id = ?', [id]);
    console.log(nombre);

    await pool.query('DELETE FROM centro_costo WHERE ID = ?', [id]);
    //res.redirect('/mantenedores/centrocosto');

    const centrosCostos = await pool.query('SELECT * FROM centro_costo');
    //console.log(usuarios);

    
    const verToask = {
        titulo :nombre[0].centroCosto,
        body   : "Se ha eliminado correctamente ",
        tipo   : "Eliminar"
    };
    //console.log(centro_costo);
    const centroEliminado = id;
    //console.log(centroEliminado);
    res.render('mantenedores/centrocosto', { verToask, req ,centroEliminado,centrosCostos,layout: 'template'});

})

router.get('/categoria', isLoggedIn, async (req, res) => {
    const categorias = await pool.query('SELECT t1.*, t2.centroCosto FROM categorias as t1 , centro_costo as t2 where t1.idCentroCosto = t2.id ORDER BY t1.categoria ASC');
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
    const categorias = await pool.query('SELECT * FROM categorias as t1 , centro_costo as t2 where t1.idCentroCosto = t2.id ORDER BY t1.categoria ASC');
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
   //res.redirect('../mantenedores/categoria');

   const categorias = await pool.query('SELECT t1.*, t2.centroCosto FROM categorias as t1 , centro_costo as t2 where t1.idCentroCosto = t2.id ORDER BY t1.categoria ASC');
   //console.log(usuarios);

   
   const verToask = {
       titulo : name,
       body   : "Se ha editado correctamente",
       tipo   : "Editar"
   };
   //console.log(verToask);
   res.render('mantenedores/categoria', { verToask, req ,categorias,layout: 'template'});

})

router.post('/eddCategoria', async (req,res) => {
    const {  id, name , idCentroCosto , valorhh} = req.body;//Obtener datos title,url,description

    const newCategoria  ={ //Se gurdaran en un nuevo objeto
        idCentroCosto : idCentroCosto,
        categoria : name,
        valorHH : valorhh
    };
  //Guardar datos en la BD     
  const result = await pool.query('INSERT INTO categorias set ?', [newCategoria]);//Inserción
  //res.redirect('../mantenedores/categoria');

  const categorias = await pool.query('SELECT t1.*, t2.centroCosto FROM categorias as t1 , centro_costo as t2 where t1.idCentroCosto = t2.id ORDER BY t1.categoria ASC');
  const centrosCostos = await pool.query('SELECT * FROM centro_costo');
  //console.log(categorias);

  
  const verToask = {
      titulo : name,
      body   : "Se ha creado correctamente",
      tipo   : "Crear"
  };
  //console.log(verToask);
  res.render('mantenedores/categoria', { verToask, req ,categorias,centrosCostos,layout: 'template'});

})


router.get('/categoria/delete/:id', async (req, res) => {
    const { id } = req.params;

    const nombre = await pool.query('SELECT categoria FROM categorias WHERE id = ?', [id]);
    ///console.log(nombre);



    await pool.query('DELETE FROM categorias WHERE ID = ?', [id]);
    //res.redirect('/mantenedores/categoria');

    const categorias = await pool.query('SELECT t1.*, t2.centroCosto FROM categorias as t1 , centro_costo as t2 where t1.idCentroCosto = t2.id ORDER BY t1.categoria ASC');
    //console.log(usuarios);
 
    
    const verToask = {
        titulo : nombre[0].categoria,
        body   : "Se ha eliminado correctamente ",
        tipo   : "Eliminar"
    };
    //console.log(verToask);
    res.render('mantenedores/categoria', { verToask, req ,categorias,layout: 'template'});
})


router.post('/addSucursal', async (req,res) => {
    const {  id_pais, direccion , fono } = req.body;//Obtener datos title,url,description

    const newSucursal  ={ //Se gurdaran en un nuevo objeto
        id_pais : id_pais,
        direccion : direccion,
        fono : fono
    };
    //Guardar datos en la BD     
    const result = await pool.query('INSERT INTO sys_sucursal set ?', [newSucursal]);//Inserción
    // console.log(result["insertId"]);

    // query para buscar el ultimo id ingresado

    const sucursal = await pool.query('SELECT * FROM sys_sucursal WHERE id_Sucursal = ?', [result["insertId"]]);

    const verToask = {
        titulo : sucursal[0].direccion,
        body   : "Se ha creado correctamente",
        tipo   : "Crear"
    };

    

    const sucursales = await pool.query("SELECT t1.*, t2.pais FROM sys_sucursal as t1, pais as t2 where t1.id_pais = t2.id");
    const paises = await pool.query("SELECT * FROM pais ");
    res.render('mantenedores/sucursal', { verToask, req ,sucursales,paises,layout: 'template'});



})

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
  
   const sucursal = await pool.query('SELECT * FROM sys_sucursal WHERE id_Sucursal = ?', [id]);

   
   const verToask = {
       titulo : sucursal[0].direccion,
       body   : "Se ha editado correctamente",
       tipo   : "Editar"
   };
  
   const sucursales = await pool.query("SELECT t1.*, t2.pais FROM sys_sucursal as t1, pais as t2 where t1.id_pais = t2.id");
   const paises = await pool.query("SELECT * FROM pais ");
   res.render('mantenedores/sucursal', { verToask, req ,sucursales,paises,layout: 'template'});

})

router.get('/sucursal/delete/:id', async (req, res) => {
    const { id } = req.params;

    const nombre = await pool.query('SELECT direccion FROM sys_sucursal WHERE id_Sucursal = ?', [id]);
    //console.log(nombre);



    await pool.query('DELETE FROM sys_sucursal WHERE id_Sucursal = ?', [id]);
    //res.redirect('/mantenedores/categoria');

    const sucursales = await pool.query('SELECT * FROM sys_sucursal');
    //console.log(usuarios);
 
    
    const verToask = {
        titulo : nombre[0].direccion,
        body   : "Se ha eliminado correctamente ",
        tipo   : "Eliminar"
    };
    //console.log(verToask);
    res.render('mantenedores/sucursal', { verToask, req ,sucursales,layout: 'template'});
})




/* AGREGAR */
router.get('/tipoProyecto', isLoggedIn, async (req, res) => {
    const proyectos = await pool.query('SELECT * FROM proyecto_tipo');
    res.render('mantenedores/tipoProyecto', { req ,proyectos, layout: 'template'});
});

/* AGREGAR PROYECTO FUNCIONA*/
router.post('/addTipoProyecto', async (req,res) => {
    const { id, descripcion } = req.body; //Obtener datos title,url,description

    const newProyecto  ={ //Se gurdaran en un nuevo objeto
        id: id,
        descripcion : descripcion 
    };

    //Guardar datos en la BD     
    const result = await pool.query('INSERT INTO proyecto_tipo set ?', [newProyecto]);//Inserción
    //res.redirect('../mantenedores/pais');


    const proyectos = await pool.query('SELECT * FROM proyecto_tipo');
    //console.log(usuarios);

    
    const verToask = {
        titulo : descripcion,
        body   : "Se ha creado correctamente",
        tipo   : "Crear"
    };
    //console.log(verToask);
    res.render('mantenedores/tipoProyecto', { verToask, req ,proyectos,layout: 'template'});

})


router.get('/tipoProyecto/edit/:id', async (req, res) => {
    const { id } = req.params;
    const proyectos = await pool.query('SELECT * FROM proyecto_tipo');
    const proyecto = await pool.query('SELECT * FROM proyecto_tipo WHERE id = ?', [id]);
    res.render('mantenedores/tipoProyecto', { req , proyectos, proyecto: proyecto[0], layout: 'template'});
    
});

router.post('/editTipoProyecto', async (req,res) => {
    const {  id, descripcion } = req.body; //Obtener datos id, descripcion

    const newProyecto  ={ //Se gurdaran en un nuevo objeto
        descripcion : descripcion 
    };
    //Guardar datos en la BD     
    await pool.query('UPDATE proyecto_tipo set ? WHERE id = ?', [newProyecto, id]);
    //res.redirect('../mantenedores/pais');

    const proyectos = await pool.query('SELECT * FROM proyecto_tipo');
    //console.log(usuarios);

    
    const verToask = {
        titulo : descripcion,
        body   : "Se ha editado correctamente",
        tipo   : "Editar"
    };
    //console.log(verToask);
    res.render('mantenedores/tipoProyecto', { verToask, req ,proyectos,layout: 'template'});

});


/* ELIMINAR PROYECTO FUNCIONA*/
router.get('/tipoProyecto/delete/:id', async (req, res) => {
    const { id } = req.params;

    const nombre = await pool.query('SELECT descripcion FROM proyecto_tipo WHERE id = ?', [id]);
    console.log(nombre);

    await pool.query('DELETE FROM proyecto_tipo WHERE ID = ?', [id]);


    const proyectos = await pool.query('SELECT * FROM proyecto_tipo');



    const verToask = {
    
        titulo : nombre[0].descripcion,
        body   : "Se ha eliminado correctamente ",
        tipo   : "Eliminar"
    };
    //console.log(verToask);
    res.render('mantenedores/tipoProyecto', { verToask, req ,proyectos,layout: 'template'});

})


router.post('/ajax-validarNombreCentroCosto', async (req,res) => {
    
    const nombreACargar = req.body.name;

    const nombreCentroCostos = await pool.query('SELECT * FROM centro_costo WHERE centroCosto = ?',[nombreACargar]);

    //console.log(nombreCentroCostos);

    res.send(nombreCentroCostos);
});

router.post('/ajax-validarNombreLogin', async (req,res) => {
    
    const nombreACargar = req.body.login;

    const EmailACargar = req.body.Email;


    const nombreLogin = await pool.query('SELECT * FROM sys_usuario WHERE login = ?',[nombreACargar]);
    const EmaliLogin = await pool.query('SELECT * FROM sys_usuario WHERE Email = ?',[EmailACargar]);

    var mensaje = "";
    if (nombreLogin.length > 0)
    {
        //console.log("Existe Login");
        mensaje = " No se pueden crear un usuario con un login Existente.\n";
    }

    if (EmaliLogin.length > 0)
    {
        mensaje = mensaje + " No se pueden crear un usuario con un Mail Existente.";
    }

    res.send(mensaje);
});






//ajax-validarNombrePais

router.post('/ajax-validarNombrePais', async (req,res) => {
    
    const nombreACargar = req.body.name;

    const nombrePaises = await pool.query('SELECT * FROM pais WHERE pais = ?',[nombreACargar]);

    res.send(nombrePaises);
})

//ajax-validarNombreTipoProyecto

router.post('/ajax-validarNombreTipoProyecto', async (req,res) => {
    
    const nombreACargar = req.body.descripcion;

    const nombreTipoProyecto = await pool.query('SELECT * FROM proyecto_tipo WHERE descripcion = ?',[nombreACargar]);

    res.send(nombreTipoProyecto);
})


router.post('/ajax-validarNombreCategoria', async (req,res) => {
    
    const nombreACargar = req.body.name;

    const nombreCategoria = await pool.query('SELECT * FROM categorias WHERE categoria = ?',[nombreACargar]);

    res.send(nombreCategoria);
});




function esNumero (dato){
    /*Definición de los valores aceptados*/
    var valoresAceptados = /^[0-9]+$/;
    if (dato.indexOf(".") === -1 ){
        if (dato.match(valoresAceptados)){
           return true;
        }else{
           return false;
        }
    }else{
        //dividir la expresión por el punto en un array
        var particion = dato.split(".");
        //evaluamos la primera parte de la división (parte entera)
        if (particion[0].match(valoresAceptados) || particion[0]==""){
            if (particion[1].match(valoresAceptados)){
                return true;
            }else {
                return false;
            }
        }else{
            return false;
        }
    }
}


/// Tipo Servicio

router.get('/tipoServicio/', async (req, res) => {
    
    const tipos_servicio = await pool.query('SELECT * FROM proyecto_servicio as t1 ORDER BY t1.descripcion');

    res.render('mantenedores/tipoServicio', { req ,tipos_servicio, layout: 'template'});

});

/// POST addTipoServicio
router.post('/addTipoServicio', async (req,res) => {
    const { descripcion } = req.body; //Obtener datos title,url,description
    console.log(req.body);

    const newTipoServicio  ={ //Se gurdaran en un nuevo objeto
        descripcion : descripcion 
    };
    //Guardar datos en la BD     
    const result = await pool.query('INSERT INTO proyecto_servicio set ?', [newTipoServicio]);//Inserción
 


    const tipos_servicio = await pool.query('SELECT * FROM proyecto_servicio as t1 ORDER BY t1.descripcion');
 

    
    const verToask = {
        titulo : descripcion,
        body   : "Se ha creado correctamente",
        tipo   : "Crear"
    };
    //console.log(verToask);
    res.render('mantenedores/tipoServicio', { verToask, req ,tipos_servicio,layout: 'template'});

});

router.get('/tipoServicio/delete/:id', async (req, res) => {
    const { id } = req.params;
    const descripcion = await pool.query('SELECT descripcion FROM proyecto_servicio WHERE id = ?', [id]);
    //console.log(nombre);

    await pool.query('DELETE FROM proyecto_servicio WHERE ID = ?', [id]);

    const tipos_servicio = await pool.query('SELECT * FROM proyecto_servicio as t1 ORDER BY t1.descripcion');

    const verToask = {
    
        titulo : descripcion[0].descripcion,
        body   : "Se ha eliminado correctamente ",
        tipo   : "Eliminar"
    };
    //console.log(verToask);
    res.render('mantenedores/tipoServicio', { verToask, req ,tipos_servicio,layout: 'template'});


});

router.get('/tipoServicio/edit/:id', async (req, res) => {
    const { id } = req.params;

    const tipos_servicio = await pool.query('SELECT * FROM proyecto_servicio as t1 ORDER BY t1.descripcion');

    const servicio = await pool.query('SELECT * FROM proyecto_servicio WHERE id = ?', [id]);

    console.log(tipos_servicio);
    console.log(servicio);
    
    res.render('mantenedores/tipoServicio', { req , tipos_servicio, servicio: servicio[0], layout: 'template'});
    
});

router.post('/editTipoServicio', async (req,res) => {
    const {  id, descripcion } = req.body; //Obtener datos title,url,description

    const newTipoServicio  ={ //Se gurdaran en un nuevo objeto
        descripcion : descripcion 
    };
    //Guardar datos en la BD     
    await pool.query('UPDATE proyecto_servicio set ? WHERE id = ?', [newTipoServicio, id]);
  

   const tipos_servicio = await pool.query('SELECT * FROM proyecto_servicio as t1 ORDER BY t1.descripcion');

   
   const verToask = {
       titulo : descripcion,
       body   : "Se ha editado correctamente",
       tipo   : "Editar"
   };
   //console.log(verToask);
   res.render('mantenedores/tipoServicio', { verToask, req ,tipos_servicio,layout: 'template'});

});


// MONEDAS 
router.get('/monedas/', async (req, res) => {
    
    const monedas = await pool.query("SELECT * FROM moneda_tipo as t1 WHERE t1.factura= 'Y' ORDER BY t1.descripcion");

    res.render('mantenedores/monedas', { req ,monedas, layout: 'template'});

});

router.post('/addMoneda', async (req,res) => {
    const { descripcion, simbolo } = req.body; //Obtener datos title,url,description
    

    const newMoneda  ={ //Se gurdaran en un nuevo objeto
        simbolo : simbolo,
        descripcion :descripcion,
        factura : 'Y'
    };
    //Guardar datos en la BD     
    const result = await pool.query('INSERT INTO moneda_tipo set ?', [newMoneda]);//Inserción
 


    const monedas = await pool.query("SELECT * FROM moneda_tipo as t1 WHERE t1.factura= 'Y' ORDER BY t1.descripcion");
 

    
    const verToask = {
        titulo : descripcion,
        body   : "Se ha creado correctamente",
        tipo   : "Crear"
    };
    //console.log(verToask);
    res.render('mantenedores/monedas', { verToask, req ,monedas,layout: 'template'});

});

router.get('/monedas/delete/:id_moneda', async (req, res) => {
    const { id_moneda } = req.params;
    const descripcion = await pool.query('SELECT descripcion FROM moneda_tipo WHERE id_moneda = ?', [id_moneda]);
    //console.log(nombre);

    await pool.query('DELETE FROM moneda_tipo WHERE id_moneda = ?', [id_moneda]);

    const monedas = await pool.query("SELECT * FROM moneda_tipo as t1 WHERE t1.factura= 'Y' ORDER BY t1.descripcion");

    const verToask = {
    
        titulo : descripcion[0].descripcion,
        body   : "Se ha eliminado correctamente ",
        tipo   : "Eliminar"
    };
    //console.log(verToask);
    res.render('mantenedores/monedas', { verToask, req ,monedas,layout: 'template'});


});

router.get('/monedas/edit/:id_moneda', async (req, res) => {
    const { id_moneda } = req.params;

    const monedas = await pool.query("SELECT * FROM moneda_tipo as t1 WHERE t1.factura= 'Y' ORDER BY t1.descripcion");

    const moneda = await pool.query('SELECT * FROM moneda_tipo WHERE id_moneda = ?', [id_moneda]);

    
    res.render('mantenedores/monedas', { req , monedas, moneda: moneda[0], layout: 'template'});
    
});

router.post('/editMoneda', async (req,res) => {
    const {  id, descripcion , simbolo} = req.body; //Obtener datos title,url,description

    const newMoneda  ={ //Se gurdaran en un nuevo objeto
        descripcion : descripcion,
        simbolo : simbolo 
    };
    //Guardar datos en la BD     
    await pool.query('UPDATE moneda_tipo set ? WHERE id_moneda = ?', [newMoneda, id]);
  
console.log(req.body);
   const monedas = await pool.query("SELECT * FROM moneda_tipo as t1 WHERE t1.factura= 'Y' ORDER BY t1.descripcion");

   
   const verToask = {
       titulo : descripcion,
       body   : "Se ha editado correctamente",
       tipo   : "Editar"
   };
   //console.log(verToask);
   res.render('mantenedores/monedas', { verToask, req ,monedas,layout: 'template'});

});







module.exports = router;