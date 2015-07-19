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
        'toBeProcessed' : {
            'processedIterations' : 0,
            'totalIterations' : 0
        },
        'transactions' : {}
    };

    var finishedtoBeProcessed = function() {
        return (iterationTracker.toBeProcessed.processedIterations === iterationTracker.toBeProcessed.totalIterations);
    };

    var finishedThisAddrTxns = function(addr) {
        return (iterationTracker.transactions[addr].processedTransactions === iterationTracker.transactions[addr].totalTransactions);
    };

    function getTransactionHashes() {    
        // iterationTracker.getTransactionHashes.iterations = 0;
        // iterationTracker.getTransactionHashes.total = toBeProcessed.length;
        console.log('there are ' + toBeProcessed.length + ' sets of hashes to get');

        iterationTracker.toBeProcessed.processedIterations = 0;
        iterationTracker.toBeProcessed.totalIterations = toBeProcessed.length;

        var processCount = 0;

        while (toBeProcessed.length > 0) {
            console.log('toBeProcessed iteration ', ++processCount);
            addr = toBeProcessed.shift(); // grab the top address to be processed and remove from toBeProcessed list.
            closure.push(addr); // put the address in the closure. this records which addresses have been processed.

            checkAddr(addr);
        }
    }

    function checkAddr(addr) {
        return (function() {
            console.log('checking address: ', addr);
            $.ajax({ // get the list of all transaction hashes involving this address
                type : "POST",
                dataType : "JSONP",
                url : 'https://insight.bitpay.com/api/addr/' + addr + '?format=json', // 'https://blockchain.info/address/' + bitaddress + '?format=json',
                success : function(data) {
                    displayData(data.transactions, 'Transactions associated with original address: \n\n');
                    txnList = data.transactions; // store the transaction data for further processing
                    checkTxnList(txnList);
                }
            });
        })();
    }

    function checkTxnList(txnList) {
        return (function() {
            console.log('checking txnList for addr ', addr);
            console.log('there are ' + txnList.length + ' transactions to get');
            iterationTracker.transactions[addr] = {
                'processedTransactions' : 0,
                'totalTransactions' : txnList.length
            };

            var txn;
            var txnCount = 0;

            while (txnList.length > 0) { // get the transaction data for each transaction data hash
                txn = txnList.shift();
                $.ajax({
                    type : "POST",
                    dataType : "JSONP",
                    url : 'https://insight.bitpay.com/api/tx/' + txn + '?format=json',
                    success : function(data) {
                        // check to see if original address is in transaction input list; if so, add to toBeProcessed if it has not been processed.
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
                            }

                            // if inputAddresses are in the closure of bitaddress:
                            if (foundAddr) {
                                // add addr to toBeProcessed if it has not been processed already
                                for (var k in inputAddresses) {
                                    if ((closure.indexOf(inputAddresses[k]) === -1) && (toBeProcessed.indexOf(inputAddresses[k]) === -1)) {
                                        toBeProcessed = toBeProcessed.concat(inputAddresses[k]);
                                    }
                                }
                            }
                        }
                    }
                }).then(function() {
                    iterationTracker.transactions[addr].processedTransactions++;

                    if (finishedThisAddrTxns(addr)) {
                        console.log('finished processing transactions for addr ' + addr);
                        iterationTracker.toBeProcessed.processedIterations++;
                        if (finishedtoBeProcessed()) {
                            if (toBeProcessed.length > 0) {
                                console.log('its time to call toBeProcessed again');
                                console.log('toBeProcessed: ', toBeProcessed);
                                getTransactionHashes();
                            } else {
                                console.log('closure: ' + closure);
                            }
                        }
                    }
                });
            }
        })();
    }

    $('.js-bitaddress').submit(function(e) {

        e.preventDefault();

        // do nice things for the user
        initSubmit();

        // TODO: Check that entered value is actually a bitcoin address.
        // TODO: Use blockchain.info API and get rid of extra API call.

        bitaddress =  '1L2JsXHPMYuAa9ugvHGLwkdstCPUDemNCf'; // '1PhxUNNLFgMALYQv1UhHRnkc4aukos9vFL'; // '1CAbbXyRpdtpA6TKXss2Ydd1gWfPGyCJdK'; // $('#f-bitaddress__input').val(); //EXAMPLE WITH A COINJOIN TRANSACTION bitaddress = '1CAbbXyRpdtpA6TKXss2Ydd1gWfPGyCJdK';
        toBeProcessed.push(bitaddress);

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