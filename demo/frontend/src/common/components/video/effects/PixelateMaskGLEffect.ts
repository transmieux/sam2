/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import BaseGLEffect from '@/common/components/video/effects/BaseGLEffect';
import {
  EffectFrameContext,
  EffectInit,
} from '@/common/components/video/effects/Effect';
import vertexShaderSource from '@/common/components/video/effects/shaders/DefaultVert.vert?raw';
import fragmentShaderSource from '@/common/components/video/effects/shaders/PixelateMask.frag?raw';
import { Tracklet } from '@/common/tracker/Tracker';
import { preAllocateTextures } from '@/common/utils/ShaderUtils';
import { RLEObject, decode } from '@/jscocotools/mask';
import invariant from 'invariant';
import { CanvasForm } from 'pts';

export default class PixelateMaskGLEffect extends BaseGLEffect {
  private _numMasks: number = 0;
  private _numMasksUniformLocation: WebGLUniformLocation | null = null;
  private _marginSizeUniformLocation: WebGLUniformLocation | null = null;


  // Must from start 1, main texture takes.
  private _masksTextureUnitStart: number = 1;
  private _maskTextures: WebGLTexture[] = [];

  constructor() {
    super(30);
    this.vertexShaderSource = vertexShaderSource;
    this.fragmentShaderSource = fragmentShaderSource;
  }

  protected setupUniforms(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    init: EffectInit,
  ): void {
    super.setupUniforms(gl, program, init);

    this._numMasksUniformLocation = gl.getUniformLocation(program, 'uNumMasks');
    this._marginSizeUniformLocation = gl.getUniformLocation(program, 'uMarginSize');
    gl.uniform1i(this._numMasksUniformLocation, this._numMasks);

    // We know the max number of textures, pre-allocate 3.
    this._maskTextures = preAllocateTextures(gl, 3);
  }

  apply(form: CanvasForm, frameContext: EffectFrameContext, _tracklets: Tracklet[]) {
    const { frameIndex } = frameContext;
    const gl = this._gl;
    const program = this._program;

    if (!program) {
      return;
    }

    for (let index = 0; index < _tracklets.length; index++) {
      const tracklet = _tracklets[index];
      invariant(gl !== null, 'WebGL2 context is required');
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // const blockSize = [5, 10, 15, 20, 25, 30][this.variant];
      // const marginSize = [5, 10, 15, 20, 25, 30][frameContext.margin];

      const blockSize = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40][tracklet.resolution];
      const marginSize = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40][tracklet.margin];

      // dynamic uniforms per frame
      gl.uniform1i(this._numMasksUniformLocation, frameContext.masks.length);
      gl.uniform1f(gl.getUniformLocation(program, 'uBlockSize'), blockSize);
      gl.uniform1f(this._marginSizeUniformLocation, marginSize);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._frameTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        frameContext.width,
        frameContext.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        frameContext.frame,
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      if (frameIndex >= tracklet?.startFrame && frameIndex <= tracklet?.endFrame) {
        // Create and bind 2D textures for each mask
        // frameContext.masks.forEach((mask, index) => {

        const decodedMask = decode([frameContext.masks[index].bitmap as RLEObject]);
        const maskData = decodedMask.data as Uint8Array;

        gl.uniform1f(gl.getUniformLocation(program, 'uBlockSize'), blockSize);
        gl.uniform1f(this._marginSizeUniformLocation, marginSize);
        gl.activeTexture(gl.TEXTURE0 + index + this._masksTextureUnitStart);
        gl.bindTexture(gl.TEXTURE_2D, this._maskTextures[index]);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.LUMINANCE,
          frameContext.height,
          frameContext.width,
          0,
          gl.LUMINANCE,
          gl.UNSIGNED_BYTE,
          maskData,
        );

        // dynamic uniforms per mask
        gl.uniform1i(
          gl.getUniformLocation(program, `uMaskTexture${index}`),
          this._masksTextureUnitStart + index,
        );
        // });

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        // Unbind textures
        gl.bindTexture(gl.TEXTURE_2D, null);
        tracklet.masks.forEach((_, index) => {
          gl.activeTexture(gl.TEXTURE0 + index + this._masksTextureUnitStart);
          gl.bindTexture(gl.TEXTURE_2D, null);
        });

        const ctx = form.ctx;
        invariant(this._canvas !== null, 'canvas is required');
        ctx.drawImage(this._canvas, 0, 0);
      }
    }

    // for (const tracklet of _tracklets) {

    // }
  }

  async cleanup(): Promise<void> {
    super.cleanup();

    if (this._gl != null) {
      // Delete mask textures to prevent memory leaks
      this._maskTextures.forEach(texture => {
        if (texture != null && this._gl != null) {
          this._gl.deleteTexture(texture);
        }
      });
      this._maskTextures = [];
    }
  }
}
