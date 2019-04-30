#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform float u_Stickiness;
uniform float u_Bounce;
uniform vec2 u_Trans;
uniform float u_Map;
uniform sampler2D u_NoiseTex1;


in vec2 fs_Pos;
out vec4 out_Col;


// *******************************
// *******************************


// NOTES:
// MAPS ARE BASED OFF OF
// SHADERS FROM SHADERTOY: 

// https://www.shadertoy.com/view/4slyRs
// https://www.shadertoy.com/view/MscBRs


// *******************************
// *******************************








// ============ NUMBERS FOR CORRIDOR MAP ==========

float EPSILON = 0.002;
vec2 twist = vec2(2.0,2.0);
float planesDistance = 0.3;
vec4 bumpMapParams1 = vec4(2.0,7.0,0.01,-0.01);
vec4 bumpMapParams2 = vec4(2.0,3.0,-0.01,0.01);
vec4 heightMapParams = vec4(3.0,1.0,0.0,0.01);
vec4 heightInfluence = vec4(-0.025,-0.05,0.8,1.8);
float fogDensity = 0.2;
float fogDistance = 0.1;
vec3 groundColor1 = vec3(0.2,0.3,0.3);
vec3 groundColor2 = vec3(0.4,0.8,0.4);
vec3 columnColors = vec3(0.9,0.3,0.3);
vec4 ambient = vec4(0.2,0.3,0.4,0.0);
vec3 lightColor = vec3(0.4,0.7,0.7);
vec4 fogColor = vec4(0.0,0.1,0.5,1.0);
vec3 rimColor = vec3(1.0,0.75,0.75);

float pi = 3.14159265359;

mat2 rot(float a) 
{
  vec2 s = sin(vec2(a, a + pi/2.0));
  return mat2(s.y,s.x,-s.x,s.y);
}

float smin( float a, float b, float k )
{
  float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
  return mix( b, a, h ) - k*h*(1.0-h);
}

float sphere(vec3 pos, float radius, vec3 scale)
{
  return length(pos*scale)-radius;
}

float heightmap(vec2 uv)
{
  return heightMapParams.x*texture(u_NoiseTex1, (uv + u_Time * 0.01*heightMapParams.zw)*heightMapParams.y).x;
    //return 0.0;
  }

  float bumpmap(vec2 uv)
  {
    float b1 = bumpMapParams1.x*(1.0 - texture(u_NoiseTex1, (uv + u_Time * 0.005*bumpMapParams1.zw)*bumpMapParams1.y).x);
    float b2 = bumpMapParams2.x*(1.0-texture(u_NoiseTex1, (uv + u_Time* 0.005 *bumpMapParams2.zw)*bumpMapParams2.x).x);
    return b1+b2;
    //return 0.0;
  }

  float distfunc(vec3 pos)
  {
    float time = u_Time / 70.0;
    vec3 p2 = pos;
    p2.x += sin(p2.z*3.0 + p2.y*5.0)*0.15;
    p2.xy *= rot(floor(p2.z*2.0)*twist.y);
    pos.xy *= rot(pos.z*twist.x);
    
    float h = heightmap(pos.xz)*heightInfluence.x;
    
    vec3 columnsrep = vec3(0.75,1.0,0.5);
    vec3 reppos = (mod(p2 + vec3(time*0.01 + sin(pos.z*0.5),0.0,0.0),columnsrep)-0.5*columnsrep);
    
    float columnsScaleX = 1.0 + sin(p2.y*20.0*sin(p2.z) + time*5.0 + pos.z)*0.15;
    float columnsScaleY = (sin(time + pos.z*4.0)*0.5+0.5);
    
    float columns = sphere(vec3(reppos.x, pos.y+0.25, reppos.z), 0.035, vec3(columnsScaleX,columnsScaleY,columnsScaleX));
    float corridor = planesDistance - abs(pos.y) + h;
    float d = smin(corridor, columns, 0.25); 

    return d;
  }

//Taken from https://www.shadertoy.com/view/Xds3zN
mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
  vec3 cw = normalize(ta-ro);
  vec3 cp = vec3(sin(cr), cos(cr),0.0);
  vec3 cu = normalize( cross(cw,cp) );
  vec3 cv = normalize( cross(cu,cw) );
  return mat3( cu, cv, cw );
}

vec3 calculateNormals(vec3 pos)
{
  vec2 eps = vec2(0.0, EPSILON*1.0);
  vec3 n = normalize(vec3(
    distfunc(pos + eps.yxx) - distfunc(pos - eps.yxx),
    distfunc(pos + eps.xyx) - distfunc(pos - eps.xyx),
    distfunc(pos + eps.xxy) - distfunc(pos - eps.xxy)));

  return n;
}

//Taken from https://www.shadertoy.com/view/XlXXWj
vec3 doBumpMap(vec2 uv, vec3 nor, float bumpfactor)
{

  const float eps = 0.001;
  float ref = bumpmap(uv); 

  vec3 grad = vec3(bumpmap(vec2(uv.x-eps, uv.y))-ref, 0.0, bumpmap(vec2(uv.x, uv.y-eps))-ref); 

  grad -= nor*dot(nor, grad);          

  return normalize( nor + grad*bumpfactor );
}

// ==================================================


float noise( vec3 p , vec3 seed) {
  return fract(sin(dot(p + seed, vec3(987.654, 123.456, 531.975))) * 85734.3545);
}

// based off of http://jamie-wong.com/2016/07/15/ray-marching-signed-distance-functions/
float intersectSDF(float distA, float distB) {
  return max(distA, distB);
}

float unionSDF(float distA, float distB) {
  return min(distA, distB);
}

float differenceSDF(float distA, float distB) {
  return max(distA, -distB);
}

// based off of http://iquilezles.org/www/articles/distfunctions/distfunctions.htm
float opSmoothUnion( float d1, float d2, float k ) {
  float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
  return mix( d2, d1, h ) - k*h*(1.0-h); 
}

float opSmoothIntersection( float d1, float d2, float k ) {
  float h = clamp( 0.5 - 0.5*(d2-d1)/k, 0.0, 1.0 );
  return mix( d2, d1, h ) + k*h*(1.0-h); 
}


mat4 rotateX(float theta) {
  float c = cos(radians(theta));
  float s = sin(radians(theta));

  return mat4(
    vec4(1, 0, 0, 0),
    vec4(0, c, s, 0),
    vec4(0, -s, c, 0),
    vec4(0, 0, 0, 1)
    );
}

mat4 rotateZ(float theta) {
  float c = cos(radians(theta));
  float s = sin(radians(theta));

  return mat4(
    vec4(c, s, 0, 0),
    vec4(-s, c, 0, 0),
    vec4(0, 0, 1, 0),
    vec4(0, 0, 0, 1)
    );
}

vec3 getRayDirection() {

  float fovy = 45.0;
  vec3 look = normalize(u_Ref - u_Eye);
  vec3 right = normalize(cross(look, u_Up));
  vec3 up = cross(right, look);

  float tan_fovy = tan(radians(fovy / 2.0));
  float len = length(u_Ref - u_Eye);
  float aspect = u_Dimensions.x / float(u_Dimensions.y);

  vec3 v = up * len * tan_fovy;
  vec3 h = right * len * aspect * tan_fovy;

  vec3 p = u_Ref + fs_Pos.x * h + fs_Pos.y * v;
  vec3 dir = normalize(p - u_Eye);

  return dir;

}

float sdEllipsoid( in vec3 p, in vec3 r )
{
  float k0 = length(p/r);
  float k1 = length(p/(r*r));
  return k0*(k0-1.0)/k1;
}

float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float sdSphere( vec3 p, float s )
{
  return length(p)-s;
}

float sdCappedCylinder( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

vec2 path(float t) {
  float a = 3.0 *sin(t * .1) / (1.0 + noise(vec3(0.0, 0.0, t), 
    vec3(0.0, 0.0,0.0))); 
  float b = sin(t*.2) / (4.0 + noise(vec3(0.0, 0.0, t), 
   vec3(0.0, 0.0,0.0)));
  return vec2(2.*a, a*b);
}


float g = 0.;
float sceneSDF(vec3 p) {
  //float noiseValue = noise(vec3(floor(u_Time / 30.0), 0.0, 0.0), vec3(0.0, 0.0, 0.0));

  if (u_Map == 0.0) {
      // path
      p += vec3(sin(p.z / (20.0)) * 3.0 + 5.0* sin(u_Time / 30.0) * sin(u_Time / 60.0), 
        sin(p.z / 20.0) * 3.0 + 5.0* sin(u_Time / 30.0) * sin(u_Time / 60.0), 
        0.0);
      //p.xy += path(p.z);
      vec3 ringPoint = (inverse(rotateX(90.0)) * vec4(p, 1.0)).xyz;
      
      // ring repetitions
      vec3 c = vec3(0.0, 4.0, 0.0);
      vec3 q = mod(ringPoint,c)-0.5*c;

      // ring deformations
      q += vec3(sin(p.y * sin((u_Time + 47.0) / 50.0)) + 1.0, 0.0, 
        sin(p.x * cos(u_Time / 38.0)) + 1.0);
      float d = sdTorus(q, vec2(8.0, 0.35));
      return d;
    }
    else if (u_Map == 2.0) {
      p.xy -= path(p.z);
    float d = -length(p.xy) + 4.;// tunnel (inverted cylinder)
    g += .015 / (.01 + d * d);
    return d;
  }
  else {
    p.xy -= path(p.z);
    p += vec3(sin(p.z / (20.0)) * 3.0 + 0.6* sin(5.0* sin(u_Time / 80.0)) * cos(u_Time / 60.0), 
      sin(p.z / (20.0)) * (3.0 + cos(u_Time / 300.0)) + 1.0 * sin(4.0* cos(u_Time / 110.0)) * sin(u_Time / 160.0) * cos(u_Time / 40.0), 
      0.0);
    float d = -length(p.xy) + 6.;// tunnel (inverted cylinder)
    g += .015 / (.01 + d * d);
    return d;
  }

}

vec3 estimateNormal(vec3 p) {
  float EPSILON = 0.001;
  return normalize(vec3(
    sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
    sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
    sceneSDF(vec3(p.x, p.y, p.z  + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
    ));
}

// returns color
vec3 rayMarch(vec3 dir) {
  float time = u_Time / 1.0;
  vec3 eye = u_Eye + vec3(u_Trans.x / 4.0, u_Trans.y / 4.0, time );
  //vec3 eye = u_Eye;
  //vec3 eye = u_Eye + vec3(u_Trans.x / 100.0, u_Trans.y / 100.0, 0);
  
  float depth = 0.0; 
  int MAX_MARCHING_STEPS = 1000;
  float EPSILON = 0.0001;
  float MAX_TRACE_DISTANCE = 1000.0;

  vec4 fragCoord = gl_FragCoord;

  // vignette
  vec2 centerCoords = vec2(u_Dimensions.x / 2.0,
   u_Dimensions.y / 2.0);
  float maxDistance = sqrt(pow(centerCoords.x, 2.0) +
   pow(centerCoords.y, 2.0));
  float shortX = fragCoord.x - centerCoords.x;
  float shortY = fragCoord.y - centerCoords.y;
  float currentDistance = pow(shortX, 2.0) / pow(u_Dimensions.x, 2.0) +
  pow(shortY, 2.0) / pow(u_Dimensions.y, 2.0);

  float intensity = 3.8; // how intense the vignette is
  float vignette = currentDistance * intensity;
  float intensity2 = 5.3; // how intense the vignette is
  float vignette2 = currentDistance * intensity2;
  vec3 vignetteColor = mix(vec3(1.0), vec3(0, 0, 0), vignette);
  vec3 vignetteColor2 = mix(vec3(0.0), vec3(1.0, 0.9, 0.7), (1.0 - vignette2));


    // center crosshair
    if (fragCoord.x < centerCoords.x + 12.0 &&
      fragCoord.x > centerCoords.x - 12.0 &&
      fragCoord.y < centerCoords.y + 0.8 &&
      fragCoord.y > centerCoords.y - 0.8) {
      return vec3(1.0, 1.0, 1.0);
  }
  if (fragCoord.x < centerCoords.x + 0.8 &&
    fragCoord.x > centerCoords.x - 0.8 &&
    fragCoord.y < centerCoords.y + 12.0 &&
    fragCoord.y > centerCoords.y - 12.0) {
    return vec3(1.0, 1.0, 1.0);
}


    // ***************************** MAP #1 ****************************************
    if (u_Map == 0.0) {
    // INTERSECTION TESTING
    vec3 eye2 = eye;
    eye2.z += 0.05;
    if (sceneSDF(eye2) < 0.4) {

      return vec3(0, 0, 1);
    }
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
      vec3 point = eye + depth * dir;
      float d = point.z - time;
      g = d;

      float dist = sceneSDF(point);
          // we are inside the sphere!
          if (dist < EPSILON) {
            // distance fog
            const vec3 fogColor = vec3(0.0, 0.0,0.1);
            float fogFactor = 0.;
            fogFactor = (70. - d)/(70.0 - 30.0);
            fogFactor = clamp( fogFactor, 0.0, 1.0 );

                     // gold shading
                     vec3 diffuseColor = vec3(221, 82, 22) / 255.;
                     float diffuseTerm = dot(normalize(vec3(-1, -1, -1) * estimateNormal(point)), normalize(u_Ref - u_Eye));
                     diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);
                     float ambientTerm = 0.5;
                     float PI = 3.14159265358979323846;

                // vec3 color = vec3(0.5 + 0.5 * cos(2. * PI * (1.0 * diffuseTerm + 0.00)),
                //                   0.5 + 0.5 * cos(2. * PI * (0.7 * diffuseTerm + 0.15)),
                //                   0.5 + 0.5 * cos(2. * PI * (0.4 * diffuseTerm + 0.20)));
                vec3 color = vec3(cos(u_Time / 180.0) + 1.5, 
                  sin(u_Time / 200.0) + 1.5, 
                  cos(u_Time / 220.0) + 1.5);
                color = mix(fogColor, color, fogFactor);

                return color * vignetteColor;
              }

        // keep going!
        depth += dist;

         // we went too far ... we should stop
         if (depth >= MAX_TRACE_DISTANCE) {
           return vec3(0, 0, 0);
         }

       }

     }

  //============================
  else if (u_Map == 2.0) {

    float EPSILON = 0.02;
    float planesDistance = 0.2;
    vec4 bumpMapParams1 = vec4(2.0,7.0,0.01,-0.01);
    vec4 bumpMapParams2 = vec4(2.0,3.0,-0.01,0.01);
    vec4 heightMapParams = vec4(3.0,1.0,0.0,0.01);
    vec4 heightInfluence = vec4(-0.025,-0.05,0.8,1.8);
    float fogDensity = 0.2;
    float fogDistance = 0.0;
    vec3 groundColor1 = vec3(0.2,0.3,0.3);
    vec3 groundColor2 = vec3(0.4,0.8,0.4);
    vec3 columnColors = vec3(0.9,0.3,0.3);
    vec4 ambient = vec4(0.2,0.3,0.4,0.0);
    vec3 lightColor = vec3(0.4,0.7,0.7);
    vec4 fogColor = vec4(0.0,0.1,0.5,1.0);
    vec3 rimColor = vec3(1.0,0.75,0.75);

    float pi = 3.14159265359;
    eye = u_Eye + vec3(u_Trans.x / 68.0, u_Trans.y / 68.0, time / 30.0);

    const int MAX_ITER = 50;
    const float MAX_DIST = 1000.0;
    
    float totalDist = 0.0;
    float totalDist2 = 0.0;
    vec3 pos = eye;
    float dist = EPSILON;
    vec3 col = vec3(0.0);
    float glow = 3.0;
    
    for(int j = 0; j < MAX_ITER; j++)
    {
      dist = distfunc(pos);
      totalDist = totalDist + dist;
      pos += dist*dir;
      if (distfunc(eye + vec3(0, 0, 0.1)) < 0.03) {
        return vec3(0, 0, 1);
      }

      if(dist < EPSILON || totalDist > MAX_DIST)
      {
        vec2 uv = pos.xy * rot(pos.z*twist.x);
        float h = heightmap(vec2(uv.x, pos.z));
        vec3 n = calculateNormals(pos);
        vec3 bump = doBumpMap(vec2(uv.x, pos.z), n, 3.0);
        float m = smoothstep(-0.15,0.2, planesDistance - abs(uv.y) + h*heightInfluence.y + sin(u_Time)*0.01);
        vec3 color = mix(mix(groundColor1, groundColor2, smoothstep(heightInfluence.z,heightInfluence.w,h)), columnColors, m);
        float fog = dist*fogDensity-fogDistance;
        float heightfog = pos.y;
        float rim = (1.0-max(0.0, dot(-normalize(dir), bump)));
        vec3 lightPos = pos - (eye + vec3(0.0,0.0,1.0));
        vec3 lightDir = -normalize(lightPos);
        float lightdist = length(lightPos);
        float atten = 1.0 / (1.0 + lightdist*lightdist*3.0);
        float light = max(0.0, dot(lightDir, bump));
        vec3 r = reflect(normalize(dir), bump);
        float spec = clamp (dot (r, lightDir),0.0,1.0);
        float specpow = pow(spec,20.0);
        vec3 c = color*(ambient.xyz + mix(rim*rim*rim, rim*0.35+0.65, m)*rimColor + lightColor*(light*atten*2.0 + specpow*1.5));
        vec4 res = mix(vec4(c, rim), fogColor, clamp(fog+heightfog,0.0,1.0));

        vec3 finalcolor = vec3(res);
        if (finalcolor == vec3(0.0, 0.0, 0.0)) {
          return vec3(1.0, 0.0, 0.0);
        }

        return vec3(res);
      //return vec3(1, 0, 0);
    }
  } 
}

 // ******************* MAP #2 ****************************
 else {

  vec3 ro = vec3(u_Trans.x / 2.2, u_Trans.y / 2.2, time / 1.6);
  vec3 p = floor(ro) + .5; 
  vec3 mask; 


  vec3 drd = 1.0 / abs(dir);
  dir = sign(dir);
  vec3 side = drd * (dir * (p - ro) + .5);

  float t = 0., ri = 0.;

  vec3 dir2 = vec3(0, 0, 1);
  vec3 drd2 = 1.0 / abs(dir2);
  dir2 = sign(dir2);
  vec3 side2 = drd2 * (dir2 * (p - ro) + .5);
  float t2 = 0., ri2 = 0.;
        //INTERSECTION
        if (sceneSDF(ro) < 0.0003) {
          return vec3(0, 0, 1);
        }

        for (float i = 0.0; i < 1.0; i+= .01) {
          float dist = sceneSDF(p);

          if (dist < EPSILON) {

            break;
          }
          mask = step(side, side.yzx) * step(side, side.zxy);
        //mask2 = step(side2, side2.yzx) * step(side2, side2.zxy);
          // minimum value between x,y,z, output 0 or 1

          side += drd * mask;
          p += dir * mask;
        }

        t = length(p - ro);

        vec3 c = vec3(1) * length(mask * vec3(1., .5, .3));
        c = mix(vec3(.8, .2, .7), vec3(.2, .1, .2), c);
        c += g * .4;
        c.g += sin(u_Time)*.2 + sin(p.z*.5 - u_Time * .1);// red rings
        c = mix(c, vec3(.2, .1, .2), 1. - exp(-.001*t*t));// fog
        return c;
      }
    }

    void main() {

      vec3 dir = getRayDirection();
  //out_Col = vec4(0.5 * (dir + vec3(1.0, 1.0, 1.0)), 1.0);
  
  vec3 color = rayMarch(dir);
  if (u_Time < 0.2) {
    out_Col = vec4(color * 0.3, 1.0);
  }
  else {
    out_Col = vec4(color, 1.0);
  }
}
