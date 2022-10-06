var Backbone = require('backbone')
    , _ = require('underscore');
Backbone.Cmodel = (function() {
    var Cho = {};


    _.extend(Backbone.Model.prototype,  {
        save: function(key, val, options) {
               // console.log(1)
                // Handle both `"key", value` and `{key: value}` -style arguments.
                var attrs;
                if (key == null || typeof key === 'object') {
                    attrs = key;
                    options = val;
                } else {
                    (attrs = {})[key] = val;
                }

           // console.log(attrs)

                options = _.extend({validate: true, parse: true}, options);



               if (!this.set(attrs, options)) return false;

                // After a successful server-side save, the client is (optionally)
                // updated with the server-side state.
                var model = this;
                var success = options.success;
                var attributes = this.attributes;
              //  console.log(attributes)
                options.success = function(resp) {
                    // Ensure attributes are restored during synchronous saves.
                    //model.attributes = attributes;
                    //var serverAttrs = options.parse ? model.parse(resp, options) : resp;
                    //if (wait) serverAttrs = _.extend({}, attrs, serverAttrs);
                    //if (serverAttrs && !model.set(serverAttrs, options)) return false;
                    //if (success) success.call(options.context, model, resp, options);
                    //model.trigger('sync', model, resp, options);
                };
                //wrapError(this, options);
                //
                //// Set temporary attributes if `{wait: true}` to properly find new ids.
                //if (attrs && wait) this.attributes = _.extend({}, attributes, attrs);
                //
                //var method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
                //if (method === 'patch' && !options.attrs) options.attrs = attrs;
                //var xhr = this.sync(method, this, options);
                //
                //// Restore attributes.
                //this.attributes = attributes;
                //
                //return xhr;
        },
        set: function(key, val, options) {
            if (key == null) return this;

            // Handle both `"key", value` and `{key: value}` -style arguments.
            var attrs;
            if (typeof key === 'object') {
                attrs = key;
                options = val;
            } else {
                (attrs = {})[key] = val;
            }

            options || (options = {});

            // Run validation.
            if (!this._validate(attrs, options)) return false;

            // Extract attributes and options.
            var unset      = options.unset;
            var silent     = options.silent;
            var changes    = [];
            var changing   = this._changing;
            this._changing = true;

            if (!changing) {
                this._previousAttributes = _.clone(this.attributes);
                this.changed = {};
            }

            var current = this.attributes;
            var changed = this.changed;
            var prev    = this._previousAttributes;

            // For each `set` attribute, update or delete the current value.
            for (var attr in attrs) {
                val = attrs[attr];
                if (!_.isEqual(current[attr], val)) changes.push(attr);
                if (!_.isEqual(prev[attr], val)) {
                    changed[attr] = val;
                } else {
                    delete changed[attr];
                }
                unset ? delete current[attr] : current[attr] = val;
            }

            // Update the `id`.
            this.id = this.get(this.idAttribute);

            // Trigger all relevant attribute changes.
            if (!silent) {
                if (changes.length) this._pending = options;
                for (var i = 0; i < changes.length; i++) {
                    this.trigger('change:' + changes[i], this, current[changes[i]], options);
                }
            }

            // You might be wondering why there's a `while` loop here. Changes can
            // be recursively nested within `"change"` events.
            if (changing) return this;
            if (!silent) {
                while (this._pending) {
                    options = this._pending;
                    this._pending = false;
                    this.trigger('change', this, options);
                }
            }
            this._pending = false;
            this._changing = false;
            return this;
        },
    });

})();

exports =  module.exports  = Backbone;