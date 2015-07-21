#bitcoin-address-closure
#A tool for computing the closure of a bitcoin address
#Created by Austin Williams and Serena Randolph  
#GNU GENERAL PUBLIC LICENSE Version 2
#
#To run this program from command line just use the command:
#$ python closure.py 'address'
#
#For example, try the following command:
#$ python closure.py 1L2JsXHPMYuAa9ugvHGLwkdstCPUDemNCf
#That's the address 

import sys
import time
import logging
import requests



logging.basicConfig(filename='logfile.log',level=logging.DEBUG, mode='w')

def playNice():
    #be nice to the api. Limit the rate of api calls.
    global lastCall
    nicetime = 5 #number of seconds to wait beteeen api calls
    if time.time() - lastCall < nicetime :
        print "Letting the api cool down so it doesn't block us ... \n waiting for ", (nicetime - (time.time() - lastCall)), " seconds..."
    time.sleep(max(0, nicetime - (time.time() - lastCall)))
    lastCall = time.time()
    print "Waiting for response from the API ..."

def computeClosure(inputaddr):
    closure = [];
    logging.info( "begining computeClosure function" )
    addrstoBeProcessed = [inputaddr]
    txnsFullyProcessed = []
    closureBalance = 0

    while len(addrstoBeProcessed) > 0 :
        workingAddr = addrstoBeProcessed.pop(0)
        closure.append(workingAddr)
        logging.info("new workingAddr is " + str(workingAddr))
        # get all transactions associated with workingAddres
        logging.info("calling api to get all info for the address " + str(workingAddr))
        playNice()
        r = requests.get("https://insight.bitpay.com/api/txs/?address=" + str(workingAddr))
        r.json()
        workingAddrInfo = r.json()

        # print "wow"
        #print workingAddrInfo['txs'][0]['txid']
        #print 'wowow'
        #for data in workingAddrInfo['txs'][0]['vin'][0]['addr'] : print data
        logging.info("api response received")
        #check the number of transactions
        if len(workingAddrInfo['txs']) == 0 :
            logging.warning("There are no transactions associated with the address " + str(workingAddr))
            continue
        else :
            logging.info("There are " + str(len(workingAddrInfo['txs'])) + " txns associated with address " +str(workingAddr))
            print "processing " + str(len(workingAddrInfo['txs'])) +" txns ..."
        #now we loop through the list of transactions
        for txnnum in range(len(workingAddrInfo['txs'])) :
            logging.info("working on txn " + str(workingAddrInfo['txs'][txnnum]['txid']))
            if not workingAddrInfo['txs'][txnnum]['txid'] in txnsFullyProcessed :
                # we haven't processed the inputs from this txn before
                logging.info("we haven't fully processed this txn before, so we'll do that now")
                logging.info("this transacation has " + str(len(workingAddrInfo['txs'][txnnum]['vin'])) + " inputs")
               	if len(workingAddrInfo['txs'][txnnum]['vin']) == 1 :
                    txnsFullyProcessed.append(workingAddrInfo['txs'][txnnum]['txid'])
                    logging.info("this txn has only one input, so it's of no use to us.")
                else :
                    if workingAddr in [workingAddrInfo['txs'][txnnum]['vin'][i]['addr'] for i in range(len(workingAddrInfo['txs'][txnnum]['vin']))] :
                        #if this code executes then workingAdress is one of the inputs of txn
                        logging.info(str(workingAddr) + " is one of the inputs in this txn, so we'll process the rest of the inputs")
                        txnsFullyProcessed.append(workingAddrInfo['txs'][txnnum]['txid'])
                        for address in [workingAddrInfo['txs'][txnnum]['vin'][i]['addr'] for i in range(len(workingAddrInfo['txs'][txnnum]['vin']))] :
                            if (not address in closure) and (not address in addrstoBeProcessed) :
                                logging.info("the address " + str(address) + "is not currently in closure or addrstoBeProcessed, so we'll add it")
                                addrstoBeProcessed.append(address)
                            else :
                                logging.info("this address has already been processed")
                    else :
                        logging.info(str(workingAddr) + " is not one of the inputs to this transaction, so this txn is of no use to us right now")
            else :
                logging.info("This txn has already been fully processed")
            logging.info("finished processing txn " + str(workingAddrInfo['txs'][txnnum]['txid']))
        print "finished processing " + str(len(workingAddrInfo['txs'])) + " txns. \n loading next address..." 
        logging.info("finished processing all txns associated with " + str(workingAddr))
    # format the string
    request=""
    for addr in closure :
    	request = addr + "," + request
    request = request[:-1]
    request = "https://insight.bitpay.com/api/addrs/" + request + "/utxo"
    print "computing the balance of the closure ..."
    playNice()
    r = requests.get(request)

    if r != [] :
    	r.json()
    	addrsInClosure = r.json()
    	for addr in range(len(addrsInClosure)) :
    		closureBalance = closureBalance + addrsInClosure[addr]['amount']
    return [closure, closureBalance]
def main():
    global lastCall
    lastCall = 0
    userinputAddr = unicode(sys.argv[1])
    print "User input address is ", str(userinputAddr), "\n"
    print "processing..."
    [closure, closureBalance] = computeClosure(userinputAddr)
    print "\nThe closure of ", userinputAddr, " is:\n"
    for i in closure : print str(i)
    print "\nThe closure contains ", len(closure), "addresses"
    print "\nThe current balance of this closure is: ", closureBalance , " btc"

# This is the standard boilerplate that calls the main() function.
if __name__ == '__main__':
  main()

# TO DO: delete logfile upon running