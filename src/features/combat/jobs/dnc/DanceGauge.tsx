import clsx from 'clsx';
import { FC } from 'react';
import { useAppSelector } from '../../../../app/hooks';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { selectResources } from '../../combatSlice';
import { GaugeNumber } from '../../GaugeNumber';
import { FaDharmachakra } from 'react-icons/fa6';
import { XivIcon } from '@/components/XivIcon';

import style from './DanceGauge.module.css';
import { HudItem } from '../../../hud/HudItem';
import { useBuffTimer } from '../../hooks';

type DanceStepProps = {
  actionId: ActionId;
  isActive: boolean;
};

export const DanceStep: FC<DanceStepProps> = ({ actionId, isActive }) => {
  const action = getActionById(actionId);

  return (
    <div className={clsx(style.step, { [style.active]: isActive })}>
      {action && <XivIcon icon={action.icon} alt={action.name} />}
    </div>
  );
};

export const DanceGauge = () => {
  const resources = useAppSelector(selectResources);
  const [{ remainingTime: standardFinishRemainingTime }] = useBuffTimer(StatusId.StandardFinish);

  return (
    <HudItem name="DanceGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-36 justify-center">
        <div className="grid h-8 auto-cols-max grid-flow-col gap-2 justify-center items-center">
          {resources.steps ? (
            Array(resources.steps)
              .fill(0)
              .map((_, i) => <DanceStep key={`step${i}`} actionId={resources[`step${i + 1}`]} isActive={resources.step === i} />)
          ) : (
            <div className="grid text-center">
              <FaDharmachakra size={24} className="text-slate-800" />
            </div>
          )}
        </div>
        <div className="h-8 text-center">{standardFinishRemainingTime != null && <GaugeNumber number={standardFinishRemainingTime} />}</div>
      </div>
    </HudItem>
  );
};
