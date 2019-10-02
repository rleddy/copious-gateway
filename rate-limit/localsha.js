var crypto = require('crypto')

module.exports = '3ec4fadf5ddf3035fcd5ec1199a6e8adc807cb1f43589af0e992e1a60974531c176f78f85ac76caeea289097ac8b3309d3698878320a2b10dbe213ea787b56a8'


// this should be run to generate the above string.
// The above string should be shared by mqtt endpoints and not be reproduced at runtime.
// so some config process outside of this stack should be used to distributed the salt above.
function genRandomString(length) {
	return crypto.randomBytes(Math.ceil(length/2))
						.toString('hex') /** convert to hexadecimal format */
						.slice(0,length);   /** return required number of characters */
}

if ( process.argv[2] !== undefined && (process.argv[2] == 'gensalt') ) {
	console.log(genRandomString(128))
}
