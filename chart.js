var chart_options = {
    chart: {
        height: 200,
        type: 'candlestick',
    },
    series: [{
        data: []
    }],
    xaxis: {
        type: 'datetime'
    },
    yaxis: {
        tooltip: {
            enabled: true
        },
    }
}

function init_chart() {
    var options = chart_options;

    $.getJSON('data.json', function(json) {
        for (let i = 0; i < json.length; i++) {
            var el = json[i];
            options.series[0].data.push({
                x: new Date(el[0] * 1000),
                y: [el[3], el[2], el[1], el[4]]
            });
            if (isNaN(options.yaxis.min)) {
                options.yaxis.min = el[3];
                options.yaxis.max = el[4];
            }
            options.yaxis.min = Math.min(el[1], el[2], el[3], el[4], options.yaxis.min);
            options.yaxis.max = Math.max(el[1], el[2], el[3], el[4], options.yaxis.max);
        }
        var h = options.yaxis.max - options.yaxis.min;
        options.yaxis.min -= h / 3;
        options.yaxis.min = Math.floor(options.yaxis.min * 500) / 500;
        options.yaxis.max += h / 3;
        options.yaxis.max = Math.ceil(options.yaxis.max * 500) / 500;

        var chart = new ApexCharts(
          document.querySelector("#chart"),
          options
        );

        chart.render();
    });
}
