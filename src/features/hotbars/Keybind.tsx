import { FC } from 'react';

import { HotbarSlotKeybindState } from './hotbarSlice';

import style from './HotbarSlot.module.css';

type KeybindProps = {
  keybind: HotbarSlotKeybindState;
};

const keyDispayMap: Record<string, string> = {
  Minus: '-',
  Equal: '=',
  NAdd: 'N+',
  NMultiply: 'N*',
  NDivide: 'N/',
  NSubtract: 'N-',
  NEnter: 'NE',
  ArrowDown: '(D)',
  ArrowUp: '(U)',
  ArrowLeft: '(L)',
  ArrowRight: '(R)',
  PageUp: 'PU',
  PageDown: 'PD',
  Home: 'Home',
  End: 'End',
  Clear: 'Clr',
  Insert: 'Ins',
};

function keyDisplay(code: string | null) {
  if (!code) {
    return null;
  }

  code = code.replace('Digit', '').replace('Key', '').replace('Numpad', 'N');

  if (keyDispayMap[code]) {
    return keyDispayMap[code];
  }

  return code;
}

export const Keybind: FC<KeybindProps> = ({ keybind }) => {
  let modifier: string | null = null;
  const key = keyDisplay(keybind.key);

  switch (keybind.modifier) {
    case 'SHIFT':
      modifier = '⬩';
      break;
    case 'CONTROL':
      modifier = 'ᶜ';
      break;
    case 'ALT':
      modifier = 'ᵃ';
      break;
  }

  return keybind.key ? (
    <div className={style.keybind}>
      {modifier}
      {key}
    </div>
  ) : null;
};
