// Brian Anderson banderson623@gmail.com
// 2008 - A little favor for BILD friends (Levi and Nate)
// For: http://testing.antiochmanifesto.org

slideo_config = {

}

var time_code = new Array(  "00:00:00",
                            "00:00:54",
                            "00:03:15",
                            "00:05:26",
                            "00:06:15",
                            "00:06:39",
                            "00:09:30",
                            "00:10:24",
                            "00:11:21",
                            "00:12:30",
                            "00:13:15",
                            "00:17:49",
                            "00:19:48",
                            "00:20:24",
                            "00:20:40",
                            "00:21:26",
                            "00:22:01",
                            "00:23:21",
                            "00:27:12")



Slideo = Class.create({
    config: {
        time_in_seconds:0,
        current_slide: 0,
        width: 480,
        height: 360,
        state: "uninitialized",
        slide_div: "slideo_slides",
        video_div: "slideo_video",
        loading_div: "slideo_loading",
        loading_content: "<p>Loading...</p>",
        flow_player_swf: "swf/FlowPlayerDark.swf",
        slide_url: null,
        timecode_url: null,  
        video_url: null,
        splash_url: null
    },
    status: {
      flow_player_ready: false
    },
    flow_player: null,
    slides: [],
    container_element: null,
    
    set_state: function(new_state){
        this.log("Setting state to: " + new_state)
        return this.config.state = new_state;
    },
    
    state: function(){
        return this.config.state;
    },
    
    initialize: function(el, configuration){
        this.log("Initalizing");
        if(valueOf(arguments[1]) != undefined ) {
          var tmp_config = $H(this.config).merge($H(arguments[1]));
          this.config = tmp_config.toObject();
          // this.config = $H(this.config).merge($H(arguments[1]));
        }
        this.container_element = $(el);
        // this.log(this.config.inspect());
        
        this.buildInternalHtmlElements();
        this.loadFlowPlayer();
        
        this.set_state("initialized");
        this.log(this.config);
        return this;
    },
    
    buildInternalHtmlElements: function(){
        this.log('building slideo elements in ' + this.container_element.id);
        this.video_element = new Element('div', { 'id': this.config.video_div});
        this.slide_element = new Element('div', { 'id': this.config.slide_div});
        this.loading_element = new Element('div', { 'id': this.config.loading_div}).update(this.config.loading_content);
        this.container_element.insert({top: this.video_element});
        this.container_element.insert({bottom: this.slide_element});
        this.container_element.insert({bottom: this.loading_element});
    },
    
    loadFlowPlayer: function(){
        this.flow_player = flashembed(this.config.video_div,  
           { src: this.config.flow_player_swf,
             width: this.config.width, 
             height: this.config.height
           },this.flowPlayerConfig());
           
       window.onFlowPlayerReady = function(){
         console.log('flow player ready!');
         this.status.flow_player_ready = true;
       }.bind(this)

       window.onStartBuffering = function(clip){
        if(this.status.flow_player_ready)
          console.log("Buffer is ready to play");
       }.bind(this)
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
           progressBarColor1: -1,
           progressBarColor2: 0x333333,
           bufferBarColor1: 0xaaaaaa,
           bufferBarColor2: 0xaaaaaa,
           showFullScreenButton: false,
           showPlayListButtons: false,
           timeDisplayFontColor: 0x222222,
           showMenu: false,   				
           splashImageFile: this.config.splash_url,
           videoFile: this.config.video_url
         }
      }
    },
    
    log:function(text){
        // console.log(text);
    },
    
    getSlideForSecond: function(second){
        for(var i = (this.slides.length - 1); i >= 0; i--){            
            if(this.slides[i].second <= second){
                return this.slides[i].slide_number;
            }
        }
        return -1;
    },
    
    setSlideTimingsFromURL: function(url){
        // url = "file:///Users/brian_anderson/Sites/slideo/" + url;
        // url = "http://theameswell.com/bild/slideo/content/timecode/concept-0.txt";
        this.log("Setting timecode from XHR (" + url + ")");
        new Ajax.Request(url, {
          method: 'get',
          onSuccess: function(transport) {
              this.log("Got timecodes!");
              this.log(transport.responseText.split("\n"));
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
            this.log("Slide " + ss.slide_number + " starts at " + ss.second);          
        }
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


// function onFlowPlayerReady(clip) {
//  
// }
// onPlay = function (clip) {
//  console.log("playing")
// }
// onPause = function(clip){
//  console.log("Paused")
// }
// onResume = function(clip){
//  console.log("resumed")
// }
// onCuePoint = function(cue_point){
//  console.log(cue_point);
// }

// var the_player = new Slideo;
// the_player.setSlideTimingsFromArrayOfTimeCodes(time_code);

// console.log(the_player.slides[0].fileName());
// console.log(the_player.slides[12].fileName());
// 
// console.log(" 0 " + the_player.getSlideForSecond(0));
// console.log(" 1 " + the_player.getSlideForSecond(1));
// console.log("60 " + the_player.getSlideForSecond(60));