var actx,
stereo,
artist,
mixer,
mixtape,
talentScout;
var c,
cctx,
hammerTime,
track,
crew,
ensamble;

window.onload = function()
{
	setTimeout('document.getElementsByTagName("header")[0].style.display="none"', 3500);
	jackIn();
	recordNewEP(document.getElementById('EPs'));
};


function clearTheFloor()
{
	with(paper)
	{
		project.activeLayer.removeChildren();
	}
}

function jackIn()
{
	actx = new (AudioContext || webkitAudioContext)();
	stereo = document.getElementById('myAudio');
	artist = actx.createMediaElementSource(stereo);
	mixer = actx.createAnalyser();
	mixer.smoothingTimeConstant = 0.9;

	artist.connect(mixer);
	artist.connect(actx.destination);
	mixtape = new Uint8Array(mixer.frequencyBinCount);

	c = document.getElementById('myCanvas');
	cctx = c.getContext("2d");
	c.width = window.innerWidth;
	c.height = ~~(window.innerHeight * 0.8);
	paper.setup(c);

	stereo.onplay = function()
	{
		throwItDown(track);
	};
	stereo.onpause = function()
	{
		clearInterval(hammerTime);
	};
}

function findDanceCrew(num)
{
	crew = [];
	for(var i=0; i<num; i++)
		crew[i] = 0;
}

function updateDanceCrew(num)
{
	for(var i=0; i<crew.length; i++)
		crew[i] = mixtape[i + num];
}

function recordNewEP(dropdown)
{
	stereo.pause();
	clearTheFloor();
	track = dropdown.selectedIndex;
	switch(track)
	{
		case 0: //bars			
			mixer.fftSize = 32;
			findDanceCrew(10);
			talentScout = 3;
			var leftEdge = ~~(c.width * 0.05);
			var gap = ~~((c.width * 0.90)/10);
			with(paper)
			{
				ensamble = [];
				for(var i=0; i<crew.length; i++)
				{
					var pnt = new Point(leftEdge + i*gap, c.height*0.995);
					var siz = new Size(gap-10, 3);
					var shp = new Shape.Rectangle(pnt, siz);
					shp.fillColor = 'black';
					ensamble[i] = shp;
				}
			}
			break;
		case 1: //1 circle
			mixer.fftSize = 32;
			findDanceCrew(5);
			talentScout = 5;
			with(paper)
			{
				ensamble = [];
				for(var i=0; i<crew.length; i++)
				{
					var defJam = new Shape.Circle(view.center, 30);
					defJam.strokeColor = 'black';
					defJam.strokeWidth = 11-2*i;
					ensamble[i] = defJam;
				}
			}
			break;
		case 2: //colors
			mixer.fftSize = 32;
			findDanceCrew(8);
			talentScout = 3;
			var leftEdge = ~~(c.width * 0.05);
			var gap = ~~((c.width * 0.90)/7);
			with(paper)
			{
				ensamble = [];
				for(var i=0; i<crew.length; i++)
				{
					var defJam = new Shape.Circle(new Point((leftEdge + gap*i), ~~(0.5 * c.height)), 30);
					defJam.strokeColor = 'black';
					defJam.strokeWidth = 7;
					defJam.fillColor = new Color(0.5,0.5,0.5);
					ensamble[i] = defJam;
				}
			}
			break;
	}
}

function throwItDown(num)
{
	with(paper){
	switch(num)
	{
		case 0:
			paper.view.onFrame = function(event)
			{
				if(stereo.paused) return;
				mixer.getByteFrequencyData(mixtape);
				updateDanceCrew(talentScout);
				for(var i=0; i<ensamble.length; i++)
				{
					ensamble[i].size.height = 3 + crew[i]*5;
				}
			}
			break;
		case 1:
			paper.view.onFrame = function(event)
			{
				if(stereo.paused) return;
				mixer.getByteFrequencyData(mixtape);
				updateDanceCrew(talentScout);
				for(var i=0; i<ensamble.length; i++)
				{
					ensamble[i].radius = 120 -20*i + (1.3*crew[i]/i);
				}
			}
			break;
		case 2:
			paper.view.onFrame = function(event)
			{
				if(stereo.paused) return;
				mixer.getByteFrequencyData(mixtape);
				updateDanceCrew(talentScout);
				for(var i=0; i<ensamble.length; i++)
				{
					ensamble[i].position.y = (0.5*c.height) - (crew[i] -128)*2;
					ensamble[i].fillColor = acidTrip(ensamble[i].fillColor);
				}
			}
			break;
	}}
}

function recordNewLP(e)
{
	stereo.pause();
	var file = e.files[0];
	objURL = URL.createObjectURL(file);
	stereo.src = objURL;
}

function acidTrip(colorElement)
{
	with(paper)
	{
		var posneg = Math.random() < 0.5 ? -1 : 1;
		if(colorElement.red > 0.02 && colorElement.red < 0.98)
			colorElement.red += posneg * Math.random() * 0.02;
		else
			colorElement.red = 0.5;
		if(colorElement.green > 0.02 && colorElement.green < 0.98)
			colorElement.green += posneg * Math.random() * 0.02;
		else
			colorElement.green = 0.5;
		if(colorElement.blue > 0.02 && colorElement.blue < 0.98)
			colorElement.blue += posneg * Math.random() * 0.02;
		else
			colorElement.blue = 0.5;
	}
	return colorElement;
}