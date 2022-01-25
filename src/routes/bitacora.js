const express = require('express');
const router = express.Router();
var dateFormat = require('dateformat');


//importar una conexión a DB
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');


router.get('/ingresoHoras', isLoggedIn, async (req, res) => {

    const etapas = await pool.query("SELECT * FROM bita_etapas");

    //console.log(req.user.idUsuario);
    // buscar los proyectos que solo tengo permiso como usuario 

   // const proyectos = await pool.query("SELECT * FROM pro_proyectos");
   const proyectos = await pool.query(" SELECT  " +
                                                " t2.* " +
                                      " FROM " +
                                                " pro_equipo AS t1, " +
	                                            " pro_proyectos AS t2 " +
                                      " WHERE  " +
		                                        " t1.id_usuario = "+req.user.idUsuario+" " +
                                      " AND " +
	                                            " t1.id_proyecto = t2.id " +
                                      " ORDER BY t2.year DESC, t2.code DESC, t2.nombre ASC " );

    //res.render('bitacora/bitacora', {etapas, proyectos, req ,layout: 'template'});
    res.render('bitacora/bitacora', {etapas, proyectos, req ,layout: 'template'});
    //res.send("asd");
});

router.post('/cargaOpcionesEtapa', isLoggedIn, async (req, res) => {

    const { idEtapa} = req.body;

    const opciones = await pool.query("SELECT * FROM bita_tarea as t1 WHERE t1.idEtapa = ? ", [idEtapa]);

    //res.render('bitacora/bitacora', {etapas, req ,layout: 'template'});

    

    res.render('bitacora/optionValues', {opciones, layout: 'blanco'});
});



router.post('/eliminarHoras', isLoggedIn, async (req, res) => {
    //console.log(req.body);

    const { idEliminar} = req.body;

    const opciones = await pool.query("DELETE FROM `rle_red`.`bita_horas` WHERE `id_bitacora_time`= ? ", [idEliminar]);

    res.redirect("../bitacora/ingresoHoras");

});

//cargarHoras

router.post('/cargarHoras', isLoggedIn, async (req, res) => {

   const { tipoP, fechaI,horaI,fechaT,horaT,esmoficacaciones,idProyecto,idEtapaProyecto,idTarea,descripcion,actividad,tipoIngreso} = req.body;

   // primero saber si es solo un dia de carga 
   //var start = new Date(fechaI);
   //var end = new Date(fechaT);

 //  console.log(req.body);
   

   var divFechaI = fechaI.split("/", 3);
   var divFechaT = fechaT.split("/", 3);

   var start = new Date(divFechaI[2],(divFechaI[1] - 1),divFechaI[0]);
   var end = new Date(divFechaT[2],(divFechaT[1] - 1),divFechaT[0]);

   var analisisHoraI = horaI.replace(":", "");
   var analisisHoraFI = horaT.replace(":", "");
   var analisisHoraAlmuerzoI = "1300";
   var analisisHoraAlmuerzoF = "1400";
   var analisisHoraAlmuerzoViernes = "1330";
   var mod = 0;
   if (esmoficacaciones == "on")
   {
        mod=1;
   }

   var fechaX = new Date(start);
   var hi = "";
   var hT = "";
   while(fechaX <= end){
       var annio = fechaX.getFullYear();
       var mees =  (fechaX.getMonth()+ 1);
       var diia =  fechaX.getDate();

      // console.log(annio + "///" + mees + "///" + diia);
      

       if (start.toString() != fechaX.toString())
       {
            hi = "08:00";
            analisisHoraI = "08:00";
       }
       else
       {
           hi = horaI;
           analisisHoraI = horaI.replace(":", "");
       }
       if (end.toString() != fechaX.toString())
       {
            hT = "18:30";
            analisisHoraFI = "18:30";
       }
       else
       {
            hT = horaT;
            analisisHoraFI = horaT.replace(":", "");
       }
       
       if (fechaX.getDay() == 5) // es viernes 
       {

            const proyeto = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ?", [idProyecto]);

            if (analisisHoraI < analisisHoraAlmuerzoViernes)
            {
                if (analisisHoraFI > analisisHoraAlmuerzoViernes) // solo puede llenar horas hasta las 13:30 los dias viernes 
                {                    
                    var startTime = new Date(dateFormat(annio+"-" +mees + "-" + diia + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss")); 
                    var endTime = new Date(dateFormat(annio+"-" +mees + "-" + diia + " " + "13:30:00", "yyyy-mm-dd HH:MM:ss"));

                    var difference = endTime.getTime() - startTime.getTime(); // This will give difference in milliseconds
                    var resultInHours = Math.round(difference / 60000) / 60;
                    
                    if (tipoIngreso == "1")
                    {
                        const newRegistroBitacora  ={ //Se gurdaran en un nuevo objeto
                            ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss") ,
                            fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + "13:30:00", "yyyy-mm-dd HH:MM:ss") ,
                            title:proyeto[0].year + "-" +proyeto[0].code + " : " + proyeto[0].nombre,
                            body:descripcion,
                            id_session:req.user.idUsuario,
                            id_project:idProyecto ,
                            id_etapa:idEtapaProyecto,
                            id_tarea:idTarea,
                            numHH:resultInHours,
                            modificacion:mod,
                            costoHH : 15000,
                            id_tipo : 1
                        };

                        const result = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacora]);

                    }
                    else
                    {
                        
                        const newRegistroBitacora  ={ //Se gurdaran en un nuevo objeto
                            ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss") ,
                            fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + "13:30:00", "yyyy-mm-dd HH:MM:ss") ,
                            title:"Actividad No relacionada a Proyecto",
                            body:descripcion,
                            id_session:req.user.idUsuario,
                            id_project:actividad ,
                            numHH:resultInHours,
                            costoHH : 15000,
                            id_tipo : 2
                        };

                        const result = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacora]);
                    }

                }
                else
                {
                    var startTime = new Date(dateFormat(annio+"-" +mees + "-" + diia + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss")); 
                    var endTime = new Date(dateFormat(annio+"-" +mees + "-" + diia + " " + hT + ":00", "yyyy-mm-dd HH:MM:ss"));
                    var difference = endTime.getTime() - startTime.getTime(); // This will give difference in milliseconds
                    var resultInHours = Math.round(difference / 60000) / 60;

                    if (tipoIngreso == "1")
                    {
                        const newRegistroBitacora  ={ //Se gurdaran en un nuevo objeto
                            ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss") ,
                            fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hT + ":00", "yyyy-mm-dd HH:MM:ss") ,
                            title:proyeto[0].year + "-" +proyeto[0].code + " : " + proyeto[0].nombre,
                            body:descripcion,
                            id_session:req.user.idUsuario,
                            id_project:idProyecto ,
                            id_etapa:idEtapaProyecto,
                            id_tarea:idTarea,
                            numHH:resultInHours,
                            modificacion:mod,
                            costoHH : 15000,
                            id_tipo : 1
                        };

                        const result = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacora]);
                    }
                    else
                    {
                        const newRegistroBitacora  ={ //Se gurdaran en un nuevo objeto
                            ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss") ,
                            fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hT + ":00", "yyyy-mm-dd HH:MM:ss") ,
                            title:"Actividad No relacionada a Proyecto",
                            body:descripcion,
                            id_session:req.user.idUsuario,
                            id_project:actividad ,
                            numHH:resultInHours,
                            costoHH : 15000,
                            id_tipo : 2
                        };

                        const result = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacora]);

                    }
                }
            }
       }
       else
       {
            // ahora comprobar si esta incluida la hora de almuerzo para poder dividir el proceso dos veces. 
           // console.log("revisar lunes - jueves que llegue antes de almuerzo hasta las 13:00" + analisisHoraI + "//" + analisisHoraAlmuerzoI + "//" + analisisHoraFI +"//" );
        if(analisisHoraI < analisisHoraAlmuerzoI && analisisHoraFI <= analisisHoraAlmuerzoI) // ESto esta ok 
        {
            //console.log("revisar lunes - jueves que llegue antes de almuerzo hasta las 13:00");

            const proyeto = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ?", [idProyecto]);
            
            //var difference = dateFormat(dateFormat(fechaX,"dd-mm-yyyy") + " " + hT + ":00", "yyyy-mm-dd h:MM:ss") - dateFormat(dateFormat(fechaX,"dd-mm-yyyy") + " " + hi + ":00", "yyyy-mm-dd h:MM:ss"); 
            var startTime = new Date(dateFormat(annio+"-" +mees + "-" + diia + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss")); 
            var endTime = new Date(dateFormat(annio+"-" +mees + "-" + diia + " " + hT +":00", "yyyy-mm-dd HH:MM:ss"));

            var difference = endTime.getTime() - startTime.getTime(); // This will give difference in milliseconds
            var resultInHours = Math.round(difference / 60000) / 60;

            if (tipoIngreso == "1")
            {
                const newRegistroBitacora  ={ //Se gurdaran en un nuevo objeto
                    ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss") ,
                    fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hT + ":00", "yyyy-mm-dd HH:MM:ss") ,
                    title:proyeto[0].year + "-" +proyeto[0].code + " : " + proyeto[0].nombre,
                    body:descripcion,
                    id_session:req.user.idUsuario,
                    id_project:idProyecto ,
                    id_etapa:idEtapaProyecto,
                    id_tarea:idTarea,
                    numHH:resultInHours,
                    modificacion:mod,
                    costoHH : 15000,
                    id_tipo : 1
                };

                const result = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacora]);
            }
            else
            {
                const newRegistroBitacora  ={ //Se gurdaran en un nuevo objeto
                    ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss") ,
                    fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hT + ":00", "yyyy-mm-dd HH:MM:ss") ,
                    title:"Actividad No relacionada a Proyecto",
                    body:descripcion,
                    id_session:req.user.idUsuario,
                    id_project:actividad ,
                    numHH:resultInHours,
                    costoHH : 15000,
                    id_tipo : 2
                };

                const result = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacora]);
            }
            
        }
        else if(analisisHoraI < analisisHoraAlmuerzoI && analisisHoraFI <= analisisHoraAlmuerzoF) // ESto esta ok 
        {
            //console.log("revisar lunes - jueves que llegue antes de almuerzo hasta las 13:00");

            const proyeto = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ?", [idProyecto]);
            
            //var difference = dateFormat(dateFormat(fechaX,"dd-mm-yyyy") + " " + hT + ":00", "yyyy-mm-dd h:MM:ss") - dateFormat(dateFormat(fechaX,"dd-mm-yyyy") + " " + hi + ":00", "yyyy-mm-dd h:MM:ss"); 
            var startTime = new Date(dateFormat(annio+"-" +mees + "-" + diia + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss")); 
            var endTime = new Date(dateFormat(annio+"-" +mees + "-" + diia + " 13:00", "yyyy-mm-dd HH:MM:ss"));

            var difference = endTime.getTime() - startTime.getTime(); // This will give difference in milliseconds
            var resultInHours = Math.round(difference / 60000) / 60;

            if (tipoIngreso == "1")
            {
                const newRegistroBitacora  ={ //Se gurdaran en un nuevo objeto
                    ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss") ,
                    fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " 13:00", "yyyy-mm-dd HH:MM:ss") ,
                    title:proyeto[0].year + "-" +proyeto[0].code + " : " + proyeto[0].nombre,
                    body:descripcion,
                    id_session:req.user.idUsuario,
                    id_project:idProyecto ,
                    id_etapa:idEtapaProyecto,
                    id_tarea:idTarea,
                    numHH:resultInHours,
                    modificacion:mod,
                    costoHH : 15000,
                    id_tipo : 1
                };

                const result = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacora]);
            }
            else
            {
                const newRegistroBitacora  ={ //Se gurdaran en un nuevo objeto
                    ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss") ,
                    fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " 13:00", "yyyy-mm-dd HH:MM:ss") ,
                    title:"Actividad No relacionada a Proyecto",
                    body:descripcion,
                    id_session:req.user.idUsuario,
                    id_project:actividad ,
                    numHH:resultInHours,
                    costoHH : 15000,
                    id_tipo : 2
                };

                const result = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacora]);
            }
            
        }
        else if ( analisisHoraI >= analisisHoraAlmuerzoF && analisisHoraFI > analisisHoraAlmuerzoF) // las dos horas son mayores a la hora de almuerzo
        {
            const proyeto = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ?", [idProyecto]);
           
            
            var startTime = new Date(dateFormat(annio+"-" +mees + "-" + diia + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss")); 
            var endTime = new Date(dateFormat(annio+"-" +mees + "-" + diia + " " + hT +":00", "yyyy-mm-dd HH:MM:ss"));

            var difference = endTime.getTime() - startTime.getTime(); // This will give difference in milliseconds
            var resultInHours = Math.round(difference / 60000) / 60;
            
            if (tipoIngreso == "1")
            {
                const newRegistroBitacora  ={ //Se gurdaran en un nuevo objeto
                    ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss") ,
                    fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hT + ":00", "yyyy-mm-dd HH:MM:ss") ,
                    title:proyeto[0].year + "-" +proyeto[0].code + " : " + proyeto[0].nombre,
                    body:descripcion,
                    id_session:req.user.idUsuario,
                    id_project:idProyecto ,
                    id_etapa:idEtapaProyecto,
                    id_tarea:idTarea,
                    numHH:resultInHours,
                    modificacion:mod,
                    costoHH : 15000,
                    id_tipo : 1
                };

                const result = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacora]);  
            }
            else
            {
                const newRegistroBitacora  ={ //Se gurdaran en un nuevo objeto
                    ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss") ,
                    fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hT + ":00", "yyyy-mm-dd HH:MM:ss") ,
                    title:"Actividad No relacionada a Proyecto",
                    body:descripcion,
                    id_session:req.user.idUsuario,
                    id_project:actividad ,
                    numHH:resultInHours,
                    costoHH : 15000,
                    id_tipo : 2
                };

                const result = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacora]);  
            }
        }
      //  else if ( (analisisHoraI < analisisHoraAlmuerzoI || analisisHoraI < analisisHoraAlmuerzoF) 
      //        && (analisisHoraFI >= analisisHoraAlmuerzoF || analisisHoraFI >= analisisHoraAlmuerzoI))
      else if (analisisHoraI < analisisHoraAlmuerzoI && analisisHoraFI > analisisHoraAlmuerzoF )
        {
            
            const proyeto = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ?", [idProyecto]);
            //var startTime = new Date(dateFormat(annio+"-" +mees + "-" + diia + " " + hi + ":00", "yyyy-mm-dd h:MM:ss")); 

            var startTimeAM = new Date(dateFormat(annio+"-" +mees + "-" + diia + " " + hi + ":00")); 
            var endTimeAM = new Date(dateFormat(annio+"-" +mees + "-" + diia + " " + "13:00:00"));
            var differenceAM = endTimeAM.getTime() - startTimeAM.getTime(); // This will give difference in milliseconds
            var resultInHoursAM = Math.round(differenceAM / 60000) / 60;
            
            var startTimePM = new Date(dateFormat(annio+"-" +mees + "-" + diia  + " " +"14:00:00")); 
            var endTimePM = new Date(dateFormat(annio+"-" +mees + "-" + diia  + " " + hT +":00"));
            var differencePM = endTimePM.getTime() - startTimePM.getTime(); // This will give difference in milliseconds
            var resultInHoursPM = Math.round(differencePM / 60000) / 60;
            
            if (tipoIngreso == "1")
            {
                const newRegistroBitacoraAM  ={ //Se gurdaran en un nuevo objeto
                    ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss") ,
                    fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + "13:00:00", "yyyy-mm-dd HH:MM:ss") ,
                    title:proyeto[0].year + "-" +proyeto[0].code + " : " + proyeto[0].nombre,
                    body:descripcion,
                    id_session:req.user.idUsuario,
                    id_project:idProyecto ,
                    id_etapa:idEtapaProyecto,
                    id_tarea:idTarea,
                    numHH:resultInHoursAM,
                    modificacion:mod,
                    costoHH : 15000,
                    id_tipo : 1
                };

                const newRegistroBitacoraPM  ={ //Se gurdaran en un nuevo objeto
                                    ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + "14:00:00", "yyyy-mm-dd HH:MM:ss") ,
                                    fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " +  hT + ":00", "yyyy-mm-dd HH:MM:ss") ,
                                    title:proyeto[0].year + "-" +proyeto[0].code + " : " + proyeto[0].nombre,
                                    body:descripcion,
                                    id_session:req.user.idUsuario,
                                    id_project:idProyecto ,
                                    id_etapa:idEtapaProyecto,
                                    id_tarea:idTarea,
                                    numHH:resultInHoursPM,
                                    modificacion:mod,
                                    costoHH : 15000,
                                    id_tipo : 1
                                };

                const resultAM = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacoraAM]);
                const resultPM = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacoraPM]);

            }
            else
            {
                const newRegistroBitacoraAM  ={ //Se gurdaran en un nuevo objeto
                    ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hi + ":00", "yyyy-mm-dd HH:MM:ss") ,
                    fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + "13:00:00", "yyyy-mm-dd HH:MM:ss") ,
                    title:"Actividad No relacionada a Proyecto",
                    body:descripcion,
                    id_session:req.user.idUsuario,
                    id_project:actividad ,
                    numHH:resultInHoursAM,
                    costoHH : 15000,
                    id_tipo : 2
                };

                const newRegistroBitacoraPM  ={ //Se gurdaran en un nuevo objeto
                                    ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + "14:00:00", "yyyy-mm-dd HH:MM:ss") ,
                                    fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " +  hT + ":00", "yyyy-mm-dd HH:MM:ss") ,
                                    title:"Actividad No relacionada a Proyecto",
                                    body:descripcion,
                                    id_session:req.user.idUsuario,
                                    id_project:actividad ,
                                    numHH:resultInHoursPM,
                                    costoHH : 15000,
                                    id_tipo : 2
                                };

                const resultAM = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacoraAM]);
                const resultPM = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacoraPM]);

            }

        }
        else if ( analisisHoraI >= analisisHoraAlmuerzoI && analisisHoraI < analisisHoraAlmuerzoF) // las dos horas son mayores a la hora de almuerzo
        {
            //console.log(analisisHoraI + " >=///" + analisisHoraAlmuerzoI + "///" + analisisHoraI + "//// <" + analisisHoraAlmuerzoF);
            //console.log(analisisHoraI + " >=///" + hT);

            const proyeto = await pool.query("SELECT * FROM pro_proyectos as t1 WHERE t1.id = ?", [idProyecto]);
           
            
            var startTime = new Date(dateFormat(annio+"-" +mees + "-" + diia + " 14:00:00", "yyyy-mm-dd HH:MM:ss")); 
            var endTime = new Date(dateFormat(annio+"-" +mees + "-" + diia + " " + hT +":00", "yyyy-mm-dd HH:MM:ss"));

            var difference = endTime.getTime() - startTime.getTime(); // This will give difference in milliseconds
            var resultInHours = Math.round(difference / 60000) / 60;
            
            if (tipoIngreso == "1")
            {
                const newRegistroBitacora  ={ //Se gurdaran en un nuevo objeto
                    ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " 14:00:00", "yyyy-mm-dd HH:MM:ss") ,
                    fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hT + ":00", "yyyy-mm-dd HH:MM:ss") ,
                    title:proyeto[0].year + "-" +proyeto[0].code + " : " + proyeto[0].nombre,
                    body:descripcion,
                    id_session:req.user.idUsuario,
                    id_project:idProyecto ,
                    id_etapa:idEtapaProyecto,
                    id_tarea:idTarea,
                    numHH:resultInHours,
                    modificacion:mod,
                    costoHH : 15000,
                    id_tipo : 1
                };

                const result = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacora]);  
            }
            else
            {
                const newRegistroBitacora  ={ //Se gurdaran en un nuevo objeto
                    ini_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " 14:00:00", "yyyy-mm-dd HH:MM:ss") ,
                    fin_time: dateFormat(dateFormat(fechaX,"yyyy-mm-dd") + " " + hT + ":00", "yyyy-mm-dd HH:MM:ss") ,
                    title:"Actividad No relacionada a Proyecto",
                    body:descripcion,
                    id_session:req.user.idUsuario,
                    id_project:actividad ,
                    numHH:resultInHours,
                    costoHH : 15000,
                    id_tipo : 2
                };

                const result = await pool.query('INSERT INTO bita_horas set ? ', [newRegistroBitacora]);  
            }
        }
       }
      var newDate = fechaX.setDate(fechaX.getDate() + 1);
      fechaX = new Date(newDate);
   }




   res.redirect("../bitacora/ingresoHoras");

});

router.get('/getBitacora', async (req,res) => {


    const horas = await pool.query(" SELECT t.id_bitacora_time,  DATE_FORMAT(t.ini_time,'%Y-%m-%d %H:%i') AS ini_time,   " +
                                    " DATE_FORMAT(t.fin_time,'%Y-%m-%d %H:%i') AS  fin_time,  t.title,  t.body,  t2.year,  t2.code,  t2.nombre  , 1 as tipo" +
                                    " FROM bita_horas AS t , pro_proyectos as t2 WHERE  t2.id = t.id_project AND  t.id_session = "+req.user.idUsuario+" " +
                                    " UNION " +
                                    " SELECT t.id_bitacora_time,  DATE_FORMAT(t.ini_time,'%Y-%m-%d %H:%i') AS ini_time,   " +
                                    " DATE_FORMAT(t.fin_time,'%Y-%m-%d %H:%i') AS  fin_time,  t.title,  t.body,  'Actividad No relacionada a Proyecto',  '',  '' AS nombre , 1 as tipo" +
                                    " FROM bita_horas AS t  WHERE   t.id_session =  "+req.user.idUsuario+" AND t.id_tipo = 2"+
                                    " UNION " +
                                    " SELECT  " +
	                                " t1.id as id_bitacora_time,   " +
	                                " DATE_FORMAT(t3.fecha_inicio,'%Y-%m-%d %H:%i') AS ini_time,    " +
	                                " DATE_FORMAT(t3.fecha_termino,'%Y-%m-%d %H:%i') AS  fin_time,  " +
	                                " 'Permiso' AS title,  " +
 	                                " t1.comentario AS body, " +
	                                " 'Permiso' AS year, " +
	                                " '' AS code, " +
	                                " t1.comentario AS nombre , 2 as tipo" +
                                    " FROM  " +
	                                " sol_solicitud AS t1 ,  " +
	                                " sol_tipo_solicitud AS t2, " +
	                                " sol_permiso AS t3  " +
                                    " WHERE  " +
	                                " t1.idTipoSolicitud = 2 " +
                                    " AND  " +
	                                " t1.idTipoSolicitud = t2.id " +
                                    " AND  " +
	                                " t1.idEstado = 3 " +
                                    " AND  " +
	                                " t1.id = t3.idSolicitud " +
                                    " AND  " +
	                                " t1.idUsuario = "+req.user.idUsuario+" "+
                                    " UNION " +
                                    " SELECT " +
                                    "    CONCAT(t1.id,t2.id) as id_bitacora_time,  DATE_FORMAT(t2.fecha,'%Y-%m-%d 08:00') AS ini_time,  " +
                                    "    DATE_FORMAT(t2.fecha,'%Y-%m-%d 18:30') AS fin_time, " +
                                    "    'Vacaciones','Vacaciones', 'Vacaciones',  '',  '' AS nombre , 3 as tipo " +
                                    "    FROM  " +
                                    "        sol_solicitud AS t1, " +
                                    "        sol_selec_dias AS t2 " +
                                    "    WHERE  " +
                                    "        t1.idTipoSolicitud = 1 " +
                                    "    AND  " +
                                    "        t1.idUsuario = "+req.user.idUsuario+" " +
                                    "    AND  " +
                                    "        t1.idEstado = 3	 " +
                                    "    AND  " +
                                    "        t1.id = t2.idSolicitud " );                           

    let HorasRegsitradas = [];
    horas.forEach(element => {

            switch(element.tipo)
            {
                case 1: // normales 
                let registro = {
                    title : element.year +"-"+ element.code + " : " + element.nombre,
                    start : element.ini_time,
                    end: element.fin_time,
                    description: 'Lecture',
                    myId : element.id_bitacora_time,
                    tipoObjeto : element.tipo
                }
             
                HorasRegsitradas.push(registro);
                break;
                case 2: // Permisos
                let registroP = {
                    title : element.year +"-"+ element.code + " : " + element.nombre,
                    start : element.ini_time,
                    end: element.fin_time,
                    description: 'Lecture',
                    myId : element.id_bitacora_time,
                    tipoObjeto : element.tipo,
                    color: '#33C4FF'
                }
             
                HorasRegsitradas.push(registroP);
                break;
                case 3: // Vacaciones
                let registroV = {
                    title : element.year +"-"+ element.code + " : " + element.nombre,
                    start : element.ini_time,
                    end: element.fin_time,
                    description: 'Lecture',
                    myId : element.id_bitacora_time,
                    tipoObjeto : element.tipo,
                    color: '#23b23d'
                }
             
                HorasRegsitradas.push(registroV);
                break;
            }           

    });

   console.log(HorasRegsitradas);

   res.send(HorasRegsitradas);
  }); 






module.exports = router;