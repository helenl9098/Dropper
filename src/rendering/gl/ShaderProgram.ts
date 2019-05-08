import {vec2, vec3, vec4, mat4} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';
import Texture from './Texture';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;

  unifRef: WebGLUniformLocation;
  unifEye: WebGLUniformLocation;
  unifUp: WebGLUniformLocation;
  unifDimensions: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifStickiness : WebGLUniformLocation;
  unifBounce : WebGLUniformLocation;
  unifTrans : WebGLUniformLocation;
  unifMap: WebGLUniformLocation;
  unifSampler1: WebGLUniformLocation;
  unifPowerUp: WebGLUniformLocation;
  unifPowerUpTimer: WebGLUniformLocation;

  constructor(shaders: Array<Shader>) {

    this.prog = gl.createProgram();



    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.unifEye   = gl.getUniformLocation(this.prog, "u_Eye");
    this.unifRef   = gl.getUniformLocation(this.prog, "u_Ref");
    this.unifUp   = gl.getUniformLocation(this.prog, "u_Up");
    this.unifDimensions   = gl.getUniformLocation(this.prog, "u_Dimensions");
    this.unifTime   = gl.getUniformLocation(this.prog, "u_Time");
    this.unifStickiness = gl.getUniformLocation(this.prog, "u_Stickiness");
    this.unifBounce = gl.getUniformLocation(this.prog, "u_Bounce");
    this.unifTrans = gl.getUniformLocation(this.prog, "u_Trans");
    this.unifMap = gl.getUniformLocation(this.prog, "u_Map");
    this.unifSampler1   = gl.getUniformLocation(this.prog, "u_NoiseTex1");
    this.unifPowerUp = gl.getUniformLocation(this.prog, "u_Power");
    this.unifPowerUpTimer = gl.getUniformLocation(this.prog, "u_PowerTimer");
  }

    // Bind the given Texture to the given texture unit
  bindTexToUnit(handleName: WebGLUniformLocation, tex: Texture, unit: number) {
    this.use();
    gl.activeTexture(gl.TEXTURE0 + unit);
    tex.bindTex();
    gl.uniform1i(handleName, unit);
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setPower(p: boolean) {
    this.use();
    if (p && this.unifPowerUp != -1) {
      gl.uniform1f(this.unifPowerUp, 1.0);
    }
    else if (this.unifPowerUp != -1) {
      gl.uniform1f(this.unifPowerUp, 0.0);
    }
  }

  setPowerTimer(t: number) {
    this.use();
    if(this.unifPowerUpTimer !== -1) {
      gl.uniform1f(this.unifPowerUpTimer, t);
    }
  }

  setEyeRefUp(eye: vec3, ref: vec3, up: vec3) {
    this.use();
    if(this.unifEye !== -1) {
      gl.uniform3f(this.unifEye, eye[0], eye[1], eye[2]);
    }
    if(this.unifRef !== -1) {
      gl.uniform3f(this.unifRef, ref[0], ref[1], ref[2]);
    }
    if(this.unifUp !== -1) {
      gl.uniform3f(this.unifUp, up[0], up[1], up[2]);
    }
  }

  setDimensions(width: number, height: number) {
    this.use();
    if(this.unifDimensions !== -1) {
      gl.uniform2f(this.unifDimensions, 752, 582);
    }
  }

  setTime(t: number) {
    this.use();
    if(this.unifTime !== -1) {
      gl.uniform1f(this.unifTime, t);
    }
  }

  setTrans(t: vec2) {
    this.use();
    if(this.unifTrans !== -1) {
      gl.uniform2f(this.unifTrans, t[0], t[1]);
    }
  }

  setSticky(t : number) {
    this.use();
    if (this.unifStickiness !== -1) {
      gl.uniform1f(this.unifStickiness, t);
    }
  }

  setBounce(t : number) {
    this.use();
    if (this.unifBounce !== -1) {
      gl.uniform1f(this.unifBounce, t);
    }
  }

  setMap(m: string) {
    this.use();
    if (this.unifMap != -1) {
      if (m == "rings") {
          gl.uniform1f(this.unifMap, 0.0);
      }
      else if (m == "cube") {
          gl.uniform1f(this.unifMap, 1.0);
      }
      else {
          gl.uniform1f(this.unifMap, 2.0);
      }
    }
  }

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
  }
};

export default ShaderProgram;
