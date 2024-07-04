import { combineEpics, Epic } from 'redux-observable';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import { RootState } from '../../../../app/store';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import { CombatStatus, createCombatStatus } from '../../combat-status';
import {
  buff,
  combo,
  executeAction,
  hasBuff,
  hasCombo,
  inCombat,
  ogcdLock,
  removeBuff,
  resource,
  removeBuffStack,
  modifyCooldown,
  addBeast,
  extendableBuff,
  debuff,
  event,
  dmgEvent,
  buffStacks,
  addBuffStack,
} from '../../combatSlice';

function beast(state: RootState) {
  return resource(state, 'beast');
}

const decreaseInnerReleaseEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === executeAction.type && [ActionId.FellCleave, ActionId.Decimate].includes(a.payload.id)),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => hasBuff(state, StatusId.InnerRelease)),
    map(() => removeBuffStack(StatusId.InnerRelease))
  );

const bloodwhettingEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === executeAction.type && getActionById(a.payload.id).type === 'Weaponskill'),
    withLatestFrom(state$),
    filter(([, state]) => hasBuff(state, StatusId.Bloodwhetting)),
    map(([action]) => event(action.payload.id, { healthPotency: 400 }))
  );

const surgingTempestStatus: CombatStatus = createCombatStatus({
  id: StatusId.SurgingTempest,
  duration: 30,
  isHarmful: false,
  maxDuration: 60,
});

const nascentChaosStatus: CombatStatus = createCombatStatus({
  id: StatusId.NascentChaos,
  duration: 30,
  isHarmful: false,
});

const defianceStatus: CombatStatus = createCombatStatus({
  id: StatusId.Defiance,
  duration: null,
  isHarmful: false,
});

const innerReleaseStatus: CombatStatus = createCombatStatus({
  id: StatusId.InnerRelease,
  duration: 15,
  isHarmful: false,
  initialStacks: 3,
});

const primalRendReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.PrimalRendReady,
  duration: 30,
  isHarmful: false,
});

const innerStrengthStatus: CombatStatus = createCombatStatus({
  id: StatusId.InnerStrength,
  duration: 15,
  isHarmful: false,
});

const thrillofBattleStatus: CombatStatus = createCombatStatus({
  id: StatusId.ThrillofBattle,
  duration: 10,
  isHarmful: false,
});

const damnationStatus: CombatStatus = createCombatStatus({
  id: StatusId.Damnation,
  duration: 15,
  isHarmful: false,
});

const holmgangStatus: CombatStatus = createCombatStatus({
  id: StatusId.Holmgang,
  duration: 10,
  isHarmful: false,
});

const holmgangDebuffStatus: CombatStatus = createCombatStatus({
  id: StatusId.HolmgangDebuff,
  duration: 10,
  isHarmful: true,
});

const nascentFlashStatus: CombatStatus = createCombatStatus({
  id: StatusId.NascentFlash,
  duration: 8,
  isHarmful: false,
});

const stemtheFlowStatus: CombatStatus = createCombatStatus({
  id: StatusId.StemtheFlow,
  duration: 4,
  isHarmful: false,
});

const stemtheTideStatus: CombatStatus = createCombatStatus({
  id: StatusId.StemtheTide,
  duration: 20,
  isHarmful: false,
});

const bloodwhettingStatus: CombatStatus = createCombatStatus({
  id: StatusId.Bloodwhetting,
  duration: 8,
  isHarmful: false,
});

const equilibriumStatus: CombatStatus = createCombatStatus({
  id: StatusId.Equilibrium,
  duration: 15,
  isHarmful: false,
  tick: (dispatch) => dispatch(event(0, { healthPotency: 200 })),
});

const shakeItOffStatus: CombatStatus = createCombatStatus({
  id: StatusId.ShakeItOff,
  duration: 15,
  isHarmful: false,
});

const burgeoningFuryStatus: CombatStatus = createCombatStatus({
  id: StatusId.BurgeoningFury,
  duration: 30,
  isHarmful: false,
});

const wratfulStatus: CombatStatus = createCombatStatus({
  id: StatusId.Wrathful,
  duration: 30,
  isHarmful: false,
});

const primalRuinationReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.PrimalRuinationReady,
  duration: 30,
  isHarmful: false,
});

const shakeItOffOverTimeStatus: CombatStatus = createCombatStatus({
  id: StatusId.ShakeItOffOverTime,
  duration: 15,
  isHarmful: false,
  tick: (dispatch) => dispatch(event(0, { healthPotency: 100 })),
});

const heavySwing: CombatAction = createCombatAction({
  id: ActionId.HeavySwing,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HeavySwing, context, { potency: 220 }));
    dispatch(combo(ActionId.HeavySwing));
  },
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const maim: CombatAction = createCombatAction({
  id: ActionId.Maim,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Maim, context, { potency: 190, comboPotency: 340 }));

    if (context.comboed) {
      dispatch(combo(ActionId.Maim));
      dispatch(addBeast(10));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Maim),
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const stormsPath: CombatAction = createCombatAction({
  id: ActionId.StormsPath,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.StormsPath, context, { potency: 200, comboPotency: 480, healthPotency: 250 }));

    if (context.comboed) {
      dispatch(addBeast(20));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.StormsPath),
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const stormsEye: CombatAction = createCombatAction({
  id: ActionId.StormsEye,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.StormsEye, context, { potency: 200, comboPotency: 480 }));

    if (context.comboed) {
      dispatch(addBeast(10));
      dispatch(extendableBuff(StatusId.SurgingTempest));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.StormsEye),
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const innerBeast: CombatAction = createCombatAction({
  id: ActionId.InnerBeast,
  execute: () => {},
  reducedBySkillSpeed: true,
  redirect: (state) => (hasBuff(state, StatusId.NascentChaos) ? ActionId.InnerChaos : ActionId.FellCleave),
});

const fellCleave: CombatAction = createCombatAction({
  id: ActionId.FellCleave,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.FellCleave, context, { potency: 580 }));

    dispatch(modifyCooldown(20, -5000));

    const state = getState();

    if (hasBuff(state, StatusId.InnerRelease)) {
      if (buffStacks(state, StatusId.BurgeoningFury) >= 2) {
        dispatch(removeBuff(StatusId.BurgeoningFury));
        dispatch(buff(StatusId.Wrathful));
      } else {
        dispatch(addBuffStack(StatusId.BurgeoningFury));
      }
    }
  },
  reducedBySkillSpeed: true,
  isUsable: (state) => beast(state) >= 50 || hasBuff(state, StatusId.InnerRelease),
  isGlowing: (state) => beast(state) >= 50 || hasBuff(state, StatusId.InnerRelease),
  redirect: (state) => (hasBuff(state, StatusId.NascentChaos) ? ActionId.InnerChaos : ActionId.FellCleave),
  cost: (state) => (hasBuff(state, StatusId.InnerRelease) ? 0 : 50),
});

const infuriate: CombatAction = createCombatAction({
  id: ActionId.Infuriate,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(addBeast(50));
    dispatch(buff(StatusId.NascentChaos));
  },
  isUsable: (state) => inCombat(state),
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
});

const innerChaos: CombatAction = createCombatAction({
  id: ActionId.InnerChaos,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.InnerChaos, context, { potency: 660 }));
    dispatch(removeBuff(StatusId.NascentChaos));
    dispatch(modifyCooldown(20, -5000));
  },
  reducedBySkillSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.NascentChaos),
  isGlowing: () => true,
});

const defiance: CombatAction = createCombatAction({
  id: ActionId.Defiance,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Defiance));
  },
  entersCombat: false,
  redirect: (state) => (hasBuff(state, StatusId.Defiance) ? ActionId.ReleaseDefiance : ActionId.Defiance),
});

const releaseDefiance: CombatAction = createCombatAction({
  id: ActionId.ReleaseDefiance,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.Defiance));
  },
  entersCombat: false,
});

const berserk: CombatAction = createCombatAction({
  id: ActionId.Berserk,
  execute: () => {},
  redirect: () => ActionId.InnerRelease,
});

const innerRelease: CombatAction = createCombatAction({
  id: ActionId.InnerRelease,
  execute: (dispatch, getState) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.InnerRelease));
    dispatch(buff(StatusId.PrimalRendReady));
    dispatch(buff(StatusId.InnerStrength));

    if (hasBuff(getState(), StatusId.SurgingTempest)) {
      dispatch(extendableBuff(StatusId.SurgingTempest, 10));
    }
  },
  entersCombat: false,
  redirect: (state) => (hasBuff(state, StatusId.Wrathful) ? ActionId.PrimalWrath : ActionId.InnerRelease),
});

const primalWrath: CombatAction = createCombatAction({
  id: ActionId.PrimalWrath,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.PrimalWrath, context, { potency: 700 }));
    dispatch(removeBuff(StatusId.Wrathful));
  },
  isGlowing: () => true,
});

const primalRend: CombatAction = createCombatAction({
  id: ActionId.PrimalRend,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.PrimalRend, context, { potency: 700 }));

    dispatch(removeBuff(StatusId.PrimalRendReady));
    dispatch(buff(StatusId.PrimalRuinationReady));
  },
  reducedBySkillSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.PrimalRendReady),
  isGlowing: (state) => hasBuff(state, StatusId.PrimalRendReady),
  animationLock: 1200,
  redirect: (state) => (hasBuff(state, StatusId.PrimalRuinationReady) ? ActionId.PrimalRuination : ActionId.PrimalRend),
});

const primalRuination: CombatAction = createCombatAction({
  id: ActionId.PrimalRuination,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.PrimalRend, context, { potency: 740 }));

    dispatch(removeBuff(StatusId.PrimalRuinationReady));
  },
  reducedBySkillSpeed: true,
  isGlowing: () => true,
});

const onslaught: CombatAction = createCombatAction({
  id: ActionId.Onslaught,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Onslaught, context, { potency: 150 }));
    dispatch(ogcdLock());
  },
  maxCharges: () => 3,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
});

const upheaval: CombatAction = createCombatAction({
  id: ActionId.Upheaval,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Upheaval, context, { potency: 400 }));
    dispatch(ogcdLock());
  },
});

const tomahawk: CombatAction = createCombatAction({
  id: ActionId.Tomahawk,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Tomahawk, context, { potency: 150 }));
  },
  reducedBySkillSpeed: true,
});

const overpower: CombatAction = createCombatAction({
  id: ActionId.Overpower,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Overpower, context, { potency: 110 }));

    dispatch(combo(ActionId.Overpower));
  },
  reducedBySkillSpeed: true,
});

const mythrilTempest: CombatAction = createCombatAction({
  id: ActionId.MythrilTempest,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.MythrilTempest, context, { potency: 100, comboPotency: 140 }));

    if (context.comboed) {
      dispatch(addBeast(20));
      dispatch(extendableBuff(StatusId.SurgingTempest));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.MythrilTempest),
  reducedBySkillSpeed: true,
});

const steelCyclone: CombatAction = createCombatAction({
  id: ActionId.SteelCyclone,
  execute: () => {},
  reducedBySkillSpeed: true,
  redirect: (state) => (hasBuff(state, StatusId.NascentChaos) ? ActionId.ChaoticCyclone : ActionId.Decimate),
});

const decimate: CombatAction = createCombatAction({
  id: ActionId.Decimate,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Decimate, context, { potency: 180 }));
  },
  reducedBySkillSpeed: true,
  isUsable: (state) => beast(state) >= 50 || hasBuff(state, StatusId.InnerRelease),
  isGlowing: (state) => beast(state) >= 50 || hasBuff(state, StatusId.InnerRelease),
  redirect: (state) => (hasBuff(state, StatusId.NascentChaos) ? ActionId.ChaoticCyclone : ActionId.Decimate),
  cost: (state) => (hasBuff(state, StatusId.InnerRelease) ? 0 : 50),
});

const chaoticCyclone: CombatAction = createCombatAction({
  id: ActionId.ChaoticCyclone,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.ChaoticCyclone, context, { potency: 320 }));

    dispatch(removeBuff(StatusId.NascentChaos));
    dispatch(modifyCooldown(20, -5000));
  },
  reducedBySkillSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.NascentChaos),
  isGlowing: () => true,
});

const orogeny: CombatAction = createCombatAction({
  id: ActionId.Orogeny,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Orogeny, context, { potency: 150 }));
    dispatch(ogcdLock());
  },
});

const thrillofBattle: CombatAction = createCombatAction({
  id: ActionId.ThrillofBattle,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.ThrillofBattle));
    dispatch(event(ActionId.ThrillofBattle, { healthPercent: 20 }));
  },
  entersCombat: false,
});

const vengeance: CombatAction = createCombatAction({
  id: ActionId.Vengeance,
  execute: () => {},
  redirect: () => ActionId.Damnation,
});

const damnation: CombatAction = createCombatAction({
  id: ActionId.Damnation,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Damnation));
  },
  entersCombat: false,
});

const holmgang: CombatAction = createCombatAction({
  id: ActionId.Holmgang,
  execute: (dispatch, getState) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Holmgang));
    if (inCombat(getState())) {
      dispatch(debuff(StatusId.HolmgangDebuff));
    }
  },
  entersCombat: false,
});

const rawIntuition: CombatAction = createCombatAction({
  id: ActionId.RawIntuition,
  execute: () => {},
  redirect: () => ActionId.Bloodwhetting,
});

const nascentFlash: CombatAction = createCombatAction({
  id: ActionId.NascentFlash,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.NascentFlash));
    dispatch(buff(StatusId.StemtheFlow));
    dispatch(buff(StatusId.StemtheTide));
  },
  entersCombat: false,
});

const bloodwhetting: CombatAction = createCombatAction({
  id: ActionId.Bloodwhetting,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Bloodwhetting));
    dispatch(buff(StatusId.StemtheFlow));
    dispatch(buff(StatusId.StemtheTide));
  },
  entersCombat: false,
});

const equilibrium: CombatAction = createCombatAction({
  id: ActionId.Equilibrium,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(event(ActionId.Equilibrium, { healthPotency: 1200 }));
    dispatch(buff(StatusId.Equilibrium));
  },
  entersCombat: false,
});

const shakeItOff: CombatAction = createCombatAction({
  id: ActionId.ShakeItOff,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(event(ActionId.ShakeItOff, { healthPotency: 300 }));
    dispatch(buff(StatusId.ShakeItOff));
    dispatch(buff(StatusId.ShakeItOffOverTime));
    dispatch(removeBuff(StatusId.ThrillofBattle));
    dispatch(removeBuff(StatusId.Damnation));
    dispatch(removeBuff(StatusId.Bloodwhetting));
  },
  entersCombat: false,
});

export const warStatuses: CombatStatus[] = [
  surgingTempestStatus,
  innerReleaseStatus,
  nascentChaosStatus,
  nascentFlashStatus,
  bloodwhettingStatus,
  equilibriumStatus,
  shakeItOffStatus,
  shakeItOffOverTimeStatus,
  holmgangStatus,
  holmgangDebuffStatus,
  thrillofBattleStatus,
  stemtheFlowStatus,
  stemtheTideStatus,
  defianceStatus,
  primalRendReadyStatus,
  innerStrengthStatus,
  damnationStatus,
  burgeoningFuryStatus,
  wratfulStatus,
  primalRuinationReadyStatus,
];

export const war: CombatAction[] = [
  heavySwing,
  maim,
  stormsPath,
  stormsEye,
  innerBeast,
  fellCleave,
  infuriate,
  innerChaos,
  defiance,
  releaseDefiance,
  berserk,
  innerRelease,
  primalRend,
  onslaught,
  upheaval,
  tomahawk,
  overpower,
  mythrilTempest,
  steelCyclone,
  decimate,
  chaoticCyclone,
  orogeny,
  thrillofBattle,
  vengeance,
  holmgang,
  rawIntuition,
  nascentFlash,
  bloodwhetting,
  equilibrium,
  shakeItOff,
  damnation,
  primalWrath,
  primalRuination,
];

export const warEpics = combineEpics(decreaseInnerReleaseEpic, bloodwhettingEpic);
