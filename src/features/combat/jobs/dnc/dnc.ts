import { combineEpics, Epic } from 'redux-observable';
import { interval, of } from 'rxjs';
import { filter, first, map, switchMap, takeUntil, takeWhile, withLatestFrom } from 'rxjs/operators';
import { AppThunk, ReducerAction, RootState } from '../../../../app/store';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { selectPartySize, setPartySize } from '../../../player/playerSlice';
import { CombatAction, createCombatAction } from '../../combat-action';
import { CombatStatus, createCombatStatus } from '../../combat-status';
import {
  addBuff,
  addCooldown,
  addEsprit,
  addFans,
  buff,
  StatusState,
  combo,
  cooldown,
  executeAction,
  hasBuff,
  hasCombo,
  inCombat,
  ogcdLock,
  removeBuff,
  resource,
  selectBuff,
  selectCombat,
  selectResources,
  setResource,
  gcd,
  event,
  removeBuffAction,
  dmgEvent,
  addBuffStack,
} from '../../combatSlice';
import { rng } from '../../utils';

const shuffleArray = (array: any[]) => {
  const result = [];
  while (array.length) {
    const index = Math.floor(Math.random() * array.length);
    result.push(array[index]);
    array.splice(index, 1);
  }

  return result;
};

function isDancing(state: RootState) {
  return hasBuff(state, StatusId.StandardStep) || hasBuff(state, StatusId.TechnicalStep);
}

function isNextStep(state: RootState, action: ActionId) {
  const combat = selectCombat(state);

  return combat.resources[`step${combat.resources.step + 1}`] === action;
}

function isDanceComplete(state: RootState) {
  const combat = selectCombat(state);

  return combat.resources.step === combat.resources.steps;
}

function fans(state: RootState) {
  return resource(state, 'fans');
}

function esprit(state: RootState) {
  return resource(state, 'esprit');
}

function steps(state: RootState) {
  return resource(state, 'step');
}

function canGetEspritFromWeaponskills(state: RootState) {
  return hasBuff(state, StatusId.Esprit) || hasBuff(state, StatusId.TechnicalEsprit);
}

const dance =
  (stepCount: number): AppThunk =>
  (dispatch) => {
    dispatch(setResource({ resourceType: 'steps', amount: stepCount }));
    dispatch(setResource({ resourceType: 'step', amount: 0 }));

    const steps = shuffleArray([ActionId.Emboite, ActionId.Entrechat, ActionId.Jete, ActionId.Pirouette]);

    for (let i = 1; i <= 4; i++) {
      dispatch(setResource({ resourceType: `step${i}`, amount: i > stepCount ? 0 : steps[i - 1] }));
    }
  };

const step =
  (action: ActionId): AppThunk =>
  (dispatch, getState) => {
    const resources = selectResources(getState());

    if (resources.step === resources.steps) {
      return;
    }

    if (resources[`step${resources.step + 1}`] === action) {
      dispatch(setResource({ resourceType: 'step', amount: resources.step + 1 }));
    }
  };

const resetDanceEpic: Epic = (action$) =>
  action$.pipe(
    filter((a) => a.type === removeBuffAction.type && (a.payload === StatusId.StandardStep || a.payload === StatusId.TechnicalStep)),
    map(() => dance(0))
  );

const technicalFinishEspritEpic: Epic<ReducerAction<StatusState>, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.TechnicalFinish),
    switchMap((a) =>
      interval(1250).pipe(
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, a.payload.id)),
        map((state) => {
          let technicalEspritGenerators = state.player.partySize - 1;

          const closedPositionStatus = selectBuff(state, StatusId.ClosedPosition);
          const espritStatus = selectBuff(state, StatusId.TechnicalStep);

          if (closedPositionStatus && espritStatus && closedPositionStatus.timestamp < espritStatus.timestamp) {
            technicalEspritGenerators--;
          }

          let esprit = 0;

          for (let i = 0; i < technicalEspritGenerators; i++) {
            if (rng(10)) {
              esprit += 10;
            }
          }

          return addEsprit(esprit);
        })
      )
    )
  );

const standardFinishEspritEpic: Epic<ReducerAction<StatusState>, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Esprit),
    switchMap((a) =>
      interval(2500).pipe(
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, a.payload.id) && hasBuff(state, StatusId.ClosedPosition)),
        takeUntil(action$.pipe(first((aa) => aa.type === addBuff.type && aa.payload.id === a.payload.id))),
        filter(() => rng(20)),
        map(() => addEsprit(10))
      )
    )
  );

const risingRythmEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Improvisation),
    switchMap((a) =>
      interval(3000).pipe(
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, a.payload.id)),
        takeUntil(action$.pipe(first((aa) => aa.type === addCooldown.type))),
        switchMap(() => of(buff(StatusId.ImprovisationRegen), addBuffStack(StatusId.RisingRhythm)))
      )
    )
  );

const soloPartySizeEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === setPartySize.type && a.payload === 1),
    map(() => removeBuff(StatusId.ClosedPosition))
  );

const improvisationStopByExpiryEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Improvisation),
    switchMap(() => action$.pipe(first((aa) => aa.type === removeBuffAction.type && aa.payload === StatusId.Improvisation))),
    switchMap(() => of(removeBuff(StatusId.Improvisation), removeBuff(StatusId.RisingRhythm), buff(StatusId.ImprovisationRegen)))
  );

const improvisationStopByFinishEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Improvisation),
    switchMap(() =>
      action$.pipe(
        first(
          (aa) => aa.type === executeAction.type && aa.payload.id !== ActionId.ImprovisedFinish && aa.payload.id !== ActionId.Improvisation
        )
      )
    ),
    switchMap(() => of(removeBuff(StatusId.Improvisation), removeBuff(StatusId.RisingRhythm)))
  );

const improvisationRegenStatus: CombatStatus = createCombatStatus({
  id: StatusId.ImprovisationRegen,
  duration: 15,
  isHarmful: false,
  tick: (dispatch) => dispatch(event(0, { healthPotency: 100 })),
  initialDelay: 2900,
  interval: 3025,
});

const risingRhythmStatus: CombatStatus = createCombatStatus({
  id: StatusId.RisingRhythm,
  duration: 30,
  isHarmful: false,
});

const silkenSymmetryStatus: CombatStatus = createCombatStatus({
  id: StatusId.SilkenSymmetry,
  duration: 30,
  isHarmful: false,
});

const silkenFlowStatus: CombatStatus = createCombatStatus({
  id: StatusId.SilkenFlow,
  duration: 30,
  isHarmful: false,
});

const standardStepStatus: CombatStatus = createCombatStatus({
  id: StatusId.StandardStep,
  duration: 15,
  isHarmful: false,
});

const standardFinishStatus: CombatStatus = createCombatStatus({
  id: StatusId.StandardFinish,
  duration: 60,
  isHarmful: false,
});

const espritStatus: CombatStatus = createCombatStatus({
  id: StatusId.Esprit,
  duration: 60,
  isHarmful: false,
});

const devilmentStatus: CombatStatus = createCombatStatus({
  id: StatusId.Devilment,
  duration: 20,
  isHarmful: false,
});

const flourishingStarfallStatus: CombatStatus = createCombatStatus({
  id: StatusId.FlourishingStarfall,
  duration: 20,
  isHarmful: false,
});

const threefoldFanDanceStatus: CombatStatus = createCombatStatus({
  id: StatusId.ThreefoldFanDance,
  duration: 30,
  isHarmful: false,
});

const technicalStepStatus: CombatStatus = createCombatStatus({
  id: StatusId.TechnicalStep,
  duration: 15,
  isHarmful: false,
});

const technicalFinishStatus: CombatStatus = createCombatStatus({
  id: StatusId.TechnicalFinish,
  duration: 20,
  isHarmful: false,
});

const flourishingFinishStatus: CombatStatus = createCombatStatus({
  id: StatusId.FlourishingFinish,
  duration: 30,
  isHarmful: false,
});

const technicalEspritStatus: CombatStatus = createCombatStatus({
  id: StatusId.TechnicalEsprit,
  duration: 20,
  isHarmful: false,
});

const flourishingSymmetryStatus: CombatStatus = createCombatStatus({
  id: StatusId.FlourishingSymmetry,
  duration: 30,
  isHarmful: false,
});

const flourishingFlowStatus: CombatStatus = createCombatStatus({
  id: StatusId.FlourishingFlow,
  duration: 30,
  isHarmful: false,
});

const fourfoldFanDanceStatus: CombatStatus = createCombatStatus({
  id: StatusId.FourfoldFanDance,
  duration: 30,
  isHarmful: false,
});

const closedPositionStatus: CombatStatus = createCombatStatus({
  id: StatusId.ClosedPosition,
  duration: null,
  isHarmful: false,
});

const shieldSambaStatus: CombatStatus = createCombatStatus({
  id: StatusId.ShieldSamba,
  duration: 15,
  isHarmful: false,
});

const improvisationStatus: CombatStatus = createCombatStatus({
  id: StatusId.Improvisation,
  duration: 15,
  isHarmful: false,
});

const lastDanceReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.LastDanceReady,
  duration: 30,
  isHarmful: false,
});

const finishingMoveReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.FinishingMoveReady,
  duration: 30,
  isHarmful: false,
});

const danceoftheDawnReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.DanceoftheDawnReady,
  duration: 30,
  isHarmful: false,
});

const cascade: CombatAction = createCombatAction({
  id: ActionId.Cascade,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Cascade, context, { potency: 220 }));
    dispatch(combo(ActionId.Cascade));

    if (canGetEspritFromWeaponskills(getState())) {
      dispatch(addEsprit(5));
    }
    if (rng(50)) {
      dispatch(buff(StatusId.SilkenSymmetry));
    }
  },
  isUsable: (state) => !isDancing(state),
  redirect: (state) => (isDancing(state) ? ActionId.Emboite : ActionId.Cascade),
  reducedBySkillSpeed: true,
});

const fountain: CombatAction = createCombatAction({
  id: ActionId.Fountain,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Fountain, context, { potency: 120, comboPotency: 280 }));

    if (context.comboed) {
      if (canGetEspritFromWeaponskills(getState())) {
        dispatch(addEsprit(5));
      }
      if (rng(50)) {
        dispatch(buff(StatusId.SilkenFlow));
      }
    }
  },
  isUsable: (state) => !isDancing(state),
  isGlowing: (state) => hasCombo(state, ActionId.Fountain),
  redirect: (state) => (isDancing(state) ? ActionId.Entrechat : ActionId.Fountain),
  reducedBySkillSpeed: true,
});

const reverseCascade: CombatAction = createCombatAction({
  id: ActionId.ReverseCascade,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.ReverseCascade, context, { potency: 280 }));

    const state = getState();
    const consume = hasBuff(state, StatusId.FlourishingSymmetry) ? StatusId.FlourishingSymmetry : StatusId.SilkenSymmetry;
    dispatch(removeBuff(consume));

    if (canGetEspritFromWeaponskills(state)) {
      dispatch(addEsprit(10));
    }
    if (rng(50)) {
      dispatch(addFans(1));
    }
  },
  isUsable: (state) => (hasBuff(state, StatusId.SilkenSymmetry) || hasBuff(state, StatusId.FlourishingSymmetry)) && !isDancing(state),
  isGlowing: (state) => hasBuff(state, StatusId.SilkenSymmetry) || hasBuff(state, StatusId.FlourishingSymmetry),
  redirect: (state) => (isDancing(state) ? ActionId.Jete : ActionId.ReverseCascade),
  reducedBySkillSpeed: true,
});

const fountainfall: CombatAction = createCombatAction({
  id: ActionId.Fountainfall,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Fountainfall, context, { potency: 340 }));

    const state = getState();
    const consume = hasBuff(state, StatusId.FlourishingFlow) ? StatusId.FlourishingFlow : StatusId.SilkenFlow;
    dispatch(removeBuff(consume));

    if (canGetEspritFromWeaponskills(state)) {
      dispatch(addEsprit(10));
    }
    if (rng(50)) {
      dispatch(addFans(1));
    }
  },
  isUsable: (state) => (hasBuff(state, StatusId.SilkenFlow) || hasBuff(state, StatusId.FlourishingFlow)) && !isDancing(state),
  isGlowing: (state) => hasBuff(state, StatusId.SilkenFlow) || hasBuff(state, StatusId.FlourishingFlow),
  redirect: (state) => (isDancing(state) ? ActionId.Pirouette : ActionId.Fountainfall),
  reducedBySkillSpeed: true,
});

const standardStep: CombatAction = createCombatAction({
  id: ActionId.StandardStep,
  execute: (dispatch) => {
    dispatch(dance(2));
    dispatch(buff(StatusId.StandardStep));
    dispatch(gcd({ time: 1500 }));
  },
  isUsable: (state) => !isDancing(state),
  redirect: (state) =>
    hasBuff(state, StatusId.FinishingMoveReady)
      ? ActionId.FinishingMove
      : hasBuff(state, StatusId.StandardStep)
      ? ActionId.StandardFinish
      : ActionId.StandardStep,
  entersCombat: false,
});

const emboite: CombatAction = createCombatAction({
  id: ActionId.Emboite,
  execute: (dispatch) => {
    dispatch(step(ActionId.Emboite));
  },
  isUsable: (state) => isDancing(state),
  isGlowing: (state) => isNextStep(state, ActionId.Emboite),
  entersCombat: false,
});

const jete: CombatAction = createCombatAction({
  id: ActionId.Jete,
  execute: (dispatch) => {
    dispatch(step(ActionId.Jete));
  },
  isUsable: (state) => isDancing(state),
  isGlowing: (state) => isNextStep(state, ActionId.Jete),
  entersCombat: false,
});

const entrechat: CombatAction = createCombatAction({
  id: ActionId.Entrechat,
  execute: (dispatch) => {
    dispatch(step(ActionId.Entrechat));
  },
  isUsable: (state) => isDancing(state),
  isGlowing: (state) => isNextStep(state, ActionId.Entrechat),
  entersCombat: false,
});

const pirouette: CombatAction = createCombatAction({
  id: ActionId.Pirouette,
  execute: (dispatch) => {
    dispatch(step(ActionId.Pirouette));
  },
  isUsable: (state) => isDancing(state),
  isGlowing: (state) => isNextStep(state, ActionId.Pirouette),
  entersCombat: false,
});

const standardFinishDmgMap: Record<number, { potency: number; actionId: ActionId }> = {
  0: {
    potency: 360,
    actionId: ActionId.StandardFinish,
  },
  1: {
    potency: 540,
    actionId: ActionId.SingleStandardFinish,
  },
  2: {
    potency: 850,
    actionId: ActionId.DoubleStandardFinish,
  },
};

const standardFinish: CombatAction = createCombatAction({
  id: ActionId.StandardFinish,
  execute: (dispatch, getState, context) => {
    const stepCount = steps(getState());
    const { actionId, potency } = standardFinishDmgMap[stepCount];
    dispatch(dmgEvent(actionId, context, { potency }));

    dispatch(dance(0));

    if (stepCount > 0) {
      dispatch(removeBuff(StatusId.StandardStep));

      if (hasBuff(getState(), StatusId.TechnicalEsprit)) {
        dispatch(removeBuff(StatusId.TechnicalEsprit));
      }

      dispatch(buff(StatusId.StandardFinish));
      dispatch(buff(StatusId.LastDanceReady));
      dispatch(buff(StatusId.Esprit));
    }
  },
  isUsable: (state) => hasBuff(state, StatusId.StandardStep),
  isGlowing: (state) => isDanceComplete(state),
});

const devilment: CombatAction = createCombatAction({
  id: ActionId.Devilment,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Devilment));
    dispatch(buff(StatusId.FlourishingStarfall));
  },
  isUsable: (state) => !isDancing(state),
  entersCombat: false,
});

const fanDance: CombatAction = createCombatAction({
  id: ActionId.FanDance,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.FanDance, context, { potency: 150 }));

    if (rng(50)) {
      dispatch(buff(StatusId.ThreefoldFanDance));
    }
  },
  isUsable: (state) => !isDancing(state) && fans(state) > 0,
  isGlowing: (state) => fans(state) > 0,
});

const fanDanceII: CombatAction = createCombatAction({
  id: ActionId.FanDanceII,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.FanDanceII, context, { potency: 100 }));

    if (rng(50)) {
      dispatch(buff(StatusId.ThreefoldFanDance));
    }
  },
  isUsable: (state) => !isDancing(state) && fans(state) > 0,
  isGlowing: (state) => fans(state) > 0,
});

const fanDanceIII: CombatAction = createCombatAction({
  id: ActionId.FanDanceIII,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.FanDanceIII, context, { potency: 200 }));
    dispatch(removeBuff(StatusId.ThreefoldFanDance));
  },
  isUsable: (state) => !isDancing(state) && hasBuff(state, StatusId.ThreefoldFanDance),
  isGlowing: (state) => hasBuff(state, StatusId.ThreefoldFanDance),
});

const fanDanceIV: CombatAction = createCombatAction({
  id: ActionId.FanDanceIV,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.FanDanceIV, context, { potency: 420 }));
    dispatch(removeBuff(StatusId.FourfoldFanDance));
  },
  isUsable: (state) => !isDancing(state) && hasBuff(state, StatusId.FourfoldFanDance),
  isGlowing: (state) => hasBuff(state, StatusId.FourfoldFanDance),
});

const technicalStep: CombatAction = createCombatAction({
  id: ActionId.TechnicalStep,
  execute: (dispatch) => {
    dispatch(dance(4));
    dispatch(buff(StatusId.TechnicalStep));
    dispatch(cooldown(58, 1500));
  },
  isUsable: (state) => !isDancing(state),
  isGlowing: () => false,
  redirect: (state) => {
    if (hasBuff(state, StatusId.FlourishingFinish)) {
      return ActionId.Tillana;
    }

    if (hasBuff(state, StatusId.TechnicalStep)) {
      return ActionId.TechnicalFinish;
    }

    return ActionId.TechnicalStep;
  },
  entersCombat: false,
});

const technicalFinishDmgMap: Record<number, { potency: number; actionId: ActionId }> = {
  0: {
    potency: 350,
    actionId: ActionId.TechnicalFinish,
  },
  1: {
    potency: 540,
    actionId: ActionId.SingleTechnicalFinish,
  },
  2: {
    potency: 720,
    actionId: ActionId.DoubleTechnicalFinish,
  },
  3: {
    potency: 900,
    actionId: ActionId.TripleTechnicalFinish,
  },
  4: {
    potency: 1300,
    actionId: ActionId.QuadrupleTechnicalFinish,
  },
};

const technicalFinish: CombatAction = createCombatAction({
  id: ActionId.TechnicalFinish,
  execute: (dispatch, getState, context) => {
    const stepCount = steps(getState());
    const { actionId, potency } = technicalFinishDmgMap[stepCount];
    dispatch(dmgEvent(actionId, context, { potency }));

    dispatch(removeBuff(StatusId.TechnicalStep));

    if (stepCount > 0) {
      dispatch(buff(StatusId.TechnicalFinish));
      dispatch(buff(StatusId.FlourishingFinish));
      dispatch(buff(StatusId.DanceoftheDawnReady));

      if (!hasBuff(getState(), StatusId.Esprit)) {
        dispatch(buff(StatusId.TechnicalEsprit));
      }
    }
  },
  isUsable: (state) => hasBuff(state, StatusId.TechnicalStep),
  isGlowing: (state) => isDanceComplete(state),
});

const tilliana: CombatAction = createCombatAction({
  id: ActionId.Tillana,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Tillana, context, { potency: 600 }));
    dispatch(removeBuff(StatusId.FlourishingFinish));
    dispatch(addEsprit(50));
  },
  isUsable: (state) => hasBuff(state, StatusId.FlourishingFinish),
  isGlowing: (state) => hasBuff(state, StatusId.FlourishingFinish),
});

const flourish: CombatAction = createCombatAction({
  id: ActionId.Flourish,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.FlourishingFlow));
    dispatch(buff(StatusId.FlourishingSymmetry));
    dispatch(buff(StatusId.ThreefoldFanDance));
    dispatch(buff(StatusId.FourfoldFanDance));
    dispatch(buff(StatusId.FinishingMoveReady));
  },
  isUsable: (state) => !isDancing(state) && inCombat(state),
  entersCombat: false,
});

const starfallDance: CombatAction = createCombatAction({
  id: ActionId.StarfallDance,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.StarfallDance, context, { potency: 600 }));
    dispatch(removeBuff(StatusId.FlourishingStarfall));
  },
  isUsable: (state) => !isDancing(state) && hasBuff(state, StatusId.FlourishingStarfall),
  isGlowing: (state) => hasBuff(state, StatusId.FlourishingStarfall),
  reducedBySkillSpeed: true,
});

const saberDance: CombatAction = createCombatAction({
  id: ActionId.SaberDance,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.SaberDance, context, { potency: 520 }));
  },
  isUsable: (state) => !isDancing(state) && esprit(state) >= 50,
  redirect: (state) => (hasBuff(state, StatusId.DanceoftheDawnReady) ? ActionId.DanceoftheDawn : ActionId.SaberDance),
  reducedBySkillSpeed: true,
});

const closedPosition: CombatAction = createCombatAction({
  id: ActionId.ClosedPosition,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.ClosedPosition));
  },
  isUsable: (state) => !isDancing(state) && selectPartySize(state) > 1,
  redirect: (state) => (hasBuff(state, StatusId.ClosedPosition) ? ActionId.Ending : ActionId.ClosedPosition),
  entersCombat: false,
});

const ending: CombatAction = createCombatAction({
  id: ActionId.Ending,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.ClosedPosition));
  },
  isUsable: (state) => !isDancing(state),
  entersCombat: false,
});

const improvisation: CombatAction = createCombatAction({
  id: ActionId.Improvisation,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Improvisation));
    dispatch(buff(StatusId.ImprovisationRegen));
  },
  isUsable: (state) => !isDancing(state),
  redirect: (state) => (hasBuff(state, StatusId.Improvisation) ? ActionId.ImprovisedFinish : ActionId.Improvisation),
  entersCombat: false,
});

const improvisedFinish: CombatAction = createCombatAction({
  id: ActionId.ImprovisedFinish,
  execute: (dispatch, getState) => {
    dispatch(removeBuff(StatusId.Improvisation));

    if (hasBuff(getState(), StatusId.RisingRhythm)) {
      dispatch(removeBuff(StatusId.RisingRhythm));
    }

    dispatch(buff(StatusId.ImprovisedFinish));
  },
  isUsable: (state) => hasBuff(state, StatusId.Improvisation),
  isGlowing: (state) => hasBuff(state, StatusId.Improvisation),
  entersCombat: false,
});

const shieldSamba: CombatAction = createCombatAction({
  id: ActionId.ShieldSamba,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.ShieldSamba));
  },
  cooldown: () => 90,
  entersCombat: false,
});

const curingWaltz: CombatAction = createCombatAction({
  id: ActionId.CuringWaltz,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(event(ActionId.SecondWind, { healthPotency: 500 }));
  },
  entersCombat: false,
});

const enAvant: CombatAction = createCombatAction({
  id: ActionId.EnAvant,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  maxCharges: () => 3,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
  entersCombat: false,
});

const windmill: CombatAction = createCombatAction({
  id: ActionId.Windmill,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Windmill, context, { potency: 100 }));
    dispatch(combo(ActionId.Windmill));

    if (canGetEspritFromWeaponskills(getState())) {
      dispatch(addEsprit(5));
    }
    if (rng(50)) {
      dispatch(buff(StatusId.SilkenSymmetry));
    }
  },
  isUsable: (state) => !isDancing(state),
  isGlowing: () => false,
  redirect: (state) => (isDancing(state) ? ActionId.Emboite : ActionId.Windmill),
  reducedBySkillSpeed: true,
});

const bladeshower: CombatAction = createCombatAction({
  id: ActionId.Bladeshower,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Bladeshower, context, { potency: 100, comboPotency: 140 }));

    if (canGetEspritFromWeaponskills(getState())) {
      dispatch(addEsprit(5));
    }
    if (rng(50)) {
      dispatch(buff(StatusId.SilkenFlow));
    }
  },
  isUsable: (state) => !isDancing(state),
  isGlowing: (state) => hasCombo(state, ActionId.Bladeshower),
  redirect: (state) => (isDancing(state) ? ActionId.Entrechat : ActionId.Bladeshower),
  reducedBySkillSpeed: true,
});

const risingWindmill: CombatAction = createCombatAction({
  id: ActionId.RisingWindmill,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.RisingWindmill, context, { potency: 140 }));

    const state = getState();
    const consume = hasBuff(state, StatusId.FlourishingSymmetry) ? StatusId.FlourishingSymmetry : StatusId.SilkenSymmetry;
    dispatch(removeBuff(consume));

    if (canGetEspritFromWeaponskills(state)) {
      dispatch(addEsprit(10));
    }
    if (rng(50)) {
      dispatch(addFans(1));
    }
  },
  isUsable: (state) => (hasBuff(state, StatusId.SilkenSymmetry) || hasBuff(state, StatusId.FlourishingSymmetry)) && !isDancing(state),
  isGlowing: (state) => hasBuff(state, StatusId.SilkenSymmetry) || hasBuff(state, StatusId.FlourishingSymmetry),
  redirect: (state) => (isDancing(state) ? ActionId.Jete : ActionId.RisingWindmill),
  reducedBySkillSpeed: true,
});

const bloodshower: CombatAction = createCombatAction({
  id: ActionId.Bloodshower,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Bloodshower, context, { potency: 180 }));

    const state = getState();
    const consume = hasBuff(state, StatusId.FlourishingFlow) ? StatusId.FlourishingFlow : StatusId.SilkenFlow;
    dispatch(removeBuff(consume));

    if (canGetEspritFromWeaponskills(state)) {
      dispatch(addEsprit(10));
    }
    if (rng(50)) {
      dispatch(addFans(1));
    }
  },
  isUsable: (state) => (hasBuff(state, StatusId.SilkenFlow) || hasBuff(state, StatusId.FlourishingFlow)) && !isDancing(state),
  isGlowing: (state) => hasBuff(state, StatusId.SilkenFlow) || hasBuff(state, StatusId.FlourishingFlow),
  redirect: (state) => (isDancing(state) ? ActionId.Pirouette : ActionId.Bloodshower),
  reducedBySkillSpeed: true,
});

const lastDance: CombatAction = createCombatAction({
  id: ActionId.LastDance,
  execute: (dispatch, _, contenxt) => {
    dispatch(dmgEvent(ActionId.LastDance, contenxt, { potency: 520 }));
    dispatch(removeBuff(StatusId.LastDanceReady));
  },
  reducedBySkillSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.LastDanceReady) && !isDancing(state),
  isGlowing: (state) => hasBuff(state, StatusId.LastDanceReady),
});

const finishingMove: CombatAction = createCombatAction({
  id: ActionId.FinishingMove,
  execute: (dispatch, getState, contenxt) => {
    dispatch(dmgEvent(ActionId.FinishingMove, contenxt, { potency: 850 }));
    dispatch(removeBuff(StatusId.FinishingMoveReady));

    dispatch(gcd({ reducedBySkillSpeed: true }));

    if (hasBuff(getState(), StatusId.TechnicalEsprit)) {
      dispatch(removeBuff(StatusId.TechnicalEsprit));
    }

    dispatch(buff(StatusId.StandardFinish));
    dispatch(buff(StatusId.LastDanceReady));
    dispatch(buff(StatusId.Esprit));
  },
  isUsable: (state) => !isDancing(state),
  isGlowing: () => true,
});

const danceOfTheDawn: CombatAction = createCombatAction({
  id: ActionId.DanceoftheDawn,
  execute: (dispatch, _, contenxt) => {
    dispatch(dmgEvent(ActionId.DanceoftheDawn, contenxt, { potency: 1000 }));
    dispatch(removeBuff(StatusId.DanceoftheDawnReady));
  },
  reducedBySkillSpeed: true,
  isUsable: (state) => !isDancing(state),
  isGlowing: () => true,
});

export const dncStatuses: CombatStatus[] = [
  silkenFlowStatus,
  silkenSymmetryStatus,
  improvisationStatus,
  shieldSambaStatus,
  standardStepStatus,
  technicalStepStatus,
  devilmentStatus,
  espritStatus,
  shieldSambaStatus,
  threefoldFanDanceStatus,
  fourfoldFanDanceStatus,
  improvisationRegenStatus,
  technicalEspritStatus,
  technicalFinishStatus,
  standardFinishStatus,
  flourishingStarfallStatus,
  flourishingSymmetryStatus,
  flourishingFlowStatus,
  flourishingFinishStatus,
  closedPositionStatus,
  risingRhythmStatus,
  lastDanceReadyStatus,
  finishingMoveReadyStatus,
  danceoftheDawnReadyStatus,
];

export const dnc: CombatAction[] = [
  cascade,
  fountain,
  reverseCascade,
  fountainfall,
  standardStep,
  emboite,
  jete,
  entrechat,
  pirouette,
  standardFinish,
  devilment,
  fanDance,
  fanDanceII,
  fanDanceIII,
  fanDanceIV,
  technicalStep,
  technicalFinish,
  tilliana,
  flourish,
  starfallDance,
  saberDance,
  closedPosition,
  ending,
  improvisation,
  improvisedFinish,
  shieldSamba,
  curingWaltz,
  windmill,
  risingWindmill,
  bladeshower,
  bloodshower,
  enAvant,
  lastDance,
  finishingMove,
  danceOfTheDawn,
];

export const dncEpics = combineEpics(
  resetDanceEpic,
  technicalFinishEspritEpic,
  standardFinishEspritEpic,
  risingRythmEpic,
  improvisationStopByExpiryEpic,
  improvisationStopByFinishEpic,
  soloPartySizeEpic
);
