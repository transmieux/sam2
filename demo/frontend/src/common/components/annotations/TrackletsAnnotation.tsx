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
import {useEffect} from 'react';
import TrackletSwimlane from '@/common/components/annotations/TrackletSwimlane';
import useTracklets from '@/common/components/annotations/useTracklets';
import useVideo from '@/common/components/video/editor/useVideo';
import {BaseTracklet} from '@/common/tracker/Tracker';
import {decodeStream} from '@/common/codecs/VideoDecoder';
import {streamFile} from '@/common/utils/FileUtils';
import {
  activeTrackletObjectAtom,
  streamingStateAtom,
  VideoData,
} from '@/demo/atoms';
import useSettingsContext from '@/settings/useSettingsContext';
import {m, spacing} from '@/theme/tokens.stylex';
import stylex from '@stylexjs/stylex';
import {useAtomValue} from 'jotai';
import useVideoEffect from '../video/editor/useVideoEffect';
import MultiRangeSlider from 'multi-range-slider-react';
import './range.css';

const styles = stylex.create({
  container: streamingState => ({
    marginTop: m[3],
    height: streamingState === 'full' ? 250 : 20,
    paddingHorizontal: spacing[4],
    '@media screen and (max-width: 768px)': {
      height: streamingState === 'full' ? 25 : 20,
    },
  }),
});

type Props = {
  inputVideo: VideoData;
  objectId: number;
};

export default function TrackletsAnnotation({inputVideo, objectId}: Props) {
  const video = useVideo();
  const setEffect = useVideoEffect();
  const tracklets = useTracklets();
  const streamingState = useAtomValue(streamingStateAtom);

  const activeTracklet = useAtomValue(activeTrackletObjectAtom)!;

  const {
    setMargin,
    setMultiRange,
    setStartFrame,
    setEndFrame,
    frameData,
    setFrameData,
    setVidoeDuration,
  } = useSettingsContext();

  const duration = frameData?.numFrames / frameData?.fps;
  function handleSelectFrame(_tracklet: BaseTracklet, index: number) {
    if (video !== null) {
      video.frame = index;
    }
  }
  const resolutionNum = [
    {label: 5, value: 5},
    {label: 10, value: 10},
    {label: 15, value: 15},
    {label: 20, value: 20},
    {label: 25, value: 25},
    {label: 30, value: 30},
  ];

  // const resolutionNum = Array.from({length: 51}, (_, i) => {
  //   // Start from 5 and add 0.5 for each step
  //   const value = (5 + i * 0.5).toFixed(1);
  //   return {label: value, value: parseFloat(value)};
  // });

  useEffect(() => {
    getMetaData();
    setMultiRange([0, Math.floor(duration)]);
    setVidoeDuration(Math.floor(duration));
  }, [inputVideo.url, duration, video]);

  useEffect(() => {
    if (activeTracklet !== null && duration && frameData?.numFrames) {
      video?.updateObject(objectId, 'endFrame', frameData?.numFrames);
      video?.updateObject(objectId, 'endVideoTime', Math.floor(duration));
    }
  }, [frameData, duration]);

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
    video?.startFrame(objectId, 0);
    video?.endFrame(objectId, data?.numFrames);
  };

  return (
    <div {...stylex.props(styles.container(streamingState))}>
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
              step={0.1}
              minValue={activeTracklet?.startVideoTime}
              maxValue={activeTracklet?.endVideoTime}
              preventWheel={true}
              onChange={e => {
                const startFrame = Math.round(
                  e.minValue * (frameData?.numFrames / Math.floor(duration)),
                );
                const endFrame = Math.round(
                  e.maxValue * (frameData?.numFrames / Math.floor(duration)),
                );

                video?.updateObject(objectId, 'startFrame', startFrame);
                video?.updateObject(objectId, 'endFrame', endFrame);
                video?.updateObject(
                  objectId,
                  'resolution',
                  activeTracklet?.resolution,
                );

                video?.updateObject(objectId, 'startVideoTime', e.minValue);
                video?.updateObject(objectId, 'endVideoTime', e.maxValue);
                video?.updateObject(objectId, 'margin', activeTracklet?.margin);

                video?.startFrame(objectId, startFrame);
                video?.endFrame(objectId, endFrame);
                video?.resolution(objectId, activeTracklet?.resolution);
                video?.margin(objectId, activeTracklet?.margin);

                setMultiRange([e.minValue, e.maxValue]);
                setStartFrame(startFrame);
                setEndFrame(endFrame);

                setEffect('PixelateMask', 1, {
                  variant: activeTracklet?.resolution,
                });
              }}
            />
          </div>

          <div className="mt-3">
            <h6 className="font-semibold">Mosaic Resoluation</h6>
            <div className="sam2-range">
              <input
                type="range"
                min={5}
                max={30}
                name="resolution"
                value={activeTracklet?.resolution}
                onChange={e => {
                  video?.margin(objectId, activeTracklet?.margin);
                  video?.updateObject(
                    objectId,
                    'margin',
                    activeTracklet?.margin,
                  );

                  setEffect('PixelateMask', 1, {
                    variant: parseInt(e.target.value),
                  });

                  video?.updateObject(
                    objectId,
                    'resolution',
                    parseInt(e.target.value),
                  );
                  video?.resolution(objectId, parseInt(e.target.value));
                }}
                className="range w-full h-3 cursor-pointer"
                // step={0.5}
                step={5}
                aria-orientation="horizontal"
                id="steps-range-slider-usage"
              />
              <div className="flex w-full justify-between px-2 text-xs">
                {resolutionNum.map(num => (
                  <span key={num.value}>{num.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Margin Range */}
          <div className="mt-3">
            <h6 className="font-semibold">Mosaic Margin</h6>
            <div className="sam2-range">
              <input
                type="range"
                min={5}
                max={30}
                name="margin"
                value={activeTracklet?.margin}
                onChange={e => {
                  setMargin(parseInt(e.target.value));
                  setEffect('MarginPixel', 1, {
                    variant: parseInt(e.target.value),
                  });
                  video?.margin(objectId, parseInt(e.target.value));
                  video?.updateObject(
                    objectId,
                    'margin',
                    parseInt(e.target.value),
                  );
                }}
                className="range w-full cursor-pointer h-3"
                // step={0.5}
                step={5}
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
