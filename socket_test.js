const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const request = require('request');

app.set('view engine', 'pug');
app.set('views', 'projects/socket_test');

let server_timer = 0;

//server time counter
let looper = setInterval(() => {
    server_timer++;
}, 1000);

let client_loopers = new Map();

let URLs = {
    bus_loc : "http://bis.mokpo.go.kr/mp/bis/searchBusRealLocationDetail.do"
};

function getOpt(url, method, form){
    return {url, method, form};
}

/*function getRouteDataByID(id){
    let opt = getOpt(URLs.bus_loc, 'POST', {busRouteId : id});
    let output = {};

    request.post(opt, (err, res, body) => {
        console.log(body);
        return JSON.parse(body)['busRealLocList'];
    });
}*/

app.get('/', (req, res) => {
    res.render('client');
});

server.listen(80, () => {
    console.log('server running on 80 port');
});

io.on('connection', socket => {

    socket.on('connect_', data => {
        console.log('Client connected : ' + socket.id);
    });

    socket.on('req_station_rt', data => {
        let id = parseInt(data.id);
        let opt = getOpt(URLs.bus_loc, 'POST', {busRouteId : id});
        let looper = setInterval(() => {

            request.post(opt, (err, res, body) => {
                let routes_raw = JSON.parse(body)['busRealLocList'];

                let routes_ref = [];
                for(let i of routes_raw) {
                    let {angle, event_type, operation_status, speed, stop_id} = i;
                    routes_ref.push({angle, event_type, operation_status, speed, stop_id});
                }

                socket.emit('res_station_rt', routes_ref);
                console.log(socket.id + " : " + "emitted");
            });
        }, 1000);

        client_loopers.set(socket.id, looper);
    });

    socket.on('forcedisconnect', () => {
        socket.disconnect();
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected : ' + socket.id);
        if(client_loopers.has(socket.id)){
            clearInterval(client_loopers.get(socket.id));
            client_loopers.delete(socket.id)
        }
    });
});
