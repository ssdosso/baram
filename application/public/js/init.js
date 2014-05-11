(function(ua, w, d, undefined) {

    var
        filesToLoad,
        root = w,
        production = w.production,
        fileLoader = {
            loadCSS: function(url, callback) {
                var link = d.createElement("link");
                if (url ==='/assets/css/print.css') {
                    link.media = "print";
                }
                link.type = "text/css";
                link.rel = "stylesheet";
                link.href = url;
                d.getElementsByTagName("head")[0].appendChild(link);
                if(callback) {
                    callback();
                }
            },
            loadJS: function(file, callback) {
                var script = d.createElement("script");
                script.type = "text/javascript";
                if (script.readyState) {  // IE
                    script.onreadystatechange = function() {
                        if (script.readyState == "loaded" || script.readyState == "complete") {
                            script.onreadystatechange = null;
                            callback();
                        }
                    };
                } else {  // Other Browsers
                    script.onload = function() {
                        callback();
                    };
                }
                if(((typeof file).toLowerCase()) === "object" && file["data-main"] !== undefined) {
                    script.setAttribute("data-main", file["data-main"]);
                    script.async = true;
                    script.src = file.src;
                } else {
                    script.src = file;
                }
                d.getElementsByTagName("head")[0].appendChild(script);
            },
            loadFiles: function(production, obj, callback) {
                var self = this;
                if(production) {
                    var length = obj["prod-css"].length - 1;
                    function _loadCss() {
                        if (length !== -1) {
                            self.loadCSS(obj["dev-css"][length], function() {
                                length--;
                                _loadCss();
                            });
                        } else {

                            if(obj["prod-js"]) {
                                self.loadJS(obj["prod-js"], callback);
                            }
                        }

                    }

                    _loadCss();

                } else {
//
                    var length = obj["dev-css"].length - 1;
                    function _loadCss() {
                        if (length !== -1) {
                            self.loadCSS(obj["dev-css"][length], function() {
                                length--;
                                _loadCss();
                            });
                        } else {
                            if(obj["dev-js"]) {
                                self.loadJS(obj["dev-js"], callback);
                            }
                        }

                    }

                    _loadCss();

                }
            }
        }

    // Mobile/Tablet Logic
    if((/iPhone|iPod|iPad|Android|BlackBerry|Opera Mini|IEMobile/).test(ua)) {

        // Desktop CSS and JavaScript files to load
        filesToLoad = {
            // CSS file that is loaded when in development mode
            "dev-css": ["/css/game.css","/css/bootstrap-modal.css","/css/bootstrap-responsive.css","/css/bootstrap.css"],
            // CSS file that is loaded when in production mode
            "prod-css":["/css/game.css","/css/bootstrap-modal.css","/css/bootstrap-responsive.css","/css/bootstrap.css"],
            // Require.js configuration file that is also loaded when in development mode
            "dev-js": { "data-main": "/js/app/config/config.js", "src": "/js/libs/require.js" },
            // JavaScript initialization file that is loaded when in development mode
//                      "dev-init": "js/app/init/DesktopInit.js",
            "dev-init": "/js/app/DesktopInit.js",
            // JavaScript file that is loaded when in production mode
            "prod-init": "/js/DesktopInit.min.js",
            "prod-js": { "data-main": "/js/app/config/config.js", "src": "/js/libs/require.js" }
        };

    }

    // Desktop Logic
    else {

        // Desktop CSS and JavaScript files to load
        filesToLoad = {
            // CSS file that is loaded when in development mode
            "dev-css": ["/css/monoshift.css","assets/plugins/summernote/build/summernote.css","/assets/css/theme_light.css","/assets/css/theme_light.css",
                "/assets/plugins/perfect-scrollbar/src/perfect-scrollbar.css",
                "/assets/plugins/bootstrap-colorpalette/css/bootstrap-colorpalette.css",
                "assets/plugins/iCheck/skins/all.css","/assets/css/main-responsive.css",
                "/assets/css/main.css",
                "/assets/fonts/style.css",
                "/assets/plugins/font-awesome/css/font-awesome.min.css",
                "/assets//plugins/bootstrap/css/bootstrap.min.css"],
            // CSS file that is loaded when in production mode
            "prod-css":["/assets/css/print.css","/assets/css/retina.min.css","/assets/css/style.min.css","/assets/css/bootstrap.min.css"],
            // Require.js configuration file that is also loaded when in development mode
            "dev-js": { "data-main": "/js/app/config/config.js", "src": "/js/libs/require.js" },
            // JavaScript initialization file that is loaded when in development mode
//                      "dev-init": "js/app/init/DesktopInit.js",
            "dev-init": "/js/app/DesktopInit.js",
            // JavaScript file that is loaded when in production mode
            "prod-init": "/js/DesktopInit.min.js",
            "prod-js": { "data-main": "/js/app/config/config.js", "src": "/js/libs/require.js" }
        };

    }
//
    fileLoader.loadFiles(production, filesToLoad, function() {

        if(!production && window.require) {
            require([filesToLoad["dev-init"]]);
        } else if ( production ) {

            require([filesToLoad["prod-init"]])
        }
    });

})(navigator.userAgent || navigator.vendor || window.opera, window, document);