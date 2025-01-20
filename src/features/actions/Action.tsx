import clsx from 'clsx';
import { ChangeEvent, FC } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { actions } from '../combat/actions';
import { addBluSpell, removeBluSpell, selectBlueMagicSpellSet } from '../player/playerSlice';
import { ActionInfo } from './actions';
import { selectElement, setExtraOptions, setVisility } from '../hud/hudSlice';
import { WithActionTooltip } from '@/components/WithActionTooltip';
import { XivIcon } from '@/components/XivIcon';

type ActionProps = {
  action: ActionInfo;
};

export const Action: FC<ActionProps> = ({ action }) => {
  const actionChangeSettings = useAppSelector((state) => selectElement(state, 'ActionChangeSettings'));
  const dispatch = useAppDispatch();

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `action-list-${action.id}`,
    data: {
      id: action.id,
      type: 'action',
    },
    disabled: !action.isAssignableToHotbar,
  });

  const bluSelected = useAppSelector((state) => {
    const spellSet = selectBlueMagicSpellSet(state);
    return spellSet.spells.includes(action.id);
  });

  const bluActiveSpellCount = useAppSelector((state) => {
    const spellSet = selectBlueMagicSpellSet(state);
    return spellSet.spells.length;
  });

  const combatAction = actions[action.id];

  function modifyBluSpellset(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.checked && bluActiveSpellCount >= 24) return;

    if (event.target.checked) {
      dispatch(addBluSpell(action.id));
    } else {
      dispatch(removeBluSpell(action.id));
    }
  }

  function toggleActionChangeSettings() {
    dispatch(setExtraOptions({ element: 'ActionChangeSettings', extraOptions: { actionId: action.id } }));
    dispatch(setVisility({ element: 'ActionChangeSettings', isVisible: !actionChangeSettings.isVisible }));
  }

  return (
    <div className="grid gap-2">
      <WithActionTooltip action={action}>
        <div id={`action_${action.id}`} className="grid auto-cols-max grid-flow-col gap-2 items-center">
          {!combatAction && <div className="text-red-500 static text-4xl">?</div>}
          {combatAction && combatAction.bluNo > 0 && (
            <div className="text-sm w-6 grid grid-flow-row items-center">
              <span>#{combatAction.bluNo}</span>
              <input type="checkbox" onChange={modifyBluSpellset} checked={bluSelected} />
            </div>
          )}
          <div className="grid">
            <div className="grid auto-cols-max grid-flow-col gap-2 items-center">
              <div className={clsx({ 'cursor-not-allowed': !action.isAssignableToHotbar })}>
                <div
                  ref={setNodeRef}
                  {...listeners}
                  {...attributes}
                  className={clsx({ 'pointer-events-none': !action.isAssignableToHotbar })}
                >
                  <XivIcon className="w-10" icon={action.icon} alt={action.name} />
                </div>
              </div>
              <div>
                <div>{action.name}</div>
                <div>Lv. {action.level}</div>
              </div>
            </div>
          </div>
        </div>
      </WithActionTooltip>

      {combatAction.actionChangeTo && (
        <button className="border px-1 rounded" onClick={toggleActionChangeSettings}>
          Action Change Settings
        </button>
      )}
    </div>
  );
};
