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

    function handle(event: KeyboardEvent | MouseEvent, key: string) {
      if (pressed.has(key)) {
        return;
      }

      pressed.add(key);

      let modifier: string | null = null;
      if (event.shiftKey) {
        modifier = 'SHIFT';
      } else if (event.ctrlKey) {
        modifier = 'CONTROL';
      } else if (event.altKey) {
        modifier = 'ALT';
      }
      sendKeyEvent(key, modifier, event);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt') {
        return;
      }

      const key = extractKey(event);
      handle(event, key);
    }

    function handleKeyUp(event: KeyboardEvent) {
      pressed.delete(extractKey(event));
    }

    function handleMouseDown(event: MouseEvent) {
      if ([0, 2].includes(event.button)) {
        return;
      }

      handle(event, `M${event.button + 1}`);
    }

    function handleMouseUp(event: MouseEvent) {
      if ([0, 2].includes(event.button)) {
        return;
      }

      pressed.delete(`M${event.button + 1}`);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [sendKeyEvent]);

  return <div></div>;
};
