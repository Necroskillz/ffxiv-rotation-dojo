import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import { FC, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { actions } from '../combat/actions';
import { HudItem } from '../hud/HudItem';
import { selectElement, setVisility } from '../hud/hudSlice';
import { selectBlueMagicSpellBook, selectJob, setBluSpellSet } from '../player/playerSlice';
import { Action } from './Action';
import { ActionInfo, getActionById, getActionsByJob } from './actions';
import Select from 'react-select';
import { Option } from '../../types';
import { useDrag } from 'react-dnd';
import React from 'react';
import Tippy from '@tippyjs/react';
import { followCursor } from 'tippy.js';
import { ActionTooltip } from './ActionTooltip';

const blueMagicSetOptions = [
  { value: 1, label: 'Set 1' },
  { value: 2, label: 'Set 2' },
  { value: 3, label: 'Set 3' },
  { value: 4, label: 'Set 4' },
  { value: 5, label: 'Set 5' },
];

export function ActionList() {
  const job = useAppSelector(selectJob);
  const hudElement = useAppSelector((state) => selectElement(state, 'ActionList'));
  const dispatch = useAppDispatch();
  const actionList = useMemo(() => {
    const groups = getActionsByJob(job)
      .filter((a) => a.id < 999000)
      .reduce((acc, a) => {
        const category =
          a.job[0] === 'All' || a.type === 'Medicine'
            ? 'General'
            : a.job.length > 3
            ? 'Role'
            : !a.isAssignableToHotbar
            ? 'Unassignable'
            : a.job.length === 3 || a.job.length === 2
            ? 'Class'
            : 'Job';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(a);
        return acc;
      }, {} as Record<string, ActionInfo[]>);

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => a.level - b.level);
    });

    return groups;
  }, [job]);
  const blueMagicSpellbook = useAppSelector(selectBlueMagicSpellBook);
  const blueMagicSpellSet = useMemo(() => blueMagicSpellbook.find((s) => s.active), [blueMagicSpellbook]);

  function close() {
    dispatch(setVisility({ element: 'ActionList', isVisible: false }));
  }

  function setBlueSpellSet(option: Option<number> | null) {
    dispatch(setBluSpellSet(option!.value));
  }

  if (!hudElement.isVisible) {
    return null;
  }

  return (
    <HudItem name="ActionList" dragHandle=".title" defaultPosition={{ x: 20, y: 20 }} z={100}>
      <div
        className={clsx('bg-xiv-bg border px-4 pb-2 pt-1 border-xiv-gold rounded-md w-[800px]', job === 'BLU' ? 'h-[800px]' : 'h-[600px]')}
      >
        <div className="title grid grid-cols-2 items-center mb-4">
          <h2 className="text-2xl">Actions</h2>
          <button className="place-self-end p-1" onClick={close}>
            <FontAwesomeIcon size="2x" icon={faXmark} />
          </button>
        </div>
        <div className="w-[780px] h-[530px]  overflow-auto">
          {['Class', 'Job', 'Unassignable', 'Role', 'General']
            .filter((c) => actionList[c]?.length)
            .map((c, id) => (
              <React.Fragment key={id}>
                <h3 className="text-xl my-1">{c}</h3>
                <div className="grid grid-cols-3 gap-1 items-start">
                  {actionList[c].map((a) => (
                    <Action key={a.id} action={a} />
                  ))}
                </div>
              </React.Fragment>
            ))}
        </div>
        {job === 'BLU' && (
          <div>
            <div className="grid grid-flow-col">
              <h2 className="text-2xl mt-2">Active Actions</h2>
              <div className="grid grid-flow-col items-center gap-4 place-self-end">
                <div>{blueMagicSpellSet?.spells.length}/24</div>
                <Select
                  className="w-40"
                  options={blueMagicSetOptions}
                  value={blueMagicSetOptions.find((s) => s.value === blueMagicSpellSet!.id)}
                  styles={{ option: (styles) => ({ ...styles, color: '#000' }) }}
                  onChange={setBlueSpellSet}
                />
              </div>
            </div>
            <div className="grid grid-cols-12 grid-rows-2 mt-3">
              {blueMagicSpellSet?.spells.map((a, id) => (
                <BluAction key={id} actionId={a} />
              ))}
            </div>
          </div>
        )}
      </div>
    </HudItem>
  );
}

type BluActionProps = {
  actionId: number;
};

const BluAction: FC<BluActionProps> = ({ actionId }) => {
  const action = getActionById(actionId);
  const combatAction = actions[actionId];

  const [, drag] = useDrag(() => ({
    type: 'action',
    item: { id: action.id },
    canDrag: () => action.isAssignableToHotbar,
  }));

  return (
    <Tippy
      disabled={!action}
      content={<ActionTooltip action={action} combatAction={combatAction} />}
      arrow={false}
      duration={[0, 0]}
      maxWidth={600}
      plugins={[followCursor]}
      followCursor={true}
    >
      <div className="grid grid-flow-row place-items-center">
        <img ref={drag} className="w-10" src={'https://beta.xivapi.com' + action.icon} alt={'icon'} />
        <span>#{actions[actionId].bluNo}</span>
      </div>
    </Tippy>
  );
};
