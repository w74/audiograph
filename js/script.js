/*-----------------------------------
		01. Scope Globals
-----------------------------------*/
var a = new Object(); //audio
var c = new Object(); //canvas
var activeIndex = 0; //keeps track of which animation <option> is selected
var $newFile = document.getElementById('newFile'); //change music button
var $dropdown = document.getElementById('animation'); //dropdown menu
var $playButton = document.querySelector('.canvas-container img');

init();

function init(){
	//fade out splash screen after 3.5 seconds
	setTimeout(function(){
		document.getElementsByTagName("header")[0].style.display="none";
	}, 3500);
	loadVars();
	changeAnim(activeIndex);

	//set up EventListeners
	$newFile.addEventListener("change", function(){
		a.element.pause();
		var file = this.files[0];
		objURL = URL.createObjectURL(file);
		a.element.src = objURL;
	});
	$dropdown.addEventListener("change", function(){
		activeIndex = this.selectedIndex;
		changeAnim();
	});
	$playButton.addEventListener("click", function(){ a.element.play(); });
}

/*FUNCTION loadVars() 
		desc: sets up the audio object (=a) and the canvas object (=c)
*/
function loadVars()
{
	a.context = new (AudioContext || webkitAudioContext)();
	a.element = document.getElementById('myAudio');
	a.source = a.context.createMediaElementSource(a.element);
	var temp = a.context.createAnalyser();
	temp.smoothingTimeConstant = 0.85;
	//arbitrary number to desensitize a.feed so the animation is smoother; the higher the number [0, 1) the less accurate the a.feed values
	a.analyser = temp;

	a.source.connect(a.analyser);
	a.source.connect(a.context.destination);
	a.freqBin = new Uint8Array(a.analyser.frequencyBinCount);

	c.element = document.getElementById('myCanvas');
	c.context = c.element.getContext("2d");
	c.width = project.view.viewSize.width;
	c.height = project.view.viewSize.height;
	
	a.element.onplay = function(){
		$playButton.style.opacity = 0;
		project.view.play();
	};
	a.element.onpause = function(){
		$playButton.style.opacity = 1;
		project.view.pause();
	};
}

/*-----------------------------------
		02. Event Response
-----------------------------------*/
/*FUNCTION changeAnim()
		desc: tells setUpCanvas() how many elements to create and a.freqBin how many values to collect from audio stream
*/
function changeAnim(){
	updateFeed();
	project.activeLayer.removeChildren();
	var num;
	switch(activeIndex){
		case 0: //bars
			num = 9;
			a.analyser.fftSize = 32;
			//determines a.freqBin.length; must be a power of 2 greater than 32
			break;
		case 1: //circle
			num = 5;
			a.analyser.fftSize = 32;
			break;
		case 2: //blob
			num = 16;
			a.analyser.fftSize = 64;
			break;
		case 3: //wave
			num = ~~(c.width/100);
			a.analyser.fftSize = 128;
			break;
		case 4: //string
			num = ~~(c.width/50);
			a.analyser.fftSize = 128;
			break;
	}
	setUpCanvas(num);
}

/*-----------------------------------
		03. Audio Functions
-----------------------------------*/
/*FUNCTION updateFeed(int arg1, int arg2)
		desc: updates a.feed's values; if num is undefined, refreshes a.feed to an empty array
		inputs: arg1 = (x >= 1), arg2 = (x >= 0)
			arg1 -> optional: defines a.feed.length; if undefined, creates empty array
			arg2 -> optional: defines from what index in a.freqBin we start pulling values
*/
function updateFeed(num, offset){
	if(num !== undefined){
		a.analyser.getByteFrequencyData(a.freqBin);
		var dx = (offset === undefined ? 0 : offset);
		for(var i = 0; i < num; i++){
			a.feed[i] = a.freqBin[i + dx];
		}
	}
	else{
		a.feed = [];
	}
}

/*-----------------------------------
		04. Canvas Functions
-----------------------------------*/
/*FUNCTION setUpCanvas(int arg1)
		desc: adds children to the activeLayer that will be manipulated by onFrame()
		inputs: arg1 = (activeIndex || x >= 0)
			arg1 -> determines which set of children to instantiate
*/
function setUpCanvas(num){
	switch(activeIndex){
		case 0:
			var barWidth = ~~(c.width/num);

			for(var i = 0; i < num; i++){
				var pnt = new Point(i*barWidth, c.height*0.995);
				var siz = new Size(barWidth-10, 3);
				var shp = new Shape.Rectangle({
					point: pnt,
					size: siz,
					fillColor: 'black'
				});
				/* Process Breakdown:
						pnt -> defines the bottom left point of the bar
						siz -> sets width equal to 1/num of c.width short 10 pixels to create a gap between bars; height equals a constant 3px
						shp -> instantiate a rectangle shape and add it to activeLayer */
				project.activeLayer.addChild(shp);
			}
			break;
		case 1:
			for(var i = 0; i < num; i++)
			{
				var cir = new Shape.Circle({
					center: view.center,
					radius: 100 - (20 * i),
					strokeColor: 'black',
					strokeWidth: 11 - 2 * i
				});
				/* Process Breakdown:
						view.center -> center of circle is the center of screen
						radius -> consecutive circles' radii get smaller in increments of 20px */
				project.activeLayer.addChild(cir);
			}
			break;
		case 2:
			var path = new Path({
				strokeColor: 'black',
				strokeWidth: 10,
				closed: true
			});
			var segmentArray = [];

			for(var i = 0; i < num; i++){
				var hypotneuse = (i % 2 === 0 ? 60 : 50);
				segmentArray[i] = new Point(view.center.x - hypotneuse * Math.cos(i*0.39269915) , view.center.y - hypotneuse * Math.sin(i*0.39269915));
			}
			/* Process Breakdown:
						segmentArray -> list of points that will connect to create a path
						hypotneuse -> calculates the cartesian coordinates of the points rotating around view.center and alternating in distance between 60 and 50 */
			path.addSegments(segmentArray);
			project.activeLayer.addChild(path.smooth());
			break;
		case 3:
			//waves and string share the same initialization code in the sense that we create a set of equidistant points across the center the of view
		case 4:
			var path = new Path({
				strokeColor: 'black',
				strokeWidth: 10,
				strokeCap: 'round'
			});
			var segmentArray = [[0, view.center.y]];

			var gapWidth = ~~((c.width - 20)/num);
			for(var i = 1; i < num; i++){
				segmentArray[i] = new Point((gapWidth*i), view.center.y + Math.pow(-1, i) * 20);
			}
			/* Process Breakdown:
						segmentArray -> list of points that will connect to create a path
						[0, view.center.y] -> creates a fixed point at the left edge of the screen 
						c.width - 20 -> we want to give the fixed points at the left and right edges at least 10 pixels of margin each */
			segmentArray.push([c.width, view.center.y])
			//add a fixed point at the right edge of the screen
			path.addSegments(segmentArray);
			project.activeLayer.addChild(path.smooth());
			break;
	}
}

/*FUNCTION onFrame(Obj arg1)
		desc: code to run on every frame during runtime
		inputs:
			arg1 -> event object generated by PaperJS during runtime
*/
function onFrame(e){
	var layer = project.activeLayer.children;
	//a.feed[i] will be referred to as 'x' in the Equation Breakdowns below
	switch(activeIndex){
		case 0:
			updateFeed(layer.length, 4);
			for(var i = 0; i < layer.length; i++){
				layer[i].size.height = 3 + c.height * (a.feed[i]/150);
				/* Equation Breakdown:
						3 -> minimum bar height when x equals 0
						c.height -> height of canvas, to prevent overflow
						x/150 -> returns x as a percentage of 150 */
			}
			break;
		case 1:
			updateFeed(layer.length, 5);
			var viewportOrientation = (c.width/c.height >= 1 ? c.height : c.width);
			for(var i = 0; i < layer.length; i++){
				layer[i].radius = ((a.feed[i]/96) + Math.pow(0.5, i)) * (0.125 - 0.024*i) * viewportOrientation + (3*i);
				/* Equation Breakdown:
						x/96 -> returns a number in range [0, 2.66)
						Math.pow(0.5, i) -> minimum value modifier to reduce liklihood of ring collision
						0.125 - 0.024*i -> ensures that each successive ring gets smaller; the radius on the rings will be [0.5%, 50%]
						3*i -> minimum ring size */
			}
			break;
		case 2:
			updateFeed(layer[0].segments.length, 6);
			var viewportOrientation = (c.width/c.height >= 1 ? c.height : c.width);
			var meanFeed = 0;
			for(var i in a.feed){ meanFeed += a.feed[i]; }
			meanFeed /= a.feed.length;

			for(var i = 0; i < layer[0].segments.length; i++){
				var hypotneuse = ( Math.pow(-1, i) * Math.pow(a.feed[i], 2) * Math.log(a.feed[i]+1) / 3600000 + meanFeed/550 ) * viewportOrientation + 30;
				/* Equation Breakdown:
						Math.pow(-1, i) -> alternates between high and low points
						Math.pow(x, 2)/(16*10*4096) -> dampens the amplitude to reduce sharp peaks between high and low points; limits range to [0, 0.1)
						Math.log(x+1)/log(255) -> significantly raises the amplitude of x[i] when below 100 to decrease the liklihood of a large arc
						meanFeed/550 -> grows and shrinks entire blob; range approx. [0, 0.45)
						30 -> minimum hypotneuse length of prevent point from falling into center of view */
				layer[0].segments[i].point.x = view.center.x - hypotneuse * Math.cos(i * 0.39269915 + e.count/400);
				layer[0].segments[i].point.y = view.center.y - hypotneuse * Math.sin(i * 0.39269915 + e.count/400);
				/*	22.5deg -> 0.39269915rad
						e.count/300 -> rotates blob by ~0.14 degrees per frame */
			}
			layer[0].smooth();
			break;
		case 3:
			updateFeed(layer[0].segments.length-1, 9);
			for(var i = 1; i < layer[0].segments.length-1; i++){
				layer[0].segments[i].point.y = view.center.y - (Math.pow(-1, i) * ((Math.sin(a.feed[i]/20)+1)/15 * c.height + 2));
				/* Equation Breakdown:
						view.center.y -> vertically aligns all points
						Math.pow(-1, i) -> alternates between high and low points
						(Math.sin(x/20)+1) -> sin(x/20) used to make wave patterns more unpredictable, but the period increased 20x to preserve a visual pattern; we add 1 to make the range [0, 2]
						Math.sin(...)/15 -> limits range to (.366, .634) of view height
						... + 2 -> prevents flatlining of wave*/
			}
			layer[0].smooth();
			break;
		case 4:
			updateFeed(layer[0].segments.length-1, 5);
			for(var i = 1; i < layer[0].segments.length-1; i++){
				layer[0].segments[i].point.y = view.center.y - ((Math.sin(a.feed[i]/20)/10 * c.height));
				/* Equation Breakdown:
						view.center.y -> vertically aligns all points
						Math.sin(x/20) -> sin(x/20) used to make wave patterns more unpredictable, but the period increased 20x to preserve a visual pattern
						Math.sin(...)/10 -> limits range to [.4, .6] of view height; a larger range creates unpleasant artifacts on monitors with low refresh rates*/
			}
			layer[0].smooth();
			break;
	}
}

function onResize(){
	c.width = project.view.viewSize.width;
	c.height = project.view.viewSize.height;
	changeAnim(); //redraw canvas objects to refit screen
}