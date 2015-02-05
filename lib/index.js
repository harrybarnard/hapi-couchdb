/**
 * Hapi-CouchDb Hapi Plugin
 * ============================================================ */
(function () {
    "use strict";

    var Joi = require('joi'),
        Hoek = require('hoek'),
        Boom = require('boom');

    var internals = {};

    /**
     * Default plugin options
     * @type {{url: string}}
     */
    internals.defaults = {
        url: 'http://localhost:5984'
    };

    /**
     * Plugin options schema
     * @type {{url: *, request: *, db: *}}
     */
    internals.schema = {
        url: Joi.string(),
        request: Joi.object(),
        db: Joi.string().required()
    };

    /**
     * Register the plugin with a Hapi server
     * @param server Hapi server interface
     * @param options Plugin options
     * @param next Callback
     */
    exports.register = function (server, options, next) {
        var init = internals.init(options);

        /**
         * Decorates a CouchDb error response with Boom properties
         * @param error CouchDb error response to decorate
         * @returns {*}
         */
        var BoomError = function (error) {
            Boom.wrap(error, error.statusCode);
            return error;
        };

        server.expose({
            Nano: init.Nano,
            Db: init.Db,
            Error: BoomError
        });

        server.log(['couchdb', 'info'], 'CouchDb connection to: ' + options.url + ' ready');

        next();
    };

    exports.register.attributes = {
        pkg: require("../package.json")
    };

    /**
     * Direct interface to Nano interface and configured db client for use outside of Hapi
     * @param options Plugin options
     * @returns {{Server, Db: *}}
     */
    module.exports.init = function (options) {
        return internals.init(options);
    };

    /**
     * Initialise the connection then return the Nano interface and configured db client
     * @param options Plugin options
     * @returns {{Server, Db: *}}
     */
    internals.init = function (options) {
        var error = Joi.validate(options, internals.schema).error;
        Hoek.assert(!error, 'Invalid CouchDb options', error && error.annotate());
        var config = Hoek.applyToDefaults(internals.defaults, options || {});

        var Nano;

        if (config.request) { // If custom request configuration is set
            // Add connection url to request config
            config.request.url = config.url;
            Nano = require('nano')(config.request);
        } else { // Otherwise use simple configuration
            Nano = require('nano')(config.url);
        }

        var db = Nano.use(config.db);

        /**
         * Update a document
         * Will create the document if it doesn't exist
         * @param id {string} Document Id
         * @param data {object} Updated document
         * @param cb {function} Callback error|document
         */
        db.update = function (id, data, cb) {
            db.get(id, {revs_info: true}, function (err, body) {
                if (err) {
                    if (err.reason === 'missing') {
                        internals.insert(data, id, cb);
                    } else {
                        cb(err);
                    }
                } else {
                    data._rev = body._rev;
                    internals.insert(data, id, cb);
                }
            });
        };

        internals.insert = function(data, id, cb) {
            db.insert(data, id, function (err, body) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, body);
                }
            });
        };

        return {
            Nano: Nano,
            Db: db
        };
    };

})();