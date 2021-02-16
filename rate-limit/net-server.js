
// https://tools.ietf.org/id/draft-polli-ratelimit-headers-00.html
//
const stats = require('./stats')

const {promisify} = require('util')
const pipeline = promisify(stream.pipeline);

const uuid = require('node-uuid');


class NetServer {
	
	//
	constructor(config) {
		//
		this.uid = ""
		this.config = config;
		assert(config, ' must have a config')
		
		if ( this.config.uid !== undefined ) {
			this.uid = this.config.uid
		}
		
		if ( config.ssl ) {
			this.setSSLOptions(config)
			this.configSSLServer(config)
			this.config.x_proto = 'https'
		} else {
			this.configHTTPServer(config)
			this.config.x_proto = 'http'
		}
		this.handlers()
		this.doListen(config)
	}
	
	handlers() {
		
	}
	
	//
	setSSLOptions(config) {
		//
		this.ssl_opts =  config.ssl;
		
		var hasSecReq = false;
		//
		try {
			assert(this.ssl_opts.key !== undefined)
			assert(this.ssl_opts.cert !== undefined)
			hasSecReq = true
		} catch ( e ) {
			hasSecReq = false
		}
		//
		if ( !hasSecReq ) {
			try {
				assert(this.ssl_opts.ca !== undefined)
				hasSecReq = true
			} catch ( e ) {
				hasSecReq = false
			}
		}
		//
		if ( !hasSecReq ) {
			try {
				assert(this.ssl_opts.pfx !== undefined)
				hasSecReq = true
			} catch ( e ) {
				hasSecReq = false
			}
		}
		//
		if ( hasSecReq ) {
			assert(this.ssl_opts.passphrase !== undefined)
			assert(this.ssl_opts.rejectUnauthorized !== undefined)
			assert(this.ssl_opts.secureProtocol !== undefined)
			assert(this.ssl_opts.servername !== undefined)
			assert(this.ssl_opts.ciphers !== undefined)
			assert(this.ssl_opts.requestCert !== undefined)
			return(true)
		}
		
		return(false)
	}
	
	//
	configSSLServer(config) {
		this.server = https.createServer(this.ssl_opts, this.serverMiddlewareWrapper)
	}
	
	//
	configHTTPServer(config) {
		this.server = http.createServer(this.serverMiddlewareWrapper)
	}
	
	//
	doListen(config) {
		if ( config.address !== undefined ) {
			server.listen(config.port, config.address, (err) => {
						  if (err) {
						  	throw err
						  }
					})
		} else {
			server.listen(config.port, (err) => {  // assume address discovery
						  if (err) {
						  	return cb(err)
						  }
					})
		}
	}
	
	stop() {
		if (this.server) {
			this.server.close(() = {})
			this.server = undefined
		}
	}
	
	
	findTarget(req) {	//
		var targetOptions = { status: 200 } /// parse out parameters, etc.
		if ( !(targetOptions) ) {
			res.statusCode = 404; // No matching path found
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
			const nomatch = Error('no match found for ' + req.url);
			nomatch.status = 404;
			throw(nomatch);	// error object returned
		}
		return(targetOptions)
	}
	
	
	async runpipes(streamList) {
		await pipeline.apply(this,streamList)
	}
	
	async pipeConnections(targetOptions,sourceRequest,sourceResponse) {
		//
		var [targetRequest,targetPromise] = this.connectToTarget(targetOptions)
		//
		if ( targetRequest ) {
			//
			var dataTransforms_ingo = this.getIngoingBodyOps(targetOptions)
			dataTransforms_ingo.unshift(sourceRequest)   // source request up front
			dataTransforms_ingo.push(targetRequest)		 // target request at end
			this.runpipes(dataTransforms_ingo).catch(err => {
													 	throw err
													 })
			//
			var targetResponse = await targetPromise;   // wait for data to come back from the request
			if ( targetResponse ) {
				stats.incrementStatusCount(targetResponse.statusCode);
				stats.incrementResponseCount();
				//
				var dataTransforms_outgo = this.getOutgoingBodyOps(targetOptions)	// pipeline the target response back to the source...
				dataTransforms_outgo.push(sourceResponse)
				this.runpipes(dataTransforms_outgo).catch(err => {
															throw err
														  })
			}
		}

	}
	
	// tranform streams going to the target
	getIngoingBodyOps(targetOptions) {
		return(this.body_ops.ingoing_ops)
	}
	
	// tranform streams coming from the target
	getOutgoingBodyOps(targetOptions) {
		return(this.body_ops.outgoing_ops)
	}

	async middleware(req, res) {
		//
		//capture request time
		req.reqStartTimestamp = Date.now();
		stats.incrementRequestCount();

		// ----/ ----/ ----/ ----/ ----/ ----/ ----
		try {
			//
			var promises = this.pluginFilters(req,res)
			if ( promises && promises.length ) {
				//
				Promises.all(promises).then(headerUpdates => {
						var match = this.findTarget(req)
						if (  match.status === 200 ) {
							var sourceResponse = res;
							var sourceRequest = headerUpdates.reduce(req,null);
							if ( !sourceRequest ) {
								throw new Error("Rejection by header updates")
							}
							//
							await pipeConnections(match,sourceRequest,sourceResponse)
						}
					}).catch(e => {
								throw e
							 })
			} else {	// not going to be any changes on the header
				var match = this.findTarget(req)
				if (  match.status === 200 ) {
					await pipeConnections(match,sourceRequest,sourceResponse)
				}
			}
			//
		} catch (e) {
			if ( e.status === 404 ) {
				res.end(e.message)
			}
		}
		// ----/ ----/ ----/ ----/ ----/ ----/ ----
	}
	
	serverMiddlewareWrapper(req,res) {
		//
		//  node --max-http-header-size 15000 client.js
		//
		var luuid = uuid.v1()
		req.correlation_id = this.uid + '.' + uuid.unparse()  // for sending
		req.logger = loggerPool.get(this.uid,luuid,'tag')
		//
		this.middleware(req, res).then(res => {
								  		res.end();  /// ????
								  })
							.catch(e => {
								   
								   })
		//
	}
	
	//
	pluginFilters(req,res) {   // return a list of promises that work on header updates.
		//
		var identifier = this.identify(req)
		if ( this.config.statsMap ) {
			var stats = this.config[identifier]
			// pass on stats
			this.header_ops.map(hop => {
									return(hop(stat,req))
								})
		}
	}
	
	//
}


var testUris = [
			{
				'uri' : "check1",
				'body' : { "text" : "text1" }
			},
			{
				'uri' : "check2",
				'body' : { "text" : "text2" }
			},
			{
				'uri' : "check3",
				'body' : { "text" : "text3" }
			},
			{
				'uri' : "check4",
				'body' : { "text" : "text4" }
			},
			{
				'uri' : "check5",
				'body' : { "text" : "text5" }
			},
			{
				'uri' : "check6",
				'body' : { "text" : "text6" }
			},
			{
				'uri' : "check7",
				'body' : { "text" : "text7" }
			}
]

class TestNetServer {
	//
	constructor(config) {
		super(config)
		//
		this.consumption = false
		this.testTime = 500
		this.uris = testUris
		this.simInterval = setInterval(() => {
									   		this.consumerCheck()
									   },this.testTime)
	}
	
	// event handler
	// needs to check the consumption handler
	async consumerCheck() {
		console.log(typeof this.consumption)

		if ( this.consumption ) {
			console.log("dot")
			// Simulate the uri requet
			var uriIndex = Math.floor(Math.random()*this.uris.length)
			var uriData = this.uris[uriIndex]
			//
			// simulate uri and body. Inspect for allowance
			var allow = await this.consumption(uriData.uri,uriData.body)
			//
			if ( allow.status == 200 ) {
				console.log("OK - " + allow.status)
			} else {
				console.log("NOT ALLOWED - " + allow.status)
			}
		} else {
			console.log("NOT")
		}
	}
	
	//
	setConsumptionHandler(cb) {			// quota
		this.consumption = cb
	}
	
	//
	prepareShutdown() {
		if ( this.simInterval !== null ) {
			clearInterval(this.simInterval);
			this.simInterval = null
		}
	}
	
	// ---- ---- ---- ---- ---- ---- ----
	setBodyOps(bops) {
		this.body_ops = bops
	}
	setSpikeHandler(spiker) {
		this.spike_handler = spiker
	}
	setAuthorizer(auth) {
		this.auth = auth
	}
	setHeaderOps(hops) {
		this.header_ops = hops
	}
	
	getAuthorizer() {
		return(this.auth)
	}
	
	// ---- ---- ---- ---- ---- ---- ----
	
	resourceCount() {
		return this.uris.length
	}
}



module.exports = TestNetServer
