var chart_options = {
    chart: {
        height: 300,
        type: 'line',
        stacked: false,
        zoom: {
            type: 'x',
            enabled: true,
            autoScaleYaxis: true
        },
        toolbar: {autoSelected: 'zoom'}
    },
    markers: {size: 0},
    colors: ['#000050'],
    stroke: {width: 2},
    xaxis: {
        type: 'datetime'
    },
    yaxis: {
        title: {text: 'Profit [%]'},
        labels: {
            tooltip: {enabled: true},
            formatter: function (val) {
                return (Math.floor(val * 100) / 100).toFixed(2);
            }
        }
    },
    tooltip: {
        shared: false,
        y: {
            formatter: function (val) {
                return Math.floor(val * 100000) / 100000 + '%';
            }
        }
    },

    series: [{
        name: 'Virtual growth of liquidity share',
        data: []
    }]
}

function init_chart() {
    var options = chart_options;

    $.getJSON('old-stats.json', function(json) {
        var apr = json['apr'];
        var daily_apr = json['daily_apr'];
        var weekly_apr = json['weekly_apr'];
        var data = json['data']
        $('#apr-profit').text((apr * 100).toFixed(2));
        $('#daily-apr').text((daily_apr * 100).toFixed(2));
        $('#weekly-apr').text((weekly_apr * 100).toFixed(2));

        var step_size = Math.max(Math.round(data.length / 500), 1);
        var start_profit = data[0][1]
        for (let i = 0; i < data.length; i++) {
            if ((i % step_size == 0) | (i == data.length - 1)) {
                var el = data[i];
                options.series[0].data.push({
                    x: new Date(el[0] * 1000),
                    y: (el[1] / start_profit - 1) * 100
                });
            }
        }

        var chart = new ApexCharts(
          document.querySelector("#chart"),
          options
        );

        chart.render();
    });
}
