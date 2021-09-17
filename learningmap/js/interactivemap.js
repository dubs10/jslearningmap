/* 
 * Interactive Learning map 1.6
 * by Howard Richardson
 * www.sqtl.co.uk
 * 
 * Released under CC-NC licence
 * https://creativecommons.org/licenses/by-nc/2.0/
 * 
 * 
  Version history: 
      1.0 : original TLDR launch release
      1.1 : added error buzz, fading status change message box, three audio modes instead of plain muting, narration start and pause controls, fixed zoom controls bug where they disappeared, better JSON-load fail / house offline handling, 
      some visual and aesthetic tweaks, standardised on camelCase for vars and funcs.
      1.2 : Added in optional fifth sponsor tab with logo and panel text 
      1.3 : Optional configurable thought bubbles that appear on mouse hover and zoom to visibility when clicked
      1.4 : Separated out more configurable common stuff. Moved icons to icon font instead of emojis. Some renaming of things. Small bugfixes and improvements to vimeo integration.
      1.5 : Rationalized a lot of the naming. Removed more propriatory stuff. Removed unnecessary database fields.
      1.6 : Prepared everything for first public github release.
  
  
  To do / ideas:
  
  - Better mobile compatibility. There are scrolling glitches currently. Also quiz requires double taps. It's useable but a bit messy sometimes.
  - Consolodate more hard-coded options into the config 
  - Abstract out some more common behaviours
  
  
  - Standardise variable, function and property naming conventions
      - All CSS : lowercase_with_underscores
      - All variables and functions : camelCase
      - All HTML IDs : lowercase_with_underscores
  
  */

var learningMap = (function() {
   var globalOptions = {} // holds the config options passed in for easy access
   
   // Places to store various map objects, dimensions etc
   var $container
   var $map
   var viewportW, viewportH
   var mapW, mapH
   var mapGSAPObj = {}
   var overlayScrollableWindow
   
   var vimeoPlayer
   
   // Timers used in the game
   var thoughtBubbleTimer

   // Events used in the game
   var event = new Event('tab_switched') // when a tab is switched inside the hotspot pop-up window
   
   // Timelines used in the game:
   var hotspotAnimation = new TimelineMax({paused:true})
   var introAnimation = new TimelineMax({paused:true})
   var zoomAnimation = new TimelineMax({paused:true})
   
   // Audio howls used in the game
   var bgmusic = new Howl({
      src: ['audio/bgmusic.mp3'],
      volume: 0.2,
      loop: true,
      onload: function(){
         $('#loading').removeClass('waitforload')
         console.log('BG music loaded')
      },
      onplayerror: function(){alert('Error starting background music :(');}
      })
   $('#loading').addClass('waitforload'); // wait for music to load
   var voiceover = new Howl({
      src: ['audio/introvoice.mp3'],
      volume: 0.4
      })
   var errorsound = new Howl({
      src: ['audio/buzzer.wav'],
      volume: 0.3
   });

  
     
   // States the game can be in:
   var zoomScale = 1
   var zoomLevel = 0
   var audioMode = 2
   var hotspotResponse = false; // current state of whether hotspots are responding to clicks
   var hotspotNarrationPlaying = false // current state of hotspot narration. false = paused
   var clickEvent = 'click'; // We use this value to bind to all events where we want to detect a simple click. This starts as click event, but if the game is started with a touch event on the start button, it becomes "touchend". This allows a simple choice of touchscreen or mouse control at the start.
 
   
   
   // Now come the functions the game uses:
   
   var initialiseHotspots = function () {
      // Loads in hotspot images from config data
      // Each hotspot has image filename, id, x & y coordinates
      // Do these in reverse order from how they were exported and then they stack on top of each other properly
      
      globalOptions.hotspotConfig.reverse().forEach( function(h) {
         var myImage = new Image()
         $(myImage).on('load', function(){$(this).removeClass('waitforload')})
         myImage.src = h.imgSrc
         myImage.id = 'hs_'+h.id
         myImage.style.left = h.x+'px'
         myImage.style.top = h.y+'px'
         $(myImage).addClass(['hotspot waitforload'])
         if (h.offline) {
            $(myImage).addClass(['work_in_progress'])
         }
         myImage.dataset.name = h.name
         if (typeof(h.separateDialogImgSrc) !== 'undefined') {
            myImage.dataset.separateDialogImgSrc = h.separateDialogImgSrc
         }
         myImage.alt ='Hotspot for '+h.id
         $('#map .hotspot_container').append(myImage)
      } )

   }
   
   var initialiseThoughtBubbles = function () {
      // Set up a circular hotspot for a thought bubble with the given config
      // Our circle is actually a square div with 100% rounded corners, done with CSS
       
      globalOptions.thoughtBubbles.forEach(
         function(t) {
            var triggerDiv = $('<div/>')
               .addClass('thought_bubble_trigger')
               .css( {'top': t.y+'px', 
                  'left': t.x+'px', 
                  'width': t.diameterX+'px', 
                  'height': t.diameterY+'px'} )
               .attr("data-thought", t.text)
               .attr("data-posX", t.x+( t.diameterX / 2 )) // calculate display position of the trigger spot 
               .attr("data-posY", t.y-(globalOptions.thoughtBubblePosYOffset )) //  vertical offset for bubble positioning
            $('#map .hotspot_container').append(triggerDiv)
         }
      )
   }
   
   var initialiseBackground = function (src){
      // Load background image into memory, set on #map, then remove the waitclass so game can start
      $('#map').addClass('waitforload')
      var bgImg = new Image()
      bgImg.onload = function(){
         $('#map').css('backgroundImage', 'url(' + bgImg.src + ')')
         $('#map').removeClass('waitforload')
      }
      bgImg.src = src
   }
   
   
   function displayStatusChangeBox(msg, icon) {
      $('#status_change_overlay .message').html(msg)
      $('#status_change_overlay .icon').html(icon)      
      // show then fade out status change message...
      $('#status_change_overlay').stop(true,true).show().delay(3000).fadeOut(1500) 
   }
   
   function waitForThenDo( waitFunction, doFunction) {
       if(!waitFunction()) {
            window.setTimeout(function(){waitForThenDo(waitFunction, doFunction)}, 300); /* this checks the flag every 300 milliseconds*/
         } else {
            window.setTimeout(doFunction)
         }
   }
   
   
   function updateZoomScale() {
      // Update the global zoomScale var to reflect current state after animation
         mapGSAPObj.applyBounds(); 
        try { // this will fail if no transform has been performed yet
            var gs_scale = $('#zoom_container')[0]._gsTransform.scaleX
            zoomScale = 1 / gs_scale
         } catch(error) {
            zoomScale = 1
         } 
         console.log('level: '+zoomLevel+', scale:'+zoomScale)
   }
   
   function narrationPlaybackToggle() {
      if (hotspotNarrationPlaying) {
         voiceover.pause()
         $("#overlay_narration_controls").html('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM10.622 8.415l4.879 3.252a.4.4 0 0 1 0 .666l-4.88 3.252a.4.4 0 0 1-.621-.332V8.747a.4.4 0 0 1 .622-.332z"/></svg>')
         hotspotNarrationPlaying = false
      } else {
         voiceover.play()
         $("#overlay_narration_controls").html('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9 9h2v6H9V9zm4 0h2v6h-2V9z"/></svg>')
         hotspotNarrationPlaying = true
      }
   }

   function forceStopNarration() {
      hotspotNarrationPlaying = true // even if it's not, so we can retoggle it next :)
      narrationPlaybackToggle()
   }
      
   var zoomOut = function(e) {
         if ( typeof(e) != 'undefined' ) {
            e.preventDefault(); // stop double taps from zooming on mobile
         }
         zoomLevel++
         if ( zoomLevel > 4 ) {
            zoomLevel = 4; // max zoom 4
         }
         $('#zoom_buttons button').removeClass('greyout')
         if ( zoomLevel == 4 ) {
            $('#zoom_buttons #zoom_out').addClass('greyout')
         } 
         zoomAnimation.tweenTo( zoomLevel , {ease: Power2.easeInout, onComplete: updateZoomScale } )
   }
   
   var zoomIn = function(e){ 
         if ( typeof(e) != 'undefined' ) {
            e.preventDefault(); // stop double taps from zooming on mobile
         }
         zoomLevel--
         if ( zoomLevel < 0 ) {
            zoomLevel = 0; // min zoom 0
         } 
         $('#zoom_buttons button').removeClass('greyout')
         if ( zoomLevel == 0 ) {
            $('#zoom_buttons #zoom_in').addClass('greyout')
         } 
         
         zoomAnimation.tweenTo( zoomLevel,  {ease: Power2.easeInout, onComplete: updateZoomScale } )
   }
   
   var switchAudioMode = function(e) {
      const audioSymbols = [ "volume_off",  "record_voice_over", "volume_up"  ] // icons for audio modes, taken from Google Material Icons font. Use name of icon.
      const audioModeDescriptions = [ "All sound muted", "Voiceover only", "Music & voiceover on"]
      
      // Change audio mode in loop: 2, 1, 0
      audioMode = audioMode - 1
      if ( audioMode == -1 ) audioMode = 2
      console.log("Audio mode:"+audioMode)
      $('#audio_mode_toggle').html(audioSymbols[audioMode]) 

      // show then fade out status change message...
      displayStatusChangeBox( audioModeDescriptions[audioMode], audioSymbols[audioMode] )
      switch (audioMode) {
         case 2:
            bgmusic.mute(false)
            voiceover.mute(false)
            Howler.mute(false)
            $("#overlay_narration_controls").show()
            $("#overlay_title").removeClass('muted')
            break;
         case 1:
            bgmusic.mute(true)
            break;
         case 0:
            bgmusic.mute(true)
            voiceover.mute(true)
            Howler.mute(true)
            $("#overlay_narration_controls").hide()
            $("#overlay_title").addClass('muted')
            break;
         default:
      }
   }
   
   var initialiseField = function () {
      // This fires at the end of the main intro to initialise all the handlers and vars for the playing field ready for user interaction
      
      
      $(".hotspot").click(hotspotHandler) // we want clicks here always, not touch events, so they don't get triggered on drag too
      $(".thought_bubble_trigger").hover(thoughtBubbleHandler).click(thoughtClickHandler)
      hotspotResponse = true;  // Turn on hotspots 
      mapGSAPObj.enable(); // Turn on map dragging
      zoomAnimation.set('#zoom_container', {scale: 1}, 0 )
      .addLabel('fullzoom')
      .to('#zoom_container', 4, {scale: 0.3, ease: Power1.easeOut } )
      .addLabel('zoomed_out')
      
      // Set up zoom buttons:
      $('#zoom_out').on(clickEvent, zoomOut)
      $('#zoom_in').on(clickEvent, zoomIn)
      $('#audio_mode_toggle').on(clickEvent, switchAudioMode)
      // Set up zooming with mousewheel:
      $('#zoom_container').on('mousewheel', function(event) {
         console.log(event.deltaY)
         if (event.deltaY < 0 ) {
            zoomOut()
         }
         if (event.deltaY > 0) {
            zoomIn()
         }
      })

      $('#zoom_buttons').show()
     
   }
   
   
  var selectTab = function(tabNumber) {
     // make tab visible, all others hidden. Update draggable boundaries.
         $('.overlay_scrollable_content').hide()
         $('#tab_'+tabNumber).show()
         $('#overlay_tab_switcher a').removeClass('active'); 
         $(`#overlay_tab_switcher a[data-tab=${tabNumber}]`).addClass('active'); // apply active class to tab selector for  border highlight
         overlayScrolllableContent[tabNumber - 1].update(true); // our counting starts at one, arrays start at zero
   }
   
   /* 
    * Game starts here with the Introduction 
     
    */
   

   
   
   var initialiseGame = function() {
      
      console.log('Started init game')
      mapW=$map.width()
      mapH=$map.height()
      
     
      // Define intro animation:
      introAnimation.set('#map', { x:(mapW-viewportW)/-2, y:(mapH-viewportH)/-2, scale:0.2, autoAlpha: 0 })
      introAnimation.add(function(){bgmusic.play(); voiceover.play();})
      introAnimation.to('#map',6, {autoAlpha: 1},2)
      introAnimation.to('#map',15, { scale: 1, ease: Power1.easeInOut}, '-=4')
      introAnimation.add(initialiseField, '=-4')
      //.add(function(){bgmusic.fade(0.2,0.03,5000)},29); // fade down music after a bit
      if (globalOptions.ffThroughIntro) {
         // If fast-forward through intro set, speed this up (for development)
         introAnimation.timeScale(10); 
      }
      // Fade out the loader, remove the spinner, add start button which fires intro animation
      $("#loading .spinner").remove()
      $("#loading p").html('Ready to go!')
      $("#loading").append('<button id="startbutton">Start</button>')
      $("#startbutton").bind('touchend',function(e){
         //$('#viewport')[0].requestFullscreen(); // not yet a good idea to play it fullscreen. TODO? make all dimensions for zooming, intro, etc work in a fullscreen mode too
         e.preventDefault()
         clickEvent = 'touchend'; // switch from clicks to touchscreen touch in the game
         $("#loading").fadeOut(500, function(){introAnimation.play();})
      }
      )
      $("#startbutton").on('click',function(e){
         // This is a fallback for screens without touch events
         
         
         //$('#viewport')[0].requestFullscreen(); // not yet a good idea to play it fullscreen. TODO? make all dimensions for zooming, intro, etc work in a fullscreen mode too
         $("#loading").fadeOut(500, function(){introAnimation.play();})
      }
      )
            
      // Make the scrollable hotspot window draggable, with mousewheel support :
      overlayScrolllableContent=Draggable.create('.overlay_scrollable_content', {
            type: 'y',
            bounds: '#overlay_scrollable_window',
            throwProps: true
         })
      
       $('.overlay_scrollable_content').on('mousewheel', function(event) {
          
          function imposeTabBoundaries() {
             /* this imposes scroll boundaries on all tabs. It is indiscriminite, so we don't need to
              know which tab it was we are scrolling*/
             overlayScrolllableContent.forEach(function(tab){tab.update(true);})
          }
          
          // Simple scrollwheel handling, adds or subtracts 40px from position each time, plus does an update to impose boundaries
          if (event.deltaY < 0 ) {
            TweenLite.set($(this), {y:'-=40', onComplete:imposeTabBoundaries})
         }
         if (event.deltaY > 0) {
            TweenLite.set($(this), {y:'+=40', onComplete:imposeTabBoundaries});            
         }
          
      })
       
      // Set up commonly used click and touch handlers. Do this once and the same objects are reused each time.
      // Modal: Set up close button and prevent screen dragging for modal dialog
      $("#overlay_dialog .close").on(clickEvent, closeDialog)
      $("#overlay_narration_controls").on(clickEvent, narrationPlaybackToggle)

               
      /* Action for tab switcher being clicked = switch tab, trigger corresponding event*/
       $('#overlay_tab_switcher .tab_switcher').on(clickEvent, function(e){
          e.preventDefault(); // don't need the bubbling.
          if(!($(this).hasClass('active'))) { // if tab clicked not already active
            var tabNumber = $(this).data('tab')
            tabNumber = parseInt(tabNumber); 
            selectTab(tabNumber)
            $('#overlay_tab_switcher').trigger('tab_switched')
          }
       }
      )
       
   }
      
   
   
   /* closeDialog undoes the dialog animation and changes*/
   var closeDialog = function() {
      $('#zoom_buttons').fadeIn(500)
      if (typeof vimeoPlayer !== 'undefined') {
         vimeoPlayer.pause()
      }
      /* Seek to the point where the dialog box is fully open (in case it's not there yet)
      and then unpause to trigger the close dialog animation. */
      hotspotAnimation.seek('dialogopen').resume()
      return true
   }

   var getOffset = function(element) {
      // return element's offset relative to document
      var bound = element.getBoundingClientRect()
      var html = document.documentElement

      return {
         top: bound.top + window.pageYOffset - html.clientTop,
         left: bound.left + window.pageXOffset - html.clientLeft
      }
   }


   var getMapPosition = function() {
      var result = { left: 0, top: 0 }
      result.left = -$map[0]._gsTransform.x
      result.top = -$map[0]._gsTransform.y
      return result
   }
   

   var makeHotspotContent = function(rawContent) {
   /* Given a JSON object of raw content data we have AJAX fetched from the server, turn it into HTML for our hotspot modal dialog.
    * This will involve doing some basic wrapping and processing.
    * We pass back an array of 4 tabs, each containing HTML to be injected into the modal dialog.
    */
      
      
         var out=new Array()
         /* Process the quiz data. Answers need to be given the CSS class 'answer' to make them blurred and click-to-reveal.
          * The text for the quiz is supplied as HTML but with the answers encapsulated by double-brackets.
          * At the time of writing this was an expedience, easier than coding an editor
          * adaptation to implement this inside the editor.
          * We will need to globally replace these double square brackets code to assign it the CSS class we want.
          * This gets a little messy sometimes. The current replacements are tailored for HTML output from CKEditor.
          * https://ckeditor.com/
          * TODO: improve this to allow easier quiz writing without this double-bracket hack
          */
       
         rawContent.quiz = rawContent.quiz.replace(/<p>(\s|&nbsp;)*\[\[(\s|&nbsp;)*<\/p>/g,"<span class='answer'>"); // replace empty paragraphs with brackets
         rawContent.quiz = rawContent.quiz.replace(/<p>(\s|&nbsp;)*\]\](\s|&nbsp;)*<\/p>/g,"</span>");   // more empty paragraphs
         rawContent.quiz = rawContent.quiz.replace(/\[\[/g,"<span class='answer'>")
         rawContent.quiz = rawContent.quiz.replace(/\]\]\]/g,"]</span>");   // sometimes you get three brackets in a row
         rawContent.quiz = rawContent.quiz.replace(/\]\]/g,"</span>")
         var templateInhabitants = `
         <ul class="inhabitants">
            ${rawContent.inhabitants.map(
               i=>`<li>
                     <img src="content/people/${i.image}" alt="">
                     <div class="description">
                        <h4>${i.name}</h4>
                        <p>${i.description}</p>
                     </div>
                  </li>`
            ).join('\n')}
         </ul>
         `
         
         var templateStory = 
         `<div class="story">
            ${rawContent.story}
         </div>
         `
         
         var templateQuiz = 
         `<div class="quiz">
            ${rawContent.quiz}
         </div>
         `
         
         
         var templateVimeo = false
         
         if (rawContent.video != '0') {
            templateVimeo = `<div class="vimeo">
               <iframe src="https://player.vimeo.com/video/${rawContent.video}" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
            </div>
            `
         } 
         
         var templateSponsor          
         if (rawContent.sponsorName.length > 0) {
            templateSponsor = `<div class="sponsor_text">
            <div class="inline_sponsor_logo"><img src="uploads/${rawContent.sponsorLogo}" alt="Sponsor's Logo"></div>
            ${rawContent.sponsorText}
         </div>
         `
         }
         
         out[1] = templateInhabitants
         out[2] = templateStory
         out[3] = templateQuiz
         if (templateVimeo) out[4] = templateVimeo
         if (rawContent.sponsorName.length > 0) {
            out[5] = templateSponsor
         }

         return out
   }
   
   var thoughtBubbleHandler = function(event) {
      switch (event.type) {
         case 'mouseenter':
                  clearTimeout(thoughtBubbleTimer)
                  var myThought = event.target.dataset.thought
                  var posX = event.target.dataset.posx
                  var posY = event.target.dataset.posy
                  $('#thought_bubble_container .inner').html(myThought)
                  $('#thought_bubble_container').css({'top': posY+'px', 'left': posX+'px'}).fadeIn(200)
            break;
         case 'mouseleave':
            thoughtBubbleTimer = setTimeout(function(){
           $('#thought_bubble_container').fadeOut(200)
            }, 500) // Put this on a delayed timer so that small accidental mouseouts don't trigger
            break;
         default:
      }

   }
   
   var thoughtClickHandler  = function(event) {
      // This is a single animation to zoom in and centre on a thought hotspot. It reuses code from the main hotspot handler. 

      // Compose the animation to zoom to centre on hotspot
      hotspotAnimation.clear() // discard any previous movement animation
      var hotspotRelPos = getOffset(this) // hotspot position relative to viewport
      var hotspotH = this.getBoundingClientRect().height // get hotspot dimensions
      var hotspotW = this.getBoundingClientRect().width
      var relX = hotspotRelPos.left + hotspotW / 2 // set x and y to centre point of hotspot relative to viewport
      var relY = hotspotRelPos.top + hotspotH / 2
      var mapPos = getMapPosition() // get map current scrolled position
      var hotspotAbsX = mapPos.left + relX // Find absolute position of centre of hotspot on the map by adding the hotspot relative location to the scrolled location of the map
      var hotspotAbsY = mapPos.top + relY
      // next we find the centre of the screen by dividing the viewport in half
      var centreScreenX = viewportW / 2
      var centreScreenY = viewportH / 2

      // the difference between (x,y) and (centreX,centreY) is the relative movement we have to make to the map to move the hotspot into the centre of the screen
      
      updateZoomScale() // in case we are half-way through a zoom already
      var toX = "+=" + (centreScreenX - relX) * zoomScale; // set relative movement
      var toY = "+=" + ((( centreScreenY - relY) * zoomScale ) + globalOptions.thoughtBubbleClickYOffset )
      
      // Scale transforms have to originate from the absolute centre of the hotspot
      var toTO = hotspotAbsX + "px " + hotspotAbsY + "px"
      console.log ('Thought at: x:'+relX+' y:'+relY+'\nViewport size: w:'+viewportW+' h:'+viewportH+'\nZoom to: x:'+toX+' y:'+toY); //debug
      hotspotAnimation.to($map, 1, {x: toX, y: toY }, 0).play()
      zoomLevel = 0; // now zoom all the way in
      zoomAnimation.tweenTo('fullzoom', {ease: Power2.easeInout, onComplete: function(){
         $('#zoom_buttons button').removeClass('greyout')
         $('#zoom_buttons #zoom_in').addClass('greyout'); // make buttons reflect this
         updateZoomScale()
      } }).duration(1.5)
   }

   
   
   var hotspotHandler = function(event) {
      
      if (hotspotResponse == false) return
      hotspotResponse = false; // Only one hotspot clickable at a time 
      updateZoomScale(); // in case we were in the middle of a zoom when clicked
 
      
      // Load in content for the window
      // Content comes from div named after the hotspot id
      $("#overlay_title, #overlay_main_img, .overlay_scrollable_content").empty(); 
      $("#overlay_main_img").empty()
      var thisHotspotID = this.id
      var $dialogImg, separateDialogImg 
      separateDialogImgSrc = $(this).data('separateDialogImgSrc')
      if (typeof(separateDialogImg) !== 'undefined') {
         $dialogImg = $('<img alt =\'Image of hotspot\' src="'+ separateDialogImgSrc +'">')
      } else {
         $dialogImg = $(this).clone()
      }
      $dialogImg.appendTo( "#overlay_main_img" ); // 
      
     
      
      // Now compose the animation to zoom to and bring in the window 
      var hotspotRelPos = getOffset(this) // hotspot position relative to viewport
      var hotspotH = this.getBoundingClientRect().height // get hotspot dimensions
      var hotspotW = this.getBoundingClientRect().width
      var relX = hotspotRelPos.left + hotspotW / 2 // set x and y to centre point of hotspot relative to viewport
      var relY = hotspotRelPos.top + hotspotH / 2
      var mapPos = getMapPosition(); // get map current scrolled position
      var hotspotAbsX = mapPos.left + relX; // Find absolute position of centre of hotspot on the map by adding the hotspot relative location to the scrolled location of the map
      var hotspotAbsY = mapPos.top + relY
      // next we find the centre of the screen by dividing the viewport in half
      var centreScreenX = viewportW / 2
      var centreScreenY = viewportH / 2

      // the difference between (x,y) and (centreX,centreY) is the relative movement we have to make to the map to move the hotspot into the centre of the screen
      updateZoomScale()
      var toX = "+=" + (centreScreenX - relX) * zoomScale; // set relative movement
      var toY = "+=" + (centreScreenY - relY) * zoomScale
            
      // Scale transforms have to originate from the absolute centre of the hotspot
      var toTO = hotspotAbsX + "px " + hotspotAbsY + "px"
      //  console.log ('Hotspot at: x:'+relX+' y:'+relY+'\nViewport size: w:'+viewportW+' h:'+viewportH+'\nZoom to: x:'+toX+' y:'+toY); //debug
      hotspotAnimation.clear(); // discard any previous animation
     
      

      // Load in data for hotspot from JSON file and fire the animation when ready
      $.getJSON( hotspotBaseURL+this.id+".json", function( data ) {
         $("#zoom_buttons").hide()
         var titleHTML = "<h2>"+data.placeName+"</h2>"
         $("#overlay_title").append(titleHTML)
         if (data.subtitle !== null) {
            $('#overlay_title').append(`<h4>${data.subtitle}</h4>`)
         }
         var hotspotContent = makeHotspotContent(data)
         // We get the content back as an array of tabs of HTML. Load the HTML into each tab...
         $(hotspotContent[1]).appendTo( "#tab_1" )
         $(hotspotContent[2]).appendTo( "#tab_2" )
         $(hotspotContent[3]).appendTo( "#tab_3" )
         if (hotspotContent[4]) {
            $(hotspotContent[4]).appendTo( "#tab_4" )
            $("#discussion_tile").show()
         } else {
            $("#discussion_tile").hide() // TODO: if this tile is hidden we should reposition the other tiles to even out the whitespace. Ideally this should count the tabs and calculate an offset.
         }
         if (hotspotContent[5]) {
            $(hotspotContent[5]).appendTo( "#tab_5" )
         }
         
         /* If we have a sponsor then set this up. It's optional so we want this hidden if not set. There is an additional positioning class that accounts for the difference vertically with the extra sponsor tile. */
         $("#sponsor_tile").empty().hide() // start fresh each time
         if (undefined !== data.sponsorLogo && data.sponsorLogo.length) {
            $('#overlay_title').append(`<h5>This story was created with the help of <a href="#" id="sponsor_crosslink">${data.sponsorName}</a>.</h5>`)
            $('#sponsor_crosslink').on(clickEvent, function(){selectTab(5)}) // make the link do the same as selecting the sponsor logo tile
            var sponsorLogo = $('<img alt="Sponsor\'s Logo">').attr('src',`uploads/${data.sponsorLogo}`)
            $("#sponsor_tile").append(sponsorLogo).show()
            $("#overlay_tab_switcher").addClass('has_sponsor')
         } else {
            $("#overlay_tab_switcher").removeClass('has_sponsor')
         }
         
         // Set up answer tap-to-reveal 
         
         /* 
            Todo: on mobile this requires a double tap. Single tap (by changing 'click' to clickEvent var)
            will mean currently that a scroll action will also trigger reveal. We need to add a cancel
            on reveal if it's part of a scroll.
          */
         $('#tab_3 > .quiz .answer').on('click', function(e){
               $(this).toggleClass('reveal')
            }
         )
         
         // Set embedded vimeo going
         var $iframe = $('.vimeo iframe')
         if ($iframe.length) {
            vimeoPlayer = new Vimeo.Player($iframe)
            vimeoPlayer.setVolume(1)
            vimeoPlayer.on('play', function(){
               bgmusic.volume(0.03) // fade music down for video
               forceStopNarration()
            })
            vimeoPlayer.on('pause', function(){
               bgmusic.volume(0.2) // restore video volume
            })
            $('#overlay_tab_switcher').off('tab_switched').on('tab_switched',function(){
               vimeoPlayer.pause()
            }); // pause if tab switches away
            
         }

         
         TweenLite.set('.overlay_scrollable_content', {y:0}); // initial position at top
         selectTab(1)
         hotspotAnimation.to($map, 1, {x: toX, y: toY }, 0)
         .to("#overlay_box", 1.5, {autoAlpha: 1}, 0)
         .add(function(){
            /* start audio loading at start*/
            voiceover.unload()
            voiceover = new Howl({
               src: ['audio/'+thisHotspotID+'.mp3'],
               volume: 0.7
               })
            },0)
         .fromTo("#overlay_dialog", 0.5, {scale:0.01}, {scale:1, ease:Back.easeOut}, '-=0.5')
         .addLabel('build_dialog')
         .fromTo("#overlay_main_img", 0.5, {scale:0.01, rotation: -30, autoAlpha:0}, {scale:1, rotation: 0, autoAlpha:1, ease:Back.easeOut})         
         .staggerFrom(".overlay_scrollable_content > *, .tab_switcher",0.2, {y:-20, autoAlpha: 0}, 0.1, 'build_dialog').
         add(function(){
            /* start audio playing*/
            narrationPlaybackToggle()
         }, '-=0.6')
         .addLabel('dialogopen')
         .addPause() 
         .to("#overlay_dialog", 0.5, {scale:0.01, ease:Back.easeIn})
         .add(function(){
            /* stop voiceover and restore hotspot response */
            hotspotResponse = true; 
            console.log('hotspots reenabled')
            forceStopNarration()
         })
         .to("#overlay_box", 0.8, {autoAlpha: 0},  '-=0.5')
         
      
         zoomLevel = 0; // now zoom all the way in
         zoomAnimation.tweenTo('fullzoom', {ease: Power2.easeInout, onComplete: function(){
            $('#zoom_buttons button').removeClass('greyout')
            $('#zoom_buttons #zoom_in').addClass('greyout'); // make buttons reflect this
            updateZoomScale()
         } }).duration(1.5)
         
         hotspotAnimation.play()
      })
      .fail(function( jqxhr, textStatus, error ) {
         var err = textStatus + ", " + error
         console.log( "Hotspot JSON AJAX request failed: " + err )
         
         // Use status change box to deliver message instead of old alert. It's less disruptive.
         errorsound.play() // buzzer sound!  
         // show then fade out status change message...
         displayStatusChangeBox("<p>This place isn't open yet, sorry.</p><p>Try another!</p>", '')
         hotspotResponse = true; // renable hotspots
      });
      
      
      
     
      
   }

   return {
      // return the public stuff
      init: function(opts) {
          // initialise the private variables
         globalOptions = opts
         $map = $('#map')
         $container = $('#viewport')
         $('#zoom_buttons').hide(); // start buttons hidden
         viewportW = $container.outerWidth()
         viewportH = $container.outerHeight()
         mapGSAPObj = Draggable.create($map, {
            type: "x,y",
            edgeResistance: 0.8,
             bounds: {width: viewportW, height: viewportH}, 
            throwProps: true,
            throwResistance: 4000,
            maxDuration: 0.8,
            autoScroll: false
         })[0];          // Draggable returns array of instances. We only make one.
         mapGSAPObj.disable();  // disable dragability of map initially
         initialiseBackground(globalOptions.backgroundImg)
         initialiseHotspots()
         if (typeof globalOptions.thoughtBubbles !== 'undefined') {
            initialiseThoughtBubbles()
         }
         hotspotBaseURL = globalOptions.hotspotBaseURL
         waitForThenDo(function(){
            var waitingFor = $('.waitforload').length
            $('#waitcount').text(waitingFor == 1?'last person':waitingFor+" inhabitants")
            return (waitingFor == 0)} , initialiseGame ); // wait until all items classed waitforload have gone then execute initialiseGame
         return this
      } // end init
   }
})()
