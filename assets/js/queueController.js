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
        console.log('urgentTicketsController' +data.country+";"+ data.urgent[0].urgent);
        if (data.country == '2') {
            $scope.urgent = data.urgent[0].urgent;
        } else if (data.country == '1') {
            $scope.urgentUK = data.urgent[0].urgent;
        } else {
            //ignore
        }
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
        if (data.country_identifier == '2') {
            populateGuages(data, "MovingAverage", 1.5);
        } else if (data.country_identifier == '1') {
            populateGuages(data, "MovingAverageUK", 1.5);
        } else {
            //ignore
        }

        //$scope.$apply();

    });
});

app.controller('realTimeGuageController', function ($scope) {

    socket.on('realTimecallStats', function (data) {
        //google.charts.setOnLoadCallback(populateSystemSnapShot);
        //google.charts.setOnLoadCallback(populateGuages);
        //$scope.guage = data;
        //console.log('realTimeGuageController' + JSON.stringify(data));

        if (data.country_identifier == '2') {
            populateSystemSnapShotBar(data, "RealTime");
            populateGuages(data, 'RealTime', 1);
        } else if (data.country_identifier == '1') {
            populateSystemSnapShotBar(data, "RealTimeUK");
            populateGuages(data, 'RealTimeUK', 1);
        } else {
            //ignore
        }

        //$scope.$apply();

    });
});

app.controller('lineChartController', function ($scope) {
    socket.on('movingSystemStats', function (data) {
        //google.charts.setOnLoadCallback(populateSystemStats);
        //$scope.guage = data;
        //console.log('lineChartController' + JSON.stringify(data));
        if (data.country_identifier == '2') {
            populateSystemStats(data.data, 'movingAverageCallstat', 'Call stat every 30 min-24hrs history');
        } else if (data.country_identifier == '1') {
            populateSystemStats(data.data, 'movingAverageCallstatUK', 'Call stat every 30 min-24hrs history');
        } else {
            //ignore
        }
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
    console.log('populateSystemSnapShotBar' + JSON.stringify(stats));
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
    var country = 0;
    var divID = 'ticketClassification';
    var unsubs = {};
    unsubs.nos = 0;
    unsubs.assigned = 0;
    unsubs.unassigned = 0;
    unsubs.urgent = 0;
    var callback = {};
    callback.nos = 0;
    callback.assigned = 0;
    callback.unassigned = 0;
    callback.urgent = 0;
    var manual = {};
    manual.nos = 0;
    manual.assigned = 0;
    manual.unassigned = 0;
    manual.urgent = 0;
    var refundEmail = {};
    refundEmail.nos = 0;
    refundEmail.assigned = 0;
    refundEmail.unassigned = 0;
    refundEmail.urgent = 0;
    var EmailQuery = {};
    EmailQuery.nos = 0;
    EmailQuery.assigned = 0;
    EmailQuery.unassigned = 0;
    EmailQuery.urgent = 0;

    //var enquiry_type = {'0': '19 Unsub', '1': '04 Unsub', '2': 'IncomingCall', '3': 'Callback/VM', '4': 'IncomingAnswered', '6': 'ManualTicket', '7': 'Refund Email', '8': 'Email query'};
    for (i = 0; i < ticketGroups.length; i++) {
        if (ticketGroups[i].enquiry_type == '0' | ticketGroups[i].enquiry_type == '1') {
            unsubs.nos = unsubs.nos + ticketGroups[i].nos;
            unsubs.assigned = unsubs.assigned + ticketGroups[i].assigned;
            unsubs.unassigned = unsubs.unassigned + ticketGroups[i].unassigned;
            unsubs.urgent = unsubs.urgent + ticketGroups[i].urgent;
        }
        if (ticketGroups[i].enquiry_type == '3') {
            callback.nos = callback.nos + ticketGroups[i].nos;
            callback.assigned = callback.assigned + ticketGroups[i].assigned;
            callback.unassigned = callback.unassigned + ticketGroups[i].unassigned;
            callback.urgent = callback.urgent + ticketGroups[i].urgent;
        }
        if (ticketGroups[i].enquiry_type == '6') {
            manual.nos = manual.nos + ticketGroups[i].nos;
            manual.assigned = manual.assigned + ticketGroups[i].assigned;
            manual.unassigned = manual.unassigned + ticketGroups[i].unassigned;
            manual.urgent = manual.urgent + ticketGroups[i].urgent;
        }
        if (ticketGroups[i].enquiry_type == '7') {
            refundEmail.nos = refundEmail.nos + ticketGroups[i].nos;
            refundEmail.assigned = refundEmail.assigned + ticketGroups[i].assigned;
            refundEmail.unassigned = refundEmail.unassigned + ticketGroups[i].unassigned;
            refundEmail.urgent = refundEmail.urgent + ticketGroups[i].urgent;
        }
        if (ticketGroups[i].enquiry_type == '8') {
            EmailQuery.nos = EmailQuery.nos + ticketGroups[i].nos;
            EmailQuery.assigned = EmailQuery.assigned + ticketGroups[i].assigned;
            EmailQuery.unassigned = EmailQuery.unassigned + ticketGroups[i].unassigned;
            EmailQuery.urgent = EmailQuery.urgent + ticketGroups[i].urgent;
        }
        country = ticketGroups[i].country;
    }
    
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Types');
    data.addColumn('number', 'Count');
    data.addColumn({'type': 'string', 'role': 'tooltip', 'p': {'html': true}})
    data.addRows([
        ['Unsubs', unsubs.nos, customPieToolTip(unsubs.assigned, unsubs.unassigned, unsubs.urgent)],
        ['Callbacks', callback.nos, customPieToolTip(callback.assigned, callback.unassigned, callback.urgent)],
        ['Manual', manual.nos, customPieToolTip(manual.assigned, manual.unassigned, manual.urgent)],
        ['RefundEmail', refundEmail.nos, customPieToolTip(refundEmail.assigned, refundEmail.unassigned, refundEmail.urgent)], // Below limit.
        ['EmailQuery', EmailQuery.nos, customPieToolTip(EmailQuery.assigned, EmailQuery.unassigned, EmailQuery.urgent)] // Below limit.
    ]);

    var options = {
        title: 'Ticket Classifications',
        width: 700, height: 400,
        pieSliceText: 'value',
        tooltip: {isHtml: true}
    };

    if ($('#ticketClassification').length <= 0) {
        return;
    }
    if (country == 2) {
        divID = 'ticketClassification';
        //console.log('Ticket Class country' + divID);
         //console.log('Ticket Class Data' + JSON.stringify(data));
    } else if (country == 1) {
        divID = 'ticketClassificationUK';
        //console.log('Ticket Class country' + divID);
        //console.log('Ticket Class Data' + JSON.stringify(data));
    }
    var chart = new google.visualization.PieChart(document.getElementById(divID));

    chart.draw(data, options);
}

function customPieToolTip(assigned, unassigned, urgent) {
    return '<div style="padding:5px 5px 5px 5px;">' +
            '<table class="pie_tooltip">' + '<tr>' +
            '<td><b>assigned:' + assigned + '</b></td>' + '</tr>' + '<tr>' +
            '<td><b>unassigned:' + unassigned + '</b></td>' + '</tr>' + '<tr>' +
            '<td style="color:red"><b>Urgent:' + urgent + '</b></td>' + '</tr>' + '</table>' + '</div>';
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
        var timestamp = new Date(callstats[i].timestamp);
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



