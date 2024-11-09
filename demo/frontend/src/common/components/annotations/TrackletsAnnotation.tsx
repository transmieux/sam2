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
import TrackletSwimlane from '@/common/components/annotations/TrackletSwimlane';
import useTracklets from '@/common/components/annotations/useTracklets';
import useVideo from '@/common/components/video/editor/useVideo';
import {BaseTracklet} from '@/common/tracker/Tracker';
import {streamingStateAtom} from '@/demo/atoms';
import {m, spacing} from '@/theme/tokens.stylex';
import stylex from '@stylexjs/stylex';
import {useAtomValue} from 'jotai';
import useVideoEffect from '../video/editor/useVideoEffect';
import MultiRangeSlider from 'multi-range-slider-react';

const styles = stylex.create({
  container: {
    marginTop: m[3],
    height: 200,
    paddingHorizontal: spacing[4],
    '@media screen and (max-width: 768px)': {
      height: 25,
    },
  },
});

export default function TrackletsAnnotation() {
  const video = useVideo();
  const tracklets = useTracklets();
  const streamingState = useAtomValue(streamingStateAtom);
  const setEffect = useVideoEffect();

  function handleSelectFrame(_tracklet: BaseTracklet, index: number) {
    if (video !== null) {
      video.frame = index;
    }
  }
  const resolutionNum = [
    {label: 5, value: 0},
    {label: 10, value: 1},
    {label: 15, value: 2},
    {label: 20, value: 3},
    {label: 25, value: 4},
    {label: 30, value: 5},
  ];

  const marginNum = [
    // {label: 0, value: 0},
    {label: 5, value: 0},
    {label: 10, value: 1},
    {label: 15, value: 2},
    {label: 20, value: 3},
    {label: 25, value: 4},
    {label: 30, value: 5},
  ];
  return (
    <div {...stylex.props(styles.container)}>
      {tracklets.map(tracklet => (
        <TrackletSwimlane
          key={tracklet.id}
          tracklet={tracklet}
          onSelectFrame={handleSelectFrame}
        />
      ))}
      {streamingState === 'full' && (
        <>
          {/* <MultiRangeSlider
              min={0}
              max={20}
              step={1}
              minValue={0}
              maxValue={10}
              preventWheel={false}
              // onChange={(e) => {
              //   const startFrame = Math.round(
              //     e.minValue * (totalFrames / duration)
              //   );
              //   const endFrame = Math.round(
              //     e.maxValue * (totalFrames / duration)
              //   );
              //   handleRangeValueChange(selectedObject, "startTime", null, [
              //     e.minValue,
              //     e.maxValue,
              //     startFrame,
              //     endFrame,
              //   ]);
              // }}
            /> */}
          {/* <div className="flex justify-between mt-4">
          <p>{0}</p>
          <p>{12}</p>
        </div> */}
          {/* Resoluation Range */}
          <div className="mt-4">
            <h6 className="font-semibold">Mosaic Resoluation</h6>
            <div>
              <input
                type="range"
                min={0}
                max={5}
                name="resolution"
                defaultValue={1}
                onChange={e => {
                  setEffect('PixelateMask', 1, {
                    variant: parseInt(e.target.value),
                  });
                }}
                className="range w-full h-1 cursor-pointer"
                step="1"
                aria-orientation="horizontal"
                id="steps-range-slider-usage"
              />
              <div className="flex w-full justify-between px-2 text-xs">
                {resolutionNum.map(num => {
                  return <span>{num.label}</span>;
                })}
              </div>
            </div>
          </div>

          {/* Margin Range */}
          <div>
            <h6 className="font-semibold">Mosaic Margin</h6>
            <div>
              <input
                type="range"
                min={0}
                max={5}
                name="margin"
                defaultValue={1}
                onChange={e => {
                  setEffect('MarginPixel', 1, {
                    variant: parseInt(e.target.value),
                  });
                }}
                className="range w-full cursor-pointer h-1"
                step="1"
              />
              <div className="flex w-full justify-between px-2 text-xs">
                {marginNum.map(num => {
                  return <span>{num.label}</span>;
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
