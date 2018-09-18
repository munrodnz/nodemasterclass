/*
 *
 * Primary file for API App
 *
 */

/* Dependencies */

var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var handlers = require('./lib/handlers').default;

// Instantiate the HTTP server.
var httpServer = http.createServer(function (req, res) {
    unifiedServer(req,res);
});

// Start the HTTP server.
httpServer.listen(config.httpPort, function () {
    console.log("The server is now listening on port "+config.httpPort+".");
});

// Instantiate the HTTPS server
var httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions, function (req, res) {
    unifiedServer(req,res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function () {
    console.log("The server is now listening on port "+config.httpsPort+".");
});

// All the server logic for both http and https server environments
var unifiedServer = function(req, res){
    // Parse the url
    var parsedUrl = url.parse(req.url, true);

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers;

    // Get the payload if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function (data) {
        buffer += decoder.write(data);
    });
    req.on('end', function () {
        buffer += decoder.end();

        // Choose the handler this request should go to. If one doesn't exist send to handlers.notfound
        var chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notfound;

        // Construct the data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        };

        // Route the request to the handler specified in the router
        chosenHandler(data, function (statusCode, payload) {
            // Use the status code called by the handler, or default to 200
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;
            // Use the payload called back by the handler, or default to empty object
            payload = typeof (payload) == 'object' ? payload : {};
            // Convert the payload to a string
            var payloadString = JSON.stringify(payload);
            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            // Log the request/response
            console.log('Returning this response: ', statusCode, payloadString);
        });



    });
};


// Define a request router
var router = {
    'ping': handlers.ping,
    'hello' : handlers.hello,
    'users' : handlers.users
};