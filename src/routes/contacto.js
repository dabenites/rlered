const express = require('express');
const router = express.Router();


//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

var url = require('url');


router.get('/listado', isLoggedIn, async (req, res) => {

    const keys_words  = await pool.query("SELECT * FROM contacto_key");
    const infokeys = {};
    keys_words.forEach(function(elemento, indice, array) {
        if (infokeys[elemento.id_contacto_key] === undefined)
        {
            infokeys[elemento.id_contacto_key] = elemento.descripcion;
        }
    });


    const contactos  = await pool.query(" SELECT  * FROM contacto ");
    //const contactos  = await pool.query("SELECT * FROM contacto  AS t WHERE t.keys_words != '' ");

    contactos.forEach((element, i) => {
        
        //console.log(separa);
        var categoria = "";
        if (element["keys_words"] != null)
        {
            var separa = element["keys_words"].split(",");
            separa.forEach(element => {
                if (element != "")
                {
                    categoria = categoria + infokeys[element] + " ,";
                }
            });
        }
        if (categoria.length > 0)
        {
            categoria = categoria.substring(0,categoria.length - 1);
        }
        contactos[i]["keys_words"] = categoria;
    });


    var mensaje = -1;
    //console.log(req.query);
    if (req.query.a !== undefined)
    {
        mensaje = req.query.a;
    }

    if (mensaje !== -1)
    { 
        const verToask = {
        titulo : "Mensaje",
        body   : "Contacto actualizado",
        tipo   : "Crear"
            };
    
        res.render('contacto/listado', { verToask, contactos , req ,layout: 'template'});
    }
    else
    {
        res.render('contacto/listado', { contactos , req ,layout: 'template'});
    }


    
}); 

router.get('/listadov', isLoggedIn, async (req, res) => {

    const keys_words  = await pool.query("SELECT * FROM contacto_key");
    const infokeys = {};
    keys_words.forEach(function(elemento, indice, array) {
        if (infokeys[elemento.id_contacto_key] === undefined)
        {
            infokeys[elemento.id_contacto_key] = elemento.descripcion;
        }
    });


    const contactos  = await pool.query(" SELECT  * FROM contacto ");
    //const contactos  = await pool.query("SELECT * FROM contacto  AS t WHERE t.keys_words != '' ");

    contactos.forEach((element, i) => {
        //console.log(separa);
        var categoria = "";
        if (element["keys_words"] != null)
        {
            var separa = element["keys_words"].split(",");

            separa.forEach(element => {
                if (element != "")
                {
                    categoria = categoria + infokeys[element] + " ,";
                }
            });
        }
        if (categoria.length > 0)
        {
            categoria = categoria.substring(0,categoria.length - 1);
        }
        contactos[i]["keys_words"] = categoria;
    });


    
    res.render('contacto/listado', { visor:true, contactos , req ,layout: 'template'});
}); 


router.post('/ajaxNombre', async (req,res) => {
    
    //console.log(req.body['NombreContacto']);
    const nombreSimilar = await pool.query(  ' SELECT ' +
							                            ' * ' +
						                    ' FROM  ' +
								                        ' contacto AS t1 ' +
						                    ' WHERE ' +
                                                         '1 = 1 ' +
                                            '   AND '   +
                                                         " t1.name like '%"+ req.body['NombreContacto'] +"%'") ;

    //console.log(nombreSimilar);
    //console.log(nombreSimilar.length);

    if (nombreSimilar.length == 0)
    {
        res.send("1");
    }
    else
    {
        // aplicar render.
        res.render('contacto/tablasimilar', {nombreSimilar,layout: 'blanco'}); 
    }


    
});

router.post('/bFormIngreso', async (req,res) => {
    
    const nombre = req.body['iNombreContacto'];
    const empresas = await pool.query(' SELECT ' +
                                                    ' * ' +
                                        ' FROM  ' +
                                                    ' contacto AS t1 ' +
                                        ' WHERE ' +
                                                   't1.grupo = 1 ' +
                                        '  ORDER BY t1.name ASC ');
    
    res.render('contacto/ingresarContacto', {empresas, nombre, layout: 'blanco'}); 



    
});

//uptContacto
router.post('/uptContacto', async (req,res) => {

  //  console.log(req.body);


    // console.log(req.body);
   const nombre = req.body['iNombreContacto'];
   const direccion = req.body['iDireccionContacto:'];
   const telefono = req.body['iTelefonoContacto'];
   const tipo_conctacto = req.body['iTipoContacto'];
   const movil = req.body['iMovilContacto'];
   const durl = req.body['iUrlContacto'];
   const e_mail = req.body['iMailContacto'];
   const comentario = req.body['iComentarioContacto'];
   const concepto = req.body['categorias'];
   const id= req.body['id'];

   const unContacto ={ 
    name :  nombre,
    address1   : direccion,
    phone :  telefono ,
    url : durl,
    email : e_mail,
    comments : comentario,
    movil : movil,
    grupo : tipo_conctacto,
    keys_words : concepto
   }; 

   await pool.query('UPDATE contacto set ? WHERE id = ?', [unContacto, id]);


    res.redirect(   url.format({
        pathname:'/contacto/listado',
        query: {
           "a": 1
         }
      }));



});

router.post('/addContacto', async (req,res) => {
    
   
   // console.log(req.body);
   const nombre = req.body['nombre'];
   const direccion = req.body['direccion'];
   const telefono = req.body['telefono'];
   const tipo_conctacto = req.body['tipo_conctacto'];
   const empresa_asociada = req.body['empresa_asociada'];
   const movil = req.body['movil'];
   const url = req.body['url'];
   const e_mail = req.body['e_mail'];
   const comentario = req.body['comentario'];
   const concepto = req.body['concepto'];

   const unContacto ={ 
    name :  nombre,
    address1   : direccion,
    phone :  telefono ,
    url : url,
    email : e_mail,
    comments : comentario,
    movil : movil,
    grupo : tipo_conctacto,
    otro_contacto : empresa_asociada,
    keys_words : concepto
   }; 

   const result = pool.query('INSERT INTO contacto set ?', [unContacto]);
    
   //res.send("Cargar nuevamente la informacion con el toask incluido");
   //res.redirect("../ploter/ploteo");

   
    res.send("mensaje");

});

// /contacto/delete/2475
router.get('/contacto/delete/:id', async (req, res) => {
    const { id } = req.params;
    

    const nombre = await pool.query('SELECT * FROM contacto WHERE id = ?', [id]);
   //console.log(nombre);

    await pool.query('DELETE FROM contacto WHERE id = ?', [id]);
    //res.redirect('/mantenedores/usuario');

    
    const verToask = {
    
        titulo : nombre[0].name,
        body   : "Se ha eliminado correctamente ",
        tipo   : "Eliminar"
    };

  
    const keys_words  = await pool.query("SELECT * FROM contacto_key");
    const infokeys = {};
    keys_words.forEach(function(elemento, indice, array) {
        if (infokeys[elemento.id_contacto_key] === undefined)
        {
            infokeys[elemento.id_contacto_key] = elemento.descripcion;
        }
    });


    const contactos  = await pool.query(" SELECT  * FROM contacto ");
    //const contactos  = await pool.query("SELECT * FROM contacto  AS t WHERE t.keys_words != '' ");

    contactos.forEach((element, i) => {
        
        //console.log(separa);
        var categoria = "";
        if (element["keys_words"] != null)
        {
            var separa = element["keys_words"].split(",");
            separa.forEach(element => {
                if (element != "")
                {
                    categoria = categoria + infokeys[element] + " ,";
                }
            });
        }
        if (categoria.length > 0)
        {
            categoria = categoria.substring(0,categoria.length - 1);
        }
        contactos[i]["keys_words"] = categoria;
    });

    res.render('contacto/listado', { verToask, contactos , req ,layout: 'template'});

    
});

router.get('/contacto/editar/:id', async (req, res) => {

    
    const { id } = req.params;

    /// contacto
    const keys_words  = await pool.query("SELECT * FROM contacto_key");

    const tipo_contacto  = await pool.query("SELECT * FROM contacto_tipo");

    const contacto  = await pool.query("SELECT *," +
                                       " if(t.keys_words LIKE '%1%','checked','') AS arquitecto," +
                                       " if(t.keys_words LIKE '%2%','checked','') AS constructora," +
                                       " if(t.keys_words LIKE '%3%','checked','') AS ito," +
                                       " if(t.keys_words LIKE '%4%','checked','') AS inmobiliaria," +
                                       " if(t.keys_words LIKE '%5%','checked','') AS mecsuelo," +
                                       " if(t.keys_words LIKE '%6%','checked','') AS postensado," +
                                       " if(t.keys_words LIKE '%7%','checked','') AS murocortina " +
                                       " FROM contacto as t WHERE t.id = "+id+"");

    const isEqualHelperHandlerbar = function(a, b, opts) {
        // console.log(a + "----" + b);
         if (a == b) {
             return true
         } else { 
             return false
         } 
     };

    res.render('contacto/editar', { tipo_contacto, contacto:contacto[0],req ,layout: 'template', helpers : {
        if_equal : isEqualHelperHandlerbar
    }});

});






module.exports = router;