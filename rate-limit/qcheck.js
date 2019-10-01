// qcheck -- assume this is what is launched by the cluster manager
//

const NetServer = require('./net-server')

const ConsumerLimits = require('./consumer-limits')
const SpikeHandler = require('./spike-handler')
const Authorizer = require('./auth-handler')
const HeaderOps = require('./header-ops')
const BodyOps = require('./body-ops')


//each child process has a section of memory...


// async middleware for the server
// responseMiddleware returns the curried callback for the middleware.
// the middleware takes in request information and the consumer will
// decide on passing it on.

function quotaMiddleware(consumer) {
	return(async (uri,body) => {
			   console.log(uri + " == " + JSON.stringify(body))
		       // app server calls this as its middleware
			   var resource = consumer.mapToResource(uri,body)
			   var decisionInfo = await consumer.handleReqCount(resource,body)
		   		console.log("DONE !!! " + uri + " == " + JSON.stringify(body))
			   // any modifification decisionInfo
			   return(decisionInfo)
		   })
}


var g_AppServer = null


// ---- ---- ---- ---- ----
function setupQuota(quota) {
	var index = quota.memIndex;
	var memkey = quota.memKey;
	if ( (memkey !== undefined) || (index !== undefined) ) {
		var clim = new ConsumerLimits(index,memkey)  // the interface to shared memory
		appServer.setConsumptionHandler(quotaMiddleware(clim))
	} else {
		process.send("Invalid index or memkey -- quota")
	}
}

// ---- ---- ---- ---- ---- ----
function setupSpikeArrest(spikeConfig) {
	var spiker = new SpikeHandler(spikeConfig)  // the interface to shared memory
	appServer.setSpikeHandler(spiker)
}

// ---- ---- ---- ---- ---- ----
function setupAuthorizer(authorizer) {
	var auth = new Authorizer(authorizer)  // the interface to shared memory
	appServer.setAuthorizer(auth)
}

// ---- ---- ---- ---- ---- ----
function setupHeaderOps(header_ops_list) {
	if ( (typeof header_ops_list === 'object')) {
		if ( header_ops_list.length ) {
			var hops = new HeaderOps(header_ops_list)  // the interface to shared memory
			appServer.setHeaderOps(hops)
		}
	} else {
		process.send("Invalid header operations")
	}
}


function setupBodyTransorms(body_transforms) {
	if ( typeof body_transforms === 'object' ) {
		if ( body_transforms.length ) {
			var bops = new BodyOps(header_ops_list)  // the interface to shared memory
			appServer.setBodyOps(bops)
		}
	} else {
		process.send("Invalid body transforms")
	}
}


if ( process.send ) {
	process.on('message',(msg) => {
			   if ( msg && ((msg.serverOps !== undefined) && msg.serverOps) && (g_AppServer === null) ) {
				   g_AppServer = new NetServer(msg);
			   }
			   if ( msg && ((msg.configurationOps !== undefined) && msg.configurationOps) && (g_AppServer !== null) ) {
				   // when this worker starts running, the master assigns it this index.
				   if ( msg.quota !== undefined ) {
			   			setupQuota(quota)
				   }
				   if ( msg.spike_config !== undefined ) {
			   			setupSpikeArrest(msg.spike_config)
				   }
				   if ( msg.authorizer !== undefined ) {
					   setupAuthorizer(msg.authorizer)
				   }
				   if ( msg.header_ops !== undefined ) {
					   setupHeaderOps(msg.header_ops)
				   }
				   if ( msg.body_transforms !== undefined ) {
			   			setupBodyTransorms(msg.body_transforms)
				   }
			   }
			})
} else {
	var memkey = parseInt(process.argv[2])
	var index = parseInt(process.argv[3])
	if ( (memkey !== undefined) && (index !== undefined) ) {
		setupTest(index,memkey)
	    var clim = new ConsumerLimits(index,memkey)  // the interface to shared memory
	    appServer.setConsumptionHandler(quotaMiddleware(clim))
	} else {
		console.log("missing parameters: [memkey]  [index]" )
		appServer.prepareShutdown()
	}
}



// TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST
// TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST
const shm = require('shm-typed-array')  // tests

var g_testBuffer = null
var g_regionIndex = -1


function simQKeeper() {
	if ( (g_AppServer != null) && (g_regionIndex >= 0) ) {
		var n = g_AppServer.resourceCount()
		for ( var i = 0; i < n; i++ ) {
			//
			var offset = g_regionIndex + i*2
			var b = testBuffer.readUInt8(offset)   // is someone asking?
			if ( b > 0 ) {
				var c = (Math.random() > 0.5) ? 1 : 0  // simulate a count
				g_testBuffer.writeUInt8(c,offset+1)		// yes .. so write the permission
				g_testBuffer.writeUInt8(0,offset)		// now tell them to read and go.
			}
		}
	}
}


var g_memkey = -1

function setupTest(index,memkey) {
	g_memkey = memkey
	g_testBuffer = shm.create(4096,'Buffer',memkey)
	g_regionIndex = index
}


function exitGracefully() {
	if ( g_memeky > 0 ) {
		shm.detach(g_memkey,true)
	}
	process.exit(0)
}


process.on('SIGINT',exitGracefully)



