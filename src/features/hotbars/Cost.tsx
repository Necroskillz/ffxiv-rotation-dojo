import { FC } from 'react';
import { useAppSelector } from '../../app/hooks';
import { ActionInfo } from '../actions/actions';
import { actions } from '../combat/actions';

import style from './HotbarSlot.module.css';

type CostProps = {
  action: ActionInfo;
  size: number;
};

const displayedCostTypes = [
  'esprit',
  'mana',
  'soul',
  'shroud',
  'void',
  'lemure',
  'heat',
  'battery',
  'soulVoice',
  'ninki',
  'firstmindsFocus',
  'whiteMana,blackMana',
  'kenki',
  'blood',
  'beast',
];

export const Cost: FC<CostProps> = ({ action, size }) => {
  const state = useAppSelector((state) => state);

  const combatAction = actions[action.id];
  if (!combatAction) {
    return null;
  }

  const cost = combatAction.cost(state);

  if (!cost || !displayedCostTypes.includes(action.costType!)) {
    return null;
  }

  return (
    <div className={style.cost} style={{ fontSize: 12 * size, bottom: -8 * size }}>
      {action.costType === 'mana' && action.cost === 10000 ? 'All' : cost}
    </div>
  );
};
