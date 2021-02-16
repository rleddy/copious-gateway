


const MAX_LOGGERS = 1024		// arbitrary, assume as many connections


class LoggerPool {
	constructor(LoggerClass) {
		this.loggerClass = LoggerClass
		this.applogger = this.init(MAX_LOGGERS)
		
	}
	
	init(nloggers) {
		this.firstFreeLogger = 1;
		this.maxLoggers = nloggers
		this.allLoggers = new Array(nloggers)
		this.allLoggers = this.allLoggers.map((pos,index) => {
											  	return new this.LoggerClass('app',index)
											  })
		return(this.allLoggers[0])
	}
	
	get(id,uuid,tag) {
		var nextLogger = null;
		//
		if ( this.firstFreeLogger > 0 ) {  // the 0 logger is the app logger
			nextLogger = this.allLoggers[this.firstFreeLogger]
			nextLogger.index = this.firstFreeLogger++
			if ( this.firstFreeLogger >= this.maxLoggers ) {
				this.firstFreeLogger = -this.maxLoggers
			} else {
				if ( this.firstFreeLogger > -this.maxLoggers ) {
					var index = -this.firstFreeLogger
					nextLogger = this.allLoggers[index]
					this.firstFreeLogger = nextLogger.index
					nextLogger.index = index
				}
			}
		}
		
		nextLogger.setParams(id,uuid,tag)
		
		return(nextLogger)
	}
	
	unget(logger) {
		var index = logger.index;
		logger.index = this.firstFreeLogger;
		this.firstFreeLogger = -index;
	}
	
}

module.exports = LoggerPool;


