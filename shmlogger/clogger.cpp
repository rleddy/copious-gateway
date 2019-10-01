

#include <sys/ipc.h>
#include <sys/types.h>
#include <sys/shm.h>
#include <unistd.h>

#include <iostream>
#include <fstream>
#include <ctime>

#ifdef SHM_UNLOCK

#endif

using namespace std;


#define MAX_COPOUT 10000

int main(int argc, char **argv) {
	
	if ( argc < 2 ) {
		cout << "not enough paramters" << endl;
		exit(1);
	}
	
#ifdef SHM_LOCK
	cout << "HAVE LOCK WILL TRAVEL"  << endl
#endif

	cout << "clogger: this is a test" << endl;
	cout << "clogger: : " << argv[1] << endl;
	
	ofstream out("out.txt");
	streambuf *coutbuf = cout.rdbuf(); //save old buf
	cout.rdbuf(out.rdbuf()); //redirect cout to out.txt!

	
	key_t key = atoi(argv[1]);
	size_t size = 4096;
	
	int resId = -1;
	unsigned long int copout = 0;
	while ( (resId < 0) && (copout < MAX_COPOUT) ) {
		usleep(500);
		resId = shmget(key, size, 0);
		copout++;
	}
	
	cout << "Running with resID: " << resId << endl;
	
	if ( resId >= 0 ) {
		void* res = shmat(resId, NULL, SHM_RDONLY);
		
		char buffer[32*100];
		char *c = buffer;
		
		usleep(5000);
		
		unsigned long int prev_d = 0L;
		unsigned int prev_i = 0;
		unsigned int low = 1;
		unsigned int high = 1;
		unsigned long int ii = 0;
		unsigned int i = 1;
		while ( !(low == 0 && high == 0 && i == 0 ) ) {
			unsigned int *p = (unsigned int *)res;
			high = *p++;
			low = *p++;
			i = *p;
			//
			unsigned long int dd = ((unsigned long int)high*1000) + low;
			//
			// Format: Mo, 15.06.2009 20:20:00
			if ( ii % 100 == 0 ) {
				time_t tt = high;
				tm * ptm = localtime(&tt);
				strftime(c, 32, "%a, %d.%m.%Y %H:%M:%S", ptm);
				cout << buffer << "-" << low << "-" << i << ": " << ii << endl;
			}
			//
			ii++;
		}
		
		int err = shmdt(res);
	}
	
	exit(0);
}
