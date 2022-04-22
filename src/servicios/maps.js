
    //var MarkerClusterer = require('node-js-marker-clusterer');
    //import { MarkerClusterer } from "@markers/markerclusterer.js";
    //import MarkerClusterer from "@markers/markerclusterer.js"; 
   
    let map;
    let markers;

    let locations = [ ];
    
    function initMap() {

      const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 2,
        center: { lat: -28.024, lng: 140.887 },
      });

      // Create an array of alphabetical characters used to label the markers.
     
      // Add some markers to the map.

      let loc = getListadoData();
      const markers = [];
      loc.forEach( function(valor, indice, listadoEdificios) {
        const position = { lat: parseFloat(valor.latitud) , lng: parseFloat(valor.altitud) };
        
        const marker = new google.maps.Marker({
          position
        });

    
        // markers can only be keyboard focusable when they have click listeners
        // open info window when marker is clicked
        markers.push(marker);
      });
    
      // Add a marker clusterer to manage the markers.
      new markerClusterer.MarkerClusterer({ markers, map });


  }

  function cargarEdificios(listadoEdificios)
  {
/*
   const  markers =  listadoEdificios.forEach( function(valor, indice, listadoEdificios) {


          const uluru = { lat: parseFloat(valor.latitud) , lng: parseFloat(valor.altitud) };

          const marker = new google.maps.Marker({
                position: uluru,
                map: map,
              });
              return marker;
      });

      console.log(markers);

      const markerCluster =   new markerClusterer.MarkerClusterer({ markers, map });
*/



  }

    function getListadoData()
    {
      let listado;

          $.ajax
            (
              {
                async: false,
                type : 'GET', 
                url	 : "/reporteria/proyectosMaps",
                  success : function (resultado) 
                    { 
                     listado = resultado;
                    } 
              }
            );


      return listado;
    }