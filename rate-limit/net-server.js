

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
	constructor(uri,body) {
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
	setConsumptionHandler(cb) {
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
	setBodyOps(bops) {}
	setSpikeHandler(spiker) {}
	setAuthorizer(auth) {}
	setHeaderOps(hops) {}
	setBodyOps(bops) {}
	
	// ---- ---- ---- ---- ---- ---- ----
	
	resourceCount() {
		return this.uris.length
	}
}



module.exports = TestNetServer
