import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Select from 'react-select';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { selectElement, setVisility } from '../hud/hudSlice';
import { Option } from '../../types';
import { selectPlayer, setPartySize, setPullTimerDuration, setSkillSpeed } from '../player/playerSlice';
import { ChangeEvent, useMemo, useState } from 'react';
import { recastTime } from '../combat/combat-action';

const partySizeOptions: Option<number>[] = [
  { value: 1, label: 'Solo' },
  { value: 4, label: 'Light party' },
  { value: 8, label: 'Full party' },
];

export function Settings() {
  const hudElement = useAppSelector((state) => selectElement(state, 'Settings'));
  const player = useAppSelector(selectPlayer);
  const dispatch = useAppDispatch();
  const [speed, setSpeed] = useState(player.speed);
  const [pullTimerDuration, setPullTimer] = useState(player.pullTimerDuration);
  const gcd = useMemo(() => recastTime(2500, 90, speed) / 1000, [speed]);

  function close() {
    dispatch(setVisility({ element: 'Settings', isVisible: false }));
  }

  function setParty(value: Option<number> | null) {
    dispatch(setPartySize(value?.value || 8));
  }

  function updateSpeed(event: ChangeEvent<HTMLInputElement>) {
    const value = parseInt(event.target.value || '400');
    dispatch(setSkillSpeed(value));
    setSpeed(value);
  }

  function updatePullTimerDuration(event: ChangeEvent<HTMLInputElement>) {
    const value = parseInt(event.target.value || '400');
    dispatch(setPullTimerDuration(value));
    setPullTimer(value);
  }

  if (!hudElement.isVisible) {
    return null;
  }

  return (
    <HudItem name="Settings" dragHandle=".title" defaultPosition={{ x: 200, y: 200 }} z={100}>
      <div className="bg-xiv-bg border px-4 pb-2 pt-1 border-xiv-gold rounded-md w-[500px] h-[400px] overflow-auto">
        <div className="title grid grid-cols-2 items-center mb-4">
          <h2 className="text-2xl">Settings</h2>
          <button className="place-self-end p-1" onClick={close}>
            <FontAwesomeIcon size="2x" icon={faXmark} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-1 w-fit">
          <div className="grid grid-cols-[120px_1fr] gap-1 w-fit items-center">
            <label>Party size</label>
            <Select
              options={partySizeOptions}
              defaultValue={partySizeOptions.find((o) => o.value === player.partySize)}
              styles={{ option: (styles) => ({ ...styles, color: '#000' }) }}
              onChange={setParty}
            ></Select>
          </div>
          <div className="grid grid-cols-[120px_100px_1fr] gap-1 w-fit items-center">
            <label>Skill/spell speed</label>
            <input className="w-[100px]" type="number" value={speed} onChange={updateSpeed} />
            <span>(GCD {gcd})</span>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-1 w-fit items-center">
            <label>Pull timer</label>
            <input className="w-[100px]" type="number" value={pullTimerDuration} onChange={updatePullTimerDuration} />
          </div>
        </div>
      </div>
    </HudItem>
  );
}
