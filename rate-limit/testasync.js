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

