/*
 * This is sample code generated by rpcgen.
 * These are only templates and you can use them
 * as a guideline for developing your own functions.
 */

#include "check.h"


void
checkprog_prog_1(char* host, char* nume, char* grupa)
{
	CLIENT *clnt;
	char * *result_1;
	struct student  grade_1_arg;

#ifndef	DEBUG
	clnt = clnt_create (host, CHECKPROG_PROG, CHECKVERS_VERS, "udp");
	if (clnt == NULL) {
		clnt_pcreateerror (host);
		exit (1);
	}
#endif	/* DEBUG */

	grade_1_arg.nume = nume;
	grade_1_arg.grupa = grupa;
	result_1 = grade_1(&grade_1_arg, clnt);
	if (result_1 == (char **) NULL) {
		clnt_perror (clnt, "call failed");
	}
#ifndef	DEBUG
	clnt_destroy (clnt);
#endif	 /* DEBUG */
}


int
main (int argc, char *argv[])
{
	char* host;
	char* nume;
	char* grupa;

	if (argc < 4) {
		printf ("usage: %s <server_host> <nume> <grupa>\n", argv[0]);
		exit (1);
	}
	host = argv[1];
	nume = argv[2];
	grupa = argv[3];
	checkprog_prog_1 (host, nume, grupa);
exit (0);
}
