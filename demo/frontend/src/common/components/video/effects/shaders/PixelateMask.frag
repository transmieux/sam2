#version 300 es
// Copyright (c) Meta Platforms, Inc. and affiliates.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

precision mediump float;

in vec2 vTexCoord;

uniform sampler2D uSampler;
uniform mediump vec2 uSize;
uniform lowp float uBlockSize;
uniform int uNumMasks;
uniform sampler2D uMaskTexture0;
uniform sampler2D uMaskTexture1;
uniform sampler2D uMaskTexture2;
uniform float uMarginSize;

out vec4 fragColor;

bool checkNeighborhood(vec2 coord, sampler2D maskTexture) {
    float margin = uMarginSize / uSize.x; // Convert margin to UV space
    if(texture(maskTexture, vec2(coord.y, coord.x)).r > 0.0) {
        return true;
    }
    
    // Check in a square around the current pixel
    for(float x = -margin; x <= margin; x += margin/2.0) {
        for(float y = -margin; y <= margin; y += margin/2.0) {
            vec2 sampleCoord = vec2(coord.y + y, coord.x + x);
            // Ensure we don't sample outside texture bounds
            if(sampleCoord.x >= 0.0 && sampleCoord.x <= 1.0 && 
               sampleCoord.y >= 0.0 && sampleCoord.y <= 1.0) {
                if(texture(maskTexture, sampleCoord).r > 0.0) {
                    return true;
                }
            }
        }
    }
    return false;
}


void main() {
  vec4 color = texture(uSampler, vTexCoord);
  vec2 uv = vTexCoord.xy;
  float dx = uBlockSize / uSize.x;
  float dy = uBlockSize / uSize.y;

  vec4 color1 = vec4(0.0f);
  vec4 color2 = vec4(0.0f);
  vec4 color3 = vec4(0.0f);

  vec2 sampleCoord = (vec2(dx * floor((uv.x / dx)), dy * floor((uv.y / dy))) +
  vec2(dx * ceil((uv.x / dx)), dy * ceil((uv.y / dy)))) / 2.0f;
  vec4 frameColor = texture(uSampler, sampleCoord);
  color = frameColor;

bool overlap = false;

    if(uNumMasks > 0) {
        overlap = overlap || checkNeighborhood(vTexCoord, uMaskTexture0);
    }
    if(uNumMasks > 1) {
        overlap = overlap || checkNeighborhood(vTexCoord, uMaskTexture1);
    }
    if(uNumMasks > 2) {
        overlap = overlap || checkNeighborhood(vTexCoord, uMaskTexture2);
    }

    if(overlap) {
        fragColor = color;
    } else {
        fragColor = vec4(0.0f);
    }
}