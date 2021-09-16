/*
 * 
 * Set up and launch the interactive map game from here.
 * learningMap.init is called once the page is ready.
 * You pass it an object full of configuration options, which can be
 * tailored to your needs here.
 * 
 */

$(document).ready(function() {
   learningMap.init({
      
      /* CONFIG OPTIONS FOR learningMap */
      
      //  backgroundImg is the image src for the map background, and is probably a relative path to a file, though it could be a full URL.
      backgroundImg: 'img/map_background.jpg',
      
      /* 
       The hotspotBaseURL is the stem for fetching the JSON data that matches the ids of each hotspot. 
       It can be a relative or absolute path on the same domain.
       The data returned will include the story, quiz and extras for each hotspot, individually requested.
       This needs to end in a trailing slash.
       */
      hotspotBaseURL: '/content/hotspots/',
      
      /* 
         hotspotConfig is an array of hotspot objects, each with the following properties:
         id                   = A single unique identifier without spaces, used to link area to map anchor and to a JSON data file containing the content of the hotspot. 
         imgSrc               = image path or URL for hotspot, probably a relative path + filename
         x, y                 = coordinates for position as px offsets from top-left corner of the map. These can be taken directly as layer positions from GIMP etc.
         offline              = bool, greys the hotspot out if it isn't ready yet.
         separateDialogImgSrc = use a different image for the dialog (specify path and filename)
   
         The hotspots will have HTML IDs of #hs_<id> and the JSON files containing the matching hotspot content are on
         the server under hotspotBaseURL/hs_<id>.json
         where hotspotBaseURL is as defined above and <id> matches the id name given below.
         The JSON data will probably be dynamically generated from an SQL database.
         
         Some example data is given in the comment below:
         
       */
      hotspotConfig: [
      /* 
      { id:"redhouse", imgSrc:"img/hotspots/example1.png", x:2138, y:1114, offline: true },
      { id:"greenhouse", imgSrc:"img/hotspots/example2.png", separateDialogImgSrc:"img/hotspots/example2dialog.png", x:1692, y:1112 },
      { id:"shops", imgSrc:"img/hotspots/example3.png", x:1679, y:1103 }
      */
      ],
      
       /* thoughtBubbles is an array of thought bubble objects, each with the following properties:
        x, y                  = coords are top left corner of the hotspot. These can be read off directly from GIMP or a similar image editor, if you open the background map in it.
        diameterX, diameterY  = defines the circle or oval size : These can be read off directly from GIMP elliptical select tool, or similar.
        text                  = the text that is displayed in the thought bubble when activated
        
        Some example data is given in the comment below:
       */
      thoughtBubbles: [
      /* 
         { x:1125, y:1975, diameterX: 250, diameterY:120 ,text: "Example thought 1" },
         { x:0865, y:1617, diameterX: 100, diameterY:120 ,text: "Example thought 2 etc" }
      */
      ] ,
      
      // thoughtBubblePosYOffset = num of pixels to offset thought bubble from centre on Y-axis. Depends on size of thought bubble image. 
      thoughtBubblePosYOffset: 265, 
      
      // thoughtBubbleClickYOffset = num of pixels to offset repositioning on Y-axis when a thought bubble is clicked. Allows for the height of the bubble above the hotspot area.
      thoughtBubbleClickYOffset: 130,
      
      // Fast-forward through intro zoom. You can set this to true so you don't have to sit through the slow intro zoom while testing, otherwise leave it as false.
      ffThroughIntro: false 
    }
      
   )
   
   
})
