import { FC } from 'react';
import { ActionList } from '../actions/ActionList';
import { Buffs } from '../combat/Buffs';
import { CastBar } from '../combat/CastBar';
import { Debuffs } from '../combat/Debuffs';
import { DanceGauge } from '../combat/jobs/dnc/DanceGauge';
import { EspritGauge } from '../combat/jobs/dnc/EspritGauge';
import { DeathGauge } from '../combat/jobs/rpr/DeathGauge';
import { SoulAndShroudGauge } from '../combat/jobs/rpr/SoulAndShroudGauge';
import PullTimer from '../combat/PullTimer';
import { Hotbars } from '../hotbars/Hotbars';
import { Settings } from './Settings';

export const Hud: FC = () => {
  return (
    <div>
      <ActionList />
      <CastBar />
      <Settings />
      <PullTimer />
      <Buffs />
      <Debuffs />
      <DanceGauge />
      <EspritGauge />
      <SoulAndShroudGauge />
      <DeathGauge />
      <Hotbars />
    </div>
  );
};
