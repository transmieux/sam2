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
import useRestartSession from '@/common/components/session/useRestartSession';
import useMessagesSnackbar from '@/common/components/snackbar/useDemoMessagesSnackbar';
import useVideo from '@/common/components/video/editor/useVideo';
import {isPlayingAtom, isStreamingAtom, labelTypeAtom} from '@/demo/atoms';
import useSettingsContext from '@/settings/useSettingsContext';
import {Reset} from '@carbon/icons-react';
import stylex from '@stylexjs/stylex';
import {useAtomValue, useSetAtom} from 'jotai';
import {useState} from 'react';
import {Button, Loading} from 'react-daisyui';

const styles = stylex.create({
  container: {
    display: 'flex',
    alignItems: 'center',
  },
});

type Props = {
  onRestart: () => void;
};

export default function ClearAllPointsInVideoButton({onRestart}: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isPlaying = useAtomValue(isPlayingAtom);
  const isStreaming = useAtomValue(isStreamingAtom);
  const setLabelType = useSetAtom(labelTypeAtom);
  const {clearMessage} = useMessagesSnackbar();
  const {restartSession} = useRestartSession();
  const {
    setMultiRange,
    setStartFrame,
    setEndFrame,
    vidoeDuration,
    setResolution,
    setMargin,
  } = useSettingsContext();

  const video = useVideo();

  async function handleRestart() {
    if (video === null) {
      return;
    }

    setIsLoading(true);
    if (isPlaying) {
      video.pause();
    }
    if (isStreaming) {
      await video.abortStreamMasks();
    }
    const isSuccessful = await video.clearPointsInVideo();
    if (!isSuccessful) {
      await restartSession();
    }
    video.frame = 0;
    video?.startFrame(0);
    video?.endFrame(video.numberOfFrames);
    video.margin(5);
    video.resolution(5);
    setEndFrame(video.numberOfFrames);
    setStartFrame(0);
    setMultiRange([0, vidoeDuration]);
    setResolution(5);
    setMargin(5);
    setLabelType('positive');
    onRestart();
    clearMessage();
    setIsLoading(false);
  }

  return (
    <div {...stylex.props(styles.container)}>
      <Button
        color="ghost"
        onClick={handleRestart}
        className="!px-4 !rounded-full font-medium text-black hover:bg-[#f0f0f0]"
        startIcon={isLoading ? <Loading size="sm" /> : <Reset size={20} />}>
        Start over
      </Button>
    </div>
  );
}
