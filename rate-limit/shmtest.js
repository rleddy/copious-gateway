

const shm = require('shm-typed-array')
const fs = require('fs')
const util = require('util');

var KeyShm = require('./keyed-shm')

const resNum = 2
//
var testBuffer = shm.create(4096,'Buffer',123)

var testshm = new KeyShm('123',1)
console.log(testshm.index)


var offset = testshm.index + resNum*2

console.log(offset)


testshm.bigBuffer.writeUInt8(0,offset)
console.log(testBuffer.readUInt8(offset))

setTimeout(() => {
		   		testBuffer.writeUInt8(0,offset)
				console.log("write 2")
		   		testBuffer.writeUInt8(2,offset+1)
		   },50)

setTimeout(() => {
			   testBuffer.writeUInt8(0,offset)
			   console.log("write 5")
			   testBuffer.writeUInt8(5,offset+1)
		   },500)


var promiselist = [1,2].map( async (c) => {
							  	perm = await testshm.useResoure(resNum)
							  	return perm
							  })

Promise.all(promiselist).then((plist) => {
							  console.log("perms: " + plist)
							  shm.detach(123,true)
							  process.exit(0)
						})


/*
async function tester() {
	//
	var perm = await testshm.useResoure(resNum)
	var perm2 = await testshm.useResoure(resNum)
	console.log("perm: " + perm)
	shm.detach(123,true)
	process.exit(0)

}
tester()
*/
