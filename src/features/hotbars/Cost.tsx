import { FC } from 'react';
import { useAppSelector } from '../../app/hooks';
import { ActionInfo } from '../actions/actions';

import style from './HotbarSlot.module.css';
import { selectAction } from '../combat/combatSlice';

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
  'oath',
  'serpentsOfferings',
  'palette',
];

export const Cost: FC<CostProps> = ({ action, size }) => {
  const combatAction = useAppSelector((state) => selectAction(state, action.id));

  if (!combatAction || !combatAction.cost || !displayedCostTypes.includes(action.costType!)) {
    return null;
  }

  return (
    <div className={style.cost} style={{ fontSize: 12 * size, bottom: -8 * size }}>
      {action.costType === 'mana' && action.cost === 10000 ? 'All' : combatAction.cost}
    </div>
  );
};
