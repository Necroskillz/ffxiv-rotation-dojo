import { FC } from 'react';
import { ActionList } from '../actions/ActionList';
import { Buffs } from '../combat/Buffs';
import { BuffScrollingText } from '../combat/BuffScrollingText';
import { CastBar } from '../combat/CastBar';
import { Debuffs } from '../combat/Debuffs';
import { DebuffScrollingText } from '../combat/DebuffScrollingText';
import { ElementalGauge } from '../combat/jobs/blm/ElementalGauge';
import { SongGauge } from '../combat/jobs/brd/SongGauge';
import { DanceGauge } from '../combat/jobs/dnc/DanceGauge';
import { EspritGauge } from '../combat/jobs/dnc/EspritGauge';
import { DragonGauge } from '../combat/jobs/drg/DragonGauge';
import { BloodGauge } from '../combat/jobs/drk/BloodGauge';
import { DarksideGauge } from '../combat/jobs/drk/DarksideGauge';
import { PowderGauge } from '../combat/jobs/gnb/PowderGauge';
import { HeatGauge } from '../combat/jobs/mch/HeatGauge';
import { ChakraGauge } from '../combat/jobs/mnk/ChakraGauge';
import { MastersGauge } from '../combat/jobs/mnk/MastersGauge';
import { HutonGauge } from '../combat/jobs/nin/HutonGauge';
import { NinkiGauge } from '../combat/jobs/nin/NinkiGauge';
import { OathGauge } from '../combat/jobs/pld/OathGauge';
import { BalanceGauge } from '../combat/jobs/rdm/BalanceGauge';
import { DeathGauge } from '../combat/jobs/rpr/DeathGauge';
import { SoulAndShroudGauge } from '../combat/jobs/rpr/SoulAndShroudGauge';
import { KenkiGauge } from '../combat/jobs/sam/KenkiGauge';
import { SenGauge } from '../combat/jobs/sam/SenGauge';
import { AetherflowGauge } from '../combat/jobs/smn/AetherflowGauge';
import { TranceGauge } from '../combat/jobs/smn/TranceGauge';
import { BeastGauge } from '../combat/jobs/war/BeastGauge';
import { ManaBar } from '../combat/ManaBar';
import { Pet } from '../combat/Pet';
import PullTimer from '../combat/PullTimer';
import { Hotbars } from '../hotbars/Hotbars';
import { Help } from './Help';
import { Settings } from './Settings';

export const Hud: FC = () => {
  return (
    <div>
      <BuffScrollingText />
      <DebuffScrollingText />
      <Help />
      <ActionList />
      <CastBar />
      <ManaBar />
      <Pet />
      <Settings />
      <PullTimer />
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
      <SenGauge />
      <KenkiGauge />
      <PowderGauge />
      <ChakraGauge />
      <MastersGauge />
      <DarksideGauge />
      <BloodGauge />
      <ElementalGauge />
      <OathGauge />
      <Hotbars />
      <Buffs />
      <Debuffs />
    </div>
  );
};
