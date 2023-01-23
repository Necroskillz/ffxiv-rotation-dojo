import React, { FC } from 'react';
import { useDrag } from 'react-dnd';
import { actions } from '../combat/actions';
import { ActionInfo } from './actions';
import { ActionTooltip } from './ActionTooltip';

type ActionProps = {
  action: ActionInfo;
};

export const Action: FC<ActionProps> = ({ action }) => {
  const [, drag] = useDrag(() => ({
    type: 'action',
    item: { id: action.id },
    canDrag: () => action.isAssignableToHotbar,
  }));

  const combatAction = actions[action.id];

  return (
    <React.Fragment>
      <ActionTooltip anchorId={`action_${action.id}`} action={action} combatAction={combatAction} />
      <div id={`action_${action.id}`} className="grid auto-cols-max grid-flow-col items-start gap-2 items-center">
        <div ref={drag}>
          <img className="w-10" src={'https://xivapi.com' + action.icon} alt={action.name} />
        </div>
        <div>
          <div>{action.name}</div>
          <div>Lv. {action.level}</div>
        </div>
      </div>
    </React.Fragment>
  );
};
