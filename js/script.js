/*-----------------------------------
		01. Scope Globals
-----------------------------------*/
var a = new Object(); //audio
/* 
context = actx
element = stereo
source = artist
analyser = mixer
freqBin = mixtape
*/
var c = new Object(); //canvas
/*
element = c
context = cctx
*/

init();

function init(){
	//setTimeout(function(){document.getElementsByTagName("header")[0].style.display="none";}, 3500);
	loadVars();
	changeAnim(0);
};

function loadVars()
{
	a.context = new (AudioContext || webkitAudioContext)();
	a.element = document.getElementById('myAudio');
	a.source = a.context.createMediaElementSource(a.element);
	var temp = a.context.createAnalyser();
	temp.smoothingTimeConstant = 0.9;
	a.analyser = temp;

	a.source.connect(a.analyser);
	a.source.connect(a.context.destination);
	a.freqBin = new Uint8Array(a.analyser.frequencyBinCount);

	c.element = document.getElementById('myCanvas');
	c.context = c.element.getContext("2d");
	c.width = project.view.viewSize.width;
	c.height = project.view.viewSize.height;
	
	a.element.onplay = function(){ project.view.play(); };
	a.element.onpause = function(){ project.view.pause(); };
}
/*-----------------------------------
		02. Event Response
-----------------------------------*/
document.getElementById('newFile').onchange = function(){
	a.element.pause();
	var file = this.files[0];
	objURL = URL.createObjectURL(file);
	a.element.src = objURL;
}

document.getElementById('animation').onchange = function(){changeAnim(this.selectedIndex)};

function changeAnim(e){
	console.log(c.onPaper);
	clearCanvas();
	var num;
	switch(e){
		case 0: //bars
			num = 10;
			a.analyser.fftSize = 32;
			break;
		case 1:
			num = 5;
			a.analyser.fftSize = 32;
			break;
	}
	setUpCanvas(e, num);
	view.on('frame', setFrameHandler(e));
}

/*-----------------------------------
		03. Audio Functions
-----------------------------------*/
function updateFeed(num, offset){
	if(num !== undefined){
		a.analyser.getByteFrequencyData(a.freqBin);
		var dx = (offset === undefined ? 0 : offset);
		for(var i = 0; i < num; i++){
			a.feed[i] = a.freqBin[i + dx];
		}
	}
	else{
		a.feed = new Array;
	}
}

/*-----------------------------------
		04. Canvas Functions
-----------------------------------*/
function setUpCanvas(e, num){
	var count = (num === undefined ? c.onPaper.length : num);
	project.activeLayer.removeChildren();
	switch(e){
		case 0:
			var barWidth = ~~(c.width/count);
			for(var i = 0; i < count; i++){
				var pnt = new Point(i*barWidth, c.height*0.995);
				var siz = new Size(barWidth-10, 3);
				var shp = new Shape.Rectangle(pnt, siz);
				shp.fillColor = 'black';
				c.onPaper[i] = shp;
			}
			break;
		case 1:
			for(var i = 0; i < count; i++)
			{
				var shp = new Shape.Circle(view.center, 5*i);
				shp.strokeColor = 'black';
				shp.strokeWidth = 11-2*i;
				c.onPaper[i] = shp;
			}
			break;
	}
}

function setFrameHandler(e){
	switch(e){
		case 0:
			var frameHandler = function(e){
				updateFeed(10, 3);
				for(var i = 0; i < c.onPaper.length; i++){
					c.onPaper[i].size.height = 3 + c.height * (a.feed[i]/192);
				}
			}
			break;
		case 1:
			var frameHandler = function(e){
				updateFeed(5, 5);
				var temp = (c.width/c.height >= 1 ? c.height : c.width);
				for(var i = 0; i < c.onPaper.length; i++){
					c.onPaper[i].radius = ((a.feed[i]/64) + (4-i)) * (0.0625 - 0.012*i) * temp + 10;
				}
			}
			break;
	}
	return frameHandler;
}

function clearCanvas(){
	a.element.pause();
	updateFeed();
	c.onPaper = new Array;
}

function onResize(){
	c.width = project.view.viewSize.width;
	c.height = project.view.viewSize.height;
	setUpCanvas(document.getElementById('animation').selectedIndex);
}