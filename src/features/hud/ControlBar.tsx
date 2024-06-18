import { FC } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { reset, setPullTimer } from '../combat/combatSlice';
import { selectKeybindingMode, setKeybindingMode } from '../hotbars/hotbarSlice';
import { selectJob, selectPullTimerDuration, setJob } from '../player/playerSlice';
import { lock, selectElement, selectLock, setVisility } from './hudSlice';
import { Option } from '../../types';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons';
import clsx from 'clsx';
import { selectIsScriptActive } from '../script_engine/scriptEngineSlice';

interface GroupOption {
  label: string;
  options: Option<string>[];
}

const jobOptions: GroupOption[] = [
  {
    label: 'Tank',
    options: [
      { value: 'DRK', label: 'DRK' },
      { value: 'GNB', label: 'GNB' },
      { value: 'PLD', label: 'PLD' },
      { value: 'WAR', label: 'WAR' },
    ],
  },
  {
    label: 'Melee',
    options: [
      { value: 'DRG', label: 'DRG' },
      { value: 'MNK', label: 'MNK' },
      { value: 'NIN', label: 'NIN' },
      { value: 'RPR', label: 'RPR' },
      { value: 'SAM', label: 'SAM' },
    ],
  },
  {
    label: 'Caster',
    options: [
      { value: 'BLM', label: 'BLM' },
      { value: 'SMN', label: 'SMN' },
      { value: 'RDM', label: 'RDM' },
      { value: 'BLU', label: 'BLU' },
    ],
  },
  {
    label: 'Ranged',
    options: [
      { value: 'BRD', label: 'BRD' },
      { value: 'DNC', label: 'DNC' },
      { value: 'MCH', label: 'MCH' },
    ],
  },
];

export const ControlBar: FC = () => {
  const dispatch = useAppDispatch();
  const actions = useAppSelector((state) => selectElement(state, 'ActionList'));
  const settings = useAppSelector((state) => selectElement(state, 'Settings'));
  const help = useAppSelector((state) => selectElement(state, 'Help'));
  const script = useAppSelector((state) => selectElement(state, 'Script'));
  const hudEditor = useAppSelector((state) => selectElement(state, 'HudEditor'));
  const importExport = useAppSelector((state) => selectElement(state, 'ImportExport'));
  const hudLock = useAppSelector(selectLock);
  const pullTimerDuration = useAppSelector(selectPullTimerDuration);
  const keybindingMode = useAppSelector(selectKeybindingMode);
  const scriptActive = useAppSelector(selectIsScriptActive);
  const job = useAppSelector(selectJob);

  const toggleKeybindingMode = () => {
    dispatch(setKeybindingMode(!keybindingMode));
  };

  function toggleActions() {
    dispatch(setVisility({ element: 'ActionList', isVisible: !actions.isVisible }));
  }

  function toggleSettings() {
    dispatch(setVisility({ element: 'Settings', isVisible: !settings.isVisible }));
  }

  function toggleHelp() {
    dispatch(setVisility({ element: 'Help', isVisible: !help.isVisible }));
  }

  function toggleScript() {
    dispatch(setVisility({ element: 'Script', isVisible: !script.isVisible }));
  }

  function toggleHudEditor() {
    dispatch(setVisility({ element: 'HudEditor', isVisible: !hudEditor.isVisible }));
  }

  function toggleImportExport() {
    dispatch(setVisility({ element: 'ImportExport', isVisible: !importExport.isVisible }));
  }


  function toggleLock() {
    dispatch(lock(!hudLock));
  }

  function resetCombat() {
    dispatch(reset(false));
  }

  function startPullTimer() {
    dispatch(setPullTimer(pullTimerDuration));
  }

  function updateJob(value: Option<string> | null) {
    if (!value) {
      return;
    }

    dispatch(setJob(value.value));
    dispatch(reset(true));
  }

  return (
    <div className="grid grid-cols-[_1fr_50px]">
      <div className="grid grid-flow-col auto-cols-max gap-2 items-center">
        <Select<Option<string>, false, GroupOption>
          options={jobOptions}
          defaultValue={jobOptions
            .map((o) => o.options)
            .flat()
            .find((o) => o.value === job)}
          styles={{ option: (styles) => ({ ...styles, color: '#000' }) }}
          onChange={updateJob}
          menuPlacement="top"
        ></Select>
        <button className="border px-1 rounded" onClick={toggleActions}>
          Actions
        </button>
        <button className={clsx('border px-1 rounded', { 'bg-white text-xiv-bg': !hudLock })} onClick={toggleLock}>
          {hudLock ? 'Unlock' : 'Lock'}
        </button>
        <button className={clsx('border px-1 rounded', { 'bg-white text-xiv-bg': keybindingMode })} onClick={toggleKeybindingMode}>
          {!keybindingMode ? 'Keybinding Mode' : 'End Keybinding Mode'}
        </button>
        <button className="border px-1 rounded" onClick={toggleSettings}>
          Settings
        </button>
        <button className="border px-1 rounded" onClick={toggleImportExport}>
          Import/Export
        </button>
        <button className="border px-1 rounded" onClick={toggleHudEditor}>
          HUD
        </button>
        <button className={clsx('border px-1 rounded', { 'bg-white text-xiv-bg': scriptActive })} onClick={toggleScript}>
          Script
        </button>
        <button className="border px-1 rounded" onClick={resetCombat}>
          Reset
        </button>
        <button className="border px-1 rounded" onClick={startPullTimer}>
          Pull timer
        </button>
      </div>
      <div className="grid items-center">
        <button onClick={toggleHelp}>
          <FontAwesomeIcon icon={faCircleQuestion} size="xl" />
        </button>
      </div>
    </div>
  );
};
