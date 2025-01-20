import clsx from 'clsx';
import { FC, Fragment } from 'react';
import { useDraggable } from '@dnd-kit/core';
import Select from 'react-select';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { CloseButton } from '@/components/CloseButton';
import { actions } from '../combat/actions';
import { HudItem } from '../hud/HudItem';
import { selectElement, setVisility } from '../hud/hudSlice';
import { selectJob, selectBlueMagicSpellBook, setBluSpellSet } from '../player/playerSlice';
import { Action } from './Action';
import { getActionsByJob, ActionInfo, getActionById } from './actions';
import { Option } from '@/types';
import { WithActionTooltip } from '@/components/WithActionTooltip';
import { XivIcon } from '@/components/XivIcon';

const blueMagicSetOptions = [
  { value: 1, label: 'Set 1' },
  { value: 2, label: 'Set 2' },
  { value: 3, label: 'Set 3' },
  { value: 4, label: 'Set 4' },
  { value: 5, label: 'Set 5' },
];

export const ActionList = () => {
  const job = useAppSelector(selectJob);
  const hudElement = useAppSelector((state) => selectElement(state, 'ActionList'));
  const dispatch = useAppDispatch();
  const actionList = getActionsByJob(job)
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

  Object.keys(actionList).forEach((key) => {
    actionList[key].sort((a, b) => a.level - b.level);
  });

  const blueMagicSpellbook = useAppSelector(selectBlueMagicSpellBook);
  const blueMagicSpellSet = blueMagicSpellbook.find((s) => s.active);

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
          <CloseButton onClick={close} />
        </div>
        <div className="w-[780px] h-[530px]  overflow-auto">
          {['Class', 'Job', 'Unassignable', 'Role', 'General']
            .filter((c) => actionList[c]?.length)
            .map((c, id) => (
              <Fragment key={id}>
                <h3 className="text-xl my-1">{c}</h3>
                <div className="grid grid-cols-3 gap-1 items-start">
                  {actionList[c].map((a) => (
                    <Action key={a.id} action={a} />
                  ))}
                </div>
              </Fragment>
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
};

type BluActionProps = {
  actionId: number;
};

const BluAction: FC<BluActionProps> = ({ actionId }) => {
  const action = getActionById(actionId);

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `action-${action.id}`,
    data: { id: action.id, type: 'action' },
    disabled: !action.isAssignableToHotbar,
  });

  return (
    <WithActionTooltip action={action}>
      <div className="grid grid-flow-row place-items-center" ref={setNodeRef} {...listeners} {...attributes}>
        <XivIcon className="w-10" icon={action.icon} alt={action.name} />
        <span>#{actions[actionId].bluNo}</span>
      </div>
    </WithActionTooltip>
  );
};
