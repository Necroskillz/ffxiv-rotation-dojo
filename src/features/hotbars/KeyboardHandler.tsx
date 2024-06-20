import { FC, useEffect } from 'react';
import { useKeyEvents } from './hooks';

const specialKeys = new Set();
specialKeys.add('ArrowDown');
specialKeys.add('ArrowUp');
specialKeys.add('ArrowLeft');
specialKeys.add('ArrowRight');
specialKeys.add('PageUp');
specialKeys.add('PageDown');
specialKeys.add('Home');
specialKeys.add('End');
specialKeys.add('Clear');
specialKeys.add('Insert');

export const KeyboardHandler: FC = () => {
  const [, sendKeyEvent] = useKeyEvents();

  useEffect(() => {
    const pressed: Set<string> = new Set();

    function extractKey(event: KeyboardEvent) {
      if (specialKeys.has(event.key)) {
        return event.key;
      }

      return event.code;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt') {
        return;
      }

      if (pressed.has(event.code)) {
        return;
      }

      pressed.add(event.code);

      let modifier: string | null = null;
      if (event.shiftKey) {
        modifier = 'SHIFT';
      } else if (event.ctrlKey) {
        modifier = 'CONTROL';
      } else if (event.altKey) {
        modifier = 'ALT';
      }

      sendKeyEvent(extractKey(event), modifier, event);
    }

    function handleKeyUp(event: KeyboardEvent) {
      pressed.delete(event.code);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [sendKeyEvent]);

  return <div></div>;
};
