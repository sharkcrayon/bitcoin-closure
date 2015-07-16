$(document).ready(function() {

    var spinner = (function () {
        var opts = { lines: 9, length: 6, width: 4, radius: 6, scale: 1, corners: 1, color: '#000', opacity: 0.25, rotate: 0, direction: 1, speed: 0.8, trail: 72, fps: 20, zIndex: 2e9, className: 'spinner', top: '50%', left: '50%', shadow: false, hwaccel: true, position: 'absolute' };
        return new Spinner(opts);
    })();

    var bitaddress,
        closure = [], // this will be the closure of bitcaddress. It is initiated empty.
        toBeProcessed = [bitaddress], // this is the list of addresses to process. It starts with just one addresses in it -- bitaddress
        txnList = [],
        inputsList = [];

    $('.js-bitaddress').submit(function(e) {

        e.preventDefault();

        var bitaddress = '1PabtoJrSJmDDTf3v5KzM1c4SK2kpkmUnt'; // $('#f-bitaddress__input').val();

        // do friendly things for the user
        spinner.spin(document.getElementById('spinner'));
        $('.js_bitadd-heading > span').text(bitaddress);

        /// Closure Code

        while (toBeProcessed.length > 0) {
            var addr = toBeProcessed.shift(); // grab the top address to be processed; remove from toBeProcessed

            // process the address by putting the address in the closure
            closure.push(addr);
            console.log("the closure currently looks like: " + closure); // CONSOLE

            // get the list of all transactions involving that address through an API call
            $.ajax({
                type : "POST",
                dataType : "JSONP",
                url : 'https://insight.bitpay.com/api/addr/' + bitaddress + '?format=json',
                success : function(data) {
                    spinner.stop();
                    $('#results > pre').text('Transactions associated with original address: \n\n' + JSON.stringify(data.transactions, null, '\t'));
                    txnList = data.transactions; // store the transaction data for further processing
                }
            }).then(function() {
                // for each txn in txnList we check to see if addr is one of the inputs
                // if it is, then the other inputs in this transaction may need to be processed if it hasn't been processed already.
                for (var i = 0; i < txnList.length; i++) {
                    // grab the list of inputs for txn and store them in inputsList. the first step in this 'grab' to get all the info for the txn:
                    $.ajax({
                        type : "POST",
                        dataType : "JSONP",
                        url : 'https://insight.bitpay.com/api/tx/' + txn + '?format=json',
                        success : function(data) {
                            $('#results > pre').text(JSON.stringify(data));
                            console.log("here's data" + data);
                            //in particular we are interested in the data.vin section (data.vin is an array, where each array entry corresponds to exactly one of the inputs of the transaction txn)
                            //if there is only one input, then we don't need to do anything more.
                            if (data.vin.length > 1){
                                //now for each input in data.vin we must extract the btc address of the input...
                                var inputsListBtcAddresses = [];

                                for (var input in data.vin){
                                    //extract the btc address of the inputsList and add it to inputsListBtcAddresses
                                    inputsListBtcAddresses = inputsListBtcAddresses.concat( input.addr );
                                }

                                //now all input addresses are stored in inputsListBtcAddresses.
                                //we need to check to see if addr is in inputsListBtcAddresses. 
                                //If it's not then we're done (because we are only looking for new addresses that have been inputs along with addr).
                                //If it is, then all addresses in inputsListBtcAddresses are in the closure of bitaddress.
                                var found_addr = false;
                                var non_addr_addreses = [];

                                for (var inputaddress in inputsListBtcAddresses) {
                                    if (inputaddress == addr) {
                                        found_addr = true;
                                    } else {
                                        non_addr_addreses = non_addr_addreses.concat(inputaddress);
                                    }
                                }

                                if (found_addr){
                                    //so if this code executes, the list non_addr_addreses is in the closure of bitaddress.
                                    //so we check all the addresses in this list to see if (1) it's already in the list closure or (2) it's already in the list toBeProcessed.
                                    //if neither of those things are true, then we add the address to the list toBePrcessed.

                                    for (var newaddr in non_addr_addreses){
                                        var inclosure = false;
                                        for (var c in closure){
                                            if (newaddr == c){
                                                inclosure = true;
                                                break;
                                            }
                                        }
                                        if (!inclosure){
                                            var intoBeProcessed = false;
                                            for (var p in toBeProcessed){
                                                if (p == newaddr){
                                                    intoBeProcessed = true;
                                                    break;
                                                }
                                            }
                                            //if this code execute then newddt is NOT in closure and NOT in toBeProcessed.
                                            //So we need to add it to the list toBeProcessed.
                                            toBeProcessed = toBeProcessed.concat(newaddr);
                                        }
                                    }
                                }
                            }
                            inputsList = data.vin;
                        }
                    });
                    //when this code executes toBeProcessed should be empty and closure should equal the closure of bitaddress.
                }
            });
        }

        //// END Closure Code

        // TODO: we'll need to replace this with promises.
        // Old ajax call
        // $.ajax({
        //     type : "POST",
        //     dataType : "JSONP",
        //     url : 'https://insight.bitpay.com/api/addr/' + bitaddress + '?format=json',
        //     success : function(data) {
        //         spinner.stop();
        //         $('#results > pre').text(JSON.stringify(data));
        //     }
        // });

        //This ^ API query gives us a list of (hashes of) all transactions that involve the btc address we gave it.
        //For example, you'll see that the first txn hash that is listed is ae52255570201cb1d6e27119cb329aec9d7cab451aa1d4c42a87cd82ea5a5c98.
        //We can grab the actual transaction data itself (which we'll need) using another API call. In particular, this one:
        //https://insight.bitpay.com/api/tx/ae52255570201cb1d6e27119cb329aec9d7cab451aa1d4c42a87cd82ea5a5c98
        //The response to that ^ API call is the actual bitcoin transaction (whose hash is 'ae5334447....'). We can parse that to get the inputs to the txn. :)

    });
});