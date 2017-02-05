// grab the room from the URL
var room = location.search && location.search.split('?')[1];

// create our webrtc connection
var webrtc = new SimpleWebRTC({
  // the id/element dom element that will hold "our" video
  localVideoEl: 'localVideo',
  // the id/element dom element that will hold remote videos
  remoteVideosEl: '',
  // immediately ask for camera access
  autoRequestMedia: true,
  debug: false,
  detectSpeakingEvents: true,
  autoAdjustMic: false,
  url: 'http://192.168.0.103:8888'
});

// when it's ready, join if we got a room from the URL
webrtc.on('readyToCall', function () {
  // you can name it anything
  if (room) {
    webrtc.joinRoom(room);


    //For Text Chat ------------------------------------------------------------------
    // Await messages from others

    webrtc.connection.on('message', function(data){
      if(data.type === 'chat'){
        console.log('chat received',data);
        $('#messages').append('<br>' + data.payload.nick + ':<br>' + data.payload.message);
      }
    });


    // Send a chat message
    $('#send').click(function(){
      var msg = $('#text').val();
      webrtc.sendToAll('chat', {message: msg, nick: webrtc.config.nick});
      $('#messages').append('<br>You:<br>' + msg);
      msg = '';
    });
  }

});


// we did not get access to the camera
webrtc.on('localMediaError', function (err) {
});



// a peer video has been added
webrtc.on('videoAdded', function (video, peer) {
  console.log('video added', peer);
  var remotes = document.getElementById('remotes');
  if (remotes) {
    var container = document.createElement('div');
    container.className = 'videoContainer';
    container.id = 'container_' + webrtc.getDomId(peer);
    container.appendChild(video);

    // suppress contextmenu
    video.oncontextmenu = function () { return false; };

    // resize the video on click
    video.onclick = function () {
      container.style.width = video.videoWidth + 'px';
      container.style.height = video.videoHeight + 'px';
    };


    // show the ice connection state
    if (peer && peer.pc) {
      var connstate = document.createElement('div');
      connstate.className = 'connectionstate';
      container.appendChild(connstate);
      peer.pc.on('iceConnectionStateChange', function (event) {
        switch (peer.pc.iceConnectionState) {
          case 'checking':
            connstate.innerText = 'Connecting to peer...';
            break;
          case 'connected':
          case 'completed': // on caller side
            connstate.innerText = 'Connection established.';
            break;
          case 'disconnected':
            connstate.innerText = 'Disconnected.';
            break;
          case 'failed':
            connstate.innerText = 'Connection failed.';
            break;
          case 'closed':
            connstate.innerText = 'Connection closed.';
            break;
        }
      });
    }
    remotes.appendChild(container);
  }
});
// a peer was removed
webrtc.on('videoRemoved', function (video, peer) {
  console.log('video removed ', peer);
  var remotes = document.getElementById('remotes');
  var el = document.getElementById(peer ? 'container_' + webrtc.getDomId(peer) : 'localScreenContainer');
  if (remotes && el) {
    remotes.removeChild(el);
  }
});

// local p2p/ice failure
webrtc.on('iceFailed', function (peer) {
  var connstate = document.querySelector('#container_' + webrtc.getDomId(peer) + ' .connectionstate');
  console.log('local fail', connstate);
  if (connstate) {
    connstate.innerText = 'Connection failed.';
    fileinput.disabled = 'disabled';
  }
});

// remote p2p/ice failure
webrtc.on('connectivityError', function (peer) {
  var connstate = document.querySelector('#container_' + webrtc.getDomId(peer) + ' .connectionstate');
  console.log('remote fail', connstate);
  if (connstate) {
    connstate.innerText = 'Connection failed.';
    fileinput.disabled = 'disabled';
  }
});

// Since we use this twice we put it here
function setRoom(name) {
  $('form').fadeOut();
  $('#title').html('Room: ' + name);
  $('#subTitle').html('Link to join: <br>' + location.href);
  $('body').addClass('active');
}

if (room) {
  setRoom(room);
} else {
  $('form').submit(function (e) {
    e.preventDefault();
    var val = $('#room-name').val().toLowerCase().replace(/\s/g, '-').replace(/[^A-Za-z0-9_\-]/g, '');
    webrtc.createRoom(val, function (err, name) {
      console.log(' create room cb', arguments);

      var newUrl = location.pathname + '?' + name;
      if (!err) {
        history.replaceState({foo: 'bar'}, null, newUrl);
        setRoom(name);
      } else {
        console.log(err);
      }
    });
    return false;
  });
}
