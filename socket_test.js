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

app.get('/', (req, res) => {
    res.render('client');
});

server.listen(80, () => {
    console.log('server running on 80 port');
});

io.on('connection', socket => {

    socket.on('conn', data => {
        console.log('Client connected : ' + socket.id);
    });

    socket.on('forcedisconnect', () => {
        socket.disconnect();
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected : ' + socket.id);
    });

});
