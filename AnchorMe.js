// ==UserScript==
// @name        AnchorMe
// @namespace   http://userscripts.org/smux
// @description Add anchors to a page
// @include     https://developer.mozilla.org/*
// @include     http://www.2ality.com/2013/06/basic-javascript.html*
// @include     http://www.atareao.es/*
// @include     http://addyosmani.github.io/backbone-fundamentals/*
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
 * - Refactorizar el código para que esté mejor ordenado (objetos)
 * - Al pasar el ratón por encima de un elemento "marcable" que aparezca un mensaje o se coloré o algo..
 * - Mostrar en el botón de "Ir al Marcador" si existe algún marcador en la página. (Mostrar desactivado si no, por ejemplo)
 * - Poder borrar el marcador existente en una página
 */

'use strict';

//Activa o desactiva el logging
var loging = true;

var log = function (logString) {
    if (loging) {
        console.log(logString);
    }
};
log('>>> Greasemonkey\'s working!');


// Objeto de utilidades: Get y Set del marcador de la página
var util = {
    cache: {
        setBookMark: function (key, obj) {
            log("key:" + key + " \nobj.type:" + obj.type + "\nobj.position: " + obj.position);
            localStorage.setItem(key, JSON.stringify(obj));
        },
        getBookMark: function (key) {
            var objStored = localStorage.getItem(key);
            if (objStored) {
                objStored = JSON.parse(objStored);
                log("key:" + key + " \nobj.type:" + objStored.type + "\nobj.position: " + objStored.position);
                return objStored;
            }
            return undefined;
        }
    }
};

//Objeto principal de la aplicación
var App = {

    key: window.location.href.split("#")[0],
    ANCHOR: "smuxAnchor",
    marcador: {
        type: "",
        position: 0
    },

    //Estilos necesarios para el script
    estilos: "" +
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
            "z-index: 99999;" +              
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
            "color: white;" +
            "padding-right: 20px;" +             
            "text-align: right;" +              
            "box-sizing: border-box;" +              
            "position: fixed;" +  
            "z-index: 99998;" +  
            "top: 10px;" +              
            "left: 10px;" +              
            "width: 160px;" +              
            "box-shadow: #b5b5b5 0 2px 6px 2px;" +              
            "border-radius: 0 5px 5px 0 ;" +              
            "transition: width 0.3s ease-out;" +           
        "}",

    loadScript: function () {
        log(">>Función loadScript1 ");
        this.cargarInterfaz();
        log(">>Función loadScript2");
        this.agregarMarcadorAlmacenado();
        log(">>Función loadScript3");
        this.bindElements();
        //No se cachean nodos web porque no se reutiliza ninguno
    },

    cargarInterfaz: function () {
        //Añado los estilos a la página
        $("head").append("<style>" + this.estilos + "</style>");

        //Añado el botón de creación de marcador
        $("body").append("<div class='boton'>Ir al marcador!</div><div class='info'>Marcador añadido</div>");           
    },

    // Función ejecutada al iniciar que recoge de localStorage el marcador 
    // y añade en el lugar adecuado <a name="marcador"></a>    
    agregarMarcadorAlmacenado: function () {
        var marcadorTemporal = util.cache.getBookMark(this.key),
            elementos;
        if (marcadorTemporal) {
            elementos = $(marcadorTemporal.type);
            var that = this;

            $.each(elementos, function (i) {
                if (i === marcadorTemporal.position) {
                    $(this).before("<a name='" + that.ANCHOR + "'></a>");
                    //FIX: Por alguna razón 'break' falla ?¿?¿?
                    //break;
                }
            });
        }
        log("Marcador Temporal agregado");
    },

    bindElements: function () {
        //Solo es posible añadir el marcador los elementos h1, h2, h3, h4, y p.
        $('h1, h2, h3, h4, p').on('dblclick', this.setMarcador.bind(this));

        $('.boton').on('click', function (event) {
            window.location.hash = this.ANCHOR;
        }.bind(this));
    },

    setMarcador: function (event) {

        //Muestra, mediante animación, que se ha añadido un marcador
        $('.info').css('width', '320px').delay(2000).queue(function () {
            $('.info').css('width', '160px').dequeue();
        });
        log('Marcador añadido: ' + $(event.target)[0].tagName);
        this.marcador.type = $(event.target)[0].tagName;

        //Llamada a la función que guarda la información en localStorage
        //Machaca si existe un marcador anterior
        $("a[name='" + this.ANCHOR + "']").remove();

        var that = this;

        //Selector con todos los elementos del mismo tipo que el seleccionado
        var elementos = $($(event.target)[0].tagName);
        $.each(elementos, function (i) {
            if (this === that) {
                that.marcador.position = i;
            }
        });

        this.key = window.location.href.split("#")[0];

        //Guarda en localStorage el marcador de la página
        util.cache.setBookMark(this.key, this.marcador);
        //Se incluye el marcador en la página para ser usuado en esta sesión
        $(this).before("<a name='" + this.ANCHOR + "'></a>");
    }

};

//Cargar jQuery si la página no lo tiene. 
var isJQuery = (typeof jQuery === "undefined") ? false : true;

// Si la página no dispone de jQuery hay que incluirlo, por lo que se debe esperar un tiempo
// a que la biblioteca cargue
if (!isJQuery) {
    log(">>Se carga jQuery");
    var script = document.createElement("script");
    script.src = "http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js";
    document.head.appendChild(script);
    //NOTE: setTimeout() causes javascript to use the global scope ('this' is 'window')
    setTimeout(App.loadScript.bind(App), 6000);
} else {
    //Si se dispone de jQuery se podrá esperar menos, pero hay que dar tiempo a que la página cargue completamente
    //Las páginas maś complejas se cargan desde varias fuentes, por lo que el "ready" de jQuery no es definitivo.
    log(">>La página ya dispone de jQuery. Se comienzará en 2 segundos con el Script");
    //NOTE: setTimeout() causes javascript to use the global scope ('this' is 'window')
    setTimeout(App.loadScript.bind(App), 2000);
}
