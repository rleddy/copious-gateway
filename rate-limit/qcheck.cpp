

#include <sys/ipc.h>
#include <sys/types.h>
#include <sys/shm.h>
#include <unistd.h>

#include <iostream>
#include <fstream>
#include <ctime>

// qcheck check for quota...

using namespace std;

/*
 
	qcheck keeps track of quotas.  It loops through shared memory by resource.
 	//
 	For each process running on a core, there is a table in of resources.
 	Each core table occupies a region of memory.
 	Each resource has the same index in each process table. So resource A may have an index 2 in table 1 for process 1.
 	The resoure A will have the same index 2 in table 3 for process 3, etc.
 
	qcheck looks at each resource index 0,1,2,3... up to a max number of resources (which defines the table size).
 	qcheck loops through memory by resource index, jumping from table to table. As it goes it counts the number of processes
 	requesting permission for a particular resource. It then updates a general count of usage for each resource.
 	As qcheck goes about its counting, it collects a point to the place in memory (address) where it may write a flag to the
 	requesting processes.
 
 	In each table a single resource entry take two bytes. The first byte is the requester byte. The second byte is the
 	permission byte. The requesting process writes a 1 to the requester byte. qcheck reads the byte and reacts if the byte is 1
 	or does nothing if the byte is 0.

 	qcheck reacts to a 1 in a requester byte by saving the address of the next byte (the permission byte). The addresses
	are saved in a list (order does not matter).  Here, this list is implemented as an array with a moving index into the end.
 	qcheck then goes through the address list and writes a 1 if there is quota left, and 0 otherwise.
 
*/

#define STARTER_QUOTA_ALLOTMENT 1000

const CONTROL_AREA_INTS = (sizeof(char) + sizeof(unsigned long int));
const CONTROL_AREA_SIZE = (CONTROL_AREA_INTS + sizeof(double)*2);

const PREDFINED_TIME_DELTA = 0.1; // 1/10th second

#define MAX_RESOURCES 128				// good for now.
static unsigned char sg_numcores = 8; 	// get core count from the system...
static bool g_is_running = true;

unsigned long int g_resource_quotas[MAX_RESOURCES];
unsigned long int g_prev_quotas[MAX_RESOURCES];
clock_t g_resource_check_times[MAX_RESOURCES];

unsigned char *g_ControlArea = NULL;

void init_resource_quotas(void) {
	// really request this or read from file or something.
	for ( unsigned int i = 0; i < MAX_RESOURCES; i++ ) {
		g_resource_quotas[i] = STARTER_QUOTA_ALLOTMENT;
		g_prev_quotas[i] = 0;
		g_resource_check_times = time();
	}
}

inline unsigned long int fetchQuota(unsigned char p) {
	// request it or set it by timeout, etc.
	return(g_resource_quotas[p]);
}

inline bool timecycle(unsigned char p) {
	clock_t t = time();
	if ( (t - g_resource_check_times[p]) > (PREDFINED_TIME_DELTA*1000) ) {
		g_resource_check_times[p] = t;
		return(true);
	}
	return(false);
}

inline void resetQuota(unsigned char p,unsigned long int currentQuota) {
	g_prev_quotas[p] = g_resource_quotas[p];
	g_resource_quotas[p] = currentQuota;
	// if ( timecycle(p) ) {
		/*
		 	double dlta_t = PREDFINED_TIME_DELTA;
			unsigned char *res_control = g_ControlArea + p*CONTROL_AREA_SIZE;
		 	double *qvalues = (double *)(res_control + CONTROL_AREA_INTS)
		 	double qrate = (g_prev_quotas[p] - g_resource_quotas[p])/dlta_t;
		 	double qpercent = g_resource_quotas[p]/STARTER_QUOTA_ALLOTMENT;
		 	qvalues[0] = qpercent;
			qvalues[1] = qrate;
		 	res_control[0] = 1; // tell network to negotiate
			set_interval_timeout([](){
						if ( control[0] == 0 ) {
		 					//
		 					g_resource_quotas[p] = *((unsigned lon int *)(res_control + 1))
						}
		 			},10)
		*/
		// emit quota percentage
		// emit rate of decrease
	// }
}

/*
	on quota update per resource...
 	//
 	g_resource_quotas[p] = event.quota_update ...
*/

inline bool running(void) {
	return g_is_running;
}


int main(int argc, char **argv) {
	// //
	if ( argc < 2 ) {
		cout << argc << ": Not enough parameters" << endl;
	}
	//
	//
	
	cout << "qcheck: : " << argv[1] << endl;
	// COMMAND LINE PARAMETERS
	key_t key = atoi(argv[1]);  // KEY TO SHM
	unsigned char resource_count = atoi(argv[2]);  // NUMBER OF resources

	//
	ofstream out("q.log");
	streambuf *coutbuf = cout.rdbuf(); //save old buf
	cout.rdbuf(out.rdbuf()); //redirect cout to out.txt!
	//
	//
	size_t size = sg_numcores*(MAX_RESOURCES*2);  		// get numcores * 256  for 128 resources per core
	
	if ( resource_count >= MAX_RESOURCES ) {
		exit(1);
	}
	const unsigned int resource_stride = MAX_RESOURCES*2;
	//
	int resId = -1;
	unsigned long int maxAttemptsResId = 1000000;  // time waiting to startup looking for shared memory...
	//
	while ( resId == -1 && maxAttemptsResId > 0 ) {
		resId = shmget(key, size, 0);
		usleep(500);
		maxAttemptsResId--;
	}
	//
	if ( resId < 0) {
		exit(1);
	}
	//
	// ----------/ ----------/ ----------/ ----------/ ----------/ ----------/ ----------
	//
	if ( resId >= 0 ) {  // should not reach the other side of this
		//
		unsigned char *active_states[size>>1];   	// pointers to states that turned on.
		void* res = shmat(resId, NULL, SHM_RDONLY); // Get the application pointer to shared memory.
		//
		usleep(5000);
		unsigned char *entries = (unsigned char *)(res);
		unsigned char *end = entries + size;  // size includes the core count, which is the top level partition of the mem region.
		g_ControlArea = end;
		while ( running() ) {
			// loop through all resources
			for ( unsigned char p = 0; p < resource_count; p++ ) {
				//  walker walks from core region to core region checking the resource entry there.
				//
				unsigned char *walker = (entries + p*2);  // offset for each resource.
				//
				unsigned int loopCount = 0;  					 // number of resources needing quota update (# permission requests)
				unsigned long int currentQuota = fetchQuota(p);  // quotas are set by resource
				//
				while ( walker < end ) {
					unsigned char on = *walker;
					if ( on == 1 ) {
						*walker = 2; // let consumer know that you saw him
						active_states[loopCount] = walker+1;  // quota goes here.. gather up the location
						loopCount++;
					}
					walker += resource_stride;
				}
				// all updaters wrote 1.. So, the quota changes only by how many signaled
				unsigned int allowed = ( currentQuota > loopCount ) : loopCount : loopCount - currentQuota; // use up the very last
				currentQuota = ( currentQuota > loopCount ) ? (currentQuota - loopCount) : 0;
				resetQuota(p,currentQuota);    // change the quota for this resource
				//
				// Communicate
				unsigned char isOK = 1;  // what to tell the signaler about proceeding.
				while ( --allowed >= 0 ) {  //
					loopCount--
					unsigned char *state = active_states[loopCount];
					*state = isOK;
					state--;
					*state = 0;
				}
				//
				isOK = 0;   // if there is left over, then it is passed quota.
				while ( --loopCount >= 0 ) {
					unsigned char *state = active_states[loopCount];
					*state = isOK;
					state--;
					*state = 0;
				}
				//
			}
		}
		
		int err = shmdt(res);
	}
	
	exit(0);
}

