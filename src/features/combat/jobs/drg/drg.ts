import { combineEpics, Epic } from 'redux-observable';
import { filter, first, map, switchMap, takeUntil } from 'rxjs';
import { RootState } from '../../../../app/store';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import { CombatStatus, createCombatStatus } from '../../combat-status';
import {
  addBuff,
  addFirstmindsFocus,
  buff,
  combo,
  debuff,
  dmgEvent,
  event,
  executeAction,
  hasBuff,
  hasCombo,
  ogcdLock,
  removeBuff,
  removeBuffAction,
  removeBuffStack,
  resource,
} from '../../combatSlice';
import { OGCDLockDuration } from '../../enums';

function firstmindsFocus(state: RootState) {
  return resource(state, 'firstmindsFocus');
}

const consumeLifeSurgeEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.LifeSurge),
    switchMap(() =>
      action$.pipe(
        filter((aa) => aa.type === executeAction.type && getActionById(aa.payload.id).type === 'Weaponskill'),
        takeUntil(action$.pipe(first((a) => a.type === removeBuffAction.type && a.payload === StatusId.LifeSurge)))
      )
    ),
    map(() => removeBuff(StatusId.LifeSurge))
  );

const powerSurgeStatus: CombatStatus = createCombatStatus({
  id: StatusId.PowerSurge,
  duration: 30,
  isHarmful: false,
});

const lifeSurgeStatus: CombatStatus = createCombatStatus({
  id: StatusId.LifeSurge,
  duration: 5,
  isHarmful: false,
});

const chaoticSpringStatus: CombatStatus = createCombatStatus({
  id: StatusId.ChaoticSpring,
  duration: 24,
  isHarmful: true,
  tick: (dispatch) => dispatch(event(0, { potency: 45 })),
});

const wheelinMotionStatus: CombatStatus = createCombatStatus({
  id: StatusId.WheelinMotion,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const fangandClawBaredStatus: CombatStatus = createCombatStatus({
  id: StatusId.FangandClawBared,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const draconianFireStatus: CombatStatus = createCombatStatus({
  id: StatusId.DraconianFire,
  duration: 30,
  isHarmful: false,
});

const lanceChargeStatus: CombatStatus = createCombatStatus({
  id: StatusId.LanceCharge,
  duration: 20,
  isHarmful: false,
});

const battleLitanyStatus: CombatStatus = createCombatStatus({
  id: StatusId.BattleLitany,
  duration: 15,
  isHarmful: false,
});

const lifeoftheDragonActiveStatus: CombatStatus = createCombatStatus({
  id: StatusId.LifeoftheDragonActive,
  duration: 30,
  isHarmful: false,
  isVisible: false,
  onExpire: (dispatch) => dispatch(removeBuff(StatusId.StarcrossReady)),
});

const diveReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.DiveReady,
  duration: 15,
  isHarmful: false,
});

const nastrondReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.NastrondReady,
  duration: 30,
  isHarmful: false,
  initialStacks: 1,
});

const starcrossReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.StarcrossReady,
  duration: 30,
  isHarmful: false,
});

const dragonsFlightStatus: CombatStatus = createCombatStatus({
  id: StatusId.DragonsFlight,
  duration: 30,
  isHarmful: false,
});

const enhancedPiercingTalonStatus: CombatStatus = createCombatStatus({
  id: StatusId.EnhancedPiercingTalon,
  duration: 15,
  isHarmful: false,
});

const trueThrust: CombatAction = createCombatAction({
  id: ActionId.TrueThrust,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.TrueThrust, context, { potency: 230 }));
    dispatch(combo(ActionId.TrueThrust));
  },
  redirect: (state) => (hasBuff(state, StatusId.DraconianFire) ? ActionId.RaidenThrust : ActionId.TrueThrust),
  reducedBySkillSpeed: true,
});

const disembowel: CombatAction = createCombatAction({
  id: ActionId.Disembowel,
  execute: () => {},
  reducedBySkillSpeed: true,
  redirect: () => ActionId.SpiralBlow,
});

const spiralBlow: CombatAction = createCombatAction({
  id: ActionId.SpiralBlow,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.SpiralBlow, context, { potency: 140, comboPotency: 300 }));

    if (context.comboed) {
      dispatch(combo(ActionId.Disembowel));
      dispatch(buff(StatusId.PowerSurge));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.SpiralBlow),
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
    dispatch(dmgEvent(ActionId.ChaoticSpring, context, { potency: 140, rearPotency: 180, comboPotency: 300, rearComboPotency: 340 }));

    if (context.comboed) {
      dispatch(debuff(StatusId.ChaoticSpring));
      dispatch(combo(ActionId.ChaosThrust));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.ChaoticSpring),
  reducedBySkillSpeed: true,
});

const wheelingThrust: CombatAction = createCombatAction({
  id: ActionId.WheelingThrust,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.WheelingThrust, context, { potency: 140, rearPotency: 180, comboPotency: 300, rearComboPotency: 340 }));

    if (context.comboed) {
      dispatch(combo(ActionId.FangandClaw));
      dispatch(buff(StatusId.WheelinMotion));
      dispatch(removeBuff(StatusId.FangandClawBared));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.WheelingThrust),
  reducedBySkillSpeed: true,
  redirect: (state) =>
    hasCombo(state, ActionId.Drakesbane) && hasBuff(state, StatusId.FangandClawBared) ? ActionId.Drakesbane : ActionId.WheelingThrust,
});

const fangAndClaw: CombatAction = createCombatAction({
  id: ActionId.FangandClaw,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.WheelingThrust, context, { potency: 140, flankPotency: 180, comboPotency: 300, flankComboPotency: 340 }));

    if (context.comboed) {
      dispatch(combo(ActionId.FangandClaw));
      dispatch(buff(StatusId.FangandClawBared));
      dispatch(removeBuff(StatusId.WheelinMotion));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.FangandClaw),
  reducedBySkillSpeed: true,
  redirect: (state) =>
    hasCombo(state, ActionId.Drakesbane) && hasBuff(state, StatusId.WheelinMotion) ? ActionId.Drakesbane : ActionId.FangandClaw,
});

const drakesbane: CombatAction = createCombatAction({
  id: ActionId.Drakesbane,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Drakesbane, context, { potency: 440 }));
    dispatch(buff(StatusId.DraconianFire));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const raidenThrust: CombatAction = createCombatAction({
  id: ActionId.RaidenThrust,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.RaidenThrust, context, { potency: 320 }));
    dispatch(removeBuff(StatusId.DraconianFire));
    dispatch(combo(ActionId.TrueThrust));
    dispatch(addFirstmindsFocus(1));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const vorpalThrust: CombatAction = createCombatAction({
  id: ActionId.VorpalThrust,
  execute: () => {},
  reducedBySkillSpeed: true,
  redirect: () => ActionId.LanceBarrage,
});

const lanceBarrage: CombatAction = createCombatAction({
  id: ActionId.LanceBarrage,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.LanceBarrage, context, { potency: 130, comboPotency: 340 }));

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
    dispatch(dmgEvent(ActionId.HeavensThrust, context, { potency: 140, comboPotency: 440 }));

    if (context.comboed) {
      dispatch(combo(ActionId.FullThrust));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.HeavensThrust),
  reducedBySkillSpeed: true,
});

const lifeSurge: CombatAction = createCombatAction({
  id: ActionId.LifeSurge,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.LifeSurge));
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
    dispatch(buff(StatusId.LanceCharge));
  },
});

const battleLitany: CombatAction = createCombatAction({
  id: ActionId.BattleLitany,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.BattleLitany));
  },
});

const jump: CombatAction = createCombatAction({
  id: ActionId.Jump,
  execute: () => {},
  redirect: () => ActionId.HighJump,
});

const highJump: CombatAction = createCombatAction({
  id: ActionId.HighJump,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.HighJump, context, { potency: 400 }));
    dispatch(buff(StatusId.DiveReady));
  },
  redirect: (state) => (hasBuff(state, StatusId.DiveReady) ? ActionId.MirageDive : ActionId.HighJump),
  actionChangeTo: ActionId.MirageDive,
});

const mirageDive: CombatAction = createCombatAction({
  id: ActionId.MirageDive,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.MirageDive, context, { potency: 380 }));
    dispatch(removeBuff(StatusId.DiveReady));
  },
  isUsable: (state) => hasBuff(state, StatusId.DiveReady),
  isGlowing: (state) => hasBuff(state, StatusId.DiveReady),
});

const geirskogul: CombatAction = createCombatAction({
  id: ActionId.Geirskogul,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.Geirskogul, context, { potency: 280 }));
    dispatch(buff(StatusId.LifeoftheDragonActive));
    dispatch(buff(StatusId.NastrondReady));
  },
  redirect: (state) => (hasBuff(state, StatusId.NastrondReady) ? ActionId.Nastrond : ActionId.Geirskogul),
  actionChangeTo: ActionId.Nastrond,
});

const nastrond: CombatAction = createCombatAction({
  id: ActionId.Nastrond,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.Nastrond, context, { potency: 720 }));
    dispatch(removeBuffStack(StatusId.NastrondReady));
  },
  isUsable: (state) => hasBuff(state, StatusId.NastrondReady),
  isGlowing: (state) => hasBuff(state, StatusId.NastrondReady),
});

const stardiver: CombatAction = createCombatAction({
  id: ActionId.Stardiver,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.Stardiver, context, { potency: 820 }));
    dispatch(buff(StatusId.StarcrossReady));
  },
  isUsable: (state) => hasBuff(state, StatusId.LifeoftheDragonActive),
  animationLock: OGCDLockDuration.Long,
  redirect: (state) => (hasBuff(state, StatusId.StarcrossReady) ? ActionId.Starcross : ActionId.Stardiver),
  actionChangeTo: ActionId.Starcross,
});

const starcross: CombatAction = createCombatAction({
  id: ActionId.Starcross,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.Starcross, context, { potency: 1000 }));
    dispatch(removeBuff(StatusId.StarcrossReady));
  },
  isUsable: (state) => hasBuff(state, StatusId.StarcrossReady),
  isGlowing: (state) => hasBuff(state, StatusId.StarcrossReady),
});

const wingedGlide: CombatAction = createCombatAction({
  id: ActionId.WingedGlide,
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
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.DragonfireDive, context, { potency: 500 }));
    dispatch(buff(StatusId.DragonsFlight));
  },
  animationLock: OGCDLockDuration.Long,
  redirect: (state) => (hasBuff(state, StatusId.DragonsFlight) ? ActionId.RiseoftheDragon : ActionId.DragonfireDive),
  actionChangeTo: ActionId.RiseoftheDragon,
});

const riseOfTheDragon: CombatAction = createCombatAction({
  id: ActionId.RiseoftheDragon,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.RiseoftheDragon, context, { potency: 550 }));
    dispatch(removeBuff(StatusId.DragonsFlight));
  },
  isUsable: (state) => hasBuff(state, StatusId.DragonsFlight),
  isGlowing: (state) => hasBuff(state, StatusId.DragonsFlight),
});

const wyrmwindThrust: CombatAction = createCombatAction({
  id: ActionId.WyrmwindThrust,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.WyrmwindThrust, context, { potency: 440 }));
  },
  isUsable: (state) => firstmindsFocus(state) === 2,
  isGlowing: (state) => firstmindsFocus(state) === 2,
});

const piercingTalong: CombatAction = createCombatAction({
  id: ActionId.PiercingTalon,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.PiercingTalon, context, {
        potency: 200,
        isEnhanced: hasBuff(getState(), StatusId.EnhancedPiercingTalon),
        enhancedPotency: 350,
      })
    );
    dispatch(removeBuff(StatusId.EnhancedPiercingTalon));
  },
  isGlowing: (state) => hasBuff(state, StatusId.EnhancedPiercingTalon),
  reducedBySkillSpeed: true,
});

const doomSpike: CombatAction = createCombatAction({
  id: ActionId.DoomSpike,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.DoomSpike, context, { potency: 110 }));
    dispatch(combo(ActionId.DoomSpike));
  },
  redirect: (state) => (hasBuff(state, StatusId.DraconianFire) ? ActionId.DraconianFury : ActionId.DoomSpike),
  reducedBySkillSpeed: true,
});

const draconianFury: CombatAction = createCombatAction({
  id: ActionId.DraconianFury,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.DraconianFury, context, { potency: 130 }));
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
    dispatch(dmgEvent(ActionId.SonicThrust, context, { potency: 100, comboPotency: 120 }));

    if (context.comboed) {
      dispatch(combo(ActionId.SonicThrust));
      dispatch(buff(StatusId.PowerSurge));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.SonicThrust),
  reducedBySkillSpeed: true,
});

const coerthanTorment: CombatAction = createCombatAction({
  id: ActionId.CoerthanTorment,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.CoerthanTorment, context, { potency: 100, comboPotency: 150 }));

    if (context.comboed) {
      dispatch(buff(StatusId.DraconianFire));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.CoerthanTorment),
  reducedBySkillSpeed: true,
});

const elusiveJump: CombatAction = createCombatAction({
  id: ActionId.ElusiveJump,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.EnhancedPiercingTalon));
  },
});

export const drgStatuses: CombatStatus[] = [
  powerSurgeStatus,
  lanceChargeStatus,
  lifeSurgeStatus,
  wheelinMotionStatus,
  fangandClawBaredStatus,
  battleLitanyStatus,
  lifeoftheDragonActiveStatus,
  diveReadyStatus,
  chaoticSpringStatus,
  draconianFireStatus,
  nastrondReadyStatus,
  starcrossReadyStatus,
  dragonsFlightStatus,
  enhancedPiercingTalonStatus,
];

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
  battleLitany,
  jump,
  highJump,
  mirageDive,
  geirskogul,
  nastrond,
  stardiver,
  wingedGlide,
  dragonfireDive,
  wyrmwindThrust,
  piercingTalong,
  doomSpike,
  draconianFury,
  sonicThrust,
  coerthanTorment,
  elusiveJump,
  drakesbane,
  lanceBarrage,
  spiralBlow,
  riseOfTheDragon,
  starcross,
];

export const drgEpics = combineEpics(consumeLifeSurgeEpic);
