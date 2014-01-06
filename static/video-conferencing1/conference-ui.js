// 2013, Muaz Khan - https://github.com/muaz-khan
// MIT License     - https://www.webrtc-experiment.com/licence/
// Documentation   - https://github.com/muaz-khan/WebRTC-Experiment/tree/master/video-conferencing

var config = {
    openSocket: function(config) {
		console.log("2:openSocket()"+config);
        var SIGNALING_SERVER = '/',
            defaultChannel = location.hash.substr(1) || 'video-conferencing-hangout';

        var channel = config.channel || defaultChannel;
        var sender = Math.round(Math.random() * 999999999) + 999999999;
		console.log("channel" + channel);
        io.connect(SIGNALING_SERVER).emit('new-channel', {
            channel: channel,
            sender: sender
        });

        var socket = io.connect(SIGNALING_SERVER + channel);
        socket.channel = channel;
        socket.on('connect', function() {
			console.log("2:socket.on('connect')");
            if (config.callback) config.callback(socket);
        });

        socket.send = function(message) {
			//console.log("2:socket.send"+JSON.stringify(message));
            socket.emit('message', {
                sender: sender,
                data: message
            });
        };

        socket.on('message', config.onmessage);
    },
    onRemoteStream: function(media) {
		console.log("2:onRemoteStream"+media);
        var video = media.video;
		console.log(media);
        video.setAttribute('controls', true);
        video.setAttribute('id', media.stream.id);
		video.setAttribute('class', 'video-container');
		
        participants.insertBefore(video, participants.firstChild);

        video.play();
        rotateVideo(video);
    },
    onRemoteStreamEnded: function(stream) {
		console.log("2:onRemoteStreamEnded"+stream);
        var video = document.getElementById(stream.id);
        if (video) video.parentNode.removeChild(video);
    },
    onRoomFound: function(room) {
		console.log("2:onRoomFound"+room);
        var alreadyExist = document.getElementById(room.broadcaster);
        if (alreadyExist) return;
		console.log(room);
        if (typeof roomsList === 'undefined') roomsList = document.body;

//        var tr = document.createElement('tr');
//        tr.setAttribute('id', room.broadcaster);
//        tr.innerHTML = '<td>' + room.roomName + '</td>' +
//            '<td><button class="join" id="' + room.roomToken + '">Join Conference</button></td>';
//        roomsList.insertBefore(tr, roomsList.firstChild);

 //       tr.onclick = function() {
 //           var tr = this;
            captureUserMedia(function() {
				console.log("2:captureUserMedia");
                conferenceUI.joinRoom({
                    roomToken: room.roomToken,
                    joinUser: room.broadcaster
                });
            });
            hideUnnecessaryStuff();
    //    };
    }
};

function createButtonClickHandler() {
    captureUserMedia(function() {
        conferenceUI.createRoom({
            roomName: (document.getElementById('conference-name') || { }).value || 'Anonymous'
        });
    });
    hideUnnecessaryStuff();
}

function captureUserMedia(callback) {
	console.log("2:captureUserMedia"+callback);
    var video = document.createElement('video');
    video.setAttribute('autoplay', true);
    video.setAttribute('controls', true);
	video.setAttribute('class', 'video-container');
    participants.insertBefore(video, participants.firstChild);

    getUserMedia({
        video: video,
        onsuccess: function(stream) {
			console.log("2:captureUserMedia:onsuccess"+stream);
			stream['id'] = config.channel;
            config.attachStream = stream;
            callback && callback();

            video.setAttribute('muted', true);
            rotateVideo(video);
        },
        onerror: function() {
            alert('unable to get access to your webcam');
            callback && callback();
        }
    });
}

// You can use! window.onload = function() {}
var conferenceUI = conference(config);

/* UI specific */
var participants = document.getElementById("participants") || document.body;
var startConferencing = document.getElementById('start-conferencing');
var roomsList = document.getElementById('rooms-list');

if (startConferencing) startConferencing.onclick = createButtonClickHandler;

function hideUnnecessaryStuff() {
    var visibleElements = document.getElementsByClassName('visible'),
        length = visibleElements.length;
    for (var i = 0; i < length; i++) {
        visibleElements[i].style.display = 'none';
    }
}

function rotateVideo(video) {
    video.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(0deg)';
    setTimeout(function() {
        video.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(360deg)';
    }, 1000);
}

//(function() {
 //   var uniqueToken = document.getElementById('unique-token');
//    if (uniqueToken)
 //       if (location.hash.length > 2) uniqueToken.parentNode.parentNode.parentNode.innerHTML = '<h2 style="text-align:center;"><a href="' + location.href + '" target="_blank">Share this link</a></h2>';
 //       else uniqueToken.innerHTML = uniqueToken.parentNode.parentNode.href = '#' + (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace( /\./g , '-');
//})();
