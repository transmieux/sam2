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
import {BaseTracklet} from '@/common/tracker/Tracker';

type Props = {
  objectId: number;
  active: boolean;
  tracklet: BaseTracklet;
};

function CustomButton({className, ...props}: ButtonProps) {
  return (
    <Button
      size="sm"
      color="ghost"
      className={`font-medium bg-gray-100 hover:bg-gray-300 px-2 h-10 ${className}`}
      {...props}>
      {props.children}
    </Button>
  );
}

export default function ObjectActions({objectId, active, tracklet}: Props) {
  const {setResolution, setMargin, setMultiRange, frameData, vidoeDuration} =
    useSettingsContext();
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
      tracklet?.startVideoTime * (frameData?.numFrames / vidoeDuration),
    );
    const endFrame = Math.round(
      tracklet?.endVideoTime * (frameData?.numFrames / vidoeDuration),
    );

    video?.updateObject(objectId, 'startFrame', startFrame);
    video?.updateObject(objectId, 'endFrame', endFrame);
    video?.updateObject(objectId, 'resolution', tracklet?.resolution);
    video?.updateObject(objectId, 'margin', tracklet?.margin);

    video?.startFrame(objectId, startFrame);
    video?.endFrame(objectId, endFrame);
    video?.resolution(objectId, tracklet?.resolution);
    video?.margin(objectId, tracklet?.margin);
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
        <div className="mb-4 ml-2">
          <div className="flex justify-start my-2  text-center">
            <span className="w-[100px] text-left">Section :</span>
            <div className="flex justify-around">
              <input
                type="number"
                min={0}
                value={tracklet?.startVideoTime}
                max={tracklet?.endVideoTime}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || parseInt(val) >= tracklet?.endVideoTime) {
                    setMultiRange([0, vidoeDuration]);
                    video?.updateObject(objectId, 'startVideoTime', 0);
                    video?.updateObject(
                      objectId,
                      'endVideoTime',
                      vidoeDuration,
                    );
                    call();
                  } else {
                    setMultiRange([parseInt(val), tracklet?.endVideoTime]);
                    video?.updateObject(
                      objectId,
                      'startVideoTime',
                      parseInt(val),
                    );
                    video?.updateObject(
                      objectId,
                      'endVideoTime',
                      tracklet?.endVideoTime,
                    );
                    call();
                  }
                  setEffect('PixelateMask', 1, {
                    variant: tracklet?.resolution,
                  });
                }}
                className={`w-[50px] rounded-md text-center bg-white text-black`}
              />
              <pre> ~ </pre>
              <input
                type="number"
                min={tracklet?.startVideoTime}
                value={tracklet?.endVideoTime}
                max={vidoeDuration}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || parseInt(val) <= tracklet?.startVideoTime) {
                    setMultiRange([tracklet.startVideoTime, vidoeDuration]);
                    video?.updateObject(
                      objectId,
                      'startVideoTime',
                      tracklet?.startVideoTime,
                    );
                    video?.updateObject(
                      objectId,
                      'endVideoTime',
                      vidoeDuration,
                    );
                    call();
                  } else {
                    call();
                    setMultiRange([tracklet?.startVideoTime, parseInt(val)]);

                    video?.updateObject(
                      objectId,
                      'startVideoTime',
                      tracklet?.startVideoTime,
                    );
                    video?.updateObject(
                      objectId,
                      'endVideoTime',
                      parseInt(val),
                    );
                  }
                  setEffect('PixelateMask', 1, {
                    variant: tracklet?.resolution,
                  });
                }}
                className={`w-[50px] rounded-md text-center bg-white text-black`}
              />
            </div>
          </div>
          <div className="flex justify-start my-2">
            <span className="w-[100px]">Resoluation:</span>
            <div className="flex justify-between">
              <input
                type="number"
                value={tracklet?.resolution}
                min={5}
                max={30}
                // step={1}
                step={5}
                onChange={e => {
                  setResolution(parseInt(e.target.value));

                  video?.resolution(objectId, parseInt(e.target.value));
                  video?.margin(objectId, tracklet?.margin);
                  video?.updateObject(
                    objectId,
                    'resolution',
                    parseInt(e.target.value),
                  );
                  video?.updateObject(objectId, 'margin', tracklet?.margin);

                  setEffect('PixelateMask', 1, {
                    variant: parseInt(e.target.value),
                  });
                }}
                className={`w-10 rounded-md text-center bg-white text-black`}
              />
            </div>
          </div>
          <div className="flex justify-start my-2">
            <span className="w-[100px]">Margin :</span>
            <div className="flex justify-between ">
              <input
                type="number"
                value={tracklet?.margin}
                min={5}
                max={30}
                // step={1}
                step={5}
                onChange={e => {
                  setMargin(parseInt(e.target.value));

                  video?.margin(objectId, parseInt(e.target.value));
                  video?.resolution(objectId, tracklet?.resolution);
                  video?.updateObject(
                    objectId,
                    'margin',
                    parseInt(e.target.value),
                  );
                  video?.updateObject(
                    objectId,
                    'resolution',
                    tracklet?.resolution,
                  );

                  setEffect('MarginPixel', 1, {
                    variant: parseInt(e.target.value),
                  });
                }}
                className={`w-10 rounded-md text-center bg-white text-black`}
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
