// Brian Anderson banderson623@gmail.com
// 2008 - A little favor for BILD friends (Levi and Nate)
// For: http://testing.antiochmanifesto.org

slideo_config = {

}

var slideo_global_player_object;

Slideo = Class.create({
    config: {
        time_in_seconds:0,
        current_slide: 0,
        width: 480,
        height: 360,
        slide_div: "slideo_slides",
        slide_img: "slideo_slides_img",
        video_div: "slideo_video",
        loading_div: "slideo_loading",
        loading_content: "<p>Loading...</p>",
        flow_player_swf: "swf/FlowPlayerDark.swf",
        slide_url: null,
        timecode_url: null,  
        video_url: null,
        splash_url: null
    },
    // Private status state (please don't monkey with)
    status: {
      flow_player_ready: false,
      state: "uninitialized",
      onLoadBeginCalls: 0,
      time_check_timer: null,
      playing: false,
      slide_number: -1,
      slide_index: -1,
      max_slides: -1,
      next_slide_at: 0,
    },
    
    flow_player: null,
    slides: [],
    container_element: null,
    
    set_state: function(new_state){
        this.log("Setting state to: " + new_state)
        return this.status.state = new_state;
    },
    
    state: function(){
        return this.status.state;
    },
    
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
        // this.showSlideAtIndex(0);
        this.set_state("initialized");
        // this.log(this.config);
        return this;
    },
    
    buildInternalHtmlElements: function(){
        this.log('building slideo elements in ' + this.container_element.id);
        this.video_element = new Element('div', { 'id': this.config.video_div});
        this.slide_element = new Element('div', { 'id': this.config.slide_div});
        this.slide_image_element = new Element('img', { 'id': this.config.slide_img});
        // this.loading_element = new Element('div', { 'id': this.config.loading_div}).update(this.config.loading_content);
        this.container_element.insert({top: this.video_element});
        this.container_element.insert({bottom: this.slide_element});
        this.slide_element.insert(this.slide_image_element);
        // this.container_element.insert({bottom: this.loading_element});
    },
    
    loadFlowPlayer: function(){
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
           // controlBarBackgroundColor: 0x000000,
           controlsOverVideo: 'ease',
           controlBarGloss: 'none',
           showVolumeSlider: false,
           initialScale: 'fit',
           showOnLoadBegin: false,
           // progressBarColor1: -1,
           progressBarColor2: 0x333333,
           bufferBarColor1: 0xaaaaaa,
           bufferBarColor2: 0xaaaaaa,
           showFullScreenButton: false,
           showPlayListButtons: false,
           initialVolumePercentage: 100,
           // timeDisplayFontColor: 0x222222,
           timeDisplayFontColor: 0x999999,
           showMenu: false,   				
           splashImageFile: this.config.splash_url,
           videoFile: this.config.video_url
         }
      }
    },
    
    log:function(text){
        console.log(text);
    },
    
  
    installPlayerReadyCallback: function(){    
      window.onFlowPlayerReady = function(){
        this.log('flow player ready!');
        this.status.flow_player_ready = true;
        this.installCallBacks();
      }.bind(this)
    },
    
    
    installCallBacks: function(){
      window.onLoadBegin = function(clip){
         this.log("onLoadBegin");
         this.status.onLoadBeginCalls++;
         this.log(this.status.onLoadBeginCalls);
         // window.alert(this.status.onLoadBeginCalls);
      }.bind(this);
      
      window.onStartBuffering = function(clip){
         this.log("onStartBuffering");
         this.scrubbing();
      }.bind(this);
      
      window.onBufferFlush = function(clip){
        this.log("onBufferFlush");
      }.bind(this);
      
      window.onBufferFull = function(){
         this.log("onBufferFull");
      }.bind(this);
      
      window.onResume = window.onPlay = function(clip){ this.playing(clip);}.bind(this);
      window.onStop = window.onPause = function(clip){ this.stopped(clip);}.bind(this)
      
      // this.flow_player.getPercentLoaded()
    },
    
    // Call back hooks
    
    playing: function(clip){
      this.status.playing = true;
      this.startObservingTime();
      this.log("Playing");
    },
    
    stopped: function(clip){
      this.log("Stopped");
      this.status.playing = false
      this.stopObservingTime();      
    },
    
    scrubbing: function(){
      this.status.next_slide_at = -1;
      this.log("Scrubbing");
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
      this.setSlideForTime(time);
      this.startObservingTime();
    },
    
    setSlideForTime: function(time){
      this.log("Checking if I can set a new slide: next slide at: " + this.status.next_slide_at + " seconds.");
      if(time > this.status.next_slide_at){
        this.slide_index = this.getSlideIndexForSecond(time)
        // this.log("Switching to slide " + this.slides[this.slide_index].slide_number);
        this.showSlideAtIndex(this.slide_index);
        if(this.status.max_index > this.slide_index) {
          this.status.next_slide_at = this.slides[this.slide_index+1].second;
        }
        this.log("next slide: " + this.status.next_slide_at)
      }
    },
    
    nextSlide: function(){
      if(this.status.max_index > this.slide_index) {
        return this.slides[this.status.slide_index + 1]
      }else{
        return this.thisSlide();
      }
    },
    
    thisSlide: function(){
      return this.slides[this.status.slide_index]
    },
    
    showSlideAtIndex: function(slide_index){
      var slide_url = this.config.slide_url + "/" + this.slides[slide_index].fileName();
      
      this.slide_image_element.src = slide_url;
      
      this.log("loading slide; " + slide_url);
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
              this.log("something wasn't happy!");
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
