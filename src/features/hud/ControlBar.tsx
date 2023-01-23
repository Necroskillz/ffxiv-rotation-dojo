import { FC } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { reset, setPullTimer } from '../combat/combatSlice';
import { selectKeybindingMode, setKeybindingMode } from '../hotbars/hotbarSlice';
import { selectPullTimerDuration } from '../player/playerSlice';
import { lock, selectElement, selectLock, setVisility } from './hudSlice';

export const ControlBar: FC = () => {
  const dispatch = useAppDispatch();
  const actions = useAppSelector((state) => selectElement(state, 'ActionList'));
  const settings = useAppSelector((state) => selectElement(state, 'Settings'));
  const hudLock = useAppSelector(selectLock);
  const pullTimerDuration = useAppSelector(selectPullTimerDuration);
  const keybindingMode = useAppSelector(selectKeybindingMode);

  const toggleKeybindingMode = () => {
    dispatch(setKeybindingMode(!keybindingMode));
  };

  function toggleActions() {
    dispatch(setVisility({ element: 'ActionList', isVisible: !actions.isVisible }));
  }

  function toggleSettings() {
    dispatch(setVisility({ element: 'Settings', isVisible: !settings.isVisible }));
  }

  function toggleLock() {
    dispatch(lock(!hudLock));
  }

  function resetCombat() {
    dispatch(reset());
  }

  function startPullTimer() {
    dispatch(setPullTimer(pullTimerDuration));
  }

  return (
    <div className="grid grid-flow-col auto-cols-max gap-2">
      <button className="border px-1 rounded" onClick={toggleActions}>
        Actions
      </button>
      <button className="border px-1 rounded" onClick={toggleLock}>
        {hudLock ? 'Unlock' : 'Lock'}
      </button>
      <button className="border px-1 rounded" onClick={toggleKeybindingMode}>
        {!keybindingMode ? 'Keybinding Mode' : 'End Keybinding Mode'}
      </button>
      <button className="border px-1 rounded" onClick={toggleSettings}>
        Settings
      </button>
      <button className="border px-1 rounded" onClick={resetCombat}>
        Reset
      </button>
      <button className="border px-1 rounded" onClick={startPullTimer}>
        Pull timer
      </button>
    </div>
  );
};
