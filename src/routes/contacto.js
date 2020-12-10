const express = require('express');
const router = express.Router();


//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/listado', isLoggedIn, async (req, res) => {

    const keys_words  = await pool.query("SELECT * FROM contacto_key");
    const infokeys = {};
    keys_words.forEach(function(elemento, indice, array) {
        if (infokeys[elemento.id_contacto_key] === undefined)
        {
            infokeys[elemento.id_contacto_key] = elemento.descripcion;
        }
    });


    //const contactos  = await pool.query(" SELECT  * FROM contacto ");
    const contactos  = await pool.query("SELECT * FROM contacto  AS t WHERE t.keys_words != '' LIMIT 10");

    contactos.forEach((element, i) => {
        var separa = element["keys_words"].split(",");
        //console.log(separa);
        var categoria = "";
        separa.forEach(element => {
            if (element != "")
            {
                categoria = categoria + infokeys[element] + " ,";
            }
        });
        contactos[i]["keys_words"] = categoria;
    });

    res.render('contacto/listado', { contactos , req ,layout: 'template'});
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
   const contactos  = await pool.query(" SELECT  * FROM contacto");
                                                
    res.render('contacto/listado', { contactos , req ,layout: 'template'});
    

});


module.exports = router;