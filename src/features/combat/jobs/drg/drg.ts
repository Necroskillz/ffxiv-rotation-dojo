import { combineEpics, Epic } from 'redux-observable';
import { filter, first, map, of, switchMap, takeUntil, withLatestFrom } from 'rxjs';
import { RootState } from '../../../../app/store';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import {
  addBuff,
  addEyeOfTheDragon,
  addFirstmindsFocus,
  buff,
  combo,
  debuff,
  executeAction,
  hasBuff,
  hasCombo,
  ogcdLock,
  removeBuff,
  resource,
  setEyeOfTheDragon,
  setThrust,
} from '../../combatSlice';

function firstmindsFocus(state: RootState) {
  return resource(state, 'firstmindsFocus');
}

function eyeOfTheDragon(state: RootState) {
  return resource(state, 'eyeOfTheDragon');
}

function thrust(state: RootState) {
  return resource(state, 'thrust');
}

const consumeLifeSurgeEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.LifeSurge),
    switchMap(() =>
      action$.pipe(
        filter((aa) => aa.type === executeAction.type && getActionById(aa.payload.id).type === 'Weaponskill'),
        takeUntil(action$.pipe(first((a) => a.type === removeBuff.type && a.payload === StatusId.LifeSurge)))
      )
    ),
    map(() => removeBuff(StatusId.LifeSurge))
  );

const removeThrustBuffsEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(
      (a) =>
        a.type === executeAction.type &&
        [
          ActionId.TrueThrust,
          ActionId.Disembowel,
          ActionId.VorpalThrust,
          ActionId.DoomSpike,
          ActionId.SonicThrust,
          ActionId.CoerthanTorment,
        ].includes(a.payload.id)
    ),
    withLatestFrom(state$),
    map(([, state]) => state),
    switchMap((state) => {
      const actions = [];

      if (hasBuff(state, StatusId.WheelinMotion)) {
        actions.push(removeBuff(StatusId.WheelinMotion));
      }

      if (hasBuff(state, StatusId.FangandClawBared)) {
        actions.push(removeBuff(StatusId.FangandClawBared));
      }

      return of(...actions);
    })
  );

const trueThrust: CombatAction = createCombatAction({
  id: ActionId.TrueThrust,
  execute: (dispatch) => {
    dispatch(combo(ActionId.TrueThrust));
  },
  redirect: (state) => (hasBuff(state, StatusId.DraconianFire) ? ActionId.RaidenThrust : ActionId.TrueThrust),
  reducedBySkillSpeed: true,
});

const disembowel: CombatAction = createCombatAction({
  id: ActionId.Disembowel,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(combo(ActionId.Disembowel));
      dispatch(buff(StatusId.PowerSurge, 30));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Disembowel),
  reducedBySkillSpeed: true,
});

const chaosThrust: CombatAction = createCombatAction({
  id: ActionId.ChaosThrust,
  execute: () => {},
  redirect: () => ActionId.ChaoticSpring,
  reducedBySkillSpeed: true,
});

const chaoticSpring: CombatAction = createCombatAction({
  id: ActionId.ChaoticSpring,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(debuff(StatusId.ChaoticSpring, 24));
      dispatch(buff(StatusId.WheelinMotion, 30));
      dispatch(setThrust(0));
    } else {
      dispatch(removeBuff(StatusId.WheelinMotion));
      dispatch(removeBuff(StatusId.FangandClawBared));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.ChaosThrust),
  reducedBySkillSpeed: true,
});

const wheelingThrust: CombatAction = createCombatAction({
  id: ActionId.WheelingThrust,
  execute: (dispatch, getState) => {
    dispatch(removeBuff(StatusId.WheelinMotion));

    if (thrust(getState()) === 1) {
      dispatch(buff(StatusId.DraconianFire, 30));
    } else {
      dispatch(buff(StatusId.FangandClawBared, 30));
      dispatch(setThrust(1));
    }
  },
  isGlowing: (state) => hasBuff(state, StatusId.WheelinMotion),
  isUsable: (state) => hasBuff(state, StatusId.WheelinMotion),
  reducedBySkillSpeed: true,
});

const fangAndClaw: CombatAction = createCombatAction({
  id: ActionId.FangandClaw,
  execute: (dispatch, getState) => {
    dispatch(removeBuff(StatusId.FangandClawBared));

    if (thrust(getState()) === 1) {
      dispatch(buff(StatusId.DraconianFire, 30));
    } else {
      dispatch(buff(StatusId.WheelinMotion, 30));
      dispatch(setThrust(1));
    }
  },
  isGlowing: (state) => hasBuff(state, StatusId.FangandClawBared),
  isUsable: (state) => hasBuff(state, StatusId.FangandClawBared),
  reducedBySkillSpeed: true,
});

const raidenThrust: CombatAction = createCombatAction({
  id: ActionId.RaidenThrust,
  execute: (dispatch) => {
    dispatch(removeBuff(StatusId.DraconianFire));
    dispatch(combo(ActionId.TrueThrust));
    dispatch(addFirstmindsFocus(1));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const vorpalThrust: CombatAction = createCombatAction({
  id: ActionId.VorpalThrust,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(combo(ActionId.VorpalThrust));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.VorpalThrust),
  reducedBySkillSpeed: true,
});

const fullThrust: CombatAction = createCombatAction({
  id: ActionId.FullThrust,
  execute: () => {},
  redirect: () => ActionId.HeavensThrust,
  reducedBySkillSpeed: true,
});

const heavensThrust: CombatAction = createCombatAction({
  id: ActionId.HeavensThrust,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(buff(StatusId.FangandClawBared, 30));
      dispatch(setThrust(0));
    } else {
      dispatch(removeBuff(StatusId.WheelinMotion));
      dispatch(removeBuff(StatusId.FangandClawBared));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.FullThrust),
  reducedBySkillSpeed: true,
});

const lifeSurge: CombatAction = createCombatAction({
  id: ActionId.LifeSurge,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.LifeSurge, 5));
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
});

const lanceCharge: CombatAction = createCombatAction({
  id: ActionId.LanceCharge,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.LanceCharge, 20));
  },
});

const dragonSight: CombatAction = createCombatAction({
  id: ActionId.DragonSight,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.RightEye, 20));
  },
});

const battleLitany: CombatAction = createCombatAction({
  id: ActionId.BattleLitany,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.BattleLitany, 15));
  },
});

const jump: CombatAction = createCombatAction({
  id: ActionId.Jump,
  execute: () => {},
  redirect: () => ActionId.HighJump,
});

const highJump: CombatAction = createCombatAction({
  id: ActionId.HighJump,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.DiveReady, 30));
  },
});

const mirageDive: CombatAction = createCombatAction({
  id: ActionId.MirageDive,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.DiveReady));
    dispatch(addEyeOfTheDragon(1));
  },
  isUsable: (state) => hasBuff(state, StatusId.DiveReady),
  isGlowing: (state) => hasBuff(state, StatusId.DiveReady),
});

const geirskogul: CombatAction = createCombatAction({
  id: ActionId.Geirskogul,
  execute: (dispatch, getState) => {
    dispatch(ogcdLock());

    if (eyeOfTheDragon(getState()) === 2) {
      dispatch(buff(StatusId.LifeoftheDragonActive, 30, { isVisible: false }));
      dispatch(setEyeOfTheDragon(0));
    }
  },
  isGlowing: (state) => eyeOfTheDragon(state) === 2,
  redirect: (state) => (hasBuff(state, StatusId.LifeoftheDragonActive) ? ActionId.Nastrond : ActionId.Geirskogul),
});

const nastrond: CombatAction = createCombatAction({
  id: ActionId.Nastrond,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
});

const stardiver: CombatAction = createCombatAction({
  id: ActionId.Stardiver,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isUsable: (state) => hasBuff(state, StatusId.LifeoftheDragonActive),
});

const spineshatterDive: CombatAction = createCombatAction({
  id: ActionId.SpineshatterDive,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1001,
    duration: 1,
  }),
});

const dragonfireDive: CombatAction = createCombatAction({
  id: ActionId.DragonfireDive,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  animationLock: 1200,
});

const wyrmwindThrust: CombatAction = createCombatAction({
  id: ActionId.WyrmwindThrust,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isUsable: (state) => firstmindsFocus(state) === 2,
  isGlowing: (state) => firstmindsFocus(state) === 2,
});

const piercingTalong: CombatAction = createCombatAction({
  id: ActionId.PiercingTalon,
  execute: () => {},
  reducedBySkillSpeed: true,
});

const doomSpike: CombatAction = createCombatAction({
  id: ActionId.DoomSpike,
  execute: (dispatch) => {
    dispatch(combo(ActionId.DoomSpike));
  },
  redirect: (state) => (hasBuff(state, StatusId.DraconianFire) ? ActionId.DraconianFury : ActionId.DoomSpike),
  reducedBySkillSpeed: true,
});

const draconianFury: CombatAction = createCombatAction({
  id: ActionId.DraconianFury,
  execute: (dispatch) => {
    dispatch(removeBuff(StatusId.DraconianFire));
    dispatch(combo(ActionId.DoomSpike));
    dispatch(addFirstmindsFocus(1));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const sonicThrust: CombatAction = createCombatAction({
  id: ActionId.SonicThrust,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(combo(ActionId.SonicThrust));
      dispatch(buff(StatusId.PowerSurge, 30));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.SonicThrust),
  reducedBySkillSpeed: true,
});

const coerthanTorment: CombatAction = createCombatAction({
  id: ActionId.CoerthanTorment,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(buff(StatusId.DraconianFire, 30));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.CoerthanTorment),
  reducedBySkillSpeed: true,
});

const elusiveJump: CombatAction = createCombatAction({
  id: ActionId.ElusiveJump,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
});

export const drg: CombatAction[] = [
  trueThrust,
  disembowel,
  chaosThrust,
  chaoticSpring,
  wheelingThrust,
  fangAndClaw,
  raidenThrust,
  vorpalThrust,
  fullThrust,
  heavensThrust,
  lifeSurge,
  lanceCharge,
  dragonSight,
  battleLitany,
  jump,
  highJump,
  mirageDive,
  geirskogul,
  nastrond,
  stardiver,
  spineshatterDive,
  dragonfireDive,
  wyrmwindThrust,
  piercingTalong,
  doomSpike,
  draconianFury,
  sonicThrust,
  coerthanTorment,
  elusiveJump,
];

export const drgEpics = combineEpics(consumeLifeSurgeEpic, removeThrustBuffsEpic);
