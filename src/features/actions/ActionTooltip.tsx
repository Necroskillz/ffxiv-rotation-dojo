import { FC } from 'react';
import { Tooltip } from 'react-tooltip';
import { useAppSelector } from '../../app/hooks';
import { CombatAction } from '../combat/combat-action';
import { ActionInfo } from './actions';

type ActionTooltipProps = {
  action: ActionInfo;
  combatAction: CombatAction;
  anchorId: string;
};

export const ActionTooltip: FC<ActionTooltipProps> = ({ action, combatAction, anchorId }) => {
  const state = useAppSelector((state) => state);

  return (
    <Tooltip anchorId={anchorId} float={true} noArrow={true} style={{ zIndex: 1000 }}>
      <div className="grid auto-rows-max grid-flow-row gap-2 items-center w-[360px]">
        <div className="grid auto-cols-max grid-flow-col gap-2 items-center">
          <div>
            <img className="w-10" src={'https://xivapi.com' + action.icon} alt={action.name} />
          </div>
          <div>
            <div>{action.name}</div>
            <div>
              <span className="text-xiv-golden-brown">{action.type}</span> <span className="text-gray-400">[{action.id}]</span>
            </div>
          </div>
        </div>
        <div className="grid auto-cols-max grid-flow-col gap-8 items-center">
          <div className="grid auto-rows-max grid-flow-row">
            <div className="text-xiv-golden-brown text-right">Cast</div>
            <div className="text-xl text-right">{action.castTime ? `${action.castTime / 1000}s` : 'Instant'}</div>
          </div>
          <div className="grid auto-rows-max grid-flow-row">
            <div className="text-xiv-golden-brown text-right">Recast</div>
            <div className="text-xl text-right">{combatAction ? combatAction.cooldown(state) / 1000 : NaN}s</div>
          </div>
        </div>
        <div dangerouslySetInnerHTML={{ __html: action.description }}></div>
      </div>
    </Tooltip>
  );
};
