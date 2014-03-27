
var App = {};
var MainController =  {
    className: 'main',
    getInstance : function() {
        if (this._instance === undefined) {
            this._instance = new App.Controller();
        }
        return this._instance;
    }
}
 module.exports = MainController;


App.Controller = function(){

}

