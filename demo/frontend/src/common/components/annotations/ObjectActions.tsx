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
import PointsToggle from '@/common/components/annotations/PointsToggle';
import useVideo from '@/common/components/video/editor/useVideo';
import useReportError from '@/common/error/useReportError';
import {
  activeTrackletObjectIdAtom,
  isPlayingAtom,
  isStreamingAtom,
  streamingStateAtom,
} from '@/demo/atoms';
import useSettingsContext from '@/settings/useSettingsContext';
import {
  AddFilled,
  Select_02,
  SubtractFilled,
  TrashCan,
} from '@carbon/icons-react';
import {useAtom, useAtomValue} from 'jotai';
import {useState} from 'react';
import type {ButtonProps} from 'react-daisyui';
import {Button} from 'react-daisyui';
import useVideoEffect from '../video/editor/useVideoEffect';

type Props = {
  objectId: number;
  active: boolean;
};

function CustomButton({className, ...props}: ButtonProps) {
  return (
    <Button
      size="sm"
      color="ghost"
      className={`font-medium border-none hover:bg-black  px-2 h-10 ${className}`}
      {...props}>
      {props.children}
    </Button>
  );
}

export default function ObjectActions({objectId, active}: Props) {
  const {
    resolution,
    margin,
    multiRange,
    setResolution,
    setMargin,
    setMultiRange,
    frameData,
    vidoeDuration
  } = useSettingsContext();
  const [isRemovingObject, setIsRemovingObject] = useState<boolean>(false);
  const [activeTrackId, setActiveTrackletId] = useAtom(
    activeTrackletObjectIdAtom,
  );
  const isStreaming = useAtomValue(isStreamingAtom);
  const isPlaying = useAtom(isPlayingAtom);
  const streamingState = useAtomValue(streamingStateAtom);
  const video = useVideo();
  const reportError = useReportError();
  const setEffect = useVideoEffect();

  async function handleRemoveObject(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    try {
      event.stopPropagation();
      setIsRemovingObject(true);
      if (isStreaming) {
        await video?.abortStreamMasks();
      }
      if (isPlaying) {
        video?.pause();
      }
      await video?.deleteTracklet(objectId);
    } catch (error) {
      reportError(error);
    } finally {
      setIsRemovingObject(false);
      if (activeTrackId === objectId) {
        setActiveTrackletId(null);
      }
    }
  }
  
  const call = () => {
    const startFrame = Math.round(
      multiRange[0] * (frameData?.numFrames / vidoeDuration),
    );
    const endFrame = Math.round(
      multiRange[1] * (frameData?.numFrames / vidoeDuration),
    );
    video?.startFrame(startFrame);
    video?.endFrame(endFrame);
    video?.resolution(resolution);
    video?.margin(margin);
  };

  return (
    <div>
      {active && (
        <div className="text-sm mt-1 leading-snug text-gray-900 hidden md:block ml-2 md:mb-4">
          Select <AddFilled size={14} className="inline" /> to add areas to the
          object and <SubtractFilled size={14} className="inline" /> to remove
          areas from the object in the video. Click on an existing point to
          delete it.
        </div>
      )}
      {streamingState === 'full' ? (
        <div className='mb-4 ml-2'>
          <div className="flex justify-start my-2  text-center">
            <span className="w-[100px] text-left">Section :</span>
            <div className="flex justify-around">
              <input
                type="number"
                min={0}
                value={multiRange[0]}
                max={multiRange[1]} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || parseInt(val) >= multiRange[1]) {
                    setMultiRange([0, vidoeDuration]);
                    call();
                  } else {
                    setMultiRange([parseInt(val), multiRange[1]]);
                    const startFrame = Math.round(
                      parseInt(val) *
                        (frameData?.numFrames / vidoeDuration),
                    );
                    const endFrame = Math.round(
                      multiRange[1] *
                        (frameData?.numFrames / vidoeDuration),
                    );
                    video?.startFrame(startFrame);
                    video?.endFrame(endFrame);
                    video?.resolution(resolution);
                    video?.margin(margin);
                  }
                  setEffect('PixelateMask', 1, {
                    variant: resolution,
                  });
                }}
                className={`w-[50px] rounded-md text-center`}
              />
              <pre> ~ </pre>
              <input
                type="number"
                min={multiRange[0]}
                value={multiRange[1]}
                max={vidoeDuration} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || parseInt(val) <= multiRange[0]) {
                    setMultiRange([multiRange[0], vidoeDuration]);
                    call();
                  } else {
                    const startFrame = Math.round(
                      multiRange[0] *
                        (frameData?.numFrames / vidoeDuration),
                    );
                    const endFrame = Math.round(
                      parseInt(val) *
                        (frameData?.numFrames / vidoeDuration),
                    );
                    video?.startFrame(startFrame);
                    video?.endFrame(endFrame);
                    video?.resolution(resolution);
                    video?.margin(margin);
                    setMultiRange([multiRange[0], parseInt(val)]);
                  }
                  setEffect('PixelateMask', 1, {
                    variant: resolution,
                  });
                }}
                className={`w-[50px] rounded-md text-center`}
              />
            </div>
          </div>
          <div className="flex justify-start my-2">
            <span className="w-[100px]">Resoluation:</span>
            <div className="flex justify-between">
              <input
                type="number"
                value={resolution}
                min={5}
                max={30}
                // step={1}
                step={5}
                onChange={e => {
                  setResolution(parseInt(e.target.value));
                  video?.resolution(parseInt(e.target.value));
                  video?.margin(margin);
                  setEffect('PixelateMask', 1, {
                    variant: parseInt(e.target.value),
                  });
                }}
                className={`w-10 rounded-md text-center`}
              />
            </div>
          </div>
          <div className="flex justify-start my-2">
            <span className="w-[100px]">Margin :</span>
            <div className="flex justify-between ">
              <input
                type="number"
                value={margin}
                min={5}
                max={30}
                // step={1}
                step={5}
                onChange={e => {
                  setMargin(parseInt(e.target.value));
                  video?.margin(parseInt(e.target.value));
                  video?.resolution(resolution);
                  setEffect('MarginPixel', 1, {
                    variant: parseInt(e.target.value),
                  });
                }}
                className={`w-10 rounded-md text-center`}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex justify-between items-center md:mt-2 mt-0">
        {active ? (
          <PointsToggle />
        ) : (
          <>
            <CustomButton startIcon={<Select_02 size={24} />}>
              Edit selection
            </CustomButton>
            <CustomButton
              loading={isRemovingObject}
              onClick={handleRemoveObject}
              startIcon={!isRemovingObject && <TrashCan size={24} />}>
              <span className="hidden md:inline">Clear</span>
            </CustomButton>
          </>
        )}
      </div>
    </div>
  );
}
