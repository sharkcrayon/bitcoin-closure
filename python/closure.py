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
#That's the "Bitstamp Hack" address. Note that this address has balance of approx 0 btc, but it's closure has a balance of over 30 btc.

import sys
import time
import requests

def playNice():
    #be nice to the api. Limit the rate of api calls.
    global lastCall
    nicetime = 5 #number of seconds to wait beteeen api calls
    if time.time() - lastCall < nicetime :
        print "Letting the api cool down so it doesn't block us ... \n waiting for ", (nicetime - (time.time() - lastCall)), " seconds..."
    time.sleep(max(0, nicetime - (time.time() - lastCall)))
    print "Waiting for response from insight.bitpay.com API ..."

def computeClosure(inputaddr):
    closure = [];
    addrstoBeProcessed = [inputaddr]
    txnsFullyProcessed = []
    closureBalance = 0

    while len(addrstoBeProcessed) > 0 :
        workingAddr = addrstoBeProcessed.pop(0)
        closure.append(workingAddr)
        # get all transactions associated with workingAddres
        playNice()
        r = requests.get("https://insight.bitpay.com/api/txs/?address=" + str(workingAddr))
        r.json()
        workingAddrInfo = r.json()
        lastCall = time.time()

        #check the number of transactions
        if len(workingAddrInfo['txs']) == 0 :
            continue
        else :
            print "processing " + str(len(workingAddrInfo['txs'])) +" txns ..."
        #now we loop through the list of transactions
        for txnnum in range(len(workingAddrInfo['txs'])) :
            if not workingAddrInfo['txs'][txnnum]['txid'] in txnsFullyProcessed :
                # we haven't processed the inputs from this txn before
               	if len(workingAddrInfo['txs'][txnnum]['vin']) == 1 :
                    txnsFullyProcessed.append(workingAddrInfo['txs'][txnnum]['txid'])
                else :
                    if workingAddr in [workingAddrInfo['txs'][txnnum]['vin'][i]['addr'] for i in range(len(workingAddrInfo['txs'][txnnum]['vin']))] :
                        #if this code executes then workingAdress is one of the inputs of txn
                        txnsFullyProcessed.append(workingAddrInfo['txs'][txnnum]['txid'])
                        for address in [workingAddrInfo['txs'][txnnum]['vin'][i]['addr'] for i in range(len(workingAddrInfo['txs'][txnnum]['vin']))] :
                            if (not address in closure) and (not address in addrstoBeProcessed) :
                                addrstoBeProcessed.append(address)
        print "finished processing " + str(len(workingAddrInfo['txs'])) + " txns. \n loading next address..." 
    # format the string
    request=""
    for addr in closure :
    	request = addr + "," + request
    request = request[:-1]
    request = "https://insight.bitpay.com/api/addrs/" + request + "/utxo"
    print "computing the balance of the closure ..."
    playNice()
    r = requests.get(request)
    lastCall = time.time()

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