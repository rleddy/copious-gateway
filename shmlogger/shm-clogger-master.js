
var shm = require('shm-typed-array')
var fs = require("fs")

var {spawn} = require('child_process')

var buf = shm.create(4096)

console.log(typeof buf)
console.log('[Master] Typeof buf:', buf.constructor.name)
console.log(buf.key)

buf.write('buffer: this is a test')
console.log(buf.toString())


var logger = spawn(__dirname + '/clogger',[buf.key])

var firstrun = false
logger.stdout.on('data', (data) => {
				 console.log(`stdout: ${data}`);
				 if ( !firstrun ) {
					firstrun = true
				 	logger.emit('first-run')
				 }
			 });

logger.on('first-run',() => {
		  
				buf.writeUInt32LE(1)
				buf.writeUInt32LE(1,4)
				buf.writeUInt32LE(1,8)

				var hrstart = process.hrtime()

				for ( var i = 0; i < 11000000; i++ ) {
				  var date = Date.now()
				  var d1 = Math.floor(date/1000)
				  var d2 = date % 1000
				  buf.writeUInt32LE(d1)
				  buf.writeUInt32LE(d2,4)
				  buf.writeUInt32LE(i%8192,8)
				  buf.write('a',12,1,'ascii')
				}
		  
				buf.writeUInt32BE(0)
				buf.writeInt32BE(0,4)
		  		buf.writeInt32BE(0,8)


				const NS_PER_SEC = 1e9;
				var hrend = process.hrtime(hrstart)
				console.log(`etime: ${hrend[0] * NS_PER_SEC + hrend[1]}`);
				console.log('secs: ' + (hrend[0] * NS_PER_SEC + hrend[1])/1000000000.0);

				const used = process.memoryUsage();
				for (let key in used) {
				  console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
				}

		  })

