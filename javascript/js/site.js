// bitcoin-address-closure
// A tool for computing the closure of a bitcoin address
// Created by Serena Randolph and Austin Williams
// GNU GENERAL PUBLIC LICENSE Version 2

$(document).ready(function() {

    var bitaddress,
        addr,
        closure = [], // the closure of bitaddress
        toBeProcessed = [], // the list of addresses to process
        txnList = [],
        foundAddr = false;

    // just a nice waiting indicator for the user
    var spinner = (function () {
        var opts = { lines: 9, length: 6, width: 4, radius: 6, scale: 1, corners: 1, color: '#000', opacity: 0.25, rotate: 0, direction: 1, speed: 0.8, trail: 72, fps: 20, zIndex: 2e9, className: 'spinner', top: '50%', left: '50%', shadow: false, hwaccel: true, position: 'absolute' };
        return new Spinner(opts);
    })();

    // display the results to the user
    var displayData = function(message, data, clear) {
        data = (data) ? JSON.stringify(data, null, '\t') : '';
        if (clear) {
            $('#results > pre').text(message + data + '\n');    
        } else {
            $('#results > pre').append(message + data + '\n');
        }
        
    };

    var displayText = function(target, message) {
        $(target).text(message);
    };

    var clearInterface = function() {
        $('.js-clear-interface').text('');
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
        console.log('there are ' + toBeProcessed.length + ' addresses to process');
        displayData('Calling the API, please wait.');

        iterationTracker.toBeProcessed.processedIterations = 0;
        iterationTracker.toBeProcessed.totalIterations = toBeProcessed.length;

        var processCount = 0;

        while (toBeProcessed.length > 0) {
            addr = toBeProcessed.shift(); // grab the top address to be processed and remove from toBeProcessed list.
            closure.push(addr); // put the address in the closure. this records which addresses have been processed.

            checkAddr(addr);
        }
    }

    function checkAddr(addr) {
        return (function() {
            $.ajax({ // get the list of all transaction hashes involving this address
                type : "POST",
                dataType : "JSONP",
                url : 'https://insight.bitpay.com/api/txs/?address=' + addr, // 'https://insight.bitpay.com/api/addr/' + addr + '?format=json', // 'https://blockchain.info/address/' + bitaddress + '?format=json',
                success : function(data) {
                    txnList = data.txs; // store the transaction data for further processing
                    checkTxnList(txnList, addr);
                }
            });
        })();
    }

    function checkTxnList(txnList, addr) {
        return (function() {
            console.log('checking txnList for addr ', addr);
            console.log('there are ' + txnList.length + ' transactions to process');
            iterationTracker.transactions[addr] = {
                'processedTransactions' : 0,
                'totalTransactions' : txnList.length
            };

            var txn;

            while (txnList.length > 0) { // iterate through each transaction associated with the current address
                txn = txnList.shift();

                // check to see if addr is in transaction input list; if so, add any sibling addresses to toBeProcessed if they have not already been processed.
                if (txn.vin.length > 1) { // txn.vin holds the input addresses for this transaction.
                    
                    // grab the addresses associated with each input
                    inputAddresses = [];
                    for (var j = 0; j < txn.vin.length; j++){
                        inputAddresses = inputAddresses.concat( txn.vin[j].addr );
                    }

                    // check if addr is one of the input's addresses. if it is, all addresses in inputAddresses are in the closure of bitaddress.
                    foundAddr = false;
                    if (inputAddresses.indexOf(addr) > -1) foundAddr = true;

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

                // update the iterationTracker for this addr
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
                            spinner.stop();
                            displayText('.js_bitadd-closure-total > span', closure.length);
                            displayData("Addresses in closure: ", closure, true);
                            getBitcoinTotal(closure);
                        }
                    }
                }
            }
        })();
    }

    function getBitcoinTotal(addresses) {
        console.log('getting bitcoin total');
        // do some formatting
        if ( Object.prototype.toString.call( addresses ) === '[object Array]' ) {
            addresses = addresses.join(',');
        }

        if (typeof addresses !== 'string') {
            console.log('Sorry, this function takes an array for multiple addresses or a string for a single address or comma-separated addresses');
            return false;
        }

        var bitcoinTotal = 0;

        $.ajax({ // get the list of all transaction hashes involving this address
            type : "POST",
            dataType : "JSONP",
            url : 'https://insight.bitpay.com/api/addrs/' + addresses + '/utxo',
            success : function(data) {
                for (var k in data) {
                    bitcoinTotal += data[k].amount;
                }
            }
        }).then(function() {
            console.log('total bitcoins: ' + bitcoinTotal);
            displayText('.js_bitadd-bitcoin-total > span', bitcoinTotal);
        });
    }

    function verifyBitAddress(address) {

    }

    $('.js-bitaddress').submit(function(e) {

        e.preventDefault();

        // reset variables in case this is not the first submission.
        bitaddress = '';
        addr = '';
        closure = [];
        toBeProcessed = [];
        txnList = [];
        foundAddr = false;

        clearInterface();

        // TODO: 
        //       Verify address (and no blanks!)
        //       Provide text updates as to the status of API queries/transaction processing

        // Some test addresses: '1L2JsXHPMYuAa9ugvHGLwkdstCPUDemNCf';//'1CAbbXyRpdtpA6TKXss2Ydd1gWfPGyCJdK';
        bitaddress = $('#f-bitaddress__input').val();
        
        verifyBitAddress(bitaddress); // TODO: Verify. Only allow process to continue if verifies.

        spinner.spin(document.getElementById('spinner'));
        displayText('.js_bitadd-address > span', bitaddress);

        toBeProcessed.push(bitaddress);

        getTransactionHashes();

    });
});
