
 +
        "@font-face{" +
                "font-family: smx-FontAwesome;" +
                "src:url(https://netdna.bootstrapcdn.com/font-awesome/2.0/font//fontawesome-webfont.eot?#iefix) format('eot')," +
                "url(https://netdna.bootstrapcdn.com/font-awesome/2.0/font//fontawesome-webfont.woff) format('woff')," +
                "url(https://netdna.bootstrapcdn.com/font-awesome/2.0/font//fontawesome-webfont.ttf) format('truetype')," +
                "url(https://netdna.bootstrapcdn.com/font-awesome/2.0/font//fontawesome-webfont.svg#FontAwesome) format('svg');" +
                "font-weight:400;" +
                "font-style:normal;" +
        "}" +
        ".smx-info {" +
                "font: 14px/1.5 sans-serif;" +
                "display: inline;" +
                "background: #d04848;" +
                "color: white;" +
                "opacity: 0;" +
                "padding-right: 20px;" +
                "text-align: right;" +
                "box-sizing: border-box;" +
                "position: fixed;" +
                "z-index: 99998;" +
                "top: 10px;" +
                "left: -155px;" +
                "width: 160px;" +
                "box-shadow: #b5b5b5 0 2px 6px 2px;" +
                "border-radius: 5px 2px 2px 5px;" +
                "transition: width 0.3s ease-out;" +
        "}" + 
        ".smx-contenedor {" +
                "font: 14px/1.5 sans-serif;" +
                "background: black;" +
                "color: white;" +
                "opacity: 0.3;" +
                "text-align: center;" +
                "position: fixed;" +
                "z-index: 99999;" +
                "top: 10px;" +
                "left: -155px;" +
                "width: 160px;" +
                "text-align: right;" +
                "box-sizing: border-box;" +
                "padding-right: 10px;" +
                "border-radius: 5px 2px 2px 5px;" +
                "box-shadow: #b5b5b5 0 2px 6px 2px;" +
                "cursor: pointer;" +
                "transition: width 0.3s ease-out;" +
        "}" +   
        ".smx-contenedor:hover {" +    
                "width: 320px;" +
        "}" +
        ".smx-boton {" +
                "display: inline;" +
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
                "padding-left: 10px;" +
        "}" +
        ".smx-eliminar::after {" +
                "content: '\\f014';" +
                "font-size: 1em;" +
        "}" +
        ".smx-eliminar-confirmar::after {" +
                "content: '\\f057';" +
                "font-size: 1em;" +
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
        " /*//NOTE: esta clase debe ser la última para que sobreescriba a las demás. */" +
        ".activo {" +
                "opacity: 1;" +
        "}"
