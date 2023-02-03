import { FC } from 'react';
import { ActionInfo } from '../actions/actions';

import style from './HotbarSlot.module.css';

type CostProps = {
  action: ActionInfo;
  size: number;
};

const displayedCostTypes = ['esprit', 'mana', 'soul', 'shroud', 'void', 'lemure', 'heat', 'battery', 'soulVoice'];

export const Cost: FC<CostProps> = ({ action, size }) => {
  if (!action.cost || !displayedCostTypes.includes(action.costType!)) {
    return null;
  }

  return (
    <div className={style.cost} style={{ fontSize: 12 * size, bottom: -8*size }}>
      {action.cost}
    </div>
  );
};
