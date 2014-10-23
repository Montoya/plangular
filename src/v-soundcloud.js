// Vue Plangular component

'use strict';


var jsonp = require('jsonp');
var audio = require('./audio');
var player = require('./player');
var plangular = require('./v-plangular');

var Plangular = Vue.extend({

  data: {
    player: player,
    index: null,
    value: null,
    track: null,
    currentTime: 0,
    duration: 0
  },

  ready: function() {
    var self = this;
    audio.addEventListener('timeupdate', function() {
      // TO DO: handle multiple views
      if (player.tracks[player.i] == self.track) {
        self.currentTime = audio.currentTime;
        self.duration = audio.duration;
      }
    });
  },

  methods: {

    play: function(playlistIndex) {
      player.play(this.index, playlistIndex);
    },

    pause: function() {
      player.pause();
    },

    playPause: function(playlistIndex) {
      player.playPause(this.index, playlistIndex);
    },

    seek: function(e) {
      if (player.tracks[player.i] == this.track) {
        player.seek(e);
      }
    },

    previous: function() { player.previous() },

    next: function() { player.next() }

  },

  directives: {

    'src': function(value) {

      var self = this;
      self.vm.value = value;

      var elements = document.querySelectorAll('[v-src]');
      for (var i = 0; i < elements.length; i++) {
        if (this.el == elements[i]) {
          self.vm.index = i;
        }
      }

      var apiUrl = plangular.api + '?url=' + value + '&client_id=' + plangular.clientID;

      if (plangular.data[value]) {
        for (var key in plangular.data[value]) {
          self.vm.$data[key] = plangular.data[value][key];
        }
        self.vm.duration = plangular.data[value].duration / 1000;
        self.vm.track = plangular.data[value];
        player.load(plangular.data[value], self.vm.index);
      } else if (value.indexOf('blend.io') > -1) { 
        /* adding support for Blend.io projects */ 
        
        // extract project ID from Blend URL 
        var blend_project_id = value.replace(/http[s]+\:\/\/blend\.io\/project\//,''); 
        
        var blend_url = 'https://blend.io/api/project/'+blend_project_id+'.json'; 
        
        apiUrl = blend_url; 
        
        jsonp(apiUrl, function(error, response) {
          
          response = {
            kind:'track', 
            id: response['_id'], 
            title: response.name, 
            duration: 'n/a', 
            state: response.state, 
            description: response.desc, 
            bpm: response.bpm, 
            uri: response.short_url, 
            user: {
              id: response.user.id, 
              kind: 'user', 
              username: response.user.name
            }, 
            permalink_url: response.short_url, 
            waveform_url: null, 
            artwork_url: 'https://s3.amazonaws.com/s3.blend.io/user/img/'+response.user.id+'.jpg', 
            stream_url: response.preview.url, 
            playback_count: response.plays, 
            download_count: null,
            favoritings_count: response.likes.length, 
            comment_count: null  
          };
          
          plangular.data[value] = response;
          for (var key in response) {
            self.vm.$data[key] = response[key];
          }
          self.vm.duration = response.duration / 1000;
          self.vm.track = plangular.data[value];
          player.load(plangular.data[value], self.vm.index);
        }); 
      } else {
        jsonp(apiUrl, function(error, response) {
          plangular.data[value] = response;
          for (var key in response) {
            self.vm.$data[key] = response[key];
          }
          self.vm.duration = response.duration / 1000;
          self.vm.track = plangular.data[value];
          player.load(plangular.data[value], self.vm.index);
        });
      }

    }

  }

});

Vue.component('plangular', Plangular);

