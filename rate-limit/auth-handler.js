//

const { createECDH, ECDH } = require('crypto');

function do_hash(data) {
	const secret = g_ShaSecret;
	const hash = crypto.createHmac('sha256', g_ShaSecret)
					   .update(data)
				       .digest('hex');
	return(hash)
}


class Authorizer {
	
	constructor(authConfig) {
		this.ECDH = createECDH('secp521r1');
		//
		this.ShaSecret = authConfig.procShaSecret;
		this.nonce = authConfig.nonce;
		//
		if ( authConfig.procLocalKey && authConfig.procLocalKey.length ) {
			this.ECDH.setPrivateKey(authConfig.procLocalKey,'hex')
		}
	}
	
	setNone(nonce) {
		this.nonce = nonce;
	}
	
	async checkAuth(req,res,headers,body) {
		//
		var secret = this.ECDH.computeSecret(headers.x_pub);
		//
		var hidden = headers['token'];
		var iv = do_hash(hidden,this.ShaSecret)
		// sender service had to construct secret from bob's key, which is registered to this..
		var clearM = await aesDecipher(hidden,secret,iv)
		if ( clearM && clearM.length ) {
			try {
				var obj = JSON.parse(clearM)
				if ( obj.nonce === this.nonce ) {
					return(this.resToACL(obj.resId))
				}
			} catch (e) {
				return(false)
			}
		}
		return(false)
		//
	}
	
	resToACL(resId) {
		return(true)
	}
}

module.exports = new Authorizer();

