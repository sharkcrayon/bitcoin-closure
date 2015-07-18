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

    var hashesReceived = new Event('hashesReceived');
    document.addEventListener('hashesReceived', getTansactions, false);

    var transactionsReceived = new Event('transactionsReceived');
    document.addEventListener('transactionsReceived', getTransactionHashes, false);

    function getTansactions(e) {
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
                        
                        // grab the bitcoin addresses associated with each input
                        inputAddresses = [];
                        for (var j = 0; j < data.vin.length; j++){
                            inputAddresses = inputAddresses.concat( data.vin[j].addr );
                        }

                        // check if addr is one of the input's addresses. if it is, all addresses in inputAddresses are in the closure of bitaddress.
                        foundAddr = false;
                        if ((addrIndex = inputAddresses.indexOf(addr)) > -1) {
                            foundAddr = true;
                            console.log('The inputs from this transaction are in the closure of the submitted address.');
                        } else {
                            console.log('None of the inputs from this transaction are in the closure with the submitted address. Moving to the next transaction.');
                        }

                        // if inputAddresses are in the closure of bitaddress:
                        if (foundAddr) {
                            // add addr to toBeProcessed if it has not been processed already
                            for (var k in inputAddresses) {
                                if ((closure.indexOf(inputAddresses[k]) == -1) && (toBeProcessed.indexOf(inputAddresses[k]) === -1)) {
                                    toBeProcessed = toBeProcessed.concat(inputAddresses[k]);
                                    console.log('This input address has not been processed. Adding it to toBeProcessed.');
                                }
                            }

                        }
                    }
                }
            }).then(function() {
                console.log('we received the transaction');
                iterationTracker.getTransactions.iterations++;
                if (isFinished('getTransactions')) {
                    console.log('we have all the transactions');
                    if (toBeProcessed.length > 0) {
                        console.log('toBeProcessed: ', toBeProcessed);
                        document.dispatchEvent(transactionsReceived);
                    } else {
                        console.log('there are no more transactions that need to be processed.');
                        console.log('closure: ', closure);
                    }
                }
            });
        }
    };

    function getTransactionHashes(e) {    
        
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
                    txnList = txnList.concat(data.transactions); // store the transaction data for further processing
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

        // TODO: Check that entered value is actually a bitcoin address.
        // TODO: Use blockchain.info API and get rid of extra API call.
        // TODO: Rewrite so addr variable is used correctly for the closure.

        bitaddress = '1CAbbXyRpdtpA6TKXss2Ydd1gWfPGyCJdK'; // $('#f-bitaddress__input').val(); //EXAMPLE WITH A COINJOIN TRANSACTION bitaddress = '1CAbbXyRpdtpA6TKXss2Ydd1gWfPGyCJdK';
        toBeProcessed.push(bitaddress);

        console.log('getting transaction hashes');
        getTransactionHashes();

        // TODO: Print bitcoin total.

    });
});



//displayData(closure, "The closure looks like: ");
//This ^ API query gives us a list of (hashes of) all transactions that involve the btc address we gave it.
//For example, you'll see that the first txn hash that is listed is ae52255570201cb1d6e27119cb329aec9d7cab451aa1d4c42a87cd82ea5a5c98.
//We can grab the actual transaction data itself (which we'll need) using another API call. In particular, this one:
//https://insight.bitpay.com/api/tx/ae52255570201cb1d6e27119cb329aec9d7cab451aa1d4c42a87cd82ea5a5c98
//The response to that ^ API call is the actual bitcoin transaction (whose hash is 'ae5334447....'). We can parse that to get the inputs to the txn. :)