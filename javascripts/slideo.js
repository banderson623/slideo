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
    internal_config: {
        time_in_seconds:0,
        current_slide: 0,
        state: "uninitialized",
        slide_div: "slideo_slides",
        video_div: "slideo_video",
    },
    slides: [],
    user_config: {},
    container_element: null,
    
    set_state: function(new_state){
        this.log("Setting state to: " + new_state)
        return this.internal_config.state = new_state;
    },
    
    state: function(){
        return this.internal_config.state;
    },
    
    initialize: function(el, configuration){
        this.log("Initalizing");
        if(valueOf(arguments[1]) != undefined ) this.user_config = arguments[1];
        this.container_element = $(el);
        
        this.buildInternalHtmlElements();
        
        this.set_state("initialized");
        this.log(this.user_config);
        return this;
    },
    
    buildInternalHtmlElements: function(){
        this.log('building slideo elements in ' + this.container_element.id);
        this.video_element = new Element('div', { 'id': this.internal_config.video_div});
        this.slide_element = new Element('div', { 'id': this.internal_config.slide_div});
        this.container_element.insert({top: this.video_element});
        this.container_element.insert({bottom: this.slide_element});
    },
    
    loadFlowPlayer: function(){
        
    },
    
    log:function(text){
        console.log(text);
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
              console.log("Got timecodes!");
              console.log(transport.responseText.split("\n"));
              this.setSlideTimingsFromArrayOfTimeCodes(transport.responseText.split("\n"));
          }.bind(this),
          onFailure: function(transport){
              console.log("something wasn't happy!");
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

// var the_player = new Slideo;
// the_player.setSlideTimingsFromArrayOfTimeCodes(time_code);

// console.log(the_player.slides[0].fileName());
// console.log(the_player.slides[12].fileName());
// 
// console.log(" 0 " + the_player.getSlideForSecond(0));
// console.log(" 1 " + the_player.getSlideForSecond(1));
// console.log("60 " + the_player.getSlideForSecond(60));