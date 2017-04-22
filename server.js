/*jslint node:true*/
/*jslint loopfunc:true*/
'use strict';

var cluster = require( 'cluster' );
var os = require( 'os' );
var urlencode = require( 'urlencode' );
//var api_key = require( './api_key.js' );
//console.log( api_key.api_key() );
var https = require( 'https' );
var path = require( 'path' );



if ( cluster.isMaster ) { // Code to run if we're in the master process

	// Count the machine's CPUs

	var cpuCount = os.cpus().length;
	var hostname = os.hostname();

	// Create a worker for each CPU

	console.log( 'platform: ' + process.platform );
	console.log( process.versions );
	console.log( 'master@' + hostname + '[' + process.pid + '] started. launching ' + cpuCount + ' workers...' );
	for ( var i = 0; i < cpuCount; i += 1 ) {
		var worker = cluster.fork();
		worker.on( 'message', function ( message ) {
			console.log( message.from + ': ' + message.type + ' ' + JSON.stringify( message.data ) );
		} );
	}

	cluster.on( 'online', function ( worker ) {
		console.log( hostname + '(' + worker.id + ")[" + worker.process.pid + '] has started' );
	} );

	cluster.on( 'exit', function ( worker, code, signal ) {
		console.log( hostname + '(' + worker.id + ')[' + worker.process.pid + '] died [code:' + code + ' signal:' + signal + ']' );
	} );
	setTimeout( function () {
		console.log( 'sending pings..' );
		for ( var wid in cluster.workers ) {
			cluster.workers[ wid ].send( {
				type: 'ping',
				from: 'master',
				data: {
					number: Math.floor( Math.random() * 50 )
				}
			} );
		}

	}, 5000 );

	// 
	// 	once workers are up then 
	// 	create endpoint at /w some sweet sweet dataz on some nonstandard port
	// 
	// 
} else { // Code to run if we're in a worker process
	process.on( 'message', function ( message ) {

		process.send( {
			type: "RECIEVED " + message.type,
			from: os.hostname() + '[' + process.pid + ']',
			data: {}
		} );

	} );

	var compression = require( 'compression' );
	var express = require( 'express' );
	var app = express();
	app.use( compression() );

	app.use( express.static( 'public' ) );

	app.get( '/', function ( req, res ) {
		res.sendFile( path.join( __dirname + '/index.html' ) );
	} );


	var server = app.listen( process.env.PORT || 8081, function () {
		var host = server.address().address;
		var port = server.address().port;

		console.log( os.hostname() + "(" + cluster.worker.id + ")[" + process.pid + "] listening on %s:%s", host, port );
	} );


}