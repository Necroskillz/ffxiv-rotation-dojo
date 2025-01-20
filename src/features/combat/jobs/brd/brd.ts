import { combineEpics, Epic } from 'redux-observable';
import { of } from 'rxjs';
import { filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { RootState } from '../../../../app/store';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import { CombatStatus, createCombatStatus } from '../../combat-status';
import {
  addBuff,
  buff,
  executeAction,
  hasBuff,
  ogcdLock,
  removeBuff,
  resource,
  debuff,
  setWandererCoda,
  setWandererRepertiore,
  setMageCoda,
  setArmyCoda,
  setArmyRepertiore,
  addWandererRepertiore,
  modifyCooldown,
  addArmyRepertiore,
  hasDebuff,
  addSoulVoice,
  dmgEvent,
  event,
  buffStacks,
} from '../../combatSlice';
import { rng } from '../../utils';
import { getActionById } from '../../../actions/actions';

function soulVoice(state: RootState) {
  return resource(state, 'soulVoice');
}

function armyRepertoire(state: RootState) {
  return resource(state, 'armyRepertoire');
}

function wandererRepertoire(state: RootState) {
  return resource(state, 'wandererRepertoire');
}

function coda(state: RootState): number {
  return resource(state, 'wandererCoda') + resource(state, 'mageCoda') + resource(state, 'armyCoda');
}

function hasCoda(state: RootState): boolean {
  return coda(state) > 0;
}

const consumeBarrageEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === executeAction.type && [ActionId.RefulgentArrow, ActionId.Shadowbite].includes(a.payload.id)),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => hasBuff(state, StatusId.Barrage)),
    map(() => removeBuff(StatusId.Barrage))
  );

const endWanderersMinuetEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && [StatusId.MagesBalladActive, StatusId.ArmysPaeonActive].includes(a.payload.id)),
    withLatestFrom(state$),
    map(([, state]) => state),
    switchMap((state) => {
      const actions = [];

      if (hasBuff(state, StatusId.WanderersMinuetActive)) {
        actions.push(removeBuff(StatusId.WanderersMinuetActive));
      }

      if (hasBuff(state, StatusId.TheWanderersMinuet)) {
        actions.push(removeBuff(StatusId.TheWanderersMinuet));
      }

      return of(...actions);
    })
  );

const endMagesBalladEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && [StatusId.TheWanderersMinuet, StatusId.ArmysPaeonActive].includes(a.payload.id)),
    withLatestFrom(state$),
    map(([, state]) => state),
    switchMap((state) => {
      const actions = [];

      if (hasBuff(state, StatusId.MagesBalladActive)) {
        actions.push(removeBuff(StatusId.MagesBalladActive));
      }

      if (hasBuff(state, StatusId.MagesBallad)) {
        actions.push(removeBuff(StatusId.MagesBallad));
      }

      return of(...actions);
    })
  );

const endArmysPaeonEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && [StatusId.MagesBalladActive, StatusId.TheWanderersMinuet].includes(a.payload.id)),
    withLatestFrom(state$),
    map(([, state]) => state),
    switchMap((state) => {
      const actions = [];

      if (hasBuff(state, StatusId.ArmysPaeonActive)) {
        actions.push(removeBuff(StatusId.ArmysPaeonActive));
      }

      if (hasBuff(state, StatusId.ArmysPaeon)) {
        actions.push(removeBuff(StatusId.ArmysPaeon));
      }

      return of(...actions);
    })
  );

const straightShotReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.StraightShotReady,
  duration: 30,
  isHarmful: false,
});

const barrageStatus: CombatStatus = createCombatStatus({
  id: StatusId.Barrage,
  duration: 10,
  isHarmful: false,
});

const stormbiteStatus: CombatStatus = createCombatStatus({
  id: StatusId.Stormbite,
  duration: 45,
  isHarmful: true,
  tick: (dispatch) => {
    dispatch(event(0, { potency: 25 }));
  },
});

const causticBiteStatus: CombatStatus = createCombatStatus({
  id: StatusId.CausticBite,
  duration: 45,
  isHarmful: true,
  tick: (dispatch) => {
    dispatch(event(0, { potency: 20 }));
  },
});

const ragingStrikesStatus: CombatStatus = createCombatStatus({
  id: StatusId.RagingStrikes,
  duration: 20,
  isHarmful: false,
});

const battleVoiceStatus: CombatStatus = createCombatStatus({
  id: StatusId.BattleVoice,
  duration: 15,
  isHarmful: false,
});

const armysMuseStatus: CombatStatus = createCombatStatus({
  id: StatusId.ArmysMuse,
  duration: 10,
  isHarmful: false,
});

const wanderersMinuetActive: CombatStatus = createCombatStatus({
  id: StatusId.WanderersMinuetActive,
  duration: 45,
  isHarmful: false,
  isVisible: false,
  tick: (dispatch) => {
    dispatch(addWandererRepertiore(1));
    dispatch(addSoulVoice(5));
  },
  onExpire: (dispatch, getState) => {
    setTimeout(() => {
      if (hasBuff(getState(), StatusId.TheWanderersMinuet)) {
        dispatch(removeBuff(StatusId.TheWanderersMinuet));
      }
    }, 3000);
  },
});

const theWanderersMinuetStatus: CombatStatus = createCombatStatus({
  id: StatusId.TheWanderersMinuet,
  duration: null,
  isHarmful: false,
});

const magesBalladActive: CombatStatus = createCombatStatus({
  id: StatusId.MagesBalladActive,
  duration: 45,
  isHarmful: false,
  isVisible: false,
  tick: (dispatch) => {
    dispatch(modifyCooldown(getActionById(ActionId.HeartbreakShot).cooldownGroup, -7500));
    dispatch(addSoulVoice(5));
  },
  onExpire: (dispatch, getState) => {
    setTimeout(() => {
      if (hasBuff(getState(), StatusId.MagesBallad)) {
        dispatch(removeBuff(StatusId.MagesBallad));
      }
    }, 3000);
  },
});

const magesBalladStatus: CombatStatus = createCombatStatus({
  id: StatusId.MagesBallad,
  duration: null,
  isHarmful: false,
});

const armysEthosStatus: CombatStatus = createCombatStatus({
  id: StatusId.ArmysEthos,
  duration: 30,
  isHarmful: false,
});

const armysPaeonActive: CombatStatus = createCombatStatus({
  id: StatusId.ArmysPaeonActive,
  duration: 45,
  isHarmful: false,
  isVisible: false,
  tick: (dispatch) => {
    dispatch(addArmyRepertiore(1));
    dispatch(addSoulVoice(5));
  },
  onExpire: (dispatch, getState) => {
    if (armyRepertoire(getState())) {
      dispatch(buff(StatusId.ArmysEthos));
    }

    setTimeout(() => {
      if (hasBuff(getState(), StatusId.ArmysPaeon)) {
        dispatch(removeBuff(StatusId.ArmysPaeon));
      }
    }, 3000);
  },
});

const armysPaeonStatus: CombatStatus = createCombatStatus({
  id: StatusId.ArmysPaeon,
  duration: null,
  isHarmful: false,
});

const blastArrowReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.BlastArrowReady,
  duration: 10,
  isHarmful: false,
});

const radiantFinaleStatus: CombatStatus = createCombatStatus({
  id: StatusId.RadiantFinale,
  duration: 20,
  isHarmful: false,
});

const playingRadiantFinale: CombatStatus = createCombatStatus({
  id: StatusId.PlayingRadiantFinale,
  duration: 20,
  isHarmful: false,
});

const troubadourStatus: CombatStatus = createCombatStatus({
  id: StatusId.Troubadour,
  duration: 15,
  isHarmful: false,
});

const naturesMinneStatus: CombatStatus = createCombatStatus({
  id: StatusId.NaturesMinne,
  duration: 15,
  isHarmful: false,
});

const wardensPaeanStatus: CombatStatus = createCombatStatus({
  id: StatusId.TheWardensPaean,
  duration: 30,
  isHarmful: false,
});

const hawksEyeStatus: CombatStatus = createCombatStatus({
  id: StatusId.HawksEye,
  duration: 30,
  isHarmful: false,
});

const resonantArrowReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.ResonantArrowReady,
  duration: 30,
  isHarmful: false,
});

const radiantEncoreReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.RadiantEncoreReady,
  duration: 30,
  isHarmful: false,
});

const radiantEncoreCodaStatus: CombatStatus = createCombatStatus({
  id: StatusId.RadiantEncoreCoda,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const straightShot: CombatAction = createCombatAction({
  id: ActionId.StraightShot,
  execute: () => {},
  redirect: () => ActionId.RefulgentArrow,
  reducedBySkillSpeed: true,
});

const heavyShot: CombatAction = createCombatAction({
  id: ActionId.HeavyShot,
  execute: () => {},
  redirect: () => ActionId.BurstShot,
  reducedBySkillSpeed: true,
});

const burstShot: CombatAction = createCombatAction({
  id: ActionId.BurstShot,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.BurstShot, context, { potency: 220 }));

    if (rng(35)) {
      dispatch(buff(StatusId.StraightShotReady));
    }
  },
  reducedBySkillSpeed: true,
});

const refulgentArrow: CombatAction = createCombatAction({
  id: ActionId.RefulgentArrow,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.RefulgentArrow, context, { potency: 280 }));

    dispatch(removeBuff(StatusId.StraightShotReady));
  },
  reducedBySkillSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.StraightShotReady),
  isGlowing: (state) => hasBuff(state, StatusId.StraightShotReady),
});

const windbite: CombatAction = createCombatAction({
  id: ActionId.Windbite,
  execute: () => {},
  redirect: () => ActionId.Stormbite,
  reducedBySkillSpeed: true,
});

const stormbite: CombatAction = createCombatAction({
  id: ActionId.Stormbite,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Stormbite, context, { potency: 100 }));

    if (rng(35)) {
      dispatch(buff(StatusId.StraightShotReady));
    }

    dispatch(debuff(StatusId.Stormbite));
  },
  reducedBySkillSpeed: true,
});

const venomousBite: CombatAction = createCombatAction({
  id: ActionId.VenomousBite,
  execute: () => {},
  redirect: () => ActionId.CausticBite,
  reducedBySkillSpeed: true,
});

const causticBite: CombatAction = createCombatAction({
  id: ActionId.CausticBite,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.CausticBite, context, { potency: 150 }));

    if (rng(35)) {
      dispatch(buff(StatusId.StraightShotReady));
    }

    dispatch(debuff(StatusId.CausticBite));
  },
  reducedBySkillSpeed: true,
});

const ragingStrikes: CombatAction = createCombatAction({
  id: ActionId.RagingStrikes,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.RagingStrikes));
  },
  entersCombat: false,
});

const battleVoice: CombatAction = createCombatAction({
  id: ActionId.BattleVoice,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.BattleVoice));
  },
  entersCombat: false,
});

const barrage: CombatAction = createCombatAction({
  id: ActionId.Barrage,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Barrage));
    dispatch(buff(StatusId.StraightShotReady));
    dispatch(buff(StatusId.ResonantArrowReady));
  },
  entersCombat: false,
  redirect: (state) => (hasBuff(state, StatusId.ResonantArrowReady) ? ActionId.ResonantArrow : ActionId.Barrage),
  actionChangeTo: ActionId.ResonantArrow,
});

const resonantArrow: CombatAction = createCombatAction({
  id: ActionId.ResonantArrow,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.ResonantArrow, context, { potency: 600 }));
    dispatch(removeBuff(StatusId.ResonantArrowReady));
  },
  isUsable: (state) => hasBuff(state, StatusId.ResonantArrowReady),
  isGlowing: (state) => hasBuff(state, StatusId.ResonantArrowReady),
  reducedBySkillSpeed: true,
});

const wanderersMinuet: CombatAction = createCombatAction({
  id: ActionId.TheWanderersMinuet,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.TheWanderersMinuet, context, { potency: 100 }));

    const ethos = hasBuff(getState(), StatusId.ArmysEthos);
    if (ethos || hasBuff(getState(), StatusId.ArmysPaeonActive)) {
      if (armyRepertoire(getState())) {
        dispatch(buff(StatusId.ArmysMuse));
      }
    }

    if (ethos) {
      dispatch(removeBuff(StatusId.ArmysEthos));
    }

    dispatch(setWandererCoda(1));
    dispatch(setWandererRepertiore(0));

    dispatch(buff(StatusId.TheWanderersMinuet));
    dispatch(buff(StatusId.WanderersMinuetActive));
  },
  redirect: (state) => (hasBuff(state, StatusId.WanderersMinuetActive) ? ActionId.PitchPerfect : ActionId.TheWanderersMinuet),
  actionChangeTo: ActionId.PitchPerfect,
});

const magesBallad: CombatAction = createCombatAction({
  id: ActionId.MagesBallad,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.MagesBallad, context, { potency: 100 }));

    const ethos = hasBuff(getState(), StatusId.ArmysEthos);
    if (ethos || hasBuff(getState(), StatusId.ArmysPaeonActive)) {
      if (armyRepertoire(getState())) {
        dispatch(buff(StatusId.ArmysMuse));
      }
    }

    if (ethos) {
      dispatch(removeBuff(StatusId.ArmysEthos));
    }

    dispatch(setMageCoda(1));

    dispatch(buff(StatusId.MagesBallad));
    dispatch(buff(StatusId.MagesBalladActive));
  },
});

const armysPaeon: CombatAction = createCombatAction({
  id: ActionId.ArmysPaeon,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.ArmysPaeon, context, { potency: 100 }));

    dispatch(setArmyCoda(1));
    dispatch(setArmyRepertiore(0));

    dispatch(buff(StatusId.ArmysPaeon));
    dispatch(buff(StatusId.ArmysPaeonActive));
  },
});

const pitchPerfectPotency: Record<number, number> = {
  1: 100,
  2: 220,
  3: 360,
};

const pitchPerfect: CombatAction = createCombatAction({
  id: ActionId.PitchPerfect,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.PitchPerfect, context, { potency: pitchPerfectPotency[wandererRepertoire(getState())] }));
    dispatch(ogcdLock());
    dispatch(setWandererRepertiore(0));
  },
  isUsable: (state) => hasBuff(state, StatusId.WanderersMinuetActive) && wandererRepertoire(state) > 0,
  isGlowing: (state) => hasBuff(state, StatusId.WanderersMinuetActive) && wandererRepertoire(state) > 0,
});

const bloodletter: CombatAction = createCombatAction({
  id: ActionId.Bloodletter,
  execute: () => {},
  redirect: () => ActionId.HeartbreakShot,
});

const heartbreakShot: CombatAction = createCombatAction({
  id: ActionId.HeartbreakShot,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HeartbreakShot, context, { potency: 180 }));

    dispatch(ogcdLock());
  },
  maxCharges: () => 3,
  extraCooldown: () => ({ cooldownGroup: 1000, duration: 1 }),
});

const sidewinder: CombatAction = createCombatAction({
  id: ActionId.Sidewinder,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Sidewinder, context, { potency: 400 }));

    dispatch(ogcdLock());
  },
});

const empyrealArrow: CombatAction = createCombatAction({
  id: ActionId.EmpyrealArrow,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.EmpyrealArrow, context, { potency: 240 }));
    dispatch(ogcdLock());

    if (hasBuff(getState(), StatusId.WanderersMinuetActive)) {
      dispatch(addWandererRepertiore(1));
      dispatch(addSoulVoice(5));
    } else if (hasBuff(getState(), StatusId.MagesBalladActive)) {
      dispatch(modifyCooldown(getActionById(ActionId.HeartbreakShot).cooldownGroup, -7500));
      dispatch(addSoulVoice(5));
    } else if (hasBuff(getState(), StatusId.ArmysPaeonActive)) {
      dispatch(addArmyRepertiore(1));
      dispatch(addSoulVoice(5));
    }
  },
});

const ironJaws: CombatAction = createCombatAction({
  id: ActionId.IronJaws,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.IronJaws, context, { potency: 100 }));
    if (rng(35)) {
      dispatch(buff(StatusId.StraightShotReady));
    }

    if (hasDebuff(getState(), StatusId.Stormbite)) {
      dispatch(debuff(StatusId.Stormbite));
    }

    if (hasDebuff(getState(), StatusId.CausticBite)) {
      dispatch(debuff(StatusId.CausticBite));
    }
  },
  reducedBySkillSpeed: true,
});

const apexArrow: CombatAction = createCombatAction({
  id: ActionId.ApexArrow,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.ApexArrow, context, { potency: 0.0125 * (context.cost - 20) * 480 + 120 }));
    if (context.cost >= 80) {
      dispatch(buff(StatusId.BlastArrowReady));
    }
  },
  isUsable: (state) => soulVoice(state) >= 20,
  isGlowing: (state) => soulVoice(state) >= 80,
  redirect: (state) => (hasBuff(state, StatusId.BlastArrowReady) ? ActionId.BlastArrow : ActionId.ApexArrow),
  cost: (state) => soulVoice(state),
  reducedBySkillSpeed: true,
});

const blastArrow: CombatAction = createCombatAction({
  id: ActionId.BlastArrow,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.BlastArrow, context, { potency: 600 }));
    dispatch(removeBuff(StatusId.BlastArrowReady));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const radiantFinale: CombatAction = createCombatAction({
  id: ActionId.RadiantFinale,
  execute: (dispatch, getState) => {
    dispatch(ogcdLock());

    const codaCount = coda(getState());

    dispatch(setArmyCoda(0));
    dispatch(setMageCoda(0));
    dispatch(setWandererCoda(0));
    dispatch(buff(StatusId.RadiantFinale));
    dispatch(buff(StatusId.PlayingRadiantFinale));
    dispatch(buff(StatusId.RadiantEncoreReady));
    dispatch(buff(StatusId.RadiantEncoreCoda, { stacks: codaCount }));
  },
  isUsable: (state) => hasCoda(state),
  isGlowing: (state) => hasCoda(state),
  redirect: (state) => (hasBuff(state, StatusId.RadiantEncoreReady) ? ActionId.RadiantEncore : ActionId.RadiantFinale),
  entersCombat: false,
  actionChangeTo: ActionId.RadiantEncore,
});

const radiantEncoreDmgMap: Record<number, number> = {
  1: 500,
  2: 600,
  3: 900,
};

const radiantEncore: CombatAction = createCombatAction({
  id: ActionId.RadiantEncore,
  execute: (dispatch, getState, context) => {
    const codaCount = buffStacks(getState(), StatusId.RadiantEncoreCoda);

    dispatch(dmgEvent(ActionId.RadiantEncore, context, { potency: radiantEncoreDmgMap[codaCount] }));
    dispatch(removeBuff(StatusId.RadiantEncoreReady));
  },
  isUsable: (state) => hasBuff(state, StatusId.RadiantEncoreReady),
  isGlowing: (state) => hasBuff(state, StatusId.RadiantEncoreReady),
  reducedBySkillSpeed: true,
});

const troubadour: CombatAction = createCombatAction({
  id: ActionId.Troubadour,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Troubadour));
  },
  entersCombat: false,
});

const theWardensPaean: CombatAction = createCombatAction({
  id: ActionId.TheWardensPaean,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.TheWardensPaean));
  },
  entersCombat: false,
});

const naturesMinne: CombatAction = createCombatAction({
  id: ActionId.NaturesMinne,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.NaturesMinne));
  },
  entersCombat: false,
});

const quickNock: CombatAction = createCombatAction({
  id: ActionId.QuickNock,
  execute: () => {},
  redirect: () => ActionId.Ladonsbite,
  reducedBySkillSpeed: true,
});

const ladonsbite: CombatAction = createCombatAction({
  id: ActionId.Ladonsbite,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Ladonsbite, context, { potency: 130 }));
    if (rng(35)) {
      dispatch(buff(StatusId.HawksEye));
    }
  },
  reducedBySkillSpeed: true,
});

const wideVolley: CombatAction = createCombatAction({
  id: ActionId.WideVolley,
  execute: () => {},
  redirect: () => ActionId.Shadowbite,
  reducedBySkillSpeed: true,
});

const shadowbite: CombatAction = createCombatAction({
  id: ActionId.Shadowbite,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Shadowbite, context, { potency: 170 }));
    dispatch(removeBuff(StatusId.HawksEye));
  },
  reducedBySkillSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.HawksEye),
  isGlowing: (state) => hasBuff(state, StatusId.HawksEye),
});

const repellingShot: CombatAction = createCombatAction({
  id: ActionId.RepellingShot,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
});

const raidOfDeath: CombatAction = createCombatAction({
  id: ActionId.RainofDeath,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.RainofDeath, context, { potency: 100 }));
    dispatch(ogcdLock());
  },
  maxCharges: () => 3,
  extraCooldown: () => ({ cooldownGroup: 1000, duration: 1 }),
});

export const brdStatuses = [
  straightShotReadyStatus,
  causticBiteStatus,
  stormbiteStatus,
  barrageStatus,
  radiantFinaleStatus,
  playingRadiantFinale,
  ragingStrikesStatus,
  battleVoiceStatus,
  magesBalladStatus,
  armysPaeonStatus,
  theWanderersMinuetStatus,
  wardensPaeanStatus,
  armysPaeonActive,
  magesBalladActive,
  wanderersMinuetActive,
  naturesMinneStatus,
  hawksEyeStatus,
  troubadourStatus,
  armysMuseStatus,
  armysEthosStatus,
  blastArrowReadyStatus,
  resonantArrowReadyStatus,
  radiantEncoreCodaStatus,
  radiantEncoreReadyStatus,
];

export const brd: CombatAction[] = [
  heavyShot,
  burstShot,
  straightShot,
  refulgentArrow,
  windbite,
  stormbite,
  venomousBite,
  causticBite,
  ragingStrikes,
  battleVoice,
  barrage,
  wanderersMinuet,
  magesBallad,
  armysPaeon,
  pitchPerfect,
  bloodletter,
  sidewinder,
  empyrealArrow,
  ironJaws,
  apexArrow,
  blastArrow,
  radiantFinale,
  troubadour,
  theWardensPaean,
  naturesMinne,
  quickNock,
  ladonsbite,
  shadowbite,
  repellingShot,
  raidOfDeath,
  heartbreakShot,
  wideVolley,
  resonantArrow,
  radiantEncore,
];

export const brdEpics = combineEpics(consumeBarrageEpic, endArmysPaeonEpic, endMagesBalladEpic, endWanderersMinuetEpic);
