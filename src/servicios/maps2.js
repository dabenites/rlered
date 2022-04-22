// This example adds a search box to a map, using the Google Place Autocomplete
// feature. People can enter geographical searches. The search box will return a
// pick list containing a mix of places and predicted search terms.
// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

let map;
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: -28.024, lng: 140.887 },
      zoom: 4
    });
    // Create the search box and link it to the UI element.
    const input = document.getElementById("pac-input");
    const searchBox = new google.maps.places.SearchBox(input);
  
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);
    // Bias the SearchBox results towards current map's viewport.

    let loc = getListadoData();
    const markers = [];
    loc.forEach( function(valor, indice, listadoEdificios) {
      const position = { lat: parseFloat(valor.latitud) , lng: parseFloat(valor.altitud) };
      
      const marker = new google.maps.Marker({
        position
      });

      var infowindow = new google.maps.InfoWindow({
        content: crearDivProyecto(valor)
      });

      google.maps.event.addListener(marker,"click", function(){
        infowindow.open(map,marker);
                  });	

  
      // markers can only be keyboard focusable when they have click listeners
      // open info window when marker is clicked
      markers.push(marker);
      
    });
  
    // Add a marker clusterer to manage the markers.
    new markerClusterer.MarkerClusterer({ markers, map });

    searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
    
        if (places.length == 0) {
          return;
        }
        
        // For each place, get the icon, name and location.
        const bounds = new google.maps.LatLngBounds();
    
        places.forEach((place) => {
          if (!place.geometry || !place.geometry.location) {
            console.log("Returned place contains no geometry");
            return;
          }   

          if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }
        });
        map.fitBounds(bounds);
      });





  }

  function setCenterMaps ( latitud,longitud)
	{
		var newLatLn = new google.maps.LatLng( latitud ,  longitud);
		 			map.panTo(newLatLn);
		 			map.setZoom(17); // modifico el zoom para que se vea mas activo
		/* Cerrar el Slice Activo*/
		$('#verTabla').modal('hide'); 			
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

  function crearDivProyecto( valor)
  {
    //console.log(valor);

   let infoDiv = '  <div style="height:250px;"> ' +
                    
                    '<table class="table table-striped" style="margin-top: 15px;">'+
																			'<tbody>'+
																				'<tr>'+
																					'<td >Nombre</td>'+
																					'<td >'+ valor.nombre +'</td>'+
																				'</tr>'+
																				'<tr>'+
																					'<td>Código</td>'+
																					'<td>'+ valor.year + "-" + valor.code +'</td>'+
																				'</tr>'+
																				'<tr>'+
																					'<td>Nº Pisos</td>'+
																					'<td> '+ valor.num_pisos +'</td>'+
																				'</tr>'+
																				'<tr>'+
																					'<td>Nº Subterraneo</td>'+
																					'<td>'+ valor.num_subterraneo +'</td>'+
																				'</tr>'+
                                        '<tr>'+
																					'<td>Nº Zona</td>'+
																					'<td>'+ valor.zona +'</td>'+
																				'</tr>'+
                                        '<tr>'+
																					'<td>Nº Suelo</td>'+
																					'<td>'+ valor.suelo +'</td>'+
																				'</tr>'+
                                        '<tr>'+
																					'<td>Nº Categoria</td>'+
																					'<td>'+ valor.categoria +'</td>'+
																				'</tr>'+
																			'</tbody>'+
                  '</div>';

    return infoDiv;
  }