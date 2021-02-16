//
var diverter = require('connected-divert')
//
const MAX_SAMPLES = 10
const DELTA_THRESHOLD =  50 // 50 msec
const MAX_POSTPONE = 50
//
const BURST_CLEAR = 0
const BURST_POSTPONE = 1
const BURST_DIVERT = 2
const BURST_REJECT = 3
//
const ALLOWANCE_PERCENTILE = 0.75


class SpikeHandler {
	
	constructor() {
		this.prev_check = Date.now()
		this.delta_averages = new Array(MAX_SAMPLES)
		this.next_sample = 0
		this.delta_averages.fill(0)
		this._average = 1000.00
		this.postponement = []
		this.state = BURST_CLEAR;
		this.divert_count = 0
	}
	
	
	async checkRate(stats) {
		var now = Date.now()
		var curDelta = now - this.prev_check
		this.addSample(curDelta)
		this.average();
		if ( this._average < DELTA_THRESHOLD ) {
			//
			return(new Promise((resolve,reject) => {
									switch ( this.state ) {
										case BURST_CLEAR: {
											this.state = BURST_POSTPONE;
							   				resolve(stats)
											break;
										}
										case BURST_POSTPONE: {
										    if ( this.postponement.length >= MAX_POSTPONE ) {
							   					this.state = BURST_DIVERT;
										    }
							   				this.postponement.push(stats)
			  							    var allowance = Math.random()
										    if ( (allowance > ALLOWANCE_PERCENTILE) && this.postponement.length ) {
												var stat = this.postponement.shift()
							   					resolve(stat)
										    }
											break;
										}
										case BURST_DIVERT: {
											var allowance = Math.random()
										    if ( (allowance > ALLOWANCE_PERCENTILE) && this.postponement.length ) {
												var stat = this.postponement.shift()
							   					resolve(stat)
											} else {
							   					this.divert_count++
							   					var stat = await this.divert(stats)
							   					resolve(stat)
											}
											break;
										}
										case BURST_REJECT: {
							   				reject(stats)
											break;
										}
									}
							   }))
		} else {
			//
			if ( this.divert_count > 0 ) this.divert_count--;
			if ( (this.state === BURST_DIVERT) && (this.divert_count === 0) ) {
				this.state = BURST_POSTPONE
			} else if ( (this.state === BURST_POSTPONE) && (this.postponement.length === 0) ) {
				this.state = BURST_CLEAR
			}
			//
			return(new Promise((resolve,reject) => {
									//
								    if ( this.postponement.length ) {
										var stat = this.postponement.shift()
							   			resolve([stat,stats])
								    } else {
										resolve(stats)
								    }
									//
							   }))
		}
	}
	
	//
	addSample(curDelta) {
		//
		var i = this.next_sample++
		this.delta_averages[i] = curDelta
		if ( this.next_sample >= MAX_SAMPLES ) {
			this.next_sample = 0
		}
	}
	
	//
	average() {
		var sum = this.delta_averages.reduce( (x,y) => x + y, 0.0 )
		return(sum/MAX_SAMPLES)
	}
	
	//
	async divert(stats) {
		//  //  mqtt to some supervisor // subscribe to completion
		diverter.publish(stats)
		var stat = await diverter.response(stats)
		return stat
	}
	
	
}


module.exports = new SpikeHandler();

