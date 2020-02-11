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
    bus_loc : "http://bis.mokpo.go.kr/mp/bis/searchBusRealLocationDetail.do",
    all_routes : "http://bis.mokpo.go.kr/mp/bis/searchBusRoute.do"
};

function getOpt(url, method, form){
    return {url, method, form};
}


app.get('/:id', (req, res) => {
    let opt = getOpt(URLs.all_routes, 'POST', {busRoute : req.params.id});
    request.post(opt, (err, res_post, body) => {
        let exist = false;
        for(let i of JSON.parse(body)["busRouteList"]){
            if(i["route_name"] === req.params.id){
                res.render('client', {name : req.params.id, id: i["route_id"]});
                exist = true;
            }
        }

        if(!exist) res.send('일치하는 버스 번호가 없습니다!');
        //res.render('client');
    });
});

server.listen(80, () => {
    console.log('server running on 80 port');
});

io.on('connection', socket => {

    socket.on('connect_', data => {
        console.log('Client connected : ' + socket.id);
        socket.prev_data = "{}";
    });

    socket.on('req_station_rt', data => {
        let id = parseInt(data.id);
        let opt = getOpt(URLs.bus_loc, 'POST', {busRouteId : id});
        let looper = setInterval(() => {
            request.post(opt, (err, res, body) => {
                if(!err) {
                    let routes_raw = JSON.parse(body)['busRealLocList'];

                    let routes_ref = {};
                    for (let i of routes_raw) {
                        //veh_id = 0, angle = 1, lat = 2 ...
                        /*
                        event type = 1 (정류장에서 출발) 2 (정류장 도착) 3(교차로 통과)
                        turn_flag = 'DW' : 하행 else : 상행, 순환
                        route_type = 11 : 광역 else : 일반
                        low_flag = 1 : 저상 else : 일반
                        turn_useflag = 1 : 비순환 else : 순환
                         */

                        let {veh_id, angle, lat, lng, event_type, speed, stop_id, plate_no, turn_flag, route_type, low_flag, turn_useflag} = i;
                        routes_ref[veh_id] = [angle, lat, lng, event_type, speed, stop_id, plate_no, turn_flag, route_type, low_flag, turn_useflag];
                    }

                    //data encapsulate
                    //send data : {veh_1 : [[1, 3], [3,10000007]], veh_2 : [[1,2], [2, 50]], veh_3 : null, veh_4 : [1,2,3,4,....]} (example, the most simplified emit data)

                    let prev_data_parsed = JSON.parse(socket.prev_data);
                    socket.prev_data = JSON.stringify(routes_ref);
                    let routes_ref_encap = {};

                    for(let i in routes_ref){
                        let item = routes_ref[i];
                        if(prev_data_parsed.hasOwnProperty(i)){
                            // 변경
                            let prev_item = prev_data_parsed[i];
                            let changed_list = [];
                            for(let k in item){
                                if(item[k] !== prev_item[k]){
                                    changed_list.push([k, item[k]]);
                                }
                            }
                            if(changed_list.length !== 0) routes_ref_encap[i] = changed_list;
                            delete prev_data_parsed[i];
                        } else {
                            // 신규
                            routes_ref_encap[i] = item;
                        }
                    }

                    for(let j in prev_data_parsed){ // 제거
                        routes_ref_encap[j] = null;
                    }

                    let routes_ref_encap_str = JSON.stringify(routes_ref_encap);
                    if(routes_ref_encap_str !== "{}"){
                        socket.emit('res_station_rt_encap', routes_ref_encap);
                        console.log(server_timer, " : ", socket.id, " : ", routes_ref_encap_str);
                    }

                    /*if (JSON.stringify(routes_ref) !== socket.prev_data) {
                        socket.emit('res_station_rt', routes_ref);
                        console.log(server_timer, " : ", socket.id + " : " + "emitted");
                    }*/


                }
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
            client_loopers.delete(socket.id);
        }
    });
});
