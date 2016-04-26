
app.controller('opprfController', function ($scope) {
    socket.on('opprflist', function (data) {
        $scope.opprf = data;
        $scope.$apply();
        //socket.post('/room/userlist', {id:'operator',name:'operator'});
    });
    socket.on('callstatus', function (data) {
        var updatedCallstatus = data.context;
        console.log(data.operator);
        console.log(data.context);
        $scope.opprf.id = data.operator;
        $scope.opprf.mode = data.context;
        $scope.$apply();
        //socket.post('/room/userlist', {id:'operator',name:'operator'});
    });
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
        console.log('QueueDetails'+JSON.stringify(data));       
        $scope.$apply();
        
    });
});

