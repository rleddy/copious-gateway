//
const KeyedShm = require('./keyed-shm')  // make use of an object that keeps track of the kinds of requests going through.

class Consumer {   // manage resource keys
	// //
	constructor(memkey,index) {
		this.pshm = new KeyedShm(memkey,index)  // the index identifies a region in the shared mem
		this.reourcesMap = {}
		this.resourceStack = []
	}
	//
	goodHeader(status,body) {
		// changes in the body are possible
		body.status = parseInt(status)
		return(body)
	}
	//
	badHeader(status,body) {
		// changes in the body are possible
		body.status = parseInt(status)
		return(body)
	}
	//
	async handleReqCount(resource,body) {
		var allowed = await this.pshm.useResoure(resource);
		if ( allowed ) {
			return(goodHeader("200",body))
		} else {
			return(badHeader("403",body));
		}
	}
	//
	// returns an index required by for location in the resource counter
	mapToResource(uri,body) {
		//
		var index = 0
		if ( this.reourcesMap.hasOwnProperty(uri) ) {
			index = this.reourcesMap[uri]
		} else {
			index = this.resourceStack.length
			this.reourcesMap[uri] = index
			this.resourceStack.push(uri)
		}
		//
		return(index)
	}
}


module.exports = Consumer;

