# !/bin/bash
# chkconfig: - 80 20
OUTBOUND_LOCATION="/opt/dashboard/app.js"
get_pid() {
	echo `ps ax | grep node | grep app.js | awk '{print$1}'`
}


test() {
	echo "Test"
	return 0
}
status() {
	pid=$(get_pid)
	echo " $pid "
	if [ -n "$pid" ] ; then
		echo  "Dashboard Service  Running: $pid "
	else
		echo  "Dashboard Service NOT Running"
	fi
	return 0
}

start() {
	pid=$(get_pid)
	if [ -n "$pid" ] ; then
                echo  "Dashboard Service  is Already Running: $pid "
	else
		echo "Starting Dashboard Service"
		/usr/local/bin/node $OUTBOUND_LOCATION >> /var/log/dashboard.log &
	fi
	return 0

}

stop() {
        pid=$(get_pid)
        if [ -n "$pid" ] ; then
                echo  "Stopping the Dashboard : $pid "
		kill $pid
        else
                echo "Service Already Stopped"
        fi
        return 0

}



case $1 in 
	test)
		test
		;;
	status)
		status
		;;
	start)
		start
		;;
	stop)
		stop
		;;
	restart)
		echo "Dashboard Service Restarted at:$(date)" >> /var/log/dashboard.log &
		stop
		start
		;;	
esac

exit 0
