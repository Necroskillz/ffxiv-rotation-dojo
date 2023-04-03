import Tippy from '@tippyjs/react';
import clsx from 'clsx';
import React, { FC, useState } from 'react';
import { useDrag } from 'react-dnd';
import { followCursor } from 'tippy.js';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { actions } from '../combat/actions';
import { addBluSpell, removeBluSpell, selectBlueMagicSpellSet } from '../player/playerSlice';
import { ActionInfo } from './actions';
import { ActionTooltip } from './ActionTooltip';

type ActionProps = {
  action: ActionInfo;
};

export const Action: FC<ActionProps> = ({ action }) => {
  const dispatch = useAppDispatch();

  const [, drag] = useDrag(() => ({
    type: 'action',
    item: { id: action.id },
    canDrag: () => action.isAssignableToHotbar,
  }));

  const blueMagicSpellSet = useAppSelector(selectBlueMagicSpellSet);
  const [bluSelected, setBluSelected] = useState(blueMagicSpellSet.spells.includes(action.id));

  const combatAction = actions[action.id];

  function modifyBluSpellset(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.checked && blueMagicSpellSet.spells.length >= 24) return;

    setBluSelected(event.target.checked);
    if (event.target.checked) {
      dispatch(addBluSpell(action.id));
    } else {
      dispatch(removeBluSpell(action.id));
    }
  }

  return (
    <React.Fragment>
      <Tippy
        disabled={!action}
        content={<ActionTooltip action={action!} combatAction={combatAction!} />}
        arrow={false}
        duration={[0, 0]}
        maxWidth={600}
        plugins={[followCursor]}
        followCursor={true}
      >
        <div id={`action_${action.id}`} className="grid auto-cols-max grid-flow-col gap-2 items-center">
          {!combatAction && <div className="text-red-500 static text-4xl">?</div>}
          {combatAction && combatAction.bluNo > 0 && (
            <div className="text-sm w-6 grid grid-flow-row items-center">
              <span>#{combatAction.bluNo}</span>
              <input type="checkbox" onChange={modifyBluSpellset} checked={bluSelected} />
            </div>
          )}
          <div className={clsx({ 'cursor-not-allowed': !action.isAssignableToHotbar })}>
            <div ref={drag} className={clsx({ 'pointer-events-none': !action.isAssignableToHotbar })}>
              <img className="w-10" src={'https://xivapi.com' + action.icon} alt={action.name} />
            </div>
          </div>
          <div>
            <div>{action.name}</div>
            <div>Lv. {action.level}</div>
          </div>
        </div>
      </Tippy>
    </React.Fragment>
  );
};
