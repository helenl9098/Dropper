import {vec2, vec3, mat4, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Texture from './rendering/gl/Texture';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  map: 'corridor',
  difficulty:'easy', 
  corridorTexture: 'pebbles',
  intersection: true,
  powerUp: false,
  powerUpTimer: 0
};

let square: Square;
let time: number = 0.1;
let velocity: number = 1.0;
let wPressed: boolean;
let aPressed: boolean;
let sPressed: boolean;
let dPressed: boolean;
let translation: vec2;

let ringScore: number = 0.0;
let cubeScore: number = 0.0;
let corridorScore: number = 0.0;
let currentScore: number = 0.0;

let start: boolean;
let pebbleSource: Texture;

var size = [752, 582];
var highText = document.getElementById('high-score');
var currentText = document.getElementById('current-score');


function updateHighScore() {
  if (controls.map == "cube") {
    highText.innerHTML = "High Score: " + cubeScore.toString();
  }
  else if (controls.map == "rings") {
    highText.innerHTML = "High Score: " + ringScore.toString();
  }
  else {
    highText.innerHTML = "High Score: " + corridorScore.toString();
  }
}

function updateCurrentScore(score: number) {

  currentScore = Math.round( score * 10) / 10;

  currentText.innerHTML = "Current Score: " + currentScore.toString();
  if (controls.map == "cube") {
    if (currentScore > cubeScore) {
      cubeScore = currentScore;
      highText.innerHTML = "High Score: " + cubeScore.toString();
    }
  }
  else if (controls.map == "rings") {
    if (currentScore > ringScore) {
      ringScore = currentScore;
      highText.innerHTML = "High Score: " + ringScore.toString();
    }
  }
  else {
    if (currentScore > corridorScore) {
      corridorScore = currentScore;
      highText.innerHTML = "High Score: " + corridorScore.toString();
    }
  }
}

function loadScene() {
  start = false;

  if (controls.corridorTexture == 'pebbles') {
    pebbleSource = new Texture('https://raw.githubusercontent.com/helenl9098/Dropper/gh-pages/src/resources/pebbles.png', 0);
    
  }
  if (controls.corridorTexture == 'geometric') {
    pebbleSource = new Texture('https://raw.githubusercontent.com/helenl9098/Dropper/gh-pages/src/resources/geometric.jpg', 0);
  }
  if (controls.corridorTexture == 'brick') {
    pebbleSource = new Texture('https://raw.githubusercontent.com/helenl9098/Dropper/gh-pages/src/resources/waves.jpg', 0);
  }
  if (controls.corridorTexture == 'sharp') {
    pebbleSource = new Texture('https://raw.githubusercontent.com/helenl9098/Dropper/gh-pages/src/resources/sharp.jpg', 0);
  }
  if (controls.corridorTexture == 'tiles') {
    pebbleSource = new Texture('https://raw.githubusercontent.com/helenl9098/Dropper/gh-pages/src/resources/cubes.png', 0);
  }
  if (controls.corridorTexture == 'scales') {
    pebbleSource = new Texture('https://raw.githubusercontent.com/helenl9098/Dropper/gh-pages/src/resources/scales.jpg', 0);
  }
  if (controls.corridorTexture == 'spiral') {
    pebbleSource = new Texture('https://raw.githubusercontent.com/helenl9098/Dropper/gh-pages/src/resources/sand.jpg', 0);
  }
    if (controls.corridorTexture == 'thorns') {
    pebbleSource = new Texture('https://raw.githubusercontent.com/helenl9098/Dropper/gh-pages/src/resources/succulent.jpg', 0);
  }

  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();

  wPressed = false;
  aPressed = false;
  sPressed = false;
  dPressed = false;
  translation = vec2.fromValues(0, 0);
  // time = 0;
}

function main() {
  var startText = document.getElementById('dropper-start');
  window.addEventListener('keypress', function (e) {
    // console.log(e.key);
    switch(e.key) {
      case 'w':
      wPressed = true;
      break;
      case 'a':
      aPressed = true;
      break;
      case 's':
      sPressed = true;
      break;
      case 'd':
      dPressed = true;
      break;
      case 'f':
      start = true;
      startText.style.display = "none";
      break;
    }
  }, false);

  window.addEventListener('keyup', function (e) {
    switch(e.key) {
      case 'w':
      wPressed = false;
      break;
      case 'a':
      aPressed = false;
      break;
      case 's':
      sPressed = false;
      break;
      case 'd':
      dPressed = false;
      break;
    }
  }, false);

  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);


  // Add controls to the gui
  const gui = new DAT.GUI();
  var guiMap = gui.add(controls, 'map', ['rings', 'cube', 'corridor']);
  var guiDifficulty = gui.add(controls, 'difficulty', ['easy', 'medium', 'hard']);
  var guiTexture = gui.add(controls, 'corridorTexture', ['pebbles', 'geometric', 'brick', 'sharp', 'tiles', 'scales', 'spiral', "thorns"]);
  var guiIntersection = gui.add(controls, 'intersection');

  guiMap.onChange(function() {
    time = 0.1;
    translation[0] = 0.0;
    translation[1] = 0.0;
    start = false;
    startText.style.display = "block";
    velocity = 1.0;
    updateHighScore();
  });

  guiDifficulty.onChange(function() {
    time = 0.1;
    translation[0] = 0.0;
    translation[1] = 0.0;
    start = false;
    startText.style.display = "block";
    velocity = 1.0;
    updateCurrentScore(0.0);
  });

  guiTexture.onChange(function() {
    time = 0.1;
    translation[0] = 0.0;
    translation[1] = 0.0;
    start = false;
    startText.style.display = "block";
    velocity = 1.0;
    updateHighScore();
    loadScene();
    flat.bindTexToUnit(flat.unifSampler1, pebbleSource, 0);
  });



  // get canvas and webgl context
  var canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  
  //gl.scissor(0,0,size[0],size[1]);
  canvas.width = size[0];
  canvas.height = size[0]/1.29;
    //gl.enable(gl.SCISSOR_TEST);
    if (!gl) {
      alert('WebGL 2 not supported!');
    }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, -10), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(164.0 / 255.0, 233.0 / 255.0, 1.0, 1);
  gl.enable(gl.DEPTH_TEST);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
    ]);

  flat.bindTexToUnit(flat.unifSampler1, pebbleSource, 0);

  function processKeyPresses() {
    if (start) {
      if(wPressed) {
        translation[1] += 1.0;
      }
      if(aPressed) {
        translation[0] += 1.0;
      }
      if(sPressed) {
       translation[1] -= 1.0;
     }
     if(dPressed) {
      translation[0] -= 1.0;
    }
  }
}


  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    renderer.clear();
    processKeyPresses();

    var intersect = renderer.render(camera, flat, [
      square,
      ], time, controls.map, translation, start, controls.powerUp, controls.powerUpTimer);
    
    // INTERSECTION TESTING
    if (controls.powerUp && controls.powerUpTimer > 500.0) {
        controls.powerUp = false;
        controls.powerUpTimer = 0.0;
        controls.intersection = true;
    }
    if (intersect == 0.0 && controls.intersection) {
      //console.log("intersected!");
      time = 0.1;
      translation[0] = 0.0;
      translation[1] = 0.0;
      start = false;
      startText.style.display = "block";
      velocity = 1.0;
      updateCurrentScore(0);
    }
    else if (start && (intersect== 2.0 || intersect == 1.0 || !controls.intersection)) {
      // slow start
      // //console.log("time");
      // if (time < 4.0) {
      //   if ((time / 1.5) * (time / 1.5) < 1.0) {
      //   time += (time / 1.5) * (time / 1.5);
      //     }
      //     else {
      //       time++;
      //     }
      // } else {

            // hit a powerup!
    if (controls.intersection && intersect == 1.0 && !controls.powerUp) {
      //console.log("intersected powerup!");
        controls.intersection = false;
        controls.powerUp = true;
    }
    if (controls.powerUp) {
        controls.powerUpTimer++;
      }
        //console.log(controls.powerUpTimer);
        time += velocity;

        if (controls.difficulty == "easy") {
          if (velocity < 2.0) {
            velocity += 0.001;
          }
        }
        else if (controls.difficulty == "medium") {
          if (velocity < 2.3) {
            velocity += 0.003;
          }
        }
        else if (controls.difficulty == "hard"){
          if (velocity < 2.5) {
            velocity += 0.005;
          }
        }

        updateCurrentScore(time);
      
    //}
  }
  stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
     window.resizeTo(250, 250);                             // Resizes the new window
     window.focus();    
      //gl.scissor(0,0,size[0],size[1]);
  //gl.enable(gl.SCISSOR_TEST);
  canvas.width = size[0];
  canvas.height = size[0]/1.29;
  gl.viewport(0, 0, size[0], size[0]/1.29);
  renderer.setSize(size[0], size[0]/1.29);
  camera.setAspectRatio(size[0] / 1.29);
  camera.updateProjectionMatrix();
  flat.setDimensions(size[0], size[0]/1.29);
}, false);

  canvas.width = size[0];
  canvas.height = size[0]/1.29;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  renderer.setSize(size[0], size[0]/1.29);
  camera.setAspectRatio(size[0] / 1.29);
  camera.updateProjectionMatrix();
  flat.setDimensions(size[0], size[0]/1.29);

  // Start the render loop
  tick();
}

main();
