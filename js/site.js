$(document).ready(function() {

    var bitaddress,
        addr,
        closure = [], // the closure of bitaddress
        toBeProcessed = [], // the list of addresses to process
        txnList = [],
        inputsList = [],
        numberTxn,
        inputsListBtcAddresses,
        foundAddr = false,
        siblingAddresses = [],
        addrIndex;

    // just a nice waiting indicator for the user
    var spinner = (function () {
        var opts = { lines: 9, length: 6, width: 4, radius: 6, scale: 1, corners: 1, color: '#000', opacity: 0.25, rotate: 0, direction: 1, speed: 0.8, trail: 72, fps: 20, zIndex: 2e9, className: 'spinner', top: '50%', left: '50%', shadow: false, hwaccel: true, position: 'absolute' };
        return new Spinner(opts);
    })();

    // the odds and ends we want to do when the process begins
    var initSubmit = function() {
        // be nice and communicate to the user
        spinner.spin(document.getElementById('spinner'));
        $('.js_bitadd-heading > span').text(bitaddress);
    };

    // display the results to the user
    var displayData = function(data, message) {
        spinner.stop();
        $('#results > pre').text(message + JSON.stringify(data, null, '\t'));
    };

    // var extractBTCAddresses = function(txn, data, addr) {
    //     displayData(data, 'BTC Addresses: ');
    //     //in particular we are interested in the data.vin section (data.vin is an array, where each array entry corresponds to exactly one of the inputs of the transaction txn)
    //     //if there is only one input, then we don't need to do anything more.
    //     // console.log("           The number of inputs in this txn is: ", data.vin.length, ". They are: ", data.vin);
    //     if (data.vin.length > 1){
    //         // console.log("           Since there is more than 1 input we look at the inputs.")
    //         //now for each input in data.vin we must extract the btc address of the input...
    //         inputsListBtcAddresses = [];

    //         for (var inputnum = 0; inputnum < data.vin.length; inputnum++){
    //             //extract the btc address of the inputsList and add it to inputsListBtcAddresses
    //             inputsListBtcAddresses = inputsListBtcAddresses.concat( data.vin[inputnum].addr );
    //             // console.log("               Input ", inputnum, " added. inputsListBtcAddresses looks like: ", inputsListBtcAddresses)
    //         }
    //         // console.log("               Finished adding input btc address for txn ", txn, "The list looks like: ", inputsListBtcAddresses)
    //         // console.log("               Now we check to see if addr (", addr, ") is among them.")
    //         //now all input addresses are stored in inputsListBtcAddresses.
    //         //we need to check to see if addr is in inputsListBtcAddresses. 
    //         //If it's not then we're done (because we are only looking for new addresses that have been inputs along with addr).
    //         //If it is, then all addresses in inputsListBtcAddresses are in the closure of bitaddress.
    //         var found_addr = false;
    //         var non_addr_addreses = [];

    //         for (var inputaddress in inputsListBtcAddresses) {
    //             if (inputaddress == addr) {
    //                 found_addr = true;
    //                 // console.log("                Found addr among the input addresses. So the other addresses must be in the closure.")
    //             } else {
    //                 non_addr_addreses = non_addr_addreses.concat(inputaddress);

    //             }
    //         }

    //         if (found_addr){
    //             //so if this code executes, the list non_addr_addreses is in the closure of bitaddress.
    //             //so we check all the addresses in this list to see if (1) it's already in the list closure or (2) it's already in the list toBeProcessed.
    //             //if neither of those things are true, then we add the address to the list toBePrcessed.
    //             // console.log("                   Before we add an address to the closure we check to see if we've already added it there previously.");
                
    //             for (var newaddr in non_addr_addreses){
    //                 var inclosure = false;
    //                 for (var c in closure){
    //                     if (newaddr == c){
    //                         inclosure = true;
    //                         // console.log("                   The address ", c, " has already been added to the closure.");
    //                         break;
    //                     }
    //                 }
    //                 if (!inclosure){
    //                     // console.log("                   The address ", c, "has not yet been added to the closure. \n let's check to see if it's in the toBeProcessed list.");
    //                     var intoBeProcessed = false;
    //                     for (var p in toBeProcessed){
    //                         if (p == newaddr){
    //                             intoBeProcessed = true;
    //                             // console.log("                       It is in the toBeProcessed list already.");
    //                             break;
    //                         }
    //                     }
    //                     //if this code execute then newddt is NOT in closure and NOT in toBeProcessed.
    //                     //So we need to add it to the list toBeProcessed.
    //                     // console.log("               The address ", c, "is not in the toBeProcessed list either. So we'll add it there.")
    //                     toBeProcessed = toBeProcessed.concat(newaddr);
    //                     // console.log("The toBeProcessed list looks like this now: ", toBeProcessed);
    //                 }
    //             }
    //         }
    //         else{
    //             // console.log("The address ", addr, "was not found among them, so we don't add these input address to the closure. Moving on to the next txn.")
    //         }
    //     }
    //     inputsList = data.vin;
    // };

// ================================================================================ //

    var iterationTracker = {
        'getTransactionHashes' : {
            'iterations' : 0,
            'total' : 0
        },
        'getTransactions' : {
            'iterations' : 0,
            'total' : 0
        }
    };

    var isFinished = function(sequence) {
        if (iterationTracker[sequence].iterations == iterationTracker[sequence].total) {
            iterationTracker[sequence].iterations = 0; iterationTracker[sequence].total = 0;
            return true;
        } else {
            return false;
        }
    };

    var getTansactions = function(e) {
        console.log('get transactions');

        iterationTracker.getTransactions.iterations = 0;
        iterationTracker.getTransactions.total = txnList.length;
        console.log('there are ' + txnList.length + ' transactions to get');

        while (txnList.length > 0) { // get the transaction data for each transaction data hash
            txn = txnList.shift();
            $.ajax({
                type : "POST",
                dataType : "JSONP",
                url : 'https://insight.bitpay.com/api/tx/' + txn + '?format=json',
                success : function(data) {
                    // check to see if original address is in transaction input list; if so, add to toBeProcessed if it has not been processed.
                    // extractBTCAddresses(txn, data, addr);
                    if (data.vin.length > 1) { // data.vin hold the inputs for txn.
                        console.log('data.vin: ', data.vin);
                        
                        // grab the bitcoin addresses associated with each input
                        inputAddresses = [];
                        for (var j = 0; j < data.vin.length; j++){
                            inputAddresses = inputAddresses.concat( data.vin[j].addr );
                        }

                        // check if addr is one of the input's addresses. if it is, all addresses in inputAddresses are in the closure of bitaddress.
                        foundAddr = false;
                        siblingAddresses = [];

                        if ((addrIndex = inputAddresses.indexOf(addr)) > -1) {
                            foundAddr = true;
                            siblingAddresses = inputAddresses.splice(addrIndex, 1);
                        }
                        // console.log('foundAddr: ', foundAddr);
                        // console.log('input addresses: ', inputAddresses);
                        // console.log('bitaddress: ', bitaddress);
                        // console.log('sibling Addresses: ', siblingAddresses);

                        // if inputAddresses are in the closure of bitaddress:
                        if (foundAddr) {
                            // add addr to toBeProcessed if it has not been processed already
                            for (var sibAddr in siblingAddresses) {
                                if ((closure.indexOf(sibAddr) == -1) && (toBeProcessed.indexOf(sibAddr) === -1)) {
                                    toBeProcessed = toBeProcessed.concat(sibAddr);
                                }
                            }

                        }
                    }
                }
            }).then(function() {
                console.log('we received the transactions');
                iterationTracker.getTransactions.iterations++;
                if (isFinished('getTransactions')) {
                    console.log('we have all the transactions');
                    console.log('toBeProcessed: ', toBeProcessed);
                    //document.dispatchEvent(hashesReceived);
                }
            });
        }

    };

    var hashesReceived = new Event('hashesReceived');
    document.addEventListener('hashesReceived', getTansactions, false);

    var getTransactionHashes = function() {    
        
        iterationTracker.getTransactionHashes.iterations = 0;
        iterationTracker.getTransactionHashes.total = toBeProcessed.length;
        console.log('there are ' + toBeProcessed.length + ' hashes to get');

        while (toBeProcessed.length > 0) {
            addr = toBeProcessed.shift(); // grab the top address to be processed and remove from toBeProcessed list.
            closure.push(addr); // put the address in the closure. this records which addresses have been processed.

            console.log('getting a hash');
            $.ajax({ // get the list of all transaction hashes involving the address
                type : "POST",
                dataType : "JSONP",
                url : 'https://insight.bitpay.com/api/addr/' + addr + '?format=json',
                success : function(data) {
                    displayData(data.transactions, 'Transactions associated with original address: \n\n');
                    txnList = data.transactions; // store the transaction data for further processing
                    numberTxn = txnList.length;
                }
            }).then(function() {
                console.log('we received the hash');
                iterationTracker.getTransactionHashes.iterations++;
                if (isFinished('getTransactionHashes')) {
                    console.log('we have all the hashes');
                    document.dispatchEvent(hashesReceived);
                }
            });
        }
    };

    $('.js-bitaddress').submit(function(e) {

        e.preventDefault();

        // do nice things for the user
        initSubmit();

        bitaddress = '1PabtoJrSJmDDTf3v5KzM1c4SK2kpkmUnt'; // $('#f-bitaddress__input').val(); //EXAMPLE WITH A COINJOIN TRANSACTION bitaddress = '1CAbbXyRpdtpA6TKXss2Ydd1gWfPGyCJdK';
        toBeProcessed.push(bitaddress);

        console.log('getting transaction hashes');
        getTransactionHashes();

    });
});



//displayData(closure, "The closure looks like: ");
//This ^ API query gives us a list of (hashes of) all transactions that involve the btc address we gave it.
//For example, you'll see that the first txn hash that is listed is ae52255570201cb1d6e27119cb329aec9d7cab451aa1d4c42a87cd82ea5a5c98.
//We can grab the actual transaction data itself (which we'll need) using another API call. In particular, this one:
//https://insight.bitpay.com/api/tx/ae52255570201cb1d6e27119cb329aec9d7cab451aa1d4c42a87cd82ea5a5c98
//The response to that ^ API call is the actual bitcoin transaction (whose hash is 'ae5334447....'). We can parse that to get the inputs to the txn. :)