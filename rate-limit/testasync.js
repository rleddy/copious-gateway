//
const util = require('util');
const fs = require('fs');

const stat = util.promisify(fs.stat);
const sleep = util.promisify(setTimeout)

async function callStat(dir) {
	const stats = await stat(dir);
	console.log(`This directory is owned by ${stats.uid}`);
}

(async () => {
 console.time("Slept for")
 await sleep(30)
 console.timeEnd("Slept for")
 })()


callStat('.')

/*
 const crypto = require('crypto');
 
 const algorithm = 'aes-192-cbc';
 const password = 'Password used to generate key';
 // Key length is dependent on the algorithm. In this case for aes192, it is
 // 24 bytes (192 bits).
 // Use async `crypto.scrypt()` instead.
 const key = crypto.scryptSync(password, 'salt', 24);
 // Use `crypto.randomBytes()` to generate a random iv instead of the static iv
 // shown here.
 const iv = Buffer.alloc(16, 0); // Initialization vector.
 
 const cipher = crypto.createCipheriv(algorithm, key, iv);
 
 let encrypted = '';
 cipher.on('readable', () => {
 let chunk;
 while (null !== (chunk = cipher.read())) {
 encrypted += chunk.toString('hex');
 }
 });
 cipher.on('end', () => {
 console.log(encrypted);
 // Prints: e5f79c5915c02171eec6b212d5520d44480993d7d622a7c4c2da32f6efda0ffa
 });
 
 cipher.write('some clear text data');
 cipher.end();
 */


/*
 
 function main() {
 dash.on("detected", async function () {
 tmpFile = await readFileAsync('tmp.png');
 console.log(tmpFile);
 });
 }
 
 */

async function* asyncGenerator() {
	var i = 0;
	while (i < 3) {
		await sleep(5)
		yield i++;
	}
}

(async function() {
 for await (let num of asyncGenerator()) {
 console.log(num);
 console.log(num + ' :: ' + Date.now())
 }
 })();

var promiselist = [1,2,3].map( async (c) => {
							  await sleep(20)
							  console.log('-+: ' + Date.now())
							  })

Promise.all(promiselist)

