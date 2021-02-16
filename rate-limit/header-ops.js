//
const appHeaderOpsCollection = require('./plugins/app-header-ops') // required to be a list

//
class HeaderOps {
	
	constructor(config) {
		//
		var select_header_ops = appHeaderOpsCollection.filter(opObj => {
														  	return ( (config[opObj.name] !== undefined) && config[opObj.name].outgoing );
														  })
		//
		this.header_ops = select_header_ops.map(opObj => {
														var className = opObj.defClass
														return( new className(opObj.name,config[opObj.name]) )
													})
	}
	
}


module.exports = new HeaderOps();

