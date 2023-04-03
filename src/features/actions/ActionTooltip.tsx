import { FC } from 'react';
import { useAppSelector } from '../../app/hooks';
import { CombatAction } from '../combat/combat-action';
import { ActionInfo } from './actions';

type ActionTooltipProps = {
  action: ActionInfo;
  combatAction: CombatAction;
};

export const ActionTooltip: FC<ActionTooltipProps> = ({ action, combatAction }) => {
  const state = useAppSelector((state) => state);

  if (!action || !combatAction) return null;

  const castTime = combatAction ? combatAction.castTime(state) : action.castTime;
  const recastTime = combatAction ? combatAction.cooldown(state) : action.recastTime;

  return (
    <div className="grid auto-rows-max grid-flow-row gap-2 items-center w-[360px] p-1 pt-2">
      <div className="grid auto-cols-max grid-flow-col gap-2 items-center">
        <div>
          <img className="w-10" src={'https://xivapi.com' + action.icon} alt={action.name} />
        </div>
        <div>
          <div>{action.name}</div>
          <div>
            <div className="grid grid-flow-col auto-cols-max gap-3">
              <div>
                <span className="text-xiv-golden-brown">{action.type}</span> <span className="text-gray-400">[{action.id}]</span>
              </div>
              {action.range != null && (
                <div>
                  <span className="text-gray-400">Range</span> <span>{action.range}y</span>
                </div>
              )}
              {action.radius != null && (
                <div>
                  <span className="text-gray-400">Radius</span> <span>{action.radius}y</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="grid auto-cols-max grid-flow-col gap-8 items-center">
        <div className="grid auto-rows-max grid-flow-row">
          <div className="text-xiv-golden-brown text-right">Cast</div>
          <div className="text-xl text-right">{castTime === 0 ? 'Instant' : `${castTime / 1000}s`}</div>
        </div>
        {action.recastTime > 0 && (
          <div className="grid auto-rows-max grid-flow-row">
            <div className="text-xiv-golden-brown text-right">Recast</div>
            <div className="text-xl text-right">{recastTime / 1000}s</div>
          </div>
        )}
        {action.costType === 'mana' && (
          <div className="grid auto-rows-max grid-flow-row">
            <div className="text-xiv-golden-brown text-right">MP Cost</div>
            <div className="text-xl text-right">{combatAction ? combatAction.cost(state) : action.cost}</div>
          </div>
        )}
        <div className="grid auto-rows-max grid-flow-row">
          <div className="text-xiv-golden-brown text-right">CD Group</div>
          <div className="text-xl text-right">{action.cooldownGroup}</div>
        </div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: action.description }}></div>
    </div>
  );
};
