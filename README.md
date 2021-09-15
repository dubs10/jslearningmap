JavaScript Learning Map
=================================

## Description
The Learning Map is a simple interactive JavaScript "game" which presents the user with a scrollable map with overlaid hotspots. The hotspots when clicked
will open up a dialog window where further details can be presented, including text, video, audio (narration) and a self-assessment quiz. 
The map was originally designed to provide an interactive home for degree-level Land Law problem questions for the Law School of City, University of London.
As such, some of the features were hard-coded with this set-up in mind, but there is enough flexibility for it to be reconfigured for different purposes.


### Features
- Scrollable and zoomable map with optional GreenSock-powered inertia
- Mouse-wheel support for zooming
- Audio introduction for providing user instructions
- Configurable hotspot overlays providing options for:
  - Offline hotspots (greyout option)
  - Separate illustration for dialog
  - Scrollable text in dialog
  - Illustrated "inhabitants" of hotspot
  - Embedded teaching video, served from Vimeo
  - Audio narration
  - Self-test quiz with blurred answers, click-to-reveal
- Background sound effects or music continually playing
- Three audio modes: All sound, voiceover only, mute
- Flash on-screen notifications (audio mode change, offline hotspot)
- Lively animations for opening and closing hotspots
- Optional sponsorship per hotspot, featuring name and logo
- Additional oval hotspots with "Tooltip"-style mouse-hover texts, used for displaying character thoughts
- Automatic click-to-zoom and click-to-centre functionality on hotspots
- AJAX loading of hotspot content and voiceovers
- Database back-end for hotspot content text
- Basic mobile / touchscreen compatibility

### Live demo
You can see the Learning Map in its original context at https://landlawstorymap.net
Launch the game by pressing the large red button on the home page.

## Disclaimer
This project was original designed for a fixed purpose on a fixed budget for City, University of London. This means that
it wasn't designed with full user-configurability and flexibility of purpose in mind initially. It's been developed instead
in an incremental fashion, often on a needs basis. I've tried to comment the code as much as possible to explain what is 
happening.
It's early days on this project still, and we hope to be able to improve the friendliness of the installation and configuration 
in the future. If you're stuck, you're welcome to get in contact with questions. We also welcome any patches, feature improvements
and bugfixes you may be able to contribute.

## Optional GreenSock map / text-scrolling inertia 
The project can make use of an optional GreenSock ThrowProps library (now "InertiaPlugin").  Without it, map and text scrolling won't keep moving when you let go of a move gesture.
This is released under a paid propriatory GreenSock licence. You must licence and link this in yourself if you want to make use of it. No copy is bundled with this project. 
For licencing this see https://greensock.com/club/

## Hotspot content
The map was designed to work in consort with a back-end database serving up the text and filenames for each hotspot.
However because the data is served up as JSON objects, it is also possible to build these in other ways and serve them
up statically, without the need for a database. 
You can see a couple of example JSON hotspot records from our live demo:
- https://tldr.legal/files/resources_html/landlawmap2/content/hotspots/hs_redcottage.json
- https://tldr.legal/files/resources_html/landlawmap2/content/hotspots/hs_familyhome.json

## Installation
Installation is currently a bit of a DIY affair :-)

### You will need
- a text editor for editing configuration files
- an empty MySQL / MariaDB database
- a SQL client or front-end for entering data and text into the database. PHPMyAdmin would work well for this.
- A standard LAMP web-server 

### Directory structure

#### js
- interactivemap.js: main project code
- go.js: launch and configuration code
- JavaScript libraries used

#### content/hotspots
- hotspot_json.php: script to generate .json files from the database
- database_config.php: configuration for database goes here
- .htaccess file for filename rewriting to make the PHP script look like it is generating static json files

#### content/sponsors
- sponsor logos go here

#### content/people
- images of inhabitants go here

#### css
- style.css: main map CSS styles

#### audio
- introvoice.mp3: voice introduction to game
- bgmusic.mp3: background music or sound effects
- buzzer.wav: a buzzer sound to signify offline hotspots
- hotspot audio narration files go here, named hs_XXXX.mp3 (where XXXX is the hotspot ID)

#### img
- five tab images for use in the dialog
- thought_bubble.svg: blank thought bubble template
- main map background image goes here
- put any other misc images here 

#### img/hotspots
- all the individual hotspot images go here
- any alternative version images for the dialog go here

#### install
- contains set-up SQL for installation. Delete once not needed.

### Content format specifications and recommendations
#### Background image for map
A single large image without any of the hotspots visible.
#### Hotspot images
Each one should be a PNG with transparent background, trimmed to its minimum dimensions. These will be overlaid on the background image. This creates square hotspots. Images can be named whatever you like.
#### Sponsor logos, optional alternate dialog images
These can be JPEG, PNG or SVG, as you see fit. Size them appropriately for their use. 
#### Creating the whole map
We suggest using an image editor (such as GIMP) and having each hotspot as its own layer, and the background image as the bottom layer. Make sure each layer is cropped to its minimum necessary dimensions. This way you can bulk export all the layers to separate files and use their layer positioning co-ordinates directly in the configuration file of the map.
#### Audio 
Audio should be saved as MP3 files. Bitrates of 64kbps per channel should be enough for most purposes. Mono files can be used for narration to save on bandwidth. A naming scheme is used:  hs_XXXXX.mp3, where XXXXX is the hotspot unique ID.
#### Video 
Video should be uploaded to Vimeo in whatever formats they accept.
#### Text
Stories and quizzes should be composed as HTML. The HTML is stored in the database in the relevant fields.
Quiz answers should be wrapped in double square brackets. This indicates they are to be blurred out.

### Database table structure


### Metadata for each hotspot
#### Required metadata 
- a single-word unique ID that describes and identifies the hotspot. Defined in map config (go.js) and referenced in the database tables. This ID is *case sensitive*.
- a human title or name for your hotspot. Stored in main database table.
- a sub-title or description for your hotspot. Stored in main database table.
- file path for the hotspot image. These are stored in img/hotspots directory. No naming scheme. Filename full web path goes in map config (go.js).
- text for hotspot: a story and a quiz. HTML stored in main database table.
#### Optional metadata
- Alternate image for the dialog, rather than reusing the hotspot image (optional).  These go in img/hotspots directory. No naming scheme. Filename full path goes in map config (go.js).
- Vimeo video, uploaded to Vimeo and referenced by Vimeo ID number (optional). This number stored in main database table.
- Sponsor name. Stored in main database table.
- Sponsorship text description, can be HTML (eg. this building sponsored by the Chambers of Foo ). Stored in main database table.
- Sponsor logo filename. These are in the content/sponsors directory. Store only the filename in main database table (not the full path).
#### Per inhabitant metadata
Each inhabitant has a record in the "people" table in the database containing:
- Inhabitant "belongsTo", matches the hotspot ID where they live
- Inhabitant name
- Inhabitant description
- Inhabitant image filename. Upload a small JPEG or PNG of constant height to the content/people/ directory. Store only the filename in the database.


### Installation steps
1. Copy the files to your webserver.
2. On the MySQL or MariaDB back-end, run the SQL file in the "install" directory to create the necessary 
database tables. This will create one table for "main" hotspot content and one for the "people" who inhabit the hotspots.
3. Put your map background image in the img directory. It is recommended to use a JPEG for the background image.
4. Put your introduction voice in the audio/introvoice.mp3 file (or leave the dummy file there for now).
5. Put your background music or sound-effects as the audio/bgmusic.mp3 file (or leave the dummy file there for now).
6. In css/style.css change the height and width of #map to match your background image dimensions.
7. Put all your hotspot images in img/hotspots
8. Put your hotspot narration audio files in the audio directory, making sure to follow the naming scheme mentioned above.
8. Upload any video to Vimeo, noting down their video ID numbers.
9. With all your files now in the right place we can edit the configuration of the map. Define your map images, hotspots, their coordinates, etc. This is by default set in /js/go.js. Edit this file.
10. Now it's time to populate the back-end database. For each of your hotspots that you defined in go.js, enter a matching record in the database containing the metadata and dialog content as specified above, one record per hotspot. Make sure the hotspot IDs matchthose in your config file. Inhabitant metadata goes in a separate related table, one record per inhabitant.
11. If you want to have additional thought bubble hotspots, define those also in the configuration in go.js, otherwise empty the thoughtBubbles array in go.js.
12. In the content/hotspots directory rename the file htaccess.RENAME-ME to .htaccess (making sure the initial dot is there in the filename). This enables the URL rewriting that allows JSON files generated by PHP & MySQL to appear as static served files from the outside. If you want to use static JSON files instead of creating them with a database, put them here and don't rename this htaccess file. However this isn't advised!
13. Put your database configuration into content/hotspots/database_config.php.
14. Double-check that htaccess files and Apache's rewrite engine are enabled on the web server, if you're using the database.
15. Test that the database is working correctly. On your browser navigate to content/hotspots/hs_<something>.json  ,where the something is the case-sensitive ID of a hotspot you have defined. You should get some JSON data back.
16. We can now test the whole map. Browse to /index.html on your webserver to try the map out. It should preload all your hotspot images, the map and the introduction narration. If everything loads successfully there should appear a start button that will launch the introduction.

### Troubleshooting 
If the loading stalls, open the developer console, choose the Network tab and reload the page. You need to make sure there aren't any 404 errors. Correct any missing or wrongly named files, if there are. 

If nothing is happening at all, open the developer console on the Console tab and check for JavaScript errors. You may have errors in your configuration/launch file (go.js).

If the game is launching but a hotspot cannot be found when clicked, make sure that there is a record matching each unique hotspot ID in the database. If you want to include a hotspot in the configuration but the content isn't ready in the database yet, mark the hotspot as being offline in the configuration by adding "offline: true" to its definition.

If no hotspots are responding at all, try browsing manually to /content/hotspots/hs_XXXXX.json, where XXXXX is one of your hotspot IDs to make sure the JSON data are being correctly generated from the contents of the database. There could be database connection errors or perhaps the htaccess file isn't working.

## Configuration
Configuration of the map is done by passing options to the learningMap.init function. By default this happens in the js/go.js file.
Some dummy default options have been placed in this file to get you started. What the options are and how they are used is covered by
the code comments in js/go.js.

## Launching the map from another web page
Because the map currently is at a fixed size and resolution, it's is best launched as a separate browser window with pre-determined dimensions.
You can do this with JavasScript, eg:
`window.open('https://url.to/game', '_blank', 'width=1200, height=679')`
The dimensions of 1200 x 679 have been found to work well with the game currently.


## Future developments
We hope to be able to develop some of the following:
- A plain demo data set to get you started.
- An open-source back-end for editing hotspot stories, uploading images, etc. Currently we use [XCRUD](https://xcrud.net) internally, but this is propriatory code so
we are prevented from sharing it with you. 
- Better touch-screen compatibility for tablet use.
- Subtitles for audio introduction, so it's not voice-only.
- A neater way of writing and storing the quizzes, without the double-brackets to signify answers. This was only ever supposed to be a temporary solution.
- Better modularisation and abstraction, to allow hotspot functionality to be swapped out as required.
- More configurability for game introduction
- Easier installation / configuration procedure.
- Make the transparent parts of hotspot images non-clickable, so we can have non-rectangular hotspots.
- Improve the clarity and organisation of the documentation

## Dependencies
The Learning Map makes use of the following other great software and libraries:

- [JQuery](https://jquery.com)
- [howler.js](https://howlerjs.com) for audio 
- [Vimeo player](https://github.com/vimeo/player.js/) for controlling the videos 
- [GreenSock](https://greensock.com) for animation and map movement

## Licence

The Learning Map and its demo content are released under the Creative Commons XXXX-TODO--XXXX licence.
The bundled howler.js, Vimeo and JQuery libraries are released under the MIT License.
GreenSock libraries are released under the [GreenSock "No Charge" Licence](https://greensock.com/standard-license/)
The optional GreenSock ThrowProps (now "InertiaPlugin") library is released under a paid propriatory GreenSock licence. You must licence and link this in yourself if you want to make use of it. No copy is bundled with this project.


## Still to do
- replace propriatory webfont references
- remove discussion field from db and CREATE SQL
- standardise on hotspotID for linking tables and do away with numeric id
- move sponsor logos from "uploads" directory to content/sponsors directory
- add in alt tag for people images
- rename two database tables to something more generic, removing the word landlaw. 
- tidy and reformat the CSS