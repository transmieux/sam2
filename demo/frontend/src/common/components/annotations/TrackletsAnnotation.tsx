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
import {useEffect, useState} from 'react';
import TrackletSwimlane from '@/common/components/annotations/TrackletSwimlane';
import useTracklets from '@/common/components/annotations/useTracklets';
import useVideo from '@/common/components/video/editor/useVideo';
import {BaseTracklet} from '@/common/tracker/Tracker';
import {decodeStream} from '@/common/codecs/VideoDecoder';
import {streamFile} from '@/common/utils/FileUtils';
import {streamingStateAtom, VideoData} from '@/demo/atoms';
import useSettingsContext from '@/settings/useSettingsContext';
import {m, spacing} from '@/theme/tokens.stylex';
import stylex from '@stylexjs/stylex';
import {useAtomValue} from 'jotai';
import useVideoEffect from '../video/editor/useVideoEffect';
import MultiRangeSlider from 'multi-range-slider-react';
import './range.css';

const styles = stylex.create({
  container: {
    marginTop: m[3],
    height: 250,
    paddingHorizontal: spacing[4],
    '@media screen and (max-width: 768px)': {
      height: 25,
    },
  },
});

type Props = {
  inputVideo: VideoData;
};

export default function TrackletsAnnotation({inputVideo}: Props) {
  const video = useVideo();
  const tracklets = useTracklets();
  const streamingState = useAtomValue(streamingStateAtom);
  const setEffect = useVideoEffect();
  const [frameData, setFrameData] = useState<any>();

  const {
    resolution,
    setResolution,
    margin,
    setMargin,
    multiRange,
    setMultiRange,
    setStartFrame,
    setEndFrame,
  } = useSettingsContext();

  const duration = frameData?.numFrames / frameData?.fps;
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

  useEffect(() => {
    const getMetaData = async () => {
      const fileStream = streamFile(inputVideo.url, {
        credentials: 'same-origin',
        cache: 'no-store',
      });

      const data = await decodeStream(fileStream, async progress => {
        return progress;
      });

      setFrameData(data);
      setStartFrame(0);
      setEndFrame(data?.numFrames);
      video?.startFrame(0);
      video?.endFrame(data?.numFrames);
    };

    getMetaData();
    setMultiRange([0, Math.floor(duration)]);
  }, [inputVideo.url, duration, video]);

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
        <div className="ml-[64px]">
          {/* Resoluation Range */}
          <div className="mt-4">
            <h6 className="font-semibold mb-2">Select Time Frame</h6>
            <MultiRangeSlider
              min={0}
              max={Math.floor(duration)} // video duration
              step={1}
              minValue={multiRange[0]}
              maxValue={multiRange[1]}
              preventWheel={true}
              onChange={e => {
                const startFrame = Math.round(
                  e.minValue * (frameData?.numFrames / Math.floor(duration)),
                );
                const endFrame = Math.round(
                  e.maxValue * (frameData?.numFrames / Math.floor(duration)),
                );
                video?.startFrame(startFrame);
                video?.endFrame(endFrame);
                video?.resolution(resolution);
                video?.margin(margin);

                setMultiRange([e.minValue, e.maxValue]);
                setStartFrame(startFrame);
                setEndFrame(endFrame);

                setEffect('PixelateMask', 1, {
                  variant: resolution,
                });
              }}
            />
          </div>

          <div className="mt-3">
            <h6 className="font-semibold">Mosaic Resoluation</h6>
            <div>
              <input
                type="range"
                min={0}
                max={5}
                name="resolution"
                value={resolution}
                onChange={e => {
                  setResolution(parseInt(e.target.value));
                  video?.margin(margin);
                  setEffect('PixelateMask', 1, {
                    variant: parseInt(e.target.value),
                  });
                  video?.resolution(parseInt(e.target.value));
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
          <div className="mt-3">
            <h6 className="font-semibold">Mosaic Margin</h6>
            <div>
              <input
                type="range"
                min={0}
                max={5}
                name="margin"
                value={margin}
                onChange={e => {
                  setMargin(parseInt(e.target.value));
                  setEffect('MarginPixel', 1, {
                    variant: parseInt(e.target.value),
                  });
                  video?.margin(parseInt(e.target.value));
                }}
                className="range w-full cursor-pointer h-1"
                step="1"
              />
              <div className="flex w-full justify-between px-2 text-xs">
                {resolutionNum.map(num => {
                  return <span>{num.label}</span>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
