import { combineEpics, Epic } from 'redux-observable';
import { interval, of } from 'rxjs';
import { filter, map, switchMap, takeWhile, withLatestFrom } from 'rxjs/operators';
import { RootState } from '../../../../app/store';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
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
  extendableDebuff,
  addSoulVoice,
} from '../../combatSlice';
import { rng } from '../../utils';

function soulVoice(state: RootState) {
  return resource(state, 'soulVoice');
}

function armyRepertoire(state: RootState) {
  return resource(state, 'armyRepertoire');
}

function wandererRepertoire(state: RootState) {
  return resource(state, 'wandererRepertoire');
}

function hasCoda(state: RootState): boolean {
  return !!(resource(state, 'wandererCoda') || resource(state, 'mageCoda') || resource(state, 'armyCoda'));
}

const consumeBarrageEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(
      (a) =>
        a.type === executeAction.type &&
        [
          ActionId.BurstShot,
          ActionId.RefulgentArrow,
          ActionId.IronJaws,
          ActionId.CausticBite,
          ActionId.Stormbite,
          ActionId.Shadowbite,
        ].includes(a.payload.id)
    ),
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

const wanderersMinuetEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.WanderersMinuetActive),
    switchMap((a) =>
      interval(3000).pipe(
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, a.payload.id)),
        filter(() => rng(80)),
        switchMap(() => of(addWandererRepertiore(1), addSoulVoice(5)))
      )
    )
  );

const magesBalladEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.MagesBalladActive),
    switchMap((a) =>
      interval(3000).pipe(
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, a.payload.id)),
        filter(() => rng(80)),
        switchMap(() => of(modifyCooldown(5, -7500), addSoulVoice(5)))
      )
    )
  );

const armysPaeonEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.ArmysPaeonActive),
    switchMap((a) =>
      interval(3000).pipe(
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, a.payload.id)),
        filter(() => rng(80)),
        switchMap(() => of(addArmyRepertiore(1), addSoulVoice(5)))
      )
    )
  );

const heavyShot: CombatAction = createCombatAction({
  id: ActionId.HeavyShot,
  execute: () => {},
  redirect: () => ActionId.BurstShot,
  reducedBySkillSpeed: true,
});

const burstShot: CombatAction = createCombatAction({
  id: ActionId.BurstShot,
  execute: (dispatch) => {
    if (rng(35)) {
      dispatch(buff(StatusId.StraightShotReady, 30));
    }
  },
  reducedBySkillSpeed: true,
});

const straightShot: CombatAction = createCombatAction({
  id: ActionId.StraightShot,
  execute: () => {},
  redirect: () => ActionId.RefulgentArrow,
  reducedBySkillSpeed: true,
});

const refulgentArrow: CombatAction = createCombatAction({
  id: ActionId.RefulgentArrow,
  execute: (dispatch) => {
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
  execute: (dispatch) => {
    if (rng(35)) {
      dispatch(buff(StatusId.StraightShotReady, 30));
    }

    dispatch(debuff(StatusId.Stormbite, 30));
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
  execute: (dispatch) => {
    if (rng(35)) {
      dispatch(buff(StatusId.StraightShotReady, 30));
    }

    dispatch(debuff(StatusId.CausticBite, 30));
  },
  reducedBySkillSpeed: true,
});

const ragingStrikes: CombatAction = createCombatAction({
  id: ActionId.RagingStrikes,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.RagingStrikes, 20));
  },
  entersCombat: false,
});

const battleVoice: CombatAction = createCombatAction({
  id: ActionId.BattleVoice,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.BattleVoice, 15));
  },
  entersCombat: false,
});

const barrage: CombatAction = createCombatAction({
  id: ActionId.Barrage,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Barrage, 10));
    dispatch(buff(StatusId.StraightShotReady, 30));
  },
  entersCombat: false,
});

const wanderersMinuet: CombatAction = createCombatAction({
  id: ActionId.TheWanderersMinuet,
  execute: (dispatch, getState) => {
    const ethos = hasBuff(getState(), StatusId.ArmysEthos);
    if (ethos || hasBuff(getState(), StatusId.ArmysPaeonActive)) {
      if (armyRepertoire(getState())) {
        dispatch(buff(StatusId.ArmysMuse, 10));
      }
    }

    if (ethos) {
      dispatch(removeBuff(StatusId.ArmysEthos));
    }

    dispatch(setWandererCoda(1));
    dispatch(setWandererRepertiore(0));

    dispatch(buff(StatusId.TheWanderersMinuet, null));
    dispatch(
      buff(StatusId.WanderersMinuetActive, 45, {
        isVisible: false,
        expireCallback: () =>
          setTimeout(() => {
            if (hasBuff(getState(), StatusId.TheWanderersMinuet)) {
              dispatch(removeBuff(StatusId.TheWanderersMinuet));
            }
          }, 3000),
      })
    );
  },
  redirect: (state) => (hasBuff(state, StatusId.WanderersMinuetActive) ? ActionId.PitchPerfect : ActionId.TheWanderersMinuet),
});

const magesBallad: CombatAction = createCombatAction({
  id: ActionId.MagesBallad,
  execute: (dispatch, getState) => {
    const ethos = hasBuff(getState(), StatusId.ArmysEthos);
    if (ethos || hasBuff(getState(), StatusId.ArmysPaeonActive)) {
      if (armyRepertoire(getState())) {
        dispatch(buff(StatusId.ArmysMuse, 10));
      }
    }

    if (ethos) {
      dispatch(removeBuff(StatusId.ArmysEthos));
    }

    dispatch(setMageCoda(1));

    dispatch(buff(StatusId.MagesBallad, null));
    dispatch(
      buff(StatusId.MagesBalladActive, 45, {
        isVisible: false,
        expireCallback: () =>
          setTimeout(() => {
            if (hasBuff(getState(), StatusId.MagesBallad)) {
              dispatch(removeBuff(StatusId.MagesBallad));
            }
          }, 3000),
      })
    );
  },
});

const armysPaeon: CombatAction = createCombatAction({
  id: ActionId.ArmysPaeon,
  execute: (dispatch, getState) => {
    dispatch(setArmyCoda(1));
    dispatch(setArmyRepertiore(0));

    dispatch(buff(StatusId.ArmysPaeon, null));
    dispatch(
      buff(StatusId.ArmysPaeonActive, 45, {
        isVisible: false,
        expireCallback: () => {
          if (armyRepertoire(getState())) {
            dispatch(buff(StatusId.ArmysEthos, 30));
          }

          setTimeout(() => {
            if (hasBuff(getState(), StatusId.ArmysPaeon)) {
              dispatch(removeBuff(StatusId.ArmysPaeon));
            }
          }, 3000);
        },
      })
    );
  },
});

const pitchPerfect: CombatAction = createCombatAction({
  id: ActionId.PitchPerfect,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(setWandererRepertiore(0));
  },
  isUsable: (state) => hasBuff(state, StatusId.WanderersMinuetActive) && wandererRepertoire(state) > 0,
  isGlowing: (state) => hasBuff(state, StatusId.WanderersMinuetActive) && wandererRepertoire(state) > 0,
});

const bloodletter: CombatAction = createCombatAction({
  id: ActionId.Bloodletter,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  maxCharges: () => 3,
  extraCooldown: () => ({ cooldownGroup: 1000, duration: 1 }),
});

const sidewinder: CombatAction = createCombatAction({
  id: ActionId.Sidewinder,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
});

const empyrealArrow: CombatAction = createCombatAction({
  id: ActionId.EmpyrealArrow,
  execute: (dispatch, getState) => {
    dispatch(ogcdLock());

    if (hasBuff(getState(), StatusId.WanderersMinuetActive)) {
      dispatch(addWandererRepertiore(1));
      dispatch(addSoulVoice(5));
    } else if (hasBuff(getState(), StatusId.MagesBalladActive)) {
      dispatch(modifyCooldown(5, -7500));
      dispatch(addSoulVoice(5));
    } else if (hasBuff(getState(), StatusId.ArmysPaeonActive)) {
      dispatch(addArmyRepertiore(1));
      dispatch(addSoulVoice(5));
    }
  },
});

const ironJaws: CombatAction = createCombatAction({
  id: ActionId.IronJaws,
  execute: (dispatch, getState) => {
    if (rng(35)) {
      dispatch(buff(StatusId.StraightShotReady, 30));
    }

    if (hasDebuff(getState(), StatusId.Stormbite)) {
      dispatch(extendableDebuff(StatusId.Stormbite, 30, 30));
    }

    if (hasDebuff(getState(), StatusId.CausticBite)) {
      dispatch(extendableDebuff(StatusId.CausticBite, 30, 30));
    }
  },
  reducedBySkillSpeed: true,
});

const apexArrow: CombatAction = createCombatAction({
  id: ActionId.ApexArrow,
  execute: (dispatch, _, context) => {
    if (context.cost >= 80) {
      dispatch(buff(StatusId.BlastArrowReady, 10));
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
  execute: (dispatch) => {
    dispatch(removeBuff(StatusId.BlastArrowReady));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const radiantFinale: CombatAction = createCombatAction({
  id: ActionId.RadiantFinale,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(setArmyCoda(0));
    dispatch(setMageCoda(0));
    dispatch(setWandererCoda(0));
    dispatch(buff(StatusId.RadiantFinale, 15));
    dispatch(buff(StatusId.PlayingRadiantFinale, 15));
  },
  isUsable: (state) => hasCoda(state),
  isGlowing: (state) => hasCoda(state),
  entersCombat: false,
});

const troubadour: CombatAction = createCombatAction({
  id: ActionId.Troubadour,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Troubadour, 15));
  },
  entersCombat: false,
});

const theWardensPaean: CombatAction = createCombatAction({
  id: ActionId.TheWardensPaean,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.TheWardensPaean, 30));
  },
  entersCombat: false,
});

const naturesMinne: CombatAction = createCombatAction({
  id: ActionId.NaturesMinne,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.NaturesMinne, 15));
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
  execute: (dispatch) => {
    if (rng(35)) {
      dispatch(buff(StatusId.ShadowbiteReady, 30));
    }
  },
  reducedBySkillSpeed: true,
});

const shadowbite: CombatAction = createCombatAction({
  id: ActionId.Shadowbite,
  execute: (dispatch) => {
    dispatch(removeBuff(StatusId.ShadowbiteReady));
  },
  reducedBySkillSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.ShadowbiteReady),
  isGlowing: (state) => hasBuff(state, StatusId.ShadowbiteReady),
});

const repellingShot: CombatAction = createCombatAction({
  id: ActionId.RepellingShot,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
});

const raidOfDeath: CombatAction = createCombatAction({
  id: ActionId.RainofDeath,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  maxCharges: () => 3,
  extraCooldown: () => ({ cooldownGroup: 1000, duration: 1 }),
});

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
];

export const brdEpics = combineEpics(
  consumeBarrageEpic,
  endArmysPaeonEpic,
  endMagesBalladEpic,
  endWanderersMinuetEpic,
  wanderersMinuetEpic,
  magesBalladEpic,
  armysPaeonEpic
);
