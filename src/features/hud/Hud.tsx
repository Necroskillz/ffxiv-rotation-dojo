import { FC } from 'react';
import { ActionList } from '../actions/ActionList';
import { Buffs } from '../combat/Buffs';
import { Debuffs } from '../combat/Debuffs';
import { DanceGauge } from '../combat/jobs/dnc/DanceGauge';
import { EspritGauge } from '../combat/jobs/dnc/EspritGauge';
import PullTimer from '../combat/PullTimer';
import { Hotbars } from '../hotbars/Hotbars';
import { Settings } from './Settings';

export const Hud: FC = () => {
  return (
    <div>
      <ActionList />
      <Settings />
      <PullTimer />
      <Buffs />
      <Debuffs />
      <DanceGauge />
      <EspritGauge />
      <Hotbars />
    </div>
  );
};
