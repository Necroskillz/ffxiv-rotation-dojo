import { FC } from 'react';
import { ActionList } from '../actions/ActionList';
import { Buffs } from '../combat/Buffs';
import { CastBar } from '../combat/CastBar';
import { Debuffs } from '../combat/Debuffs';
import { SongGauge } from '../combat/jobs/brd/SongGauge';
import { DanceGauge } from '../combat/jobs/dnc/DanceGauge';
import { EspritGauge } from '../combat/jobs/dnc/EspritGauge';
import { DragonGauge } from '../combat/jobs/drg/DragonGauge';
import { HeatGauge } from '../combat/jobs/mch/HeatGauge';
import { HutonGauge } from '../combat/jobs/nin/HutonGauge';
import { NinkiGauge } from '../combat/jobs/nin/NinkiGauge';
import { BalanceGauge } from '../combat/jobs/rdm/BalanceGauge';
import { DeathGauge } from '../combat/jobs/rpr/DeathGauge';
import { SoulAndShroudGauge } from '../combat/jobs/rpr/SoulAndShroudGauge';
import { AetherflowGauge } from '../combat/jobs/smn/AetherflowGauge';
import { TranceGauge } from '../combat/jobs/smn/TranceGauge';
import { BeastGauge } from '../combat/jobs/war/BeastGauge';
import { ManaBar } from '../combat/ManaBar';
import { Pet } from '../combat/Pet';
import PullTimer from '../combat/PullTimer';
import { Hotbars } from '../hotbars/Hotbars';
import { Settings } from './Settings';

export const Hud: FC = () => {
  return (
    <div>
      <ActionList />
      <CastBar />
      <ManaBar />
      <Pet />
      <Settings />
      <PullTimer />
      <Buffs />
      <Debuffs />
      <DanceGauge />
      <EspritGauge />
      <SoulAndShroudGauge />
      <DeathGauge />
      <AetherflowGauge />
      <TranceGauge />
      <HeatGauge />
      <BeastGauge />
      <SongGauge />
      <NinkiGauge />
      <HutonGauge />
      <DragonGauge />
      <BalanceGauge />
      <Hotbars />
    </div>
  );
};
