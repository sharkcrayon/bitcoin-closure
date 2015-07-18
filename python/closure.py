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
from blockchain import blockexplorer

logging.basicConfig(filename='logfile.log',level=logging.DEBUG, mode='w')

def playNice():
    #be nice to the api. Limit the rate of api calls.
    global lastCall
    nicetime = 1 #number of seconds to wait beteeen api calls
    if time.time() - lastCall < nicetime :
        print "Letting the api cool down... waiting for ", (nicetime - (time.time() - lastCall)), " seconds..."
    time.sleep(max(0, nicetime - (time.time() - lastCall)))
    lastCall = time.time()
    print "processing..."

def computeCLosure(inputaddr):
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
        workingAddrInfo = blockexplorer.get_address(workingAddr)
        logging.info("api response received")
        closureBalance = closureBalance + workingAddrInfo.final_balance
        logging.info("this address has a current balance of " + str(workingAddrInfo.final_balance))
        logging.info("this closure has a balance of at least " + str(closureBalance))
        #check the number of transactions
        if len(workingAddrInfo.transactions) == 0 :
            logging.warning("There are no transactions associated with the address " + str(workingAddr))
            continue
        else :
            logging.info("There are " + str(len(workingAddrInfo.transactions)) + " txns associated with address " +str(workingAddr))
        #now we loop through the list of transactions
        for txn in workingAddrInfo.transactions :
            logging.info("working on txn " + str(txn.hash))
            if not txn.hash in txnsFullyProcessed :
                # we haven't processed the inputs from this txn before
                logging.info("we haven't fully processed this txn before, so we'll do that now")
                logging.info("this transacation has " + str(len(txn.inputs)) + " inputs")
                if len(txn.inputs) == 1 :
                    txnsFullyProcessed.append(txn.hash)
                    logging.info("this txn has only one input, so it's of no use to us.")
                else :
                    if workingAddr in [txn.inputs[i].address for i in range(len(txn.inputs))] :
                        #if this code executes then workingAdress is one of the inputs of txn
                        logging.info(str(workingAddr) + " is one of the inputs in this txn, so we'll process the rest of the inputs")
                        txnsFullyProcessed.append(txn.hash)
                        for address in [txn.inputs[i].address for i in range(len(txn.inputs))] :
                            if (not address in closure) and (not address in addrstoBeProcessed) :
                                logging.info("the address " + str(address) + "is not currently in closure or addrstoBeProcessed, so we'll add it")
                                addrstoBeProcessed.append(address)
                            else :
                                logging.info("this address has already been processed")
                    else :
                        logging.info(str(workingAddr) + " is not one of the inputs to this transaction, so this txn is of no use to us right now")
            else :
                logging.info("This txn has already been fully processed")
            logging.info("finished processing txn " + str(txn.hash))
        logging.info("finished processing all txns associated with " + str(workingAddr))
    return [closure, closureBalance]

def main():
    global lastCall
    lastCall = 0
    userinputAddr = unicode(sys.argv[1])
    print "User input address is ", str(userinputAddr), "\n"
    print "processing..."
    [closure, closureBalance] = computeCLosure(userinputAddr)
    print "\nThe closure of ", userinputAddr, " is:\n"
    for i in closure : print str(i)
    print "\nThe closure contains ", len(closure), "addresses"
    print "\nThe current balance of this closure is: ", closureBalance / 100000000, " btc"

# This is the standard boilerplate that calls the main() function.
if __name__ == '__main__':
  main()
