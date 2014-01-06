// 2013, Muaz Khan - https://github.com/muaz-khan
// MIT License     - https://www.webrtc-experiment.com/licence/
// Documentation   - https://github.com/muaz-khan/WebRTC-Experiment/blob/master/socketio-over-nodejs

// Load libraries
var https = require('https');
var app = require('express')();
var fs = require('fs');
var socketio = require('socket.io');

// The server options
var svrPort = 8888; // This is the port of service
var svrOptions = {
    key: fs.readFileSync('certs/webserver.key'),
    cert: fs.readFileSync('certs/webserver.cert')
  //,  ca: fs.readFileSync( 'bundle.crt')
};

// Create a Basic server and response 
var servidor = https.createServer( svrOptions , app);

// Create the Socket.io Server over the HTTPS Server
io = socketio.listen( servidor );



//var app = require('express')(),
//    server = require('https').createServer(app),
 //   io = require('socket.io').listen(server);

servidor.listen(svrPort);

// ----------------------------------socket.io

var channels = {};

io.sockets.on('connection', function (socket) {
    var initiatorChannel = '';
    if (!io.isConnected)
        io.isConnected = true;

    socket.on('new-channel', function (data) {
        channels[data.channel] = data.channel;
        onNewNamespace(data.channel, data.sender);
    });

    socket.on('presence', function (channel) {
        var isChannelPresent = !! channels[channel];
        socket.emit('presence', isChannelPresent);
        if (!isChannelPresent)
            initiatorChannel = channel;
    });

    socket.on('disconnect', function (channel) {
        if (initiatorChannel)
            channels[initiatorChannel] = null;
    });
	
});

function onNewNamespace(channel, sender) {
    io.of('/' + channel).on('connection', function (socket) {
        if (io.isConnected) {
            io.isConnected = false;
            socket.emit('connect', true);
        }

        socket.on('message', function (data) {
            if (data.sender == sender)
                socket.broadcast.emit('message', data.data);
        });
    });
}

// ----------------------------------extras

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/static/video-conferencing/index.html');
});
//conference
app.get('/conference.js', function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendfile(__dirname + '/static/video-conferencing/conference.js');
});

app.get('/conference-ui.js', function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendfile(__dirname + '/static/video-conferencing/conference-ui.js');
});
app.get('/RTCPeerConnection-v1.5.js', function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendfile(__dirname + '/static/video-conferencing/RTCPeerConnection-v1.5.js');
});
app.get('/chat', function (req, res) {
    res.sendfile(__dirname + '/static/text-chat.html');
});

app.get('/RTCMultiConnection', function (req, res) {
    res.sendfile(__dirname + '/static/RTCMultiConnection/index.html');
});
//end conference
//sharing
app.get('/sharing-conference.js', function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendfile(__dirname + '/static/Pluginfree-Screen-Sharing/conference.js');
});

app.get('/sharing-RTCPeerConnection-v1.5.js', function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendfile(__dirname + '/static/Pluginfree-Screen-Sharing/RTCPeerConnection-v1.5.js');
});
app.get('/Pluginfree-Screen-Sharing', function (req, res) {
    res.sendfile(__dirname + '/static/Pluginfree-Screen-Sharing/index.html');
});
//end sharing

//record
app.get('/RecordRTC.js', function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendfile(__dirname + '/static/RecordRTC/RecordRTC.js');
});
app.get('/RecordRTC', function (req, res) {
    res.sendfile(__dirname + '/static/RecordRTC/index.html');
});

//php
app.get('/RecordRTC-to-PHP', function (req, res) {
    res.sendfile(__dirname + '/static/RecordRTC/RecordRTC-to-PHP/index.html');
});
app.get('/delete.php', function (req, res) {
    res.sendfile(__dirname + '/static/RecordRTC/RecordRTC-to-PHP/delete.php');
});
app.get('/save.php', function (req, res) {
    res.sendfile(__dirname + '/static/RecordRTC/RecordRTC-to-PHP/save.php');
});
//end record
app.get('/socketio.js', function (req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendfile(__dirname + '/static/socket.io.js');
});
