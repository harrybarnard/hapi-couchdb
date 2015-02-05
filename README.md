hapi-couchdb
=============

* Provides an direct interface to [Nano](https://github.com/dscape/nano) and a configurable database connection. 
* Integrates with [Hapi](https://github.com/hapijs/hapi) as a plugin.
* Allows you to share a CouchDb connection across your whole Hapi server.
* Can be used outside of Hapi when necessary. 

Prerequisites:

* [CouchDb](https://couchdb.apache.org/)
* [Hapi](https://github.com/hapijs/hapi) (if being used as a plugin)

## Usage

### Example

```javascript
var Hapi = require('hapi'),
    server = new Hapi.Server();

server.connection({
    host: '0.0.0.0',
    port: 8080
});

// Register plugin with some options
server.register({
    plugin: require('hapi-couchdb'),
    options: {
        url: 'http://username:password@localhost:5984',
        db: 'mycouchdb'
    }
}, function (err) {
    if(err) {
        console.log('Error registering hapi-couchdb', err);
    } else {
        console.log('hapi-couchdb registered');
    }
});

// Example of accessing CouchDb within a route handler
server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        var CouchDb = request.server.plugins['hapi-couchdb'];
        // Get a document from the db
        CouchDb.Db.get('rabbit', { revs_info: true }, function(err, body) {
            if (err) {
                throw new Error(CouchDb.Error(error); // Using error decoration convenience method
            } else {
                reply(body);
            });
    }
});

server.start(function() {
    console.log('Server running on host: ' + server.info.uri);
});
```

### Within Your Hapi Plugin

```javascript
exports.register = function (server, options, next) {
    
    var CouchDb = server.plugins['hapi-couchdb'];
    
    // Do something cool with CouchDb here...
    
    next();
};
```

### Usage Outside of Hapi

```javascript 
var CouchDb = require('hapi-couchdb').init(options);
```
For example:
```javascript
var CouchDb = require('hapi-couchdb').init({db: 'mycouchdb'});

// Do something cool with CouchDb here...
```

## Methods

### Db

The configured database interface. More information available [here](https://github.com/dscape/nano#document-functions).

### Db.update

```javascript
Db.update(/** document id **/ id, /** updated document **/ doc, /** callback **/ callback);
```

A document update convenience method. It will create the document in the database if it doesn't exist.

Example usage:

```javascript
Db.update(id, doc, function(error, body) {
    if(error) {
        console.log(error);
    } else {
        console.log('Document Updated! Current revision:', body._rev);
    }
});
```

### Nano

The full Nano interface. More information available [here](https://github.com/dscape/nano#database-functions).

### Error

```javascript
CouchDb.Error(/* CouchDb error response */ error);
```
A convenience method that will decorate an error returned by CouchDb using [Boom](https://github.com/hapijs/boom#wraperror-statuscode-message) for Hapi compatability. This function is only exposed if the module if used as a Hapi plugin. 

## Options

```javascript
// Example options
{
    url: 'http://myusername:mypassword@localhost:5984', // CouchDb host
    db: 'mycouchdb', // Database to use. *Required*
}
```

### url *{string} optional*

The CouchDb host to use. Defaults to ```http://localhost:5484```

### db *{string} required*

The name of the database you wish to use. This option is required.

### request *{object} optional*

Nano uses [Request](https://github.com/request/request) under the hood. You can use this configuration option to fine tune requests made by Nano to CouchDb. A full list of request options can be found [here](https://github.com/request/request#requestoptions-callback)

## Licence
MIT
