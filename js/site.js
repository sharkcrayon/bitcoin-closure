$(document).ready(function() {

    $('.js-bitaddress').submit(function(e) {

        e.preventDefault();

        var bitaddress = '1PabtoJrSJmDDTf3v5KzM1c4SK2kpkmUnt'; // $('#f-bitaddress__input').val();

        // $.getJSON('https://blockchain.info/address/' + bitaddress + '?format=json&cors=true')
        //     .done(function(data) {
        //         $('#results').text(JSON.stringify(data));
        //     });

        // $.ajax({
        //     type : "POST",
        //     dataType : "JSONP",
        //     url : 'https://blockchain.info/address/' + bitaddress + '?format=json',
        //     success : function(data) {
        //         $('#results').text(JSON.stringify(data));
        //     }
        // });

    });
})