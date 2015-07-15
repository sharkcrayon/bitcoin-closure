$(document).ready(function() {

    $('.js-bitaddress').submit(function(e) {

        e.preventDefault();

        var bitaddress = '1PabtoJrSJmDDTf3v5KzM1c4SK2kpkmUnt'; // $('#f-bitaddress__input').val();

        // $.getJSON('https://insight.bitpay.com/api/addr/' + bitaddress + '?cors=true')
        //     .done(function(data) {
        //         $('#results > pre').text(JSON.stringify(data));
        //     });

        $.ajax({
            type : "POST",
            dataType : "JSONP",
            url : 'https://insight.bitpay.com/api/addr/' + bitaddress + '?format=json',
            success : function(data) {
                $('#results > pre').text(JSON.stringify(data));
            }
        });

        $('.js_bitadd-heading > span').text(bitaddress);

        // initiate spinner
        var opts = {
            lines: 9, // The number of lines to draw
            length: 6, // The length of each line
            width: 4, // The line thickness
            radius: 6, // The radius of the inner circle
            scale: 1, // Scales overall size of the spinner
            corners: 1, // Corner roundness (0..1)
            color: '#000', // #rgb or #rrggbb or array of colors
            opacity: 0.25, // Opacity of the lines
            rotate: 0, // The rotation offset
            direction: 1, // 1: clockwise, -1: counterclockwise
            speed: 0.8, // Rounds per second
            trail: 72, // Afterglow percentage
            fps: 20, // Frames per second when using setTimeout() as a fallback for CSS
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            className: 'spinner', // The CSS class to assign to the spinner
            top: '50%', // Top position relative to parent
            left: '50%', // Left position relative to parent
            shadow: false, // Whether to render a shadow
            hwaccel: true, // Whether to use hardware acceleration
            position: 'absolute' // Element positioning
        };
        var target = document.getElementById('spinner');
        var spinner = new Spinner(opts).spin(target);

        // load example result
        //var tmp_JSON = '{"title": "Example Schema","type": "object","properties": {"firstName": {"type": "string"},"lastName": {"type": "string"},"age": {"description": "Age in years","type": "integer","minimum": 0}},"required": ["firstName", "lastName"]}';

        // var tmp_JSON = {
        //     "title": "Example Schema",
        //     "type": "object",
        //     "properties": {
        //         "firstName": {
        //             "type": "string"
        //         },
        //         "lastName": {
        //             "type": "string"
        //         },
        //         "age": {
        //             "description": "Age in years",
        //             "type": "integer",
        //             "minimum": 0
        //         }
        //     },
        //     "required": ["firstName", "lastName"]
        // };

        // var tmp_submitSuccess = function() {
        //     spinner.stop();
        //     $('#results > pre').text(JSON.stringify(tmp_JSON));
        // };

        // setTimeout(tmp_submitSuccess, 3000);

    });
})