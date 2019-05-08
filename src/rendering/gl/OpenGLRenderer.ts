import {mat4, vec4, vec2} from 'gl-matrix';
import Drawable from './Drawable';
import Camera from '../../Camera';
import {gl} from '../../globals';
import ShaderProgram from './ShaderProgram';

let utime: number = 0;
var size = [752, 582];
//let uTranslation: 

// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {
  constructor(public canvas: HTMLCanvasElement) {
  }

  setClearColor(r: number, g: number, b: number, a: number) {
    gl.clearColor(r, g, b, a);
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  render(camera: Camera, prog: ShaderProgram, drawables: Array<Drawable>, time: number, 
    map: string, translation: vec2, start: boolean, power: boolean, timer: number) {

    this.canvas.width = size[0];
    this.canvas.height = size[1];

    // create to render to
    const targetTextureWidth = 1;
    const targetTextureHeight = 1;
    const targetTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + 1);
    //targetTexture.bindTex();
    //gl.uniform1i(handleName, 1);
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    {
      // define size and format of level 0
      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data: number = null;
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        targetTextureWidth, targetTextureHeight, border,
        format, type, data);

      // set the filtering so we don't need mips
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    // Create and bind the framebuffer
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // attach the texture as the first color attachment
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, 0);


    for (let drawable of drawables) {
          // render to our targetTexture by binding the framebuffer
          gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

        // render cube with our 3x2 texture
        gl.bindTexture(gl.TEXTURE_2D, targetTexture);
        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);

        // Clear the canvas AND the depth buffer.
        gl.clearColor(0, 0, 1, 1);   // clear to blue
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var aspect = targetTextureWidth / targetTextureHeight;
        prog.draw(drawable);

        var pixels = new Uint8Array(1 * 4);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        // render to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // render the cube with the texture we just rendered to
        gl.bindTexture(gl.TEXTURE_2D, targetTexture);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, size[0], size[1]);

        // Clear the canvas AND the depth buffer.
        gl.clearColor(1, 1, 1, 1);   // clear to white
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        aspect = gl.canvas.width / gl.canvas.height;
        prog.draw(drawable);
      }

      prog.setEyeRefUp(camera.controls.eye, camera.controls.center, camera.controls.up);
      prog.setTime(time);
      prog.setTrans(translation);
      prog.setMap(map);
      prog.setPower(power);
      prog.setPowerTimer(timer);

      if (pixels[2] == 255 && pixels[1] == 0 && pixels[0] == 0) {
        return 0.0;
      }
      else if (pixels[2] == 0 && pixels[1] == 0 && pixels[0] == 255) {
        return 1.0;
      }
      else {
        return 2.0;
      }
    }
  };

  export default OpenGLRenderer;
