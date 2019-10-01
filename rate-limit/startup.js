//
// require
const util = require('util');
const fs = require('fs');
//
const rcluster = require('./reload-cluster')
const KeyedShm = require('./keyed-shm')

// command line
// ------------------------------------------   COMMAND LINE PARAMETERS
// the key is generated externally and passed here and to C++ q manager
var shmKey = process.argv[2]


if ( shmKey === undefined ) {
	console.log("shm key required")
	process.exit(1)
}

var g_memkey = parseInt(shmKey)


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
//
function remainingIndex(indexList) {
	var n = indexList.length
	var indexFinder = new Array(n)
	indexFinder.fill(-1)
	for ( var i = 0; i < n; i++ ) {
		var j = indexList[i]
		if ( j >= 0 ) {
			indexFinder[j] = j
		}
	}
	
	for ( var k = 0; k < n; k++ ) {
		if ( indexFinder[k] < 0 ) {
			return(k)
		}
	}
	
	return(-1)
}


var g_MasterBuffer = null;
function setupSharedMemory() {
	g_MasterBuffer = shm.create(4096,'Buffer',g_memkey)
}

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
//


// RUN RUN

// shared memory
setupSharedMemory(memkey)

// launch clusters
var options = {}
var cManager = rcluster('qcheck',options)     //qcheck.js
//


// -------------------------------------------    WORKER SETUP
// When a worker is forked, the 'cworker' event is emitted.
//
cManager.on('cworker',(worker,wInfo) => {   // the work will be the process object. wInfo is the record for book keeping.
			
				//
				// Each worker needs a memIndex so that it knows where to write in memory.
				if ( !(wInfo.hasOwnProperty('memIndex')) ) {
					// get the indexes that are in play.
					var indexList = cManager.mapTracked((winfo) => {
														return(winfo.memIndex ? winfo.memIndex : -1)
													})
					// find the first remaining index if possible.
					var index = remainingIndex(indexList)
					if ( index >= 0 ) {
							// it was found, send it to the child.
						g_config.configurationOps = true
						g_config.serverOps = true
						g_config.quota = {
										'memIndex' : index,
										'memKey' : g_memkey
								}
						worker.send(g_config)
					}
				}
				//
				//
			})

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

var mqtt = require('mqtt')
var mqtt_client  = mqtt.connect('mqtt://test.mosquitto.org')  // point to our server

var g_config = {}

var mqttKey = fs.readFileSync('confighash.txt','ascii').toString()
if ( !isHash(mqttKey) ) {
	if ( fs.stat(mqttKey) ) {// not right
		var config = fs.readFileSync(mqttKey,'ascii').toString()
		do_configure(config)
	}
}


do_configure(confstr) {
	try {
		g_config = JSON.parse(confstr)
	} catch ( e ) {
		console.log("could not load config file from mqtt hash")
	}

}

var mqttAES_topic = ""
var mqttConfig_topic = ""


function setSubscriptions(an_mqttKey) {
	mqtt_client.subscribe(an_mqttKey, (err) => {
						  if ( !err ) {
						  		// mqtt_client.publish('presence', 'Hello mqtt')
						  } else {
						  		//
						  }
					})
	mqttAES_topic = an_mqttKey + "-AES"
	mqtt_client.subscribe(mqttAES_topic, (err) => {
						  if ( !err ) {
						  		// mqtt_client.publish('presence', 'Hello mqtt')
						  } else {
						  		//
						  }
					})
	mqttConfig_topic = an_mqttKey + "-config"
	mqtt_client.subscribe(mqttAES_topic, (err) => {
						  if ( !err ) {
						  		// mqtt_client.publish('presence', 'Hello mqtt')
						  } else {
						  		//
						  }
					})
}


function unsetSubscriptions(an_mqttKey) {
	mqtt_client.unsubscribe(an_mqttKey, (err) => {
						  if ( !err ) {
						  // mqtt_client.publish('presence', 'Hello mqtt')
						  } else {
						  //
						  }
					})
	mqttAES_topic = an_mqttKey + "-AES"
	mqtt_client.unsubscribe(mqttAES_topic, (err) => {
						  if ( !err ) {
						  // mqtt_client.publish('presence', 'Hello mqtt')
						  } else {
						  //
						  }
					})
	mqttConfig_topic = an_mqttKey + "-config"
	mqtt_client.subunsubscribescribe(mqttAES_topic, (err) => {
						  if ( !err ) {
						  // mqtt_client.publish('presence', 'Hello mqtt')
						  } else {
						  //
						  }
					})
}

mqtt_client.on('connect', function () {
			   })

mqtt_client.on('message', (topic, message) => {
			   if ( topic === mqttKey ) {
				   if ( message !== topic ) {
			   			unsetSubscriptions(topic)
						setSubscriptions(topic)
				   }
			   } else if ( topic === mqttAES_topic ) {
			   		setAES(message)
			   } else if ( topic === mqttConfig_topic ) {
			   		confstr = decipherConfig(message)
			   		if ( hashConfig(confstr) === mqttKey ) {
			   			var configuredBefore = Object.keys(g_config).length
			   			do_configure(confstr)
			   			if ( configuredBefore ) {
							delete g_config.quota
							g_config.configurationOps = true
							g_config.serverOps = false
						}
			   			sendWokers(g_config)
			   		}
			   }
		})


shutdownMQTT() {
	 mqtt_client.end()
}










