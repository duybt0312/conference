// 2013, @muazkh » github.com/muaz-khan
// MIT License » https://webrtc-experiment.appspot.com/licence/
// Documentation » https://github.com/muaz-khan/WebRTC-Experiment/tree/master/video-conferencing

var conference = function(config) {
    var self = {
        userToken: uniqueToken()
    };
console.log('self.userToken: '+ self.userToken);
    var channels = '--',curentTokenResponse = '',
        isbroadcaster,
        isGetNewRoom = true,
        sockets = [],
        defaultSocket = { };

    function openDefaultSocket() {
        defaultSocket = config.openSocket({
            onmessage: onDefaultSocketResponse,
            callback: function(socket) {
                defaultSocket = socket;
            }
        });
    }

    function onDefaultSocketResponse(response) {
        if (response.userToken == self.userToken) return;

        if (isGetNewRoom && response.roomToken && response.broadcaster) config.onRoomFound(response);

        if (response.newParticipant) onNewParticipant(response.newParticipant);

        if (response.userToken && response.joinUser == self.userToken && response.participant && channels.indexOf(response.userToken) == -1) {
            channels += response.userToken + '--';
            openSubSocket({
                isofferer: true,
                channel: response.channel || response.userToken
            });
        }
    }

    function openSubSocket(_config) {
        if (!_config.channel) return;
        var socketConfig = {
            channel: _config.channel,
            onmessage: socketResponse,
            onopen: function() {
                if (isofferer && !peer) initPeer();
                sockets[sockets.length] = socket;
            }
        };

        socketConfig.callback = function(_socket) {
            socket = _socket;
            this.onopen();
        };

        var socket = config.openSocket(socketConfig),
            isofferer = _config.isofferer,
            gotstream,
            video = document.createElement('video'),
            inner = { },
            peer;

        var peerConfig = {
            attachStream: config.attachStream,
            onICE: function(candidate) {
                socket.send({
                    userToken: self.userToken,
                    candidate: {
                        sdpMLineIndex: candidate.sdpMLineIndex,
                        candidate: JSON.stringify(candidate.candidate)
                    }
                });
            },
            onRemoteStream: function(stream) {
			console.log('1 onRemoteStream' + stream)
                if (!stream) return;

                video[moz ? 'mozSrcObject' : 'src'] = moz ? stream : webkitURL.createObjectURL(stream);
				console.log('video' + video.currentTime);
                video.play();
				//stream['id'] = _config.channel;
				if(curentTokenResponse != ''){ 
					stream['id'] = curentTokenResponse;
					curentTokenResponse = '';
				}
				console.log('stream');
				console.log(stream);
				console.log('_config');
				console.log(_config);
                _config.stream = stream;
                onRemoteStreamStartsFlowing();
            },
            onRemoteStreamEnded: function(stream) {
			console.log('die here');
			console.log(stream);
			
                if (config.onRemoteStreamEnded)
                    config.onRemoteStreamEnded(stream);
            }
        };

        function initPeer(offerSDP) {
            if (!offerSDP) {
                peerConfig.onOfferSDP = sendsdp;
            } else {
                peerConfig.offerSDP = offerSDP;
                peerConfig.onAnswerSDP = sendsdp;
            }

            peer = RTCPeerConnection(peerConfig);
        }

        function onRemoteStreamStartsFlowing() {
		console.log('onRemoteStreamStartsFlowing' + video.readyState + '---' + video.paused + '--' + video.currentTime + 'HTMLMediaElement.HAVE_CURRENT_DATA' + HTMLMediaElement.HAVE_CURRENT_DATA);
            if (!(video.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA || video.paused || video.currentTime <= 0)) {
                gotstream = true;
				console.log('_config.stream:');
				console.log( _config.stream);
                if (config.onRemoteStream)
                    config.onRemoteStream({
                        video: video,
                        stream: _config.stream,
                    });

                if (isbroadcaster && channels.split('--').length > 3) {
                    /* broadcasting newly connected participant for video-conferencing! */
                    defaultSocket.send({
                        newParticipant: socket.channel,
                        userToken: self.userToken
                    });
                }

            } else setTimeout(onRemoteStreamStartsFlowing, 50);
        }

        function sendsdp(sdp) {
			console.log('sdp' + sdp);
            socket.send({
                userToken: self.userToken,
                sdp: JSON.stringify(sdp)
            });
        }

        function socketResponse(response) {
            if (response.userToken == self.userToken) return;
            if (response.sdp) {
				console.log('socketResponse' + response.userToken);
                inner.sdp = JSON.parse(response.sdp);
				curentTokenResponse = response.userToken;
                selfInvoker();
            }

            if (response.candidate && !gotstream) {
                if (!peer) console.error('missed an ice', response.candidate);
                else
                    peer.addICE({
                        sdpMLineIndex: response.candidate.sdpMLineIndex,
                        candidate: JSON.parse(response.candidate.candidate)
                    });
            }

            if (response.left) {
			console.log('close');
			console.log('response');
			console.log(response);
                if (peer && peer.peer) {
                    console.log(response.userToken);
    
					var videoc = document.getElementById(response.userToken);
					console.log(videoc);
					if (videoc) videoc.parentNode.removeChild(videoc);
					peer.peer.close();
                    peer.peer = null;
                }
            }
        }

        var invokedOnce = false;

        function selfInvoker() {
            if (invokedOnce) return;

            invokedOnce = true;

            if (isofferer){
			console.log('addAnswerSDP' + inner.sdp);
				peer.addAnswerSDP(inner.sdp);
			}
            else{
				console.log('initPeer');
				initPeer(inner.sdp);
			}
        }
    }

    function leave() {
        var length = sockets.length;
        for (var i = 0; i < length; i++) {
            var socket = sockets[i];
			console.log(socket);
            if (socket) {
                socket.send({
                    left: true,
                    userToken: self.userToken
                });
                delete sockets[i];
            }
			
        }
		
		sockets = swap(sockets);
    }

    window.onbeforeunload = function() {
        leave();
    };

    window.onkeyup = function(e) {
        if (e.keyCode == 116) leave();
    };

    function startBroadcasting() {
        defaultSocket && defaultSocket.send({
            roomToken: self.roomToken,
            roomName: self.roomName,
            broadcaster: self.userToken
        });
        setTimeout(startBroadcasting, 3000);
    }

    function onNewParticipant(channel) {
        if (!channel || channels.indexOf(channel) != -1 || channel == self.userToken) return;
        channels += channel + '--';

        var new_channel = uniqueToken();
        openSubSocket({
            channel: new_channel
        });

        defaultSocket.send({
            participant: true,
            userToken: self.userToken,
            joinUser: channel,
            channel: new_channel
        });
    }

    function uniqueToken() {
        var s4 = function() {
            return Math.floor(Math.random() * 0x10000).toString(16);
        };
        return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
    }
	function swap(arr) {
    	log('swap 1878');
        var swapped = [],
            length = arr.length;
        for (var i = 0; i < length; i++)
            if (arr[i] && arr[i] !== true)
                swapped.push(arr[i]);
        return swapped;
    }

    function log(a, b, c, d, e, f) {
        if (window.skipRTCMultiConnectionLogs) return;
        if (f)
            console.log(a, b, c, d, e, f);
        else if (e)
            console.log(a, b, c, d, e);
        else if (d)
            console.log(a, b, c, d);
        else if (c)
            console.log(a, b, c);
        else if (b)
            console.log(a, b);
        else if (a)
            console.log(a);
    }
    openDefaultSocket();
    return {
        createRoom: function(_config) {
            self.roomName = _config.roomName || 'Anonymous';
            self.roomToken = uniqueToken();

            isbroadcaster = true;
            isGetNewRoom = false;
            startBroadcasting();
        },
        joinRoom: function(_config) {
            self.roomToken = _config.roomToken;
            isGetNewRoom = false;

            openSubSocket({
                channel: self.userToken
            });

            defaultSocket.send({
                participant: true,
                userToken: self.userToken,
                joinUser: _config.joinUser
            });
        }
    };
};
