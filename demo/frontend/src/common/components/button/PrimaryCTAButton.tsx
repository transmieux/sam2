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
import GradientBorder from '@/common/components/button/GradientBorder';
import type {ReactNode} from 'react';

type Props = {
  disabled?: boolean;
  endIcon?: ReactNode;
} & React.DOMAttributes<HTMLButtonElement>;

export default function PrimaryCTAButton({
  children,
  disabled,
  endIcon,
  ...props
}: Props) {
  return (
    // <GradientBorder disabled={disabled}>
      <button
        className={`btn ${disabled && 'btn-disabled'} !rounded-full !text-black border-1 border-black hover:bg-[#f0f0f0] bg-white`}
        {...props}>
        {children}
        {endIcon != null && endIcon}  
      </button>
    // </GradientBorder>
  );
}
