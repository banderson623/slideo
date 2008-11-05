// Brian Anderson banderson623@gmail.com
// 2008 - A little favor for BILD friends (Levi and Nate)
// For: http://testing.antiochmanifesto.org

var slideo_global_player_object;

Slideo = Class.create({
  
    // User configurable for slideo, these should be set as the second argument in the constructor
    config: {
        time_in_seconds:0,
        current_slide: 0,
        width: 480,
        height: 360,
        show_slide_progress_bar: true,
        slide_div: "slideo_slides",
        slide_img: "slideo_slides_img",
        slide_cache_img: "slideo_cache_img",
        video_div: "slideo_video",
        message_div: "slideo_message",
        video_splash_div: "slideo_video_splash",
        loading_content: "<p class=\"loading\">Loading</p>",
        video_unavailable: '<p class="unavailable error">Video is not available</p>',
        flow_player_swf: "swf/FlowPlayerDark.swf",
        slide_url: null,
        timecode_url: null,  
        video_url: null,
        splash_url: null,
        cache_next_image_after: 8.0, // delay in seconds
        experimental_load_percent_before_playback_can_start: 0
    },
    
    
    // Private status state (please don't monkey with)
    status: {
      flow_player_ready: false,
      state: "uninitialized",
      onLoadBeginCalls: 0,
      time_check_timer: null,
      loading_timer: null,
      playing: false,
      slide_number: -1,
      slide_index: -1,
      max_slides: -1,
      next_slide_at: 0,
      current_time: -1,
      cached_next_slide: false,
      working_cache: null,
      playback_can_start: false,
      started_loading_at: 0
    },
    
    flow_player: null,
    slides: [],
    container_element: null,
      
    initialize: function(el, configuration){
        this.log("Initalizing");
        if(valueOf(arguments[1]) != undefined ) {
          var tmp_config = $H(this.config).merge($H(arguments[1]));
          this.config = tmp_config.toObject();
        }
        this.container_element = $(el);
        
        this.buildInternalHtmlElements();
        this.loadFlowPlayer();
        this.installPlayerReadyCallback();
        return this;
    },
    
    buildInternalHtmlElements: function(){
        this.log('building slideo elements in ' + this.container_element.id);
        this.video_element = new Element('div', { 'id': this.config.video_div});
        this.slide_element = new Element('div', { 'id': this.config.slide_div});
        this.video_splash_element = new Element('img', { 'id': this.config.video_splash_div});
        
        this.slide_image_element = new Element('img', { 'id': this.config.slide_img}).hide();
        this.slide_cache_img_element = new Element('img', { 'id': this.config.slide_cache_img, "style":"display:none;"});
        this.message_element = new Element('div', { 'id': this.config.message_div}).hide();

        this.container_element.insert({top: this.video_element});
        this.container_element.insert({bottom: this.slide_element});
        this.container_element.insert({bottom: this.video_splash_element});

        this.slide_element.insert(this.slide_image_element);
        this.slide_element.insert(this.slide_cache_img_element);
        
        this.container_element.insert({bottom: this.message_element});
    },
    
    loadFlowPlayer: function(){
        this.status.started_loading_at = (new Date).getTime()
        window.slideo_api = this.flow_player = window.flashembed(this.config.video_div,  
           { src: this.config.flow_player_swf,
             width: this.config.width, 
             height: this.config.height
           },this.flowPlayerConfig());
    },
    
    // Responsible for returning a JS Object/Hash
    // for all of the flow player config
    flowPlayerConfig: function(){  
      return {
        config: {   
           autoPlay: false,
           autoBuffering: true,
           controlBarBackgroundColor: -1,
           controlsOverVideo: 'ease',
           controlBarGloss: 'none',
           showVolumeSlider: false,
           initialScale: 'fit',
           showOnLoadBegin: false,
           progressBarColor2: 0x333333,
           bufferBarColor1: 0xaaaaaa,
           bufferBarColor2: 0xaaaaaa,
           showFullScreenButton: false,
           showPlayListButtons: false,
           initialVolumePercentage: 100,
           timeDisplayFontColor: 0x999999,
           showMenu: false,   				
           // splashImageFile: this.config.splash_url,
           videoFile: this.config.video_url
         }
      }
    },
    
    message: function(text_for_message){
      this.log("Showing message: " + text_for_message)
      this.message_element.update(text_for_message).show();
    },
    
    hideMessage: function(){
      this.message_element.hide();
      this.message_element.update('');
    },
    
    log:function(text){
      try{ console.log(text);}
      catch(err){//logging not supported
      }
    },
    
  
    installPlayerReadyCallback: function(){    
      window.onFlowPlayerReady = function(){
        this.log('flow player ready!');
        this.status.flow_player_ready = true;
        this.installCallBacks();
      }.bind(this)
      

      var splash_url = this.config.splash_url
      console.log(" displaying splash: " + splash_url);
      this.video_splash_element.src = splash_url;
      // this.video_splash_element.hide();
      this.showLoading()
      
    },
    
    // 
    canStartPlayback: function(){
      this.log("Playback can start now (loaded: " + this.flow_player.getPercentLoaded() +  "%) ");
      this.hideMessage();
      this.video_splash_element.hide();
      // this.flow_player.DoPlay();
      this.log(this.flow_player.getTime());
      this.status.playback_can_start = true;
      this.log("It took " + ((new Date()).getTime() - this.status.started_loading_at)/1000 + " seconds to load before it could play");
    },
    
    showLoading: function(){
      this.message(this.config.loading_content);
      
      if(this.config.experimental_load_percent_before_playback_can_start > 0){
        var percent_load = (this.flow_player.getPercentLoaded() / this.config.experimental_load_percent_before_playback_can_start) * 100;
        if (percent_load >= 100) { percent_load = 100; }
        if (percent_load < 0 || percent_load == NaN ) { percent_load = 0; }

        try{ this.message_element.down('p').insert({bottom: " (" + Math.round(percent_load) + "%)"});}
        catch(err) {}

        if(!this.status.playback_can_start){
          this.status.show_loading_timer = setTimeout(function(){this.showLoading();}.bind(this), 250);
        } else {
          this.hideMessage();
        }
      }
    },
    
    installCallBacks: function(){
      window.onLoadBegin = function(clip){
         // this.log("onLoadBegin");
         this.status.onLoadBeginCalls++;
         this.log(this.status.onLoadBeginCalls);
         // window.alert(this.status.onLoadBeginCalls);
         if(this.status.onLoadBeginCalls >= 3 && this.status.playback_can_start == false) this.canStartPlayback();
         
      }.bind(this);
      
      window.onStartBuffering = function(clip){ this.scrubbing(); }.bind(this);
      window.onBufferFlush =    function(clip){ this.log("onBufferFlush"); }.bind(this);
      window.onBufferFull =     function(){ this.log("onBufferFull"); }.bind(this);
      window.onStreamNotFound = function(){ this.message(this.config.video_unavailable); }.bind(this);
      
      window.onResume = window.onPlay = function(clip){ this.playing(clip); }.bind(this);
      window.onStop = window.onPause =  function(clip){ this.stopped(clip); }.bind(this)
      
    },    
    playing: function(clip){
      this.status.playing = true;
      this.startObservingTime();
      this.log("Playing");
      this.hideMessage();
    },
    
    stopped: function(clip){
      this.log("Stopped");
      this.status.playing = false
      this.stopObservingTime();
      this.message("Paused");   
    },
    
    scrubbing: function(){
      this.status.next_slide_at = -1;
      // this.log("Scrubbing");
    },
    
    stopObservingTime: function(){
      clearTimeout(this.status.time_check_timer);
    },
    
    startObservingTime: function(){
      if(this.status.playing)
        this.status.time_check_timer = setTimeout(function(){this.checkTime();}.bind(this), 1000);
    },
    
    checkTime: function(){
      var time = this.flow_player.getTime();
      this.status.current_time = time;
      this.setSlideForTime(time);
      this.startObservingTime();
      this.tick();
    },
    
    tick: function(){
      // this.log("Time left on this slide: " + this.secondsRemaingForCurrentSlide());
      // this.log("loaded % " + this.flow_player.getPercentLoaded());
    },
    
    setSlideForTime: function(time){
      if(time > this.status.next_slide_at){
        var new_index = this.getSlideIndexForSecond(time)
        if(new_index >= 0) {
          this.status.slide_index = new_index;
          this.log("Switching to slide " + this.slides[this.status.slide_index].slide_number);
          this.showSlideAtIndex(this.status.slide_index);
          if(this.status.max_index > this.status.slide_index) {
            this.status.next_slide_at = this.slides[this.status.slide_index+1].second;
          }
          this.log("next slide: " + this.status.next_slide_at)
        } else {
          this.log("NO SLIDE ADVANCED: Got " + new_index + " back from getSlideIndexForSecond with a time value of: " + time);
        }
      }
    },
      
    nextSlide: function(){
      if(!this.atLastSlide()) {
        return this.slides[this.status.slide_index + 1]
      }else{
        return this.thisSlide();
      }
    },
    
    thisSlide: function(){
      return this.slides[this.status.slide_index]
    },
    
    atLastSlide:function(){
      return (this.slide_index >= this.status.max_index)
    },
    
    showSlideAtIndex: function(slide_index){
      var slide_url = this.config.slide_url + "/" + this.slides[slide_index].fileName();
      this.slide_image_element.src = slide_url;
      this.slide_image_element.show();
      this.cacheSlideAtIndex(slide_index + 1);
      this.log("loading slide; " + slide_url);
    },

    cacheSlideAtIndex: function(index){
      // clearTimeout(this.status.working_cache);
      // if(index <= this.status.max_index){
      //   this.status.working_cache = setTimeout(function(){
      //     this.log('cached slide ' + this.slides[index].slide_number);
      //     this.slide_cache_img_element.src = this.config.slide_url + "/" + this.slides[index].fileName();
      //   }.bind(this), (this.config.cache_next_image_after * 1000));
      // }
    },
    
    updateSlideProgressBar: function(){
      if(this.config.show_slide_progress_bar){
      }
    },
    
    secondsRemaingForCurrentSlide: function(){
      if(this.status.next_slide_at >= 0){
        return this.status.next_slide_at - this.status.current_time;
      } else {
        return -1
      }
    },
    
    
    getSlideIndexForSecond: function(second){
        for(var i = (this.slides.length - 1); i >= 0; i--){            
            if(this.slides[i].second <= second){
                return i
            }
        }
        return -1;
    },
    
    setSlideTimingsFromURL: function(url){
        this.log("Setting timecode from XHR (" + url + ")");
        new Ajax.Request(url, {
          method: 'get',
          onSuccess: function(transport) {
              this.setSlideTimingsFromArrayOfTimeCodes(transport.responseText.split("\n"));
          }.bind(this),
          onFailure: function(transport){
              this.log("Could not load the slide timings");
              this.message("<p>Could not load slide timings</p>")
          }
        });
    },
    
    setSlideTimingsFromArrayOfTimeCodes: function(time_code_array){
        this.log("Setting timecodes from array");
        for(var i=0; i <= (time_code_array.length - 1); ++i){
            var ss = new SlideoSlide;
            ss.time_code = time_code_array[i];
            ss.second = this.timeCodeToSeconds(time_code_array[i]);
            ss.slide_number = i + 1; // levi starts at 1 on the files
            if(ss.second != NaN) this.slides.push(ss);
            // this.log("Slide " + ss.slide_number + " starts at " + ss.second);          
        }
        this.status.max_slides = i - 1;
        this.status.max_index = i;
        this.log("Slide count: " + i);

        this.showSlideAtIndex(0);
        this.cacheSlideAtIndex(1);
    },
    
    timeCodeToSeconds: function(timecode_string){
        var time_array = timecode_string.split(":").reverse();
        var seconds = parseInt(time_array[0], 10);
        seconds += parseInt(time_array[1],10) * 60;
        if(time_array[2] != undefined) {
            seconds += parseInt(time_array[2], 10) * 60;
        }
        return seconds;
    }
    
    
    
    
});

SlideoSlide = Class.create({
    timecode: "",
    second: 0,
    slide_number: 0,
    
    initialize: function(){
        
    },
    
    fileName: function(){
       return "Slide"+ this.leftPadWithZeros(this.slide_number,2) +".png"; 
    },
    
    leftPadWithZeros: function(number,width){
        var string_number = ""+number;
        var delta = width - (string_number).length;
        for(delta; delta > 0; delta--){
            string_number = "0" + string_number;
        }
        return string_number;
    }
    
});
