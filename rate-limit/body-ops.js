//

const appOpsCollection = require('./plugins/app-body-ops') // required to be a list

class BodyOps {
	
	constructor(config) {
		//
		var select_outgoing_ops = appOpsCollection.filter(opObj => {
							return ( (config[opObj.name] !== undefined) && config[opObj.name].outgoing );
						})
		//
		this.outgoing_ops = select_outgoing_ops.map(opObj => {
													var className = opObj.defClass
													return( new className(opObj.name,config[opObj.name]) )
												})
		//
		var select_ingoing_ops = appOpsCollection.filter(opObj => {
							return ( (config[opObj.name] !== undefined) && config[opObj.name].ingoing );
						})
		//
		this.ingoing_ops = select_ingoing_ops.map(opObj => {
														var className = opObj.defClass
														return( new className(opObj.name,config[opObj.name]) )
													})
	}
	
	
	
}


module.exports = new BodyOps();

