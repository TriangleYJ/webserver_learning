$(() => {
    let socket = io();

    let cur_location = window.location.href;
    let cur_url = new URL(cur_location);
    let id = $("#routeID").val();


    let routes = {};

    socket.emit("connect_", {});

    socket.emit("req_station_rt", {id});

    /*socket.on("res_station_rt", function (data) {
        let return_content = "";
        for(let i of data){
            let return_line = `angle : ${i.angle} event_type : ${i.event_type} speed : ${i.speed} stop_id : ${i.stop_id}<br>`;
            return_content += return_line;
        }
        $("#log").html(return_content);
        console.log("received data from server");
    });*/

    socket.on("res_station_rt_encap", data => {
        let sequence = ['angle', 'lat', 'lng', 'event_type', 'speed', 'stop_id', 'plate_no', 'turn_flag', 'route_type', 'low_flag', 'turn_useflag'];

        //Data receiver (decryption)
        for(let i in data){
            let item = data[i];
            if(item == null){ // 제거
                if(routes.hasOwnProperty(i)){
                    delete routes[i];
                }
            }
            else if(typeof item[0] === 'string') { // 추가
                routes[i] = {};
                for (let j in item){
                    routes[i][sequence[j]] = item[j];

                }
            }
            else{ // 변경
                for(let j of item){
                    routes[i][sequence[j[0]]] = j[1];
                }
            }
        }

        let list = $('#title');
        list.empty();
        for(let i in routes){
            list.append(`<li>${JSON.stringify(routes[i])}</li>`);
        }
    });


    //socket.on('timer', function(data){
    //    $('#log').text("server running time : " +data.time);
    //});


    function randomID(len) {
        var name = "";
        var possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXTY_-";
        for (var i = 0; i < len; i++) {
            name += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return name;
    }
});