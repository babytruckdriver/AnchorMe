// ==UserScript==
// @name        AnchorMe
// @namespace   http://userscripts.org/smux
// @description Add anchors to a page
// @include     https://developer.mozilla.org/*
// @include     http://www.2ality.com/2013/06/basic-javascript.html*
// @version     0.1
// @grant       none
// ==/UserScript==
// Puede que la página ya disponga de jQuery, por lo que no hay que importarlo
// -@-require     http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js
//
/*
* Haciendo doble click sobre un texto se crea un marcador.
* Solo se permite un marcador, así que si se vuelve a hacer doble click el primer marcador se elimina.
* Debe guardarse el marcador en localStorage para añadirlo al cargar la página
* 
* TODO: 
* - Añadir animación a la derecha del botón cuando se añada un nuevo marcador.
*/

'use strict';

//Cargar jQuery si la página no lo tiene. 
var isJQuery = (typeof jQuery === "undefined") ? false : true;

if(!isJQuery) {
    console.log(">>Se carga jQuery");
    var script = document.createElement("script");
    script.src = "http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js";
    document.head.appendChild(script);
}



//Activa o desactiva el logging
var loging = true,
    anchor = '';

//aquí debe guardarse el marcador recogido de localStorage, de existir.
var log = function (logString) {
    if (loging) {
        console.log(logString);
    }
}
log('>>> Greasemonkey\'s working!');

var util = {
    cache: {
        setBookMark: function (key, obj) {
            // Si no existe el objecto lo crea.
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, obj);
            }
        },
        getBookMark: function (key) {
            return localStorage.getItem(key);
        }
    }
};

//Estilos necesarios para el script
var estilos = "" +
    "@font-face {" +
        "font-family: 'Open Sans';" +
        "font-style: normal;" +
        "font-weight: normal;" +
        'src: url("//mozorg.cdn.mozilla.net/media/fonts/OpenSans-Regular-webfont.eot?#iefix") format("embedded-opentype"), url("//mozorg.cdn.mozilla.net/media/fonts/OpenSans-Regular-webfont.woff") format("woff"), url("//mozorg.cdn.mozilla.net/media/fonts/OpenSans-Regular-webfont.ttf") format("truetype"), url("//mozorg.cdn.mozilla.net/media/fonts/OpenSans-Regular-webfont.svg#OpenSansRegular") format("svg");' +
    "}" +
    "" +
    ".boton {" + 
        "font: 14px/1.5 'Open Sans',sans-serif;" + 
        "background: black;" + 
        "color: white;" +
        "text-align: center;" +             
        "position: fixed;" +              
        "z-index: 99;" +              
        "top: 10px;" +              
        "left: 10px;" +              
        "width: 160px;" +              
        "border-radius: 5px;" +              
        "box-shadow: #b5b5b5 0 2px 6px 2px;" +             
        "cursor: pointer;" +           
    "}" +  
    "" +
    ".info {" +          
        "font: 14px/1.5 'Open Sans',sans-serif;" + 
        "display: inline;" +             
        "background: #d04848;" +              
        "padding-right: 20px;" +             
        "text-align: right;" +              
        "box-sizing: border-box;" +              
        "position: fixed;" +              
        "top: 10px;" +              
        "left: 10px;" +              
        "width: 160px;" +              
        "box-shadow: #b5b5b5 0 2px 6px 2px;" +              
        "border-radius: 0 5px 5px 0 ;" +              
        "transition: width 0.3s ease-out;" +           
    "}";



var loadScript = function () {
    var key = window.location,
        ANCHOR = "smuxAnchor",
        value = "";
    
    log("Cargando el Script Greasemonkey.")
    //Añado los estilos a la página
    $('head').append('<style>' + estilos + '</style>');

    //Añado el botón de creación de marcador
    $('body').append('<div class=\'boton\'>Ir al marcador!</div><div class=\'info\'>Marcador añadido</div>');

    //TODO: Función ejecutada al iniciar que recoge de localStorage el marcador 
    // y añade en el lugar adecuado <a name="marcador"></a>


    /*
        * Manejadores de eventos
        */
    $('.boton').on('click', function (event) {
        //TODO: 
        window.location.hash = ANCHOR;
    });

    //Solo es posible añadir el marcador los elementos h1, h2, h3, h4, p, div
    $('h1, h2, h3, h4, p') .on('dblclick', function () {

        //Muestra, mediante animación, que se ha añadido un marcador
        $('.info') .css('width', '320px').delay(2000).queue(function () {
            $('.info') .css('width', '160px').dequeue();
        });
        log('Marcador añadido: ' + $(this)[0].tagName);

        //TODO: Llamada a la función que guarda la información en localStorage
        $("a[name='" + ANCHOR + "']").remove();
        util.cache.setBookMark(key, value);
        $(this).before("<a name='"+ ANCHOR + "'></a>");
    });
    
};

// Esperamos 6 segundos a que la página cargue completamente.
// Hay páginas que hacen varias recargas ?¿?¿?.
setTimeout(loadScript, 6000);
