google.charts.setOnLoadCallback(populateSystemSnapShot);
google.charts.setOnLoadCallback(populateTicketClassification);
google.charts.setOnLoadCallback(populateGuages);
google.charts.setOnLoadCallback(populateSystemStats);

app.controller('ticketClassificationController', function ($scope) {
    socket.on('ticketClassification', function (data) {
        //console.log('ticketClassification' + JSON.stringify(data));
        populateTicketClassification(data);
    });
});
app.controller('urgentTicketsController', function ($scope) {
    socket.on('urgentTickets', function (data) {
        console.log('Urgent'+data);
        $scope.urgent = data;
        $scope.$apply();
    });
});

app.controller('guageController', function ($scope) {
    socket.on('movingCallStats', function (data) {
        //google.charts.setOnLoadCallback(populateSystemSnapShot);
        //google.charts.setOnLoadCallback(populateGuages);
        //$scope.guage = data;
        //console.log('guageController' + JSON.stringify(data));
        //populateSystemSnapShotBar(data, "MovingAverage");
        populateGuages(data, "MovingAverage", 1.5);

        //$scope.$apply();

    });
});

app.controller('realTimeGuageController', function ($scope) {

    socket.on('realTimecallStats', function (data) {
        //google.charts.setOnLoadCallback(populateSystemSnapShot);
        //google.charts.setOnLoadCallback(populateGuages);
        //$scope.guage = data;
        //console.log('realTimeGuageController' + JSON.stringify(data));
        populateSystemSnapShotBar(data, "RealTime");
        populateGuages(data, 'RealTime', 1);

        //$scope.$apply();

    });
});

app.controller('lineChartController', function ($scope) {
    socket.on('movingSystemStats', function (data) {
        //google.charts.setOnLoadCallback(populateSystemStats);
        //$scope.guage = data;
        //console.log('lineChartController' + JSON.stringify(data));
        populateSystemStats(data, 'movingAverageCallstat', 'Call stat every 30 min-24hrs history');
        //$scope.$apply();

    });
});
app.controller('realTimelineChartController', function ($scope) {
    socket.on('realtimeSystemStats', function (data) {
        //google.charts.setOnLoadCallback(populateSystemStats);
        //$scope.guage = data;
        //console.log('lineChartController realtimeSystemStats' + JSON.stringify(data));
        populateSystemStats(data, 'realtimeCallstat', 'Realtime -(1 hr snapshot)');

        // $scope.$apply();

    });
});


function populateSystemSnapShot(stats, elementId) {

    if (stats == undefined) {
        return;
    }
    //console.log('populateSystemSnapShot' + JSON.stringify(stats));
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Entities');
    data.addColumn('number', 'Values');
    data.addRows([
        ['Calls', stats.totalIncomingCalls],
        ['External Redirections', stats.totalExternalRedirections],
        ['Waiting', stats.totalCallsInQueue],
        ['Connected', stats.connectedCount],
        ['Agents', stats.loggedInOperators]
    ]);

    var tempId = 'systemStatsSnapshot' + elementId;

    if ($('#' + tempId).length <= 0) {
        return;
    }

    var table = new google.visualization.Table(document.getElementById(tempId));

    table.draw(data, {showRowNumber: true, width: '100%', height: '100%'});
}

function populateSystemSnapShotBar(stats, elementId) {
    //console.log('populateSystemSnapShotBar' + JSON.stringify(stats));
    var data = google.visualization.arrayToDataTable([
        ['entites', 'Total', 'Blocked', {role: 'annotation'}],
        ['Calls', stats.totalIncomingCalls - stats.totalExternalRedirections, 0, stats.totalIncomingCalls - stats.totalExternalRedirections + ""],
        ['Waiting', 0, stats.totalCallsInQueue, stats.totalCallsInQueue + ""],
        ['Connected', stats.connectedCount, 0, stats.connectedCount + ""],
        ['Agents', stats.loggedInOperators - stats.blocked, stats.blocked, stats.loggedInOperators - stats.blocked + "/" + stats.blocked]
    ]);
    //['Agents', stats.loggedInOperators-stats.blocked,0,stats.blocked,0,0,stats.loggedInOperators-stats.blocked+"/"+stats.blocked]
    var options = {
        width: 400,
        height: 200,
        legend: {position: 'top', maxLines: 3},
        bar: {groupWidth: '75%'},
        isStacked: true
    };
    var tempId = 'systemStatsSnapshot' + elementId;

    if ($('#' + tempId).length <= 0) {
        return;
    }
    var chart = new google.visualization.BarChart(document.getElementById(tempId));
    chart.draw(data, options);
}

function populateResponseRate(stats, elementId, size) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['ResponseRate', stats.responseRate]
    ]);

    var options = {
        width: 280 / size, height: 200 / size,
        redFrom: 0, redTo: 30,
        yellowFrom: 31, yellowTo: 45,
        greenFrom: 46, greenTo: 100,
        minorTicks: 5
    };


    if ($('#responseRate' + elementId).length <= 0) {
        return;
    }
    var chart = new google.visualization.Gauge(document.getElementById('responseRate' + elementId));

    chart.draw(data, options);


}

function populateAverageWaitingTime(stats, elementId, size) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['WaitingTime', stats.waitingTime]
    ]);

    var options = {
        width: 280 / size, height: 200 / size,
        redFrom: 120, redTo: 160,
        yellowFrom: 60, yellowTo: 120,
        greenFrom: 0, greenTo: 60,
        minorTicks: 5,
        max: 160
    };

    if ($('#waitingTime' + elementId).length <= 0) {
        return;
    }
    var chart = new google.visualization.Gauge(document.getElementById('waitingTime' + elementId));

    chart.draw(data, options);


}
function populateAverageConnectedTime(stats, elementId, size) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['TalkingTime', stats.connectedTime]
    ]);

    var options = {
        width: 280 / size, height: 200 / size,
        redFrom: 210, redTo: 400,
        yellowFrom: 0, yellowTo: 150,
        greenFrom: 150, greenTo: 210,
        minorTicks: 5,
        max: 400
    };

    if ($('#talkingTime' + elementId).length <= 0) {
        return;
    }
    var chart = new google.visualization.Gauge(document.getElementById('talkingTime' + elementId));

    chart.draw(data, options);


}

function populateAverageAbandonTime(stats) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['AbandonTime', stats.abandonTime]
    ]);

    var options = {
        width: 280, height: 200,
        redFrom: 120, redTo: 160,
        yellowFrom: 60, yellowTo: 120,
        greenFrom: 0, greenTo: 60,
        minorTicks: 5,
        max: 160
    };


    if ($('#abandonTime').length <= 0) {
        return;
    }
    var chart = new google.visualization.Gauge(document.getElementById('abandonTime'));

    chart.draw(data, options);


}
function populateTimeoutCount(stats, elementId, size) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['timeoutCount', stats.timeoutCount]
    ]);

    var options = {
        width: 280 / size, height: 200 / size,
        redFrom: 10, redTo: 50,
        yellowFrom: 5, yellowTo: 10,
        greenFrom: 0, greenTo: 5,
        minorTicks: 5,
        max: 50
    };

    if ($('#timeoutCount' + elementId).length <= 0) {
        return;
    }

    var chart = new google.visualization.Gauge(document.getElementById('timeoutCount' + elementId));

    chart.draw(data, options);


}

function populateAbandonRates(stats) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['AbandonRate', (stats.abandonCount / stats.totalIncomingCalls) * 100],
        ['Abandon<10', (stats.abandonCount_10 / stats.abandonCount) * 100],
        ['Abandon 11_30', (stats.abandonCount_30 / stats.abandonCount) * 100],
        ['Abandon 31_120', (stats.abandonCount_120 / stats.abandonCount) * 100],
        ['Abandon 120+ ', (stats.abandonCount_140 / stats.abandonCount) * 100]
    ]);

    var options = {
        width: 280, height: 200,
        redFrom: 60, redTo: 100,
        yellowFrom: 30, yellowTo: 60,
        greenFrom: 0, greenTo: 30,
        minorTicks: 5
    };

    if ($('#abandonRates').length <= 0) {
        return;
    }
    var chart = new google.visualization.Gauge(document.getElementById('abandonRates'));

    chart.draw(data, options);


}
function populateTicketClassification(ticketGroups) {
    if (ticketGroups == undefined) {
        return;
    }
    var unsubs = 0;
    var callback = 0;
    var manual = 0;
    var refundEmail = 0;
    var EmailQuery = 0;

    //var enquiry_type = {'0': '19 Unsub', '1': '04 Unsub', '2': 'IncomingCall', '3': 'Callback/VM', '4': 'IncomingAnswered', '6': 'ManualTicket', '7': 'Refund Email', '8': 'Email query'};
    for (i = 0; i < ticketGroups.length; i++) {
        if (ticketGroups[i].enquiry_type == '0' | ticketGroups[i].enquiry_type == '1')
            unsubs = unsubs + ticketGroups[i].nos;
        if (ticketGroups[i].enquiry_type == '3')
            callback = callback + ticketGroups[i].nos;
        if (ticketGroups[i].enquiry_type == '6')
            manual = manual + ticketGroups[i].nos;
        if (ticketGroups[i].enquiry_type == '7')
            refundEmail = refundEmail + ticketGroups[i].nos;
        if (ticketGroups[i].enquiry_type == '8')
            EmailQuery = EmailQuery + ticketGroups[i].nos;
    }

    var data = google.visualization.arrayToDataTable([
        ['Types', 'Count'],
        ['Unsubs', unsubs],
        ['Callbacks', callback],
        ['Manual', manual],
        ['RefundEmail', refundEmail],
        ['EmailQuery', EmailQuery]
    ]);

    var options = {
        title: 'Ticket Classifications',
        width: 700, height: 400,
        pieSliceText: 'value'
    };

    if ($('#ticketClassification').length <= 0) {
        return;
    }

    var chart = new google.visualization.PieChart(document.getElementById('ticketClassification'));

    chart.draw(data, options);
}

function populateSystemStats(callstats, divId, title) {
    if (callstats === undefined) {
        return;
    }
    var data = new google.visualization.DataTable();
    data.addColumn('datetime', 'time');
    data.addColumn('number', 'TotalCalls');
    data.addColumn('number', 'InQueue');
    data.addColumn('number', 'Connected');
    data.addColumn('number', 'operators');
    data.addColumn('number', 'responseRate X 2');

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
        singleStat.push((callstats[i].responseRate) / 2);

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
        height: 555,
        width: $(document).width(),
        vAxis: {ticks: [{v: 0, f: '0'}, {v: 1, f: '1'}, {v: 2, f: '2'}, {v: 3, f: '3'}, {v: 4, f: '4'}, {v: 5, f: '5'}, {v: 10, f: '10'}, {v: 15, f: '15'}, {v: 20, f: '20'}, {v: 30, f: '60%'}, {v: 40, f: '80%'}, {v: 50, f: '100%'}]},
        legend: {position: 'bottom'}
    };


    if ($('#' + divId).length <= 0) {
        return;
    }
    var chart = new google.visualization.LineChart(document.getElementById(divId));


    chart.draw(data, options);


}


function populateGuages(data, elementId, size) {
    //console.log('populateGuages' + elementId + "Values:" + JSON.stringify(data));


    try {


        populateResponseRate(data, elementId, size);
        populateAverageWaitingTime(data, elementId, size);
        populateAverageConnectedTime(data, elementId, size);
        populateTimeoutCount(data, elementId, size);



    } catch (err) {
        console.log(err.message);
    }

    //populateAverageAbandonTime(data);
    //populateAbandonRates(data);

}



