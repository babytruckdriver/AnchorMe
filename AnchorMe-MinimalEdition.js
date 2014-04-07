/*jslint indent:8, devel:true, browser:true, vars:true*/
/*global jQuery, $, console*/
// ==UserScript==
// @name        AnchorMe-MinimalEdition
// @namespace   http://userscripts.org/smux
// @description Set a reading mark in the pages you choose. Never forget where your reading finish last time.
// @include     https://developer.mozilla.org/*
// @include     http://www.2ality.com/2013/06/basic-javascript.html*
// @include     http://www.atareao.es/*
// @include     http://addyosmani.github.io/backbone-fundamentals/*
// @include     https://github.com/Nijikokun/the-zen-approach/blob/master/*
// @version     0.1
// @grant       none
// ==/UserScript==
// Puede que la página ya disponga de jQuery, por lo que no se importa por defecto
// -@-require     http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js
//
/*
 * Haciendo doble click sobre un texto se crea un marcador.
 * Solo se permite un marcador, así que si se vuelve a hacer doble click el primer marcador se elimina.
 *
 * TODO:
 * - En histórico: Añadir icono (o algo) para poder hacer un marcador principal (el onclick en marcadores no va al marcador)
 */

/*
 The MIT License (MIT)
 
 Copyright (c) 2013 Samuel González Izquierdo
 
 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

'use strict';

//Activa o desactiva el logging
var DEBUG = true;

var log = function (logString) {
        if (DEBUG && console) {
                console.log(logString);
        }
};
log('>>> Greasemonkey\'s working!');


// Objeto de utilidades: Get y Set del marcador de la página (a localStorage)
var util = {
        cache: {
                //Key del objecto de marcadores a guardar en localStorage
                BM_KEY: "ANCHORME",
                //Construye el tipo de objeto que espera el método 'setBookMark'
                bookMarckObject: function () {
                        return {
                                id: 0,
                                type: "",
                                position: 0,
                                tip: ""
                        };
                },
                setBookMark: function (obj) {
                        //TODO cerciorarse de que 'obj' es del tipo requerido. Con 'InstanceOf' o algo así.
                        //Se crea un identificador único para este marcador
                        obj.id = new Date().getTime();
                        
                        log("obj.id:" + obj.id + " \nobj.type:" + obj.type + "\nobj.position: " + obj.position + "\nobj.tip: " + obj.tip);
                        
                        var bookMarks = localStorage.getItem(this.BM_KEY);
                        if (bookMarks) {
                                bookMarks = JSON.parse(bookMarks);
                                bookMarks.push(obj);
                        } else {
                                //Si no existe aún un objeto de marcadores en localStorage lo creamos
                                bookMarks = [];
                                bookMarks.push(obj);
                        }
                        
                        localStorage.setItem(this.BM_KEY, JSON.stringify(bookMarks));
                        
                },
                //Retorna el marcador 'principal'
                getBookMark: function () {
                        var bookMarks = localStorage.getItem(this.BM_KEY),
                            ids = [],
                            idMarcadorActivo,
                            marcadorAtivo;
                        
                        if (bookMarks) {
                                bookMarks = JSON.parse(bookMarks);
                                
                                $.each(bookMarks, function () {
                                        ids.push(this.id);
                                });
                                
                                //Id más alto. Al ser una fecha es el marcador más reciente
                                idMarcadorActivo = Math.max.apply(null, ids);
                                
                                //CHANGES: El algoritmo no me gusta demasiado. Tener que recorrer el Array dos veces me irrita!!
                                //Es posible que el marcador más moderno siempre sea el último y nos podamos ahorrar dos dos 'each'
                                $.each(bookMarks, function () {
                                        if (this.id === idMarcadorActivo) {
                                                marcadorAtivo = this;
                                                return false; //Es la única manera de que el loop no continue. 'break' no funciona.
                                        }
                                });
                                
                                if (marcadorAtivo) {
                                        return marcadorAtivo;
                                }
                        }
                        return undefined;
                },
                //Retorna todos los marcadores escepto el 'principal'
                getBookMarksHistory: function () {
                        var bookMarks = localStorage.getItem(this.BM_KEY);
                        if (bookMarks) {
                                bookMarks = JSON.parse(bookMarks);
                                return bookMarks;
                        }
                        return undefined;
                },
                deleteBookMark: function (idBookMark) {
                        var tempBMArr = [];
                        
                        if (idBookMark) {
                                //TODO: Borrar marcador que coincida con idBookMark
                                var bookMarks = localStorage.getItem(this.BM_KEY);
                                if (bookMarks) {
                                        bookMarks = JSON.parse(bookMarks);
                                        //Borra el bookmark más actual, que es el último de la lista
                                        $.each(bookMarks, function () {
                                                if (this.id !== idBookMark) {
                                                        tempBMArr.push(this); 
                                                }
                                        });

                                        localStorage.setItem(this.BM_KEY, JSON.stringify(tempBMArr));
                                }
                                log("Marcador eliminado");
                        } else {
                        //Borrar todos los marcadores
                                localStorage.clear();
                                log("Todos los marcadores eliminados");
                        }
                }
        },
        textos: {
                btoIrHayMarcador:   "Ir al marcador!",
                btoIrNoHayMarcador: "No hay marcador",
                infoMarca: "Marcador añadido",
                infoMarcable: "M",
                eliminar: "¿Eliminar?",
                historicoMarcadores: "Histórico de marcadores"
        }
};

//Objeto principal de la aplicación
var App = {
        ANCHOR: "smuxAnchor",
        marcador: {
                id: 0,
                type: "",
                position: 0,
                tip: ""
        },
        hayMarcador: false,
        enConfirmacion: false,
        confirmacionEliminacion: false,

        //Estilos necesarios para el script.
        //Deben prefijarse para evitar repetir nombres de clases que ya pudiesen existir en la página (Me ha pasado!!!!)
        //Mi prefijo será: smx-
        estilos: "" +
        "@font-face{" +
                "font-family: smx-FontAwesome;" +
                "src:url(https://netdna.bootstrapcdn.com/font-awesome/2.0/font//fontawesome-webfont.eot?#iefix) format('eot')," +
                "url(https://netdna.bootstrapcdn.com/font-awesome/2.0/font//fontawesome-webfont.woff) format('woff')," +
                "url(https://netdna.bootstrapcdn.com/font-awesome/2.0/font//fontawesome-webfont.ttf) format('truetype')," +
                "url(https://netdna.bootstrapcdn.com/font-awesome/2.0/font//fontawesome-webfont.svg#FontAwesome) format('svg');" +
                "font-weight :400;" +
                "font-style:normal;" +
        "}" +
        ".smx-info {" +
                "font: 14px/1.5 Courier New, monospace;" +
                "font-weight: bold;" +
                "display: inline;" +
                "background: #d04848;" +
                "color: white;" +
                "opacity: 0;" +
                "padding-right: 20px;" +
                "text-align: right;" +
                "box-sizing: border-box;" +
                "position: fixed;" +
                "z-index: 99997;" +
                "top: 10px;" +
                "left: -155px;" +
                "width: 160px;" +
                "box-shadow: #b5b5b5 0 2px 6px 2px;" +
                "border-radius: 5px 2px 2px 5px;" +
                "transition: width 0.3s ease-out;" +
        "}" + 
        ".smx-contenedor {" +
                "font: 14px/1.5 Courier New, monospace;" +
                "background: black;" +
                "color: white;" +
                "opacity: 0.3;" +
                "position: fixed;" +
                "z-index: 99998;" +
                "top: 10px;" +
                "left: -150px;" +
                "width: 160px;" +
                "text-align: right;" +
                "box-sizing: border-box;" +
                "padding-right: 10px;" +
                "border-radius: 5px 2px 2px 5px;" +
                "box-shadow: #b5b5b5 0 2px 6px 2px;" +
                "cursor: pointer;" +
                "transition: width 0.3s ease-out 0.2s;" +
        "}" +   
        ".smx-contenedor:hover {" +    
                "width: 310px;" +
        "}" +
        ".smx-boton {" +
                "display: inline;" +
                "font-weight: 800; /*'bold' es insuficiente*/" +
        "}" +           
        ".smx-boton:hover {" +
                "opacity: 0.6;" +
        "}" +  
        ".smx-boton-hover-off:hover {" +
                "opacity: 1;" +
        "}" +          
        ".smx-boton:active {" +
                "opacity: 0.3;" +
        "}" +     
        ".smx-boton-active-off:active {" +
                "opacity: 1;" +
        "}" +         
        ".smx-eliminar {" +
                "font-family: smx-FontAwesome; " +
                "padding: 10px;" +
                "cursor: pointer;" +
        "}" +
        ".smx-eliminar::after {" +
                "content: '\\f014';" +
                "font-size: 14px;" + 
                "display: inline-block; /* //NOTE: A los elementos inline no se les puede cambiar el ancho o alto */" +
                "width: 10px;" +
        "}" +
        ".smx-eliminar-confirmar::after {" +
                "content: '\\f057';" +
                "font-size: 14px;" + 
        "}" +           
        ".smx-eliminar:hover::after {" +
                "opacity: 0.6;" +
        "}" +               
        ".smx-eliminar:active::after {" +
                "opacity: 0.3;" +
        "}" +
        ".smx-eliminar-hover-off:hover::after {" +
                "opacity: 1;" +
        "}" +               
        ".smx-eliminar-active-off:active::after {" +
                "opacity: 1;" +
        "}" +        
        ".smx-marcable {" +
                "display: none;" +
                "box-sizing: border-box;" +
                "position: absolute;" +
                "font-size: 10px; /*Si se utiliza 'em' se hereda el tamaño del contenedor*/" +
                "font-weight: bold;" +
                "width: 50px;" +
                "heigth: 15px;" +
                "line-height: 15px;" +
                "text-align: center;" +
                "background-color: #f4cece;" +
                "color: white;" +
                "opacity: 0.6;" +
                "border-radius: 4px 4px 0 0;" +
                "box-shadow: #b5b5b5 0 2px 6px 2px;" + 
                "transform: translate(0, -14px); /*Lo mismo: transform:translateX(-18px);*/" +
        "}" +
        ".smx-lista-marcadores {" +
                "opacity: 1;" +
                "font-family: smx-FontAwesome; " +  
                "padding-right: 10px;" +
                "background: black;" +        
        "}" +
        ".smx-lista-marcadores::after {" +
                "content: '\\f039';" +
                "font-size: 1em;" +
        "}" +        
        ".smx-lista-marcadores:hover::after {" +
                "opacity: 0.6;" +
        "}" +               
        ".smx-lista-marcadores:active::after {" +
                "opacity: 0.3;" +
        "}" +        
        ".smx-contenedor-marcadores {" +
                "display: none;" +
                "overflow: auto;" +
                "font: 14px/1.5 Courier New, monospace;" +
                "background-color: rgba(0, 0, 0, 0.6);" +
                "color: white;" +
                "text-align: center;" +
                "position: fixed;" +
                "z-index: 99999;" +
                "top: 15px;" +
                "left: 10px;" +
                "width: 350px;" +
                "height: 300px;" +
                "box-sizing: border-box;" +
                "padding: 20px 20px 20px 20px;" +
                "border-radius: 5px 5px 5px 5px;" +
                "box-shadow: #b5b5b5 0 2px 6px 2px;" +
                "/*transition: height 0.3s ease-out;*/" +
        "}" +
        ".smx-titulo-historico {" +
                "font-weight: bold;" +
                "text-shadow: 1px 1px 2px black;" +
                "background-color: rgb(247, 146, 146);" +
                "margin: 5px;" +
                "border-radius: 2px;" +
        "}" +
        ".smx-marcador-historico {" +
                "text-align: left;" +
                "background-color: black;" +
                "margin: 5px;" +
                "border-radius: 2px;" +        
        "}" +     
        ".smx-marcador-principal{" +
                "font-weight: bold;" + 
                "color: rgb(247, 146, 146);" +
        "}" +           
        " /*//NOTE: esta clase debe ser la última para que sobreescriba a las demás. */" +
        ".activo {" +
                "opacity: 1;" +
        "}",

        loadScript: function () {
                this.cargarInterfaz();
                this.cargarHistoricoMarcadores();
                this.bindElements();
                
        },
        
        //Carga los elementos de la interfaz y los cachea
        cargarInterfaz: function () {
                
                //Añado los estilos a la página
                $("head").append("<style>" + this.estilos + "</style>");

                //Añado el botón de Ir al Marcador
                $("body").append("<div class='smx-contenedor'><span class='smx-lista-marcadores'></span><div class='smx-boton'>" + util.textos.btoIrHayMarcador + "</div>" +
                                 "</div><div class='smx-info'>" + util.textos.infoMarca + "</div>");
                
                //Añado el mensaje que informa si el elemento sobre el que está el cursor es "marcable"
                $("body").append("<div class='smx-marcable'>" + util.textos.infoMarcable + "</div>");
                
                //Añade contenedor de marcadores almacenados en memoria local (localStorage)
                $("body").append("<div class='smx-contenedor-marcadores'><div class='smx-titulo-historico'>" + util.textos.historicoMarcadores + "<span class='smx-eliminar'></span></div></div>");
                
                //Cacheo de elementos
                this.btoIr = $(".smx-boton");
                this.infoNuevoMarcador = $(".smx-info");
                this.contenedor = $(".smx-contenedor");
                this.eliminar = $(".smx-eliminar");
                this.marcable = $(".smx-marcable");
                this.btoListaMarcadores = $(".smx-lista-marcadores");
                this.contenedorMarcadores = $(".smx-contenedor-marcadores");
        },

        // Función ejecutada al iniciar que recoge de localStorage el marcador 
        // y añade en el lugar adecuado <a name="marcador"></a>    
        agregarMarcadorAlmacenado: function (marcador) {
                var elementos;
                
                //Si hay un marcador para esta página
                if (marcador) {
                        //Colección de los elementos del tipo del elemento marcado
                        elementos = $(marcador.type);
                        var that = this;

                        $.each(elementos, function (i) {
                                if (i === marcador.position) {
                                        $(this).before("<a name='" + that.ANCHOR + "'></a>");
                                        return false;
                                }
                        });
                        
                        log("Marcador Temporal Almacenado agregado a la página.");
                } 
        },

        bindElements: function () {
                
                //Solo es posible añadir un marcador a los elementos h1, h2, h3, h4, y p.
                $("h1, h2, h3, h4, p").on("dblclick", this.setMarcador.bind(this));
                
                $("h1, h2, h3, h4, p").on("mouseover", function (event) {
                        // Mostrar etiqueta informativa de elementno "marcable";       
                        $(event.target).prepend(this.marcable);
                        this.marcable.css("margin-button", "30px");
                        this.marcable.show();
                }.bind(this));
                
                $("h1, h2, h3, h4, p").on("mouseout", function (event) {
                        // Esconder etiqueta informativa de elementno "marcable";  
                        this.marcable.hide();
                }.bind(this));
                
                this.btoIr.on("click", function () {
                        window.location.hash = this.ANCHOR;
                }.bind(this));
                
                this.eliminar.on("click", this.confirmarEliminar.bind(this));
                
                this.eliminar.on("mouseout", function (event) {
                        this.confirmacionEliminacion = false;
                        $(event.target).removeClass("smx-eliminar-confirmar");
                }.bind(this));                
                
                this.btoListaMarcadores.on("click", function () {
                        this.contenedorMarcadores.show();
                }.bind(this));
                
                this.contenedorMarcadores.on("mouseleave", function (event) {
                        $(this).delay(500).queue(function () {
                                $(this).hide("fast").dequeue();
                        });
                });

        },

        setMarcador: function (event) {

                //Llamada a la función que guarda la información en localStorage
                //Machaca si existe un marcador anterior
                $("a[name='" + this.ANCHOR + "']").remove();
                
                var marcador = new util.cache.bookMarckObject();
                
                marcador.type = $(event.target)[0].tagName;

                //Selector con todos los elementos del mismo tipo que el seleccionado
                var elementos = $($(event.target)[0].tagName);
                $.each(elementos, function (i) {
                        if (this === event.target) {
                                marcador.position = i;
                                marcador.tip = $.trim($(this).text().slice(1, 50)).slice(0,25) + "...";
                        }
                });

                //Guarda en localStorage el marcador de la página
                util.cache.setBookMark(marcador);
                
                //Se incluye el marcador en la página para ser usuado en esta sesión
                $(event.target).before("<a name='" + this.ANCHOR + "'></a>");
                
                this.activarBoton();
                this.hayMarcador = true;
                
                //Actualiza el panel de histórico de marcadores
                this.cargarHistoricoMarcadores();
                
                var that = this;
                
                //Muestra, mediante animación, que se ha añadido un marcador
                this.infoNuevoMarcador.css('width', '320px')
                        .delay(2000).queue(function () {
                                that.infoNuevoMarcador.css('width', '160px').dequeue();
                        });
                log('Marcador añadido: ' + $(event.target)[0].tagName);
        },
        
        confirmarEliminar: function (event) {
                var idMarcador;
                
                if (this.hayMarcador) {
                        if (!this.confirmacionEliminacion) {
                                $(event.target).addClass("smx-eliminar-confirmar");
                                this.confirmacionEliminacion = true;
                        } else {
                                this.confirmacionEliminacion = false;
                                $(event.target).removeClass("smx-eliminar-confirmar");
                                idMarcador = $(event.target).data("id");
                                this.eliminarMarcador(idMarcador);
                        }
                }
        },
        
        eliminarMarcador: function (idMarcador) {
                log("Eliminando marcador: " + idMarcador);
                $("a[name='" + this.ANCHOR + "']").remove();
                //Se permite eliminar todos los marcadores o solo uno
                if (idMarcador) {
                        util.cache.deleteBookMark(idMarcador);
                        this.hayMarcador = this.cargarHistoricoMarcadores();
                        
                        if (!this.hayMarcador) {
                                this.desactivarBoton();
                        }
                }
                else {
                        util.cache.deleteBookMark();
                        this.cargarHistoricoMarcadores();
                        this.desactivarBoton();
                        this.hayMarcador = false;
                }
        },
        
        desactivarBoton: function () {
                this.infoNuevoMarcador.removeClass("activo");
                this.contenedor.removeClass("activo").css("cursor", "text");
                this.btoListaMarcadores.css("cursor", "pointer");
                this.btoIr.text(util.textos.btoIrNoHayMarcador).addClass("smx-boton-hover-off smx-boton-active-off");
                //TODO: Desactivar la papelera cuando no quede ningún marcador
                //this.eliminar.addClass("smx-eliminar-hover-off smx-eliminar-active-off");
        },
        
        activarBoton: function () {
                this.infoNuevoMarcador.addClass("activo");
                this.contenedor.addClass("activo").css("cursor", "pointer");
                this.btoIr.text(util.textos.btoIrHayMarcador).removeClass("smx-boton-hover-off smx-boton-active-off");
                //TODO: Desactivar la papelera cuando no quede ningún marcador
                //this.eliminar.removeClass("smx-eliminar-hover-off smx-eliminar-active-off");
        },
        
        //Retorna si hay marcadores o no (true/false)
        cargarHistoricoMarcadores: function () {
                //Recupera de localStorage todos los marcadores almacenados y los muestra
                var marcadores = util.cache.getBookMarksHistory(),
                    marcadoresHTML = "";
                
                //Primero se borra todo el historico de marcadores para luego volver a cargarlo actualizado
                //Este selector no se puede cachear en la carga de la página porque en ese momento no existen los elementos a seleccionar.
                $(".smx-marcador-historico").remove();
                log("Carando histórico de marcadores");
                
                //NOTE: no es buena idea utilizar elementos 'ul' ya que es muy probable que la página tenga estilos por defecto para ese elemento
                if(marcadores && marcadores.length > 0) {
                        log("Parece que hay marcadores que añadir")
                        //TODO: Mostrar también la hora, minutos y segundos
                        $.each(marcadores, function () {
                                marcadoresHTML = "<div class='smx-marcador-historico'><span class='smx-eliminar' data-id='" + this.id + "'></span>" + this.tip + "</div>" + marcadoresHTML;
                        });
                        
                        this.contenedorMarcadores.append(marcadoresHTML);
                        
                        //Añadir el marcador principal a la página
                        this.agregarMarcadorAlmacenado(marcadores[marcadores.length - 1]);
                        
                        $(".smx-marcador-historico:first").addClass("smx-marcador-principal");
                        
                        //Añadir manejadores para el evento 'click' y 'mouseout' sobre los marcadores cargados
                        $(".smx-eliminar").on("click", this.confirmarEliminar.bind(this)); 
                        
                        $(".smx-eliminar").on("mouseout", function (event) {
                                this.confirmacionEliminacion = false;
                                $(event.target).removeClass("smx-eliminar-confirmar");
                        }.bind(this));
                        
                        this.activarBoton();
                        this.hayMarcador = true;
                        
                        return true;
                        
                } else {
                        log("No hay marcadores");
                        this.hayMarcador = false;
                        return false;
                }
                
        }

};

//Cargar jQuery si la página no lo tiene. 
var isJQuery = (typeof jQuery === "undefined") ? false : true;

// Si la página no dispone de jQuery hay que incluirlo, por lo que se debe esperar un tiempo
// a que la biblioteca cargue
if (!isJQuery) {
        log(">>No se ha detectado jQuery en la página, por lo que se procede a su carga...");
        var script = document.createElement("script");
        script.src = "http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js";
        document.head.appendChild(script);
        
        //NOTE: setTimeout() causes javascript to use the global scope ('this' is 'window')
        setTimeout(App.loadScript.bind(App), 6000);
} else {
        
        //Si se dispone de jQuery se podrá esperar menos, pero hay que dar tiempo a que la página cargue completamente
        //Las páginas maś complejas se cargan desde varias fuentes, por lo que el "ready" de jQuery no es definitivo.
        log(">>La página ya dispone de jQuery. Se comenzará con el Script en 2 segundos.");
        //NOTE: setTimeout() causes javascript to use the global scope ('this' is 'window')
        
        setTimeout(App.loadScript.bind(App), 2000);
}
