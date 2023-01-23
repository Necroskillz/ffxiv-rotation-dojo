import { FC } from 'react';
import { ActionInfo } from '../actions/actions';

import style from './HotbarSlot.module.css';

type CostProps = {
  action: ActionInfo;
};

const displayedCostTypes = ['esprit', 'mana'];

export const Cost: FC<CostProps> = ({ action }) => {
  if (!action.cost || !displayedCostTypes.includes(action.costType!)) {
    return null;
  }

  return <div className={style.cost}>{action.cost}</div>;
};
