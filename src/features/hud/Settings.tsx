import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { CloseButton } from '@/components/CloseButton';
import { Option } from '@/types';
import { ChangeEvent, useEffect, useState } from 'react';
import Select from 'react-select';
import { selectGcdRecast, selectSpellRecast } from '../combat/combatSlice';
import { selectPlayer, setPartySize, setSkillSpeed, setSpellSpeed, setPullTimerDuration } from '../player/playerSlice';
import { HudItem } from './HudItem';
import { selectElement, setVisility } from './hudSlice';

const partySizeOptions: Option<number>[] = [
  { value: 1, label: 'Solo' },
  { value: 4, label: 'Light party' },
  { value: 8, label: 'Full party' },
];

export const Settings = () => {
  const hudElement = useAppSelector((state) => selectElement(state, 'Settings'));
  const player = useAppSelector(selectPlayer);
  const dispatch = useAppDispatch();
  const [skillSpeed, setLocalSkillSpeed] = useState<number | null>(player.skillSpeed);
  const [spellSpeed, setLocalSpellSpeed] = useState<number | null>(player.spellSpeed);
  const [pullTimerDuration, setPullTimer] = useState<number | null>(player.pullTimerDuration);
  const gcd = useAppSelector(selectGcdRecast);
  const cast = useAppSelector(selectSpellRecast);

  useEffect(() => {
    setLocalSkillSpeed(player.skillSpeed);
    setLocalSpellSpeed(player.spellSpeed);
  }, [player]);

  function close() {
    dispatch(setVisility({ element: 'Settings', isVisible: false }));
  }

  function setParty(value: Option<number> | null) {
    dispatch(setPartySize(value?.value || 8));
  }

  function updateSkillSpeed(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.value) {
      setLocalSkillSpeed(null);

      return;
    }

    const value = parseInt(event.target.value || '420');
    dispatch(setSkillSpeed(value));
    setLocalSkillSpeed(value);
  }

  function onBlurSkillSpeed() {
    if (skillSpeed == null) {
      dispatch(setSkillSpeed(420));
      setLocalSkillSpeed(420);
    }
  }

  function updateSpellSpeed(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.value) {
      setLocalSpellSpeed(null);

      return;
    }

    const value = parseInt(event.target.value || '420');
    dispatch(setSpellSpeed(value));
    setLocalSpellSpeed(value);
  }

  function onBlurSpellSpeed() {
    if (spellSpeed == null) {
      dispatch(setSpellSpeed(420));
      setLocalSpellSpeed(420);
    }
  }

  function updatePullTimerDuration(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.value) {
      setPullTimer(null);

      return;
    }

    const value = parseInt(event.target.value || '10');
    dispatch(setPullTimerDuration(value));
    setPullTimer(value);
  }

  function onBlurPullTimerDuration() {
    if (pullTimerDuration == null) {
      dispatch(setPullTimerDuration(10));
      setPullTimer(10);
    }
  }

  if (!hudElement.isVisible) {
    return null;
  }

  return (
    <HudItem name="Settings" dragHandle=".title" defaultPosition={{ x: 200, y: 200 }} z={100}>
      <div className="bg-xiv-bg border px-4 pb-2 pt-1 border-xiv-gold rounded-md w-[500px] h-[400px] overflow-auto">
        <div className="title grid grid-cols-2 items-center mb-4">
          <h2 className="text-2xl">Settings</h2>
          <CloseButton onClick={close} />
        </div>
        <div className="grid grid-cols-1 gap-1 w-fit">
          <div className="grid grid-cols-[120px_1fr] gap-1 w-fit items-center">
            <label>Party size</label>
            <Select
              options={partySizeOptions}
              value={partySizeOptions.find((o) => o.value === player.partySize)}
              styles={{ option: (styles) => ({ ...styles, color: '#000' }) }}
              onChange={setParty}
            ></Select>
          </div>
          <div className="grid grid-cols-[120px_100px_1fr] gap-1 w-fit items-center">
            <label>Skill speed</label>
            <input className="w-[100px]" type="number" value={skillSpeed!} onChange={updateSkillSpeed} onBlur={onBlurSkillSpeed} />
            <span>(GCD {gcd})</span>
          </div>
          <div className="grid grid-cols-[120px_100px_1fr] gap-1 w-fit items-center">
            <label>Spell speed</label>
            <input className="w-[100px]" type="number" value={spellSpeed!} onChange={updateSpellSpeed} onBlur={onBlurSpellSpeed} />
            <span>(Cast {cast})</span>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-1 w-fit items-center">
            <label>Pull timer</label>
            <input
              className="w-[100px]"
              type="number"
              value={pullTimerDuration!}
              onChange={updatePullTimerDuration}
              onBlur={onBlurPullTimerDuration}
            />
          </div>
        </div>
      </div>
    </HudItem>
  );
};
