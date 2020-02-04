const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.set('view engine', 'pug');
app.set('views', 'projects/socket_test');

let data_by_time = 0;

let looper = setInterval(() => {
    data_by_time++;
    io.emit('timer', {
        time : data_by_time
    });
}, 1000);

let client_loopers = new Map();

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
        let looper = setInterval(() => {
            //let station_raw = getStationdDataByID(id);
            //test
            let station_refined = {
                data : data_by_time + id
            }
            socket.emit('res_station_rt', station_refined);
            console.log(socket.id + " : " + "emitted");
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
