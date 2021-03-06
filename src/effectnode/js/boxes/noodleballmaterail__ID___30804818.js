/* "noodle-ball-materail" */

import { Clock, Color, DoubleSide, MeshStandardMaterial } from "three";

export class NoodleBallMaterial {
  constructor({ relay, CommonShader }) {
    this.material = new MeshStandardMaterial({
      color: new Color("#ffffff"),
      side: DoubleSide,
      transparent: true,
      metalness: 0.5,
      roughness: 0.5,
      opacity: 0.5,
    });
    this.CommonShader = CommonShader;
    this.relay = relay;
    this.setup();
    return this.material;
  }
  setup() {
    let onBeforeCompile = (shader, renderer) => {
      shader.uniforms.time = { value: 0 };
      shader.uniforms.myColor = { value: new Color("#ffffff") };

      if (this.relay && this.relay.onUserData) {
        this.relay.onUserData(({ ballColor, ballOpacity }) => {
          shader.uniforms.myColor.value = new Color(ballColor);
          this.material.opacity = Math.abs(ballOpacity / 100);
        });
      }

      let clock = new Clock();
      setInterval(() => {
        shader.uniforms.time.value = clock.getElapsedTime();
      });

      shader.vertexShader = shader.vertexShader.replace(
        `#include <common>`,
        /* glsl */ `
#include <common>
attribute vec3 offset;
uniform float time;
uniform vec3 myColor;
varying vec3 myColorV;

${this.CommonShader.UtilFunctions()}

      `
      );

      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        /* glsl */ `
        // vec3 p3 = ballify(vec3(offset * 2.0), 0.5);

        // vec3 coord = p3;

        // coord += 0.1 * snoiseVec3(vec3(coord + time * 0.6));

        // vec3 transformed = position + coord;

        float t = 1.0;

        ${this.CommonShader.CoordProcedure()}

        vec3 transformed = position + coord;

        myColorV = myColor;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_pars_fragment>",
        /* glsl */ `#include <color_pars_fragment>

        varying vec3 myColorV;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
        /* glsl */ `
        outgoingLight = myColorV;

        gl_FragColor = vec4( outgoingLight, diffuseColor.a );

        // diffuseColor.rgb *= myColorV;
        `
      );

      // shader.vertexShader = shader.vertexShader.replace(
      //   `#include <defaultnormal_vertex>`,
      //   `
      //   `
      // );

      this.material.userData.shader = shader;
      // console.log(this.material.userData.shader.vertexShader);
    };

    this.material.onBeforeCompile = onBeforeCompile;

    this.material.needsUpdate = true;
  }
}

export const box = async (relay) => {
  let { spec } = await relay.waitFor(0);
  let { CommonShader } = await relay.waitFor(1);
  let ballMaterial = new NoodleBallMaterial({
    ...spec,
    relay,
    CommonShader,
  });
  relay.pulse({
    ballMaterial,
  });
};
