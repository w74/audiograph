/*-----------------------------------
		01. Scope Globals
-----------------------------------*/
var a = new Object(); //audio
var c = new Object(); //canvas
var activeIndex = 0;

init();

function init(){
	//setTimeout(function(){document.getElementsByTagName("header")[0].style.display="none";}, 3500);
	loadVars();
	changeAnim(activeIndex);
};

function loadVars()
{
	a.context = new (AudioContext || webkitAudioContext)();
	a.element = document.getElementById('myAudio');
	a.source = a.context.createMediaElementSource(a.element);
	var temp = a.context.createAnalyser();
	temp.smoothingTimeConstant = 0.85;
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
document.getElementById('newFile').addEventListener("change", function(){
	a.element.pause();
	var file = this.files[0];
	objURL = URL.createObjectURL(file);
	a.element.src = objURL;
});

document.getElementById('animation').addEventListener("change", function(){
	activeIndex = this.selectedIndex;
	changeAnim(activeIndex);
});

function changeAnim(e){
	a.element.pause();
	updateFeed();
	var num;
	switch(e){
		case 0: //bars
			num = 9;
			a.analyser.fftSize = 32;
			break;
		case 1:
			num = 5;
			a.analyser.fftSize = 32;
			break;
	}
	setUpCanvas(e, num);
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
		a.feed = [];
	}
}

/*-----------------------------------
		04. Canvas Functions
-----------------------------------*/
function setUpCanvas(e, num){
	var count = (num === undefined ? project.activeLayer.children.length : num);
	project.activeLayer.removeChildren();
	switch(e){
		case 0:
			var barWidth = ~~(c.width/count);
			for(var i = 0; i < count; i++){
				var pnt = new Point(i*barWidth, c.height*0.995);
				var siz = new Size(barWidth-10, 3);
				var shp = new Shape.Rectangle({
					point: pnt, 
					size: siz,
					fillColor: 'black'
				});
				project.activeLayer.addChild(shp);
			}
			break;
		case 1:
			for(var i = 0; i < count; i++)
			{
				var cir = new Shape.Circle(view.center, 100-(20*i));
				cir.strokeColor = 'black';
				cir.strokeWidth = 11-2*i;
				project.activeLayer.addChild(cir);
			}
			break;
	}
}

function onFrame(e){
	var layer = project.activeLayer;
	switch(activeIndex){
		case 0:
			updateFeed(10, 4);
			for(var i = 0; i < layer.children.length; i++){
				layer.children[i].size.height = 3 + c.height * (a.feed[i]/150);
			}
			break;
		case 1:
			updateFeed(5, 5);
			var temp = (c.width/c.height >= 1 ? c.height : c.width);
			for(var i = 0; i < layer.children.length; i++){
				layer.children[i].radius = ((a.feed[i]/64) + (4-i)) * (0.0625 - 0.012*i) * temp + 10;
			}
			break;
	}
}

function onResize(){
	c.width = project.view.viewSize.width;
	c.height = project.view.viewSize.height;
	setUpCanvas(document.getElementById('animation').selectedIndex);
}