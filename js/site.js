$(document).ready(function() {

    // var spinner = (function () {
    //     var opts = { lines: 9, length: 6, width: 4, radius: 6, scale: 1, corners: 1, color: '#000', opacity: 0.25, rotate: 0, direction: 1, speed: 0.8, trail: 72, fps: 20, zIndex: 2e9, className: 'spinner', top: '50%', left: '50%', shadow: false, hwaccel: true, position: 'absolute' };
    //     return new Spinner(opts);
    // })();

    var opts = { lines: 9, length: 6, width: 4, radius: 6, scale: 1, corners: 1, color: '#000', opacity: 0.25, rotate: 0, direction: 1, speed: 0.8, trail: 72, fps: 20, zIndex: 2e9, className: 'spinner', top: '50%', left: '50%', shadow: false, hwaccel: true, position: 'absolute' };
    var spinner = new Spinner(opts);

    $('.js-bitaddress').submit(function(e) {

        e.preventDefault();

        var bitaddress = '1PabtoJrSJmDDTf3v5KzM1c4SK2kpkmUnt'; // $('#f-bitaddress__input').val();

        // do friendly things for the user
        spinner.spin(document.getElementById('spinner'));
        $('.js_bitadd-heading > span').text(bitaddress);

        // TODO: we'll need to replace this with promises.
        // start ajax calls
        $.ajax({
            type : "POST",
            dataType : "JSONP",
            url : 'https://insight.bitpay.com/api/addr/' + bitaddress + '?format=json',
            success : function(data) {
                spinner.stop();
                $('#results > pre').text(JSON.stringify(data));
            }
        });

        //This ^ API query gives us a list of (hashes of) all transactions that involve the btc address we gave it.
        //For example, you'll see that the first txn hash that is listed is ae52255570201cb1d6e27119cb329aec9d7cab451aa1d4c42a87cd82ea5a5c98.
        //We can grab the actual transaction data itself (which we'll need) using another API call. In particular, this one:
        //https://insight.bitpay.com/api/tx/ae52255570201cb1d6e27119cb329aec9d7cab451aa1d4c42a87cd82ea5a5c98
        //The response to that ^ API call is the actual bitcoin transaction (whose hash is 'ae5334447....'). We can parse that to get the inputs to the txn. :)

    });
});