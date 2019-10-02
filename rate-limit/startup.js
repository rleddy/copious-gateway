//
// require
const fs = require('fs');
const crypto = require('crypto');
//
const rcluster = require('./reload-cluster')
const KeyedShm = require('./keyed-shm')
const g_ShaSecret = require('./localsha')   // this is the salt


const CTLS_URL = "https://.......";

function getMac() {
	var macs = require('os').networkInterfaces()
	for ( var k in macs ) {
		if ( k[0] === 'e' ) {
			var intrfacelist = macs[k]
			return intrfacelist[0].mac
		}
	}
	return '1234'
}


// command line
// ------------------------------------------   COMMAND LINE PARAMETERS
// the key is generated externally and passed here and to C++ q manager
var shmKey = process.argv[2]


if ( shmKey === undefined ) {
	console.log("shm key required")
	process.exit(1)
}

var g_memkey = parseInt(shmKey)


var g_myID = getMac()
var myPublicKey = ""


function registerService() {
	var opts = {
	method: "POST"
		form : {
			"whoami" : g_myID
		}
	}
	require(CTLS_URL,opts,(err,body) => {
				myPublicKey = body.toString();
			})
}



// ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

function isHash(str) {
	// isHex
	var test = /^[0..9,A..F,a..f]+$/.test()
	return(test)
	// right length
}

function do_hash(config) {
	const secret = g_ShaSecret;
	const hash = crypto.createHmac('sha256', g_ShaSecret)
					   .update(config)
				       .digest('hex');
	return(hash)
}

//
var gAES = ""

async function aesDecipher(message,aes_key,iv) {
	//
	var alg = 'aes-128-cbc'
	var dec = crypto.createDecipheriv('aes-128-cbc', key, iv)
	
	return new Promise((resolve,reject) => {
								   let decrypted = '';
								   dec.on('readable', () => {
											  	while (null !== (chunk = decipher.read())) {
											  		decrypted += chunk.toString('utf8');
											  	}
											});
								   dec.on('end', () => {
										  		resolve(decrypted);
										  });
					   })
}



async function decipher(fogmessage,aes_key) {
	var kl = fogmessage[0] ^ 0xE2 // as utf8 encoded
	var iv = fogmessage.substr(1,kl)
	var message = fogmessage.substr(kl)
	iv = await decrypt(iv,myPublicKey)
	var clearM = await aesDecipher(message,aes_key,iv)
	return(clearM)
}
//
async function decipherConfig(message) {
	if ( gAES.length ) {
		// have a nice day
		var clear = await decipher(message,gAES)
		return clear
	}
	return ""
}


async function decrypt(message,pubKey) {
	var buffer = Buffer.from('fhqwhgads', 'Base64')
	var bs = crypto.publicDecrypt(pubKey, buffer)
	return bs.toString()
}

//
function setAES(message) {
	decrypt(message,myPublicKey).then(key => {
									 gAES = key
							  }).error((err) => {})
}


// ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
//
// These are indecies into shared memory sections
// that are used for to map to resource, one section per core.
//
function remainingIndex(indexList) {	// index list order unknown, gaps unkown
	var n = indexList.length
	var indexFinder = new Array(n)
	indexFinder.fill(-1)
	for ( var i = 0; i < n; i++ ) {  // set the value of the indexed position to the index
		var j = indexList[i]		 // but only if it is a set value
		if ( j >= 0 ) {
			indexFinder[j] = j
		}
	}
	
	for ( var k = 0; k < n; k++ ) {	// index finder ordered and gaps marked
		if ( indexFinder[k] < 0 ) {	// return the first one
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


function sendWokers(new_config) {
	//
	cManager.foreachTracked((winfo) => {
							var worker = cManager.access(winfo.worker_key)
							if ( worker ) {
								worker.send(new_config)
							}
						})
}

// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

var mqtt = require('mqtt')
var mqtt_client  = mqtt.connect('mqtt://test.mosquitto.org')  // point to our server

var g_config = {}


//
var g_mqttKey = fs.readFileSync('confighash.txt','ascii').toString()
if ( !isHash(g_mqttKey) ) {
	fs.access(g_mqttKey,(err) => {
			  if ( err ) {
			  	console.log("no configuration could be found")
			  } else {
				  var config = fs.readFileSync(g_mqttKey,'ascii').toString()
				  do_configure(config)
				  g_mqttKey = do_hash(config)
				  setSubscriptions(g_mqttKey)
			  }
			})
} else {
	setSubscriptions(g_mqttKey)
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
	//
	mqtt_client.subscribe(an_mqttKey, (err) => {
						  if ( !err ) {
						  		// mqtt_client.publish('presence', 'Hello mqtt')
						  } else {
						  		//
						  }
					})
	//
	mqttAES_topic = an_mqttKey + "-AES"
	mqtt_client.subscribe(mqttAES_topic, (err) => {
						  if ( !err ) {
						  		// mqtt_client.publish('presence', 'Hello mqtt')
						  } else {
						  		//
						  }
					})
	//
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
	//
	mqtt_client.unsubscribe(an_mqttKey, (err) => {
											  if ( !err ) {
												// mqtt_client.publish('presence', 'Hello mqtt')
											  } else {
												//
											  }
										})
	//
	mqttAES_topic = an_mqttKey + "-AES"
	mqtt_client.unsubscribe(mqttAES_topic, (err) => {
											  if ( !err ) {
											  // mqtt_client.publish('presence', 'Hello mqtt')
											  } else {
											  //
											  }
										})
	//
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
								   if ( topic === g_mqttKey ) {
			   						   // If a configuration changes,
									   // the first message to be sent will be the sha256 hash
									   // based on the current shared salt.
									   if ( message !== topic ) { // change the subscriptions to match the new key
											unsetSubscriptions(topic)
											setSubscriptions(topic)
									   }
									   //
								   } else if ( topic === mqttAES_topic ) {
			   							// the next message coming back this way should deliever ans AES key
										setAES(message)
								   } else if ( topic === mqttConfig_topic ) {
			   							// using the AES key decipher the next configuration being sent
			   							// when it is sent.
			   							decipherConfig(message).then((confstr) => {
													if ( hashConfig(confstr) === g_mqttKey ) {
														var configuredBefore = Object.keys(g_config).length
														do_configure(confstr)
														if ( configuredBefore ) {
															delete g_config.quota
															g_config.configurationOps = true
															g_config.serverOps = false
														}
														sendWokers(g_config)
													}
										})
			   
								   }
							})


shutdownMQTT() {
	 mqtt_client.end()
}




registerService()







