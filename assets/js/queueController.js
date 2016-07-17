
google.charts.load('current', {'packages': ['gauge', 'corechart']});
google.charts.setOnLoadCallback(populateGuages);
//google.charts.load('current', {'packages': ['corechart']});
google.charts.setOnLoadCallback(populateMovingAverageCallStats);

app.controller('guageController', function ($scope) {
    socket.on('callStats', function (data) {
        $scope.guage = data;
        console.log('guageController' + JSON.stringify(data));
        populateGuages(data, "");
        $scope.$apply();

    });
});

app.controller('realTimeGuageController', function ($scope) {
    socket.on('realTimecallStats', function (data) {
        $scope.guage = data;
        console.log('realTimeGuageController' + JSON.stringify(data));
        populateGuages(data, 'RealTime');
        $scope.$apply();

    });
});

app.controller('lineChartController', function ($scope) {
    socket.on('movingcallStats', function (data) {
        //$scope.guage = data;
        console.log('lineChartController' + JSON.stringify(data));
        populateMovingAverageCallStats(data, 'movingAverageCallstat', 'Call stat every 5 min');
        $scope.$apply();

    });
});
app.controller('realTimelineChartController', function ($scope) {
    socket.on('realtimecallStats', function (data) {
        //$scope.guage = data;
        console.log('lineChartController realtimecallStats' + JSON.stringify(data));
        populateMovingAverageCallStats(data, 'realtimeCallstat', 'Realtime');
        $scope.$apply();

    });
});
function populateResponseRate(data, elementId) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['ResponseRate', data.responseRate]
    ]);

    var options = {
        width: 400, height: 120,
        redFrom: 0, redTo: 30,
        yellowFrom: 31, yellowTo: 45,
        greenFrom: 46, greenTo: 100,
        minorTicks: 5
    };

    var chart = new google.visualization.Gauge(document.getElementById('responseRate' + elementId));

    chart.draw(data, options);


}

function populateAverageWaitingTime(data, elementId) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['WaitingTime', data.waitingTime]
    ]);

    var options = {
        width: 400, height: 120,
        redFrom: 120, redTo: 160,
        yellowFrom: 60, yellowTo: 120,
        greenFrom: 0, greenTo: 60,
        minorTicks: 5,
        max: 160
    };

    var chart = new google.visualization.Gauge(document.getElementById('waitingTime' + elementId));

    chart.draw(data, options);


}
function populateAverageConnectedTime(data, elementId) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['TalkingTime', data.connectedTime]
    ]);

    var options = {
        width: 400, height: 120,
        redFrom: 210, redTo: 400,
        yellowFrom: 0, yellowTo: 150,
        greenFrom: 150, greenTo: 210,
        minorTicks: 5,
        max: 400
    };

    var chart = new google.visualization.Gauge(document.getElementById('talkingTime' + elementId));

    chart.draw(data, options);


}

function populateAverageAbandonTime(data) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['AbandonTime', data.abandonTime]
    ]);

    var options = {
        width: 400, height: 120,
        redFrom: 120, redTo: 160,
        yellowFrom: 60, yellowTo: 120,
        greenFrom: 0, greenTo: 60,
        minorTicks: 5,
        max: 160
    };

    var chart = new google.visualization.Gauge(document.getElementById('abandonTime'));

    chart.draw(data, options);


}
function populateTimeoutCount(data, elementId) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['timeoutCount', data.timeoutCount]
    ]);

    var options = {
        width: 400, height: 120,
        redFrom: 10, redTo: 50,
        yellowFrom: 5, yellowTo: 10,
        greenFrom: 0, greenTo: 5,
        minorTicks: 5,
        max: 50
    };

    var chart = new google.visualization.Gauge(document.getElementById('timeoutCount' + elementId));

    chart.draw(data, options);


}

function populateAbandonRates(data) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['AbandonRate', (data.abandonCount / data.totalIncomingCalls) * 100],
        ['Abandon<10', (data.abandonCount_10 / data.abandonCount) * 100],
        ['Abandon 11_30', (data.abandonCount_30 / data.abandonCount) * 100],
        ['Abandon 31_120', (data.abandonCount_120 / data.abandonCount) * 100],
        ['Abandon 120+ ', (data.abandonCount_140 / data.abandonCount) * 100]
    ]);

    var options = {
        width: 400, height: 120,
        redFrom: 60, redTo: 100,
        yellowFrom: 30, yellowTo: 60,
        greenFrom: 0, greenTo: 30,
        minorTicks: 5
    };

    var chart = new google.visualization.Gauge(document.getElementById('abandonRates'));

    chart.draw(data, options);


}
function populateMovingAverageCallStats(callstats, divId, title) {
    var data = new google.visualization.DataTable();
    data.addColumn('datetime', 'time');
    data.addColumn('number', 'TotalCalls');
    data.addColumn('number', 'InQueue');
    data.addColumn('number', 'Connected');
    data.addColumn('number', 'operators');

    //var stats = [[2004,10,5,2],[2005,11,6,3],[2006,12,5,5],[2007,13,3,2]];
    //data.addRows(stats);

    var stats = [];
    for (i = 0; i < callstats.length; i++) {
        var singleStat = [];
        var timestamp = new Date(callstats[i].dateTime);
        //console.log(timestamp);
        singleStat.push(timestamp);
        singleStat.push(callstats[i].totalIncomingCalls);
        singleStat.push(callstats[i].totalCallsInQueue);
        singleStat.push(callstats[i].connectedCount);
        singleStat.push(callstats[i].loggedInOperators);

        stats.push(singleStat);
    }
    data.addRows(stats);
//    var data = google.visualization.arrayToDataTable([
//        ['Year', 'Sales', 'Expenses'],
//        ['2004', 1000, 400],
//        ['2005', 1170, 460],
//        ['2006', 660, 1120],
//        ['2007', 1030, 540]
//    ]);

    var options = {
        title: title,
        curveType: 'function',
        legend: {position: 'bottom'}
    };
    var chart = new google.visualization.LineChart(document.getElementById(divId));


    chart.draw(data, options);


}
function populateGuages(data, elementId) {
    populateResponseRate(data, elementId);
    populateAverageWaitingTime(data, elementId);
    populateAverageConnectedTime(data, elementId);
    populateTimeoutCount(data, elementId);
    //populateAverageAbandonTime(data);
    //populateAbandonRates(data);

}
//function populateGuages(data) {
//
//    var data = google.visualization.arrayToDataTable([
//        ['Label', 'Value'],
//        ['ResponseRate', (data.connectedCount/data.totalIncomingCalls)*100],
//        ['WaitingTime', data.waitingTime],
//        ['AbandonTime', data.abandonTime],
//        ['CallHandingTime', data.connectedTime],
//    ]);
//
//    var options = {
//        width: 400, height: 120,
//        redFrom: 90, redTo: 100,
//        yellowFrom: 75, yellowTo: 90,
//        minorTicks: 5
//    };
//
//    var chart = new google.visualization.Gauge(document.getElementById('chart_div'));
//
//    chart.draw(data, options);
//
//
//}



