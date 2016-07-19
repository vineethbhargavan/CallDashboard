# !bin/bash
echo "Node Monitoring Service"
DASHBOARD_RESTART="/opt/dashboard/dashboard.sh"
get_pid() {
        echo `ps ax | grep node | grep $1 | awk '{print$1}'`
}
pid_dashboard=$(get_pid app.js)
if [ -n "$pid_dashboard" ] ; then
    echo  "Dashboard Service  Running: $pid_dashboard "
else
    echo  "Dashboard Service NOT Running"
    sh $DASHBOARD_RESTART restart
fi

exit 0

