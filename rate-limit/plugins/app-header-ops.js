


module.exports = []




/*
class SimpleHeaderOp  {
	constructor(config) {
 		this.config = config;
	}
 
	 updateHeader(headerOpt,req) {
 		//
 		headerOpt['send_timestamp'] = Date.now();
 		headerOpt['x-request-id'] = req.correlation_id
 
		if ( this.config['x-forwarded-proto'] ) {
			headerOpt['x-forwarded-proto'] = this.config.x_proto;
		}
 
		if ( this.config['x-forwarded-for'] ) {
			var forwarded_for = req.headers['x-forwarded-for'] || '';
			if ( forwarded_for.length > 0 ) { forwarded_for += ','; }
			forwarded_for += req.socket.remoteAddress;
			headerOpt['x-forwarded-for'] = forwarded_for;
		}
 
	 }
}
 
 
 class HostnameHeaderOp  {
 	constructor(config) {
 		this.config = config;
	}
 
	 stripPort(hostname) {
		const colon = hostname.indexOf(':');
		if (colon > 0) {
			return(hostname.substring(0, colon)); // strip port if present
		}
 		return(hostname)
	 }
 
 	 updateHeader(headerOpt,req) {
 
		if ( req.headers.host ) { // might be missing (with an http-1.0 client for example)
 			var hostname = req.headers.host;

			if ( this.config['x-forwarded-host'] ) {
				var forwarded_host = headerOpt['x-forwarded-host'] || '';
				if ( headerOpt > 0 ) { headerOpt += ','; }
				forwarded_host += hostname;
				headerOpt['x-forwarded-host'] = forwarded_host;
			}
 
 			hostname = this.stripPort(hostname)

			if ( this.config['via'] ) {
				// append our hostname (but not the port), if present, to the via header
				var via = headerOpt['via'] || '';
				if ( via.length > 0 ) { via += ','; }
				via += req.httpVersion + ' ' + hostname;
				headerOpt['via'] = via;
			}

		}

 	}
 }
 
 
 class ContentLengthHeaderOp  {
 	//
 	constructor(config) {
 		this.config = config;
	}
 
 	updateHeader(headerOpt,req) {
		if ( headerOpt['content-length'] ) {
			delete headerOpt['content-length'];  // will be recalculated
			//if(!headerOpt['transfer-encoding'] && req.method==='DELETE') {
			//	headerOpt['transfer-encoding'] = 'chunked';
			//}
		}
 	}

 }

module.exports = [
				  { "name" : "example",
				  	"defClass" :  SimpleTransform
				  },
 				  { "name" : "example2",
				  	"defClass" :  HostnameHeaderOp
				  },
 				  { "name" : "example3",
				  	"defClass" :  ContentLengthHeaderOp
				  }

]
*/

