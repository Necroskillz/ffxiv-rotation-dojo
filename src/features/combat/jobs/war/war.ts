import { combineEpics, Epic } from 'redux-observable';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import { RootState } from '../../../../app/store';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
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

const heavySwing: CombatAction = createCombatAction({
  id: ActionId.HeavySwing,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HeavySwing, context, { potency: 200 }));
    dispatch(combo(ActionId.HeavySwing));
  },
  reducedBySkillSpeed: true,
});

const maim: CombatAction = createCombatAction({
  id: ActionId.Maim,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Maim, context, { potency: 150, comboPotency: 300 }));

    if (context.comboed) {
      dispatch(combo(ActionId.Maim));
      dispatch(addBeast(10));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Maim),
  reducedBySkillSpeed: true,
});

const stormsPath: CombatAction = createCombatAction({
  id: ActionId.StormsPath,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.StormsPath, context, { potency: 150, comboPotency: 430, healthPotency: 250 }));

    if (context.comboed) {
      dispatch(addBeast(20));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.StormsPath),
  reducedBySkillSpeed: true,
});

const stormsEye: CombatAction = createCombatAction({
  id: ActionId.StormsEye,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.StormsEye, context, { potency: 150, comboPotency: 430 }));

    if (context.comboed) {
      dispatch(addBeast(10));
      dispatch(extendableBuff(StatusId.SurgingTempest, 30, 60));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.StormsEye),
  reducedBySkillSpeed: true,
});

const innerBeast: CombatAction = createCombatAction({
  id: ActionId.InnerBeast,
  execute: () => {},
  reducedBySkillSpeed: true,
  redirect: (state) => (hasBuff(state, StatusId.NascentChaos) ? ActionId.InnerChaos : ActionId.FellCleave),
});

const fellCleave: CombatAction = createCombatAction({
  id: ActionId.FellCleave,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.FellCleave, context, { potency: 490 }));

    dispatch(modifyCooldown(20, -5000));
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
    dispatch(buff(StatusId.NascentChaos, 30));
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
    dispatch(dmgEvent(ActionId.InnerChaos, context, { potency: 650 }));
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
    dispatch(buff(StatusId.Defiance, null));
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
    dispatch(buff(StatusId.InnerRelease, 15, { stacks: 3 }));
    dispatch(buff(StatusId.PrimalRendReady, 30));
    dispatch(buff(StatusId.InnerStrength, 15));

    if (hasBuff(getState(), StatusId.SurgingTempest)) {
      dispatch(extendableBuff(StatusId.SurgingTempest, 10, 60));
    }
  },
  entersCombat: false,
});

const primalRend: CombatAction = createCombatAction({
  id: ActionId.PrimalRend,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.PrimalRend, context, { potency: 700 }));

    dispatch(removeBuff(StatusId.PrimalRendReady));
  },
  reducedBySkillSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.PrimalRendReady),
  isGlowing: (state) => hasBuff(state, StatusId.PrimalRendReady),
  animationLock: 1200,
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
    dispatch(dmgEvent(ActionId.Upheaval, context, { potency: 370 }));
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
    dispatch(dmgEvent(ActionId.MythrilTempest, context, { potency: 100, comboPotency: 150 }));

    if (context.comboed) {
      dispatch(addBeast(20));
      dispatch(extendableBuff(StatusId.SurgingTempest, 30, 60));
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
    dispatch(dmgEvent(ActionId.Decimate, context, { potency: 200 }));
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
    dispatch(buff(StatusId.ThrillofBattle, 10));
    dispatch(event(ActionId.ThrillofBattle, { healthPercent: 20 }));
  },
  entersCombat: false,
});

const vengeance: CombatAction = createCombatAction({
  id: ActionId.Vengeance,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Vengeance, 15));
    dispatch(buff(StatusId.VulnerabilityDown, 15));
  },
  entersCombat: false,
});

const holmgang: CombatAction = createCombatAction({
  id: ActionId.Holmgang,
  execute: (dispatch, getState) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Holmgang, 15));
    if (inCombat(getState())) {
      dispatch(debuff(StatusId.HolmgangDebuff, 15));
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
    dispatch(buff(StatusId.NascentFlash, 8));
    dispatch(buff(StatusId.StemtheFlow, 4));
    dispatch(buff(StatusId.StemtheTide, 20));
  },
  entersCombat: false,
});

const bloodwhetting: CombatAction = createCombatAction({
  id: ActionId.Bloodwhetting,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Bloodwhetting, 8));
    dispatch(buff(StatusId.StemtheFlow, 4));
    dispatch(buff(StatusId.StemtheTide, 20));
  },
  entersCombat: false,
});

const equilibrium: CombatAction = createCombatAction({
  id: ActionId.Equilibrium,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(event(ActionId.Equilibrium, { healthPotency: 1200 }));
    dispatch(buff(StatusId.Equilibrium, 15, { periodicEffect: () => dispatch(event(0, { healthPotency: 200 })) }));
  },
  entersCombat: false,
});

const shakeItOff: CombatAction = createCombatAction({
  id: ActionId.ShakeItOff,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(event(ActionId.ShakeItOff, { healthPotency: 300 }));
    dispatch(buff(StatusId.ShakeItOff, 30));
    dispatch(buff(StatusId.ShakeItOffOverTime, 15, { periodicEffect: () => dispatch(event(0, { healthPotency: 100 })) }));
    dispatch(removeBuff(StatusId.ThrillofBattle));
    dispatch(removeBuff(StatusId.Vengeance));
    dispatch(removeBuff(StatusId.VulnerabilityDown));
    dispatch(removeBuff(StatusId.Bloodwhetting));
  },
  entersCombat: false,
});

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
];

export const warEpics = combineEpics(decreaseInnerReleaseEpic, bloodwhettingEpic);
