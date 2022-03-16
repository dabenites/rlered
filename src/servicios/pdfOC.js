//const PDFDocument = require('pdfkit');
const PDFDocument = require("pdfkit-table"); 
const path    = require('path');


function  buildPDF(dataCallback, endCallback) {
  const doc = new PDFDocument({ bufferPages: true, font: 'Times-Roman' });
  //const doc = new PDFDocument({ font: 'Courier' });

  doc.on('data', dataCallback);
  doc.on('end', endCallback);

  let tletra = 10;
  let puntoPrimer   = 155;
  let puntoSegundo  = 470;

  // contorno 
  doc.polygon([10, 10], [602, 10], [602, 780], [10, 780]);
  doc.stroke();

  doc.image(__dirname+"/"+"LogoRLE.png", 18,12, {scale: 0.25});

  doc.fontSize(16)
                .text("Orden de Compra", 220, 50);

  // Primer Bloque
  doc.fontSize(tletra).text("Fecha de emisión" , 50, 100); doc.fontSize(tletra).text(":"  , puntoPrimer, 100);
  doc.fontSize(tletra).text("Proyecto"         , 50, 110); doc.fontSize(tletra).text(":"  , puntoPrimer, 110);
  doc.fontSize(tletra).text("Centro de Costo"  , 50, 120); doc.fontSize(tletra).text(":"  , puntoPrimer, 120);

  doc.fontSize(tletra).text("N°"               , 400, 100); doc.fontSize(tletra).text(":"  , puntoSegundo, 100);
  doc.fontSize(tletra).text("Forma de Pago"    , 400, 110); doc.fontSize(tletra).text(":"  , puntoSegundo, 110);
  
  // Segundo bloque
  doc.fontSize(tletra).text("Nombre"            , 50, 140); doc.fontSize(tletra).text(":"  , puntoPrimer, 140);
  doc.fontSize(tletra).text("Dirección"         , 50, 150); doc.fontSize(tletra).text(":"  , puntoPrimer, 150);
  doc.fontSize(tletra).text("RUT"               , 50, 160); doc.fontSize(tletra).text(":"  , puntoPrimer, 160);

  doc.fontSize(tletra).text("Contacto"           , 400, 140); doc.fontSize(tletra).text(":"  , puntoSegundo, 140);
  doc.fontSize(tletra).text("Teléfono"           , 400, 150); doc.fontSize(tletra).text(":"  , puntoSegundo, 150);
  doc.fontSize(tletra).text("Teléfonos"          , 400, 160); doc.fontSize(tletra).text(":"  , puntoSegundo, 160);

  // Tercer Bloque
  doc.fontSize(tletra).text("Datos Facturación"  , 50, 180,{underline: true}); 
  let tercerBloque = 195;
  doc.fontSize(tletra).text("Facturar a"         , 50, tercerBloque); doc.fontSize(tletra).text(":"  , puntoPrimer, tercerBloque);
  doc.fontSize(tletra).text("Dirección"          , 50, tercerBloque + 10); doc.fontSize(tletra).text(":"  , puntoPrimer, tercerBloque + 10);
  doc.fontSize(tletra).text("Contacto"           , 50, tercerBloque + 20); doc.fontSize(tletra).text(":"  , puntoPrimer, tercerBloque + 20);
  doc.fontSize(tletra).text("Dirección entrega"  , 50, tercerBloque + 30); doc.fontSize(tletra).text(":"  , puntoPrimer, tercerBloque + 30);

  doc.fontSize(tletra).text("RUT"                , 400, tercerBloque); doc.fontSize(tletra).text(":"  , puntoSegundo, tercerBloque);
  doc.fontSize(tletra).text("Teléfono"           , 400, tercerBloque + 10); doc.fontSize(tletra).text(":"  , puntoSegundo, tercerBloque + 10);

  // Cuarto Bloque.  
  
  doc.fontSize(tletra).text("Condiciones de Compra"  , 50, 245,{underline: true}); //doc.fontSize(tletra).text(":"  , puntoPrimer, 240);
  let cuartoBloque = 260;
  doc.fontSize(tletra).text("Dirección despacho"     , 50, cuartoBloque  ); doc.fontSize(tletra).text(":"  , puntoPrimer, cuartoBloque);
  doc.fontSize(tletra).text("Encargado"              , 50, cuartoBloque + 10); doc.fontSize(tletra).text(":"  , puntoPrimer, cuartoBloque + 10);
  doc.fontSize(tletra).text("Comentarios OC"         , 50, cuartoBloque + 20); doc.fontSize(tletra).text(":"  , puntoPrimer, cuartoBloque + 20);

  doc.fontSize(tletra).text("Teléfono"               , 400, cuartoBloque ); doc.fontSize(tletra).text(":"  , puntoSegundo, cuartoBloque );

  // Cuarto Bloque.  
  doc.fontSize(tletra).text("Nota"  , 50, 518);
  doc.fontSize(tletra).text("1. Las facturas electrónicas deben traer referenciada el numero de la orden de compra y numero de proyecto."     , 50, 530);
  doc.fontSize(tletra).text("2. Las facturas electrónicas que no cumplan , podrían ser rechazadas según Ley 20.956 dentro de los 8 días desde"+
                            " la recepción del documento."              , 50, 540);
  doc.fontSize(tletra).text("3. Las facturas electrónicas deben ser enviadas en formato PDF y XML a la casilla de correo contabilidad@renelagos.com"         , 50, 560);
  doc.fontSize(tletra).text("4. En el caso de boletas electrónicas se debe de igual forma detallar en su comentario el numero de orden de compra"+
                            " y numero de proyecto."         , 50, 570);
  

  
  doc.image(__dirname+"/"+"flagosFirma.png", 105,650, {scale: 0.15});

  doc.polygon([100, 693], [240, 693]);
  doc.stroke();
  doc.fontSize(tletra).text("Solicitante"  , 140, 702);


  doc.polygon([380, 693], [520, 693]);
  doc.stroke();
  doc.fontSize(tletra).text("Aprobador"  , 420, 703);



    
  // Bloque dinamico con la informacion de la tabla 

  const table = {
    title: "",
    subtitle: "",
    //headers: ["Cantidad", "Unidad", "Descripción", "Precio","Total"],
    headers: [
      { label:"Cantidad", property: 'cant', width: 40, renderer: null,align:"center" },
      { label:"Unidad", property: 'uni', width: 40, renderer: null,align:"center" }, 
      { label:"Descripción", property: 'desc', width: 300, renderer: null,align:"center" }, 
      { label:"Precio", property: 'pre', width: 50, renderer: null ,align:"center"}, 
      { label:"Total", property: 'tot', width: 50, renderer: null,align:"center" }, 
    ],
    rows: [
      ["1.68", "1", "Informe Modelación", "$31,579.53", "$53.054"],
    ],
  };


doc.table( table, { 
    // A4 595.28 x 841.89 (portrait) (about width sizes)
    width: 480,
    x: 50, // {Number} default: undefined | doc.x
    y: 300, // {Number} default: undefined | doc.y
    //columnsSize: [ 200, 100, 100 ],
  }); 



  doc.end();
}

async function fetchImage(src) {
    const image = await axios
        .get(src, {
            responseType: 'arraybuffer'
        })
    return image.data;
}


module.exports = { buildPDF };