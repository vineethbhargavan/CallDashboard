
app.controller('opprfController', function ($scope) {
    socket.on('opprflist', function (data) {
        $scope.opprf = data;
        $scope.$apply();
        //socket.post('/room/userlist', {id:'operator',name:'operator'});
    });
//    socket.on('callstatus', function (data) {
//        var updatedCallstatus = data.context;
//        console.log(data.operator);
//        console.log(data.context);
//        $scope.opprf.id = data.operator;
//        $scope.opprf.mode = data.context;
//        $scope.$apply();
//        //socket.post('/room/userlist', {id:'operator',name:'operator'});
//    });
});

app.controller('usersController', function ($scope) {
    socket.on('userlist', function (data) {
        $scope.userlist = data;
        $scope.$apply();

    });
});

app.controller('queueController', function ($scope) {
    socket.on('waitingqueue', function (data) {
        $scope.queue = data;
        console.log('QueueDetails' + JSON.stringify(data));
        $scope.$apply();

    });
});

app.controller('guageController', function ($scope) {
    socket.on('callStats', function (data) {
        $scope.guage = data;
        console.log('guageController' + JSON.stringify(data));
        populateGuages(data);
        $scope.$apply();

    });
});

app.controller('terminatedCallsController', function ($scope) {
    socket.on('terminatedCalls', function (data) {
        $scope.queue = data;
        console.log('QueueDetails' + JSON.stringify(data));
        $scope.$apply();

    });
});

app.controller('callstatsHistoryController', function ($scope) {
    socket.on('callstatsHistory', function (data) {
        $scope.guage = data;
        console.log('callstatsHistoryController' + JSON.stringify(data));
        
        $scope.$apply();

    });
});

function populateResponseRate(data) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['ResponseRate', (data.connectedCount/data.totalIncomingCalls)*100]
    ]);

    var options = {
        width: 400, height: 120,
        redFrom: 0, redTo: 30,
        yellowFrom: 31, yellowTo: 45,
        greenFrom:46,greenTo:100,
        minorTicks: 5
    };

    var chart = new google.visualization.Gauge(document.getElementById('responseRate'));

    chart.draw(data, options);


}

function populateAverageWaitingTime(data) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['WaitingTime', data.waitingTime]
    ]);

    var options = {
        width: 400, height: 120,
        redFrom: 120, redTo: 160,
        yellowFrom: 60, yellowTo: 120,
        greenFrom:0,greenTo:60,
        minorTicks: 5
    };

    var chart = new google.visualization.Gauge(document.getElementById('waitingTime'));

    chart.draw(data, options);


}
function populateAverageConnectedTime(data) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['TalkingTime', data.connectedTime]
    ]);

    var options = {
        width: 400, height: 120,
        redFrom: 240, redTo: 1800,
        yellowFrom: 180, yellowTo: 240,
        greenFrom:0,greenTo:180,
        minorTicks: 5
    };

    var chart = new google.visualization.Gauge(document.getElementById('talkingTime'));

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
        greenFrom:0,greenTo:60,
        minorTicks: 5
    };

    var chart = new google.visualization.Gauge(document.getElementById('abandonTime'));

    chart.draw(data, options);


}

function populateAbandonRates(data) {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['AbandonRate', (data.abandonCount/data.totalIncomingCalls)*100],
        ['Abandon<10', (data.abandonCount_10/data.abandonCount)*100],
        ['Abandon 11_30', (data.abandonCount_30/data.abandonCount)*100],
        ['Abandon 31_120', (data.abandonCount_120/data.abandonCount)*100],
        ['Abandon 120+ ', (data.abandonCount_140/data.abandonCount)*100]
    ]);

    var options = {
        width: 400, height: 120,
        redFrom: 60, redTo: 100,
        yellowFrom: 30, yellowTo: 60,
        greenFrom:0,greenTo:30,
        minorTicks: 5
    };

    var chart = new google.visualization.Gauge(document.getElementById('abandonRates'));

    chart.draw(data, options);


}
function populateGuages(data){
    populateResponseRate(data);
    populateAverageWaitingTime(data);
    populateAverageConnectedTime(data);
    populateAverageAbandonTime(data);
    populateAbandonRates(data);
    
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


