
const shm = require('shm-typed-array')
const fs = require('fs')
const util = require('util');
//const Mutex = require('await-mutex')

// Mutex from async-mutex
class Mutex {

    constructor() {
        this._locking = Promise.resolve();
        this._locks = 0;
    }

    isLocked() {
        return this._locks > 0;
    }

    lock() {

        this._locks += 1;

        let unlockNext;

        let willLock = new Promise(resolve => unlockNext = () => {
            this._locks -= 1;
      
            resolve();
        });

        let willUnlock = this._locking.then(() => unlockNext);

        this._locking = this._locking.then(() => willLock);

        return willUnlock;
    }
}


const MAX_RESOURCES = 128
const ZERO_WAIT_MAX_COUNT = 500

const sleep = util.promisify(setTimeout)


// Sleeper

module.exports = class KeyShm {

	//
	constructor(memkey,processSection) {
		if ( typeof memkey === 'string' ) {
			memkey = parseInt(memkey)
		}
		this.bigBuffer = shm.get(memkey);
		if ( this.bigBuffer === null ) {
			throw new Error('No shared memory')
		}
		if ( processSection !== undefined ) {
			this.index = processSection*MAX_RESOURCES;   // this is by the resource box index
		} else {
			this.index = -1
		}
		this._mutex = new Mutex();
		this.starter = Date.now()
	}
	
	//
	dontLastForever() {
		this.starter = Date.now()
	}
	
	//
	lastingForever() {
		if ( (this.starter + 10000) > Date.now() ) {
			return false;
		}
		return true;
	}

	//
	async waitForReset(offset) {
		this.dontLastForever()
		var isU = this.bigBuffer.readUInt8(offset) // read until 0
		while ( isU !== 0 ) {
			await sleep(1)
			isU = this.bigBuffer.readUInt8(offset)
			if ( this.lastingForever() ) {
				break
			}
		}

	}
	
	//
	async useResoure(resourceNum) {
		var permission = -1
		if ( this.index >= 0 ) {
			var offset = this.index + resourceNum*2;  // signal shared memory at this position.
			let unlock = await this._mutex.lock();
			//
			this.bigBuffer.writeUInt8(1,offset);   // write flag set high
			await this.waitForReset(offset)
			permission = this.bigBuffer.readUInt8(offset+1)  //  read state
			//
			unlock()
		}
		return(permission)
	}
	
}
