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
import emptyFunction from '@/common/utils/emptyFunction';
import {
  endFrameStateAtom,
  marginStateAtom,
  multiRangeStateAtom,
  resoultionStateAtom,
  startFrameStateAtom,
} from '@/demo/atoms';
import {INFERENCE_API_ENDPOINT, VIDEO_API_ENDPOINT} from '@/demo/DemoConfig';
import SettingsModal from '@/settings/SettingsModal';
import {
  Action,
  DEFAULT_SETTINGS,
  Settings,
  settingsReducer,
} from '@/settings/SettingsReducer';
import {useAtom} from 'jotai';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {useImmerReducer} from 'use-immer';

type ContextProps = {
  settings: Settings;
  dispatch: React.Dispatch<Action>;
  openModal: () => void;
  closeModal: () => void;
  hasChanged: boolean;
  resolution: number;
  margin: number;
  setResolution: (value: number) => void;
  setMargin: (value: number) => void;
  multiRange: number[];
  setMultiRange: (value: number[]) => void;
  startFrame: number;
  endFrame: number;
  setStartFrame: (value: number) => void;
  setEndFrame: (value: number) => void;
  frameData: any;
  setFrameData: any;
  vidoeDuration: number;
  setVidoeDuration: any;
};

export const SettingsContext = createContext<ContextProps>({
  settings: DEFAULT_SETTINGS,
  dispatch: emptyFunction,
  openModal: emptyFunction,
  closeModal: emptyFunction,
  hasChanged: false,
  resolution: 5,
  margin: 5,
  setResolution: emptyFunction,
  setMargin: emptyFunction,
  multiRange: [0, 10],
  setMultiRange: emptyFunction,
  startFrame: 0,
  endFrame: 1,
  setStartFrame: emptyFunction,
  setEndFrame: emptyFunction,
  frameData: null,
  setFrameData: emptyFunction,
  vidoeDuration: 0,
  setVidoeDuration: emptyFunction,
});

type Props = PropsWithChildren;

export default function SettingsContextProvider({children}: Props) {
  const [resolution, setResolution] = useAtom(resoultionStateAtom);
  const [margin, setMargin] = useAtom(marginStateAtom);
  const [multiRange, setMultiRange] = useAtom(multiRangeStateAtom);
  const [startFrame, setStartFrame] = useAtom(startFrameStateAtom);
  const [endFrame, setEndFrame] = useAtom(endFrameStateAtom);
  const [frameData, setFrameData] = useState<any>();
  const [vidoeDuration, setVidoeDuration] = useState<any>();
  const [state, dispatch] = useImmerReducer(
    settingsReducer,
    DEFAULT_SETTINGS,
    settings => {
      // Load the settings from local storage. Eventually use the reducer init
      // to handle initial loading.
      return settingsReducer(settings, {type: 'load-state'});
    },
  );

  const modalRef = useRef<HTMLDialogElement>(null);

  const openModal = useCallback(() => {
    modalRef.current?.showModal();
  }, [modalRef]);

  const handleCloseModal = useCallback(() => {
    modalRef.current?.close();
  }, [modalRef]);

  const hasChanged = useMemo(() => {
    return (
      VIDEO_API_ENDPOINT !== state.videoAPIEndpoint ||
      INFERENCE_API_ENDPOINT !== state.inferenceAPIEndpoint
    );
  }, [state.videoAPIEndpoint, state.inferenceAPIEndpoint]);

  const value = useMemo(
    () => ({
      settings: state,
      dispatch,
      openModal,
      closeModal: handleCloseModal,
      hasChanged,
      resolution,
      margin,
      setResolution,
      setMargin,
      multiRange,
      setMultiRange,
      startFrame,
      setStartFrame,
      endFrame,
      setEndFrame,
      frameData,
      setFrameData,
      vidoeDuration,
      setVidoeDuration,
    }),
    [
      state,
      dispatch,
      openModal,
      handleCloseModal,
      hasChanged,
      resolution,
      margin,
      startFrame,
      endFrame,
      multiRange,
      frameData,
      vidoeDuration,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
      <SettingsModal ref={modalRef} />
    </SettingsContext.Provider>
  );
}
