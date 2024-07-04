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
  debuff,
  addCartridge,
  gcd,
  event,
  dmgEvent,
} from '../../combatSlice';

function cartridge(state: RootState) {
  return resource(state, 'cartridge');
}

const removeRipContinuationEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(
      (a) => a.type === executeAction.type && getActionById(a.payload.id).type === 'Weaponskill' && a.payload.id !== ActionId.GnashingFang
    ),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => hasBuff(state, StatusId.ReadytoRip)),
    map(() => removeBuff(StatusId.ReadytoRip))
  );

const removeTearContinuationEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(
      (a) => a.type === executeAction.type && getActionById(a.payload.id).type === 'Weaponskill' && a.payload.id !== ActionId.SavageClaw
    ),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => hasBuff(state, StatusId.ReadytoTear)),
    map(() => removeBuff(StatusId.ReadytoTear))
  );

const removeGougeContinuationEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(
      (a) => a.type === executeAction.type && getActionById(a.payload.id).type === 'Weaponskill' && a.payload.id !== ActionId.WickedTalon
    ),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => hasBuff(state, StatusId.ReadytoGouge)),
    map(() => removeBuff(StatusId.ReadytoGouge))
  );

const removeBlastContinuationEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(
      (a) => a.type === executeAction.type && getActionById(a.payload.id).type === 'Weaponskill' && a.payload.id !== ActionId.BurstStrike
    ),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => hasBuff(state, StatusId.ReadytoBlast)),
    map(() => removeBuff(StatusId.ReadytoBlast))
  );

const brutalShellStatus: CombatStatus = createCombatStatus({
  id: StatusId.BrutalShell,
  duration: 30,
  isHarmful: false,
});

const noMercyStatus: CombatStatus = createCombatStatus({
  id: StatusId.NoMercy,
  duration: 20,
  isHarmful: false,
});

const royalGuardStatus: CombatStatus = createCombatStatus({
  id: StatusId.RoyalGuard,
  duration: null,
  isHarmful: false,
});

const readytoBlastStatus: CombatStatus = createCombatStatus({
  id: StatusId.ReadytoBlast,
  duration: 10,
  isHarmful: false,
});

const readytoGougeStatus: CombatStatus = createCombatStatus({
  id: StatusId.ReadytoGouge,
  duration: 10,
  isHarmful: false,
});

const readytoRipStatus: CombatStatus = createCombatStatus({
  id: StatusId.ReadytoRip,
  duration: 10,
  isHarmful: false,
});

const readytoTearStatus: CombatStatus = createCombatStatus({
  id: StatusId.ReadytoTear,
  duration: 10,
  isHarmful: false,
});

const bowShockStatus: CombatStatus = createCombatStatus({
  id: StatusId.BowShock,
  duration: 15,
  isHarmful: true,
  tick: (dispatch) => dispatch(event(0, { potency: 60 })),
});

const sonicBreakStatus: CombatStatus = createCombatStatus({
  id: StatusId.SonicBreak,
  duration: 30,
  isHarmful: true,
  tick: (dispatch) => dispatch(event(0, { potency: 60 })),
});

const camouflageStatus: CombatStatus = createCombatStatus({
  id: StatusId.Camouflage,
  duration: 20,
  isHarmful: false,
});

const nebulaStatus: CombatStatus = createCombatStatus({
  id: StatusId.Nebula,
  duration: 15,
  isHarmful: false,
});

const auroraStatus: CombatStatus = createCombatStatus({
  id: StatusId.Aurora,
  duration: 18,
  isHarmful: false,
  tick: (dispatch) => dispatch(event(0, { healthPotency: 200 })),
});

const superbolideStatus: CombatStatus = createCombatStatus({
  id: StatusId.Superbolide,
  duration: 10,
  isHarmful: false,
});

const heartOfLightStatus: CombatStatus = createCombatStatus({
  id: StatusId.HeartofLight,
  duration: 15,
  isHarmful: false,
});

const heartOfCorundumStatus: CombatStatus = createCombatStatus({
  id: StatusId.HeartofCorundum,
  duration: 8,
  isHarmful: false,
});

const clarityofCorundumStatus: CombatStatus = createCombatStatus({
  id: StatusId.ClarityofCorundum,
  duration: 4,
  isHarmful: false,
});

const catharsisofCorundumStatus: CombatStatus = createCombatStatus({
  id: StatusId.CatharsisofCorundum,
  duration: 20,
  isHarmful: false,
});

const keenEdge: CombatAction = createCombatAction({
  id: ActionId.KeenEdge,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.KeenEdge, context, { potency: 200 }));
    dispatch(combo(ActionId.KeenEdge));
  },
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const brutalShell: CombatAction = createCombatAction({
  id: ActionId.BrutalShell,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.BrutalShell, context, { potency: 160, comboPotency: 300, comboHealthPotency: 200 }));

    if (context.comboed) {
      dispatch(combo(ActionId.BrutalShell));
      dispatch(buff(StatusId.BrutalShell));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.BrutalShell),
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const solidBarrel: CombatAction = createCombatAction({
  id: ActionId.SolidBarrel,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.SolidBarrel, context, { potency: 140, comboPotency: 360 }));

    if (context.comboed) {
      dispatch(addCartridge(1));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.SolidBarrel),
  reducedBySkillSpeed: true,
  preservesCombo: false,
});

const noMercy: CombatAction = createCombatAction({
  id: ActionId.NoMercy,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.NoMercy));
  },
  entersCombat: false,
});

const royalGuard: CombatAction = createCombatAction({
  id: ActionId.RoyalGuard,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.RoyalGuard));
  },
  entersCombat: false,
  redirect: (state) => (hasBuff(state, StatusId.RoyalGuard) ? ActionId.ReleaseRoyalGuard : ActionId.RoyalGuard),
});

const releaseRoyalGuard: CombatAction = createCombatAction({
  id: ActionId.ReleaseRoyalGuard,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.RoyalGuard));
  },
  entersCombat: false,
});

const burstStrike: CombatAction = createCombatAction({
  id: ActionId.BurstStrike,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.BurstStrike, context, { potency: 380 }));
    dispatch(buff(StatusId.ReadytoBlast));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => cartridge(state) > 0,
});

const bloodfest: CombatAction = createCombatAction({
  id: ActionId.Bloodfest,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(addCartridge(3));
  },
  isUsable: (state) => inCombat(state),
});

const continuation: CombatAction = createCombatAction({
  id: ActionId.Continuation,
  execute: () => {},
  isUsable: () => false,
  redirect: (state) => {
    if (hasBuff(state, StatusId.ReadytoBlast)) {
      return ActionId.Hypervelocity;
    }

    if (hasBuff(state, StatusId.ReadytoRip)) {
      return ActionId.JugularRip;
    }

    if (hasBuff(state, StatusId.ReadytoTear)) {
      return ActionId.AbdomenTear;
    }

    if (hasBuff(state, StatusId.ReadytoGouge)) {
      return ActionId.EyeGouge;
    }

    return ActionId.Continuation;
  },
});

const hypervelocity: CombatAction = createCombatAction({
  id: ActionId.Hypervelocity,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Hypervelocity, context, { potency: 180 }));
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.ReadytoBlast));
  },
  isGlowing: () => true,
});

const jugularRip: CombatAction = createCombatAction({
  id: ActionId.JugularRip,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.JugularRip, context, { potency: 200 }));
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.ReadytoRip));
  },
  isGlowing: () => true,
});

const abdomenTear: CombatAction = createCombatAction({
  id: ActionId.AbdomenTear,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.AbdomenTear, context, { potency: 240 }));
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.ReadytoTear));
  },
  isGlowing: () => true,
});

const eyeGouge: CombatAction = createCombatAction({
  id: ActionId.EyeGouge,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.EyeGouge, context, { potency: 280 }));
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.ReadytoGouge));
  },
  isGlowing: () => true,
});

const gnashingFang: CombatAction = createCombatAction({
  id: ActionId.GnashingFang,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.GnashingFang, context, { potency: 380 }));
    dispatch(combo(ActionId.GnashingFang));
    dispatch(buff(StatusId.ReadytoRip));
    dispatch(gcd({ reducedBySkillSpeed: true }));
  },
  isGlowing: (state) => cartridge(state) > 0,
  redirect: (state) =>
    hasCombo(state, ActionId.SavageClaw)
      ? ActionId.SavageClaw
      : hasCombo(state, ActionId.WickedTalon)
      ? ActionId.WickedTalon
      : ActionId.GnashingFang,
  reducedBySkillSpeed: true,
});

const savageClaw: CombatAction = createCombatAction({
  id: ActionId.SavageClaw,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.SavageClaw, context, { comboPotency: 460 }));

    if (context.comboed) {
      dispatch(combo(ActionId.SavageClaw));
      dispatch(buff(StatusId.ReadytoTear));
    }
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const wickedTalon: CombatAction = createCombatAction({
  id: ActionId.WickedTalon,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.WickedTalon, context, { comboPotency: 540 }));

    if (context.comboed) {
      dispatch(buff(StatusId.ReadytoGouge));
    }
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const doubleDown: CombatAction = createCombatAction({
  id: ActionId.DoubleDown,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.DoubleDown, context, { potency: 1200 }));
    dispatch(gcd({ reducedBySkillSpeed: true }));
  },
  isGlowing: (state) => cartridge(state) >= 2,
  reducedBySkillSpeed: true,
});

const lightningShot: CombatAction = createCombatAction({
  id: ActionId.LightningShot,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.LightningShot, context, { potency: 150 }));
  },
  reducedBySkillSpeed: true,
});

const dangerZone: CombatAction = createCombatAction({
  id: ActionId.DangerZone,
  execute: () => {},
  redirect: () => ActionId.BlastingZone,
  isGlowing: () => true,
});

const blastingZone: CombatAction = createCombatAction({
  id: ActionId.BlastingZone,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.BlastingZone, context, { potency: 720 }));
    dispatch(ogcdLock());
  },
});

const trajectory: CombatAction = createCombatAction({
  id: ActionId.Trajectory,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Trajectory, context, { potency: 150 }));
    dispatch(ogcdLock());
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
});

const bowShock: CombatAction = createCombatAction({
  id: ActionId.BowShock,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.BowShock, context, { potency: 150 }));
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.BowShock));
  },
});

const sonicBreak: CombatAction = createCombatAction({
  id: ActionId.SonicBreak,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.SonicBreak, context, { potency: 300 }));
    dispatch(gcd({ reducedBySkillSpeed: true }));
    dispatch(debuff(StatusId.SonicBreak));
  },
  reducedBySkillSpeed: true,
});

const camouflage: CombatAction = createCombatAction({
  id: ActionId.Camouflage,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Camouflage));
  },
  entersCombat: false,
});

const nebula: CombatAction = createCombatAction({
  id: ActionId.Nebula,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Nebula));
  },
  entersCombat: false,
});

const aurora: CombatAction = createCombatAction({
  id: ActionId.Aurora,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Aurora));
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1001,
    duration: 1,
  }),
  entersCombat: false,
});

const superbolide: CombatAction = createCombatAction({
  id: ActionId.Superbolide,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Superbolide));
  },
  entersCombat: false,
});

const heartOfLight: CombatAction = createCombatAction({
  id: ActionId.HeartofLight,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.HeartofLight));
  },
  entersCombat: false,
});

const heartOfStone: CombatAction = createCombatAction({
  id: ActionId.HeartofStone,
  execute: () => {},
  redirect: () => ActionId.HeartofCorundum,
});

const heartOfCorundum: CombatAction = createCombatAction({
  id: ActionId.HeartofCorundum,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.HeartofCorundum));
    dispatch(buff(StatusId.ClarityofCorundum));
    dispatch(buff(StatusId.CatharsisofCorundum));
  },
  entersCombat: false,
});

const demonSlice: CombatAction = createCombatAction({
  id: ActionId.DemonSlice,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.DemonSlice, context, { potency: 100 }));
    dispatch(combo(ActionId.DemonSlice));
  },
  reducedBySkillSpeed: true,
});

const demonSlaughter: CombatAction = createCombatAction({
  id: ActionId.DemonSlaughter,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.DemonSlaughter, context, { potency: 100, comboPotency: 160 }));

    if (context.comboed) {
      dispatch(addCartridge(1));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.DemonSlaughter),
  reducedBySkillSpeed: true,
});

const fatedCircle: CombatAction = createCombatAction({
  id: ActionId.FatedCircle,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.FatedCircle, context, { potency: 300 }));
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => cartridge(state) > 0,
});

export const gnbStatuses: CombatStatus[] = [
  auroraStatus,
  bowShockStatus,
  camouflageStatus,
  heartOfCorundumStatus,
  heartOfLightStatus,
  nebulaStatus,
  superbolideStatus,
  sonicBreakStatus,
  royalGuardStatus,
  readytoBlastStatus,
  readytoRipStatus,
  readytoTearStatus,
  readytoGougeStatus,
  brutalShellStatus,
  noMercyStatus,
  clarityofCorundumStatus,
  catharsisofCorundumStatus,
];

export const gnb: CombatAction[] = [
  keenEdge,
  brutalShell,
  solidBarrel,
  noMercy,
  royalGuard,
  releaseRoyalGuard,
  burstStrike,
  bloodfest,
  continuation,
  hypervelocity,
  jugularRip,
  abdomenTear,
  eyeGouge,
  gnashingFang,
  savageClaw,
  wickedTalon,
  doubleDown,
  lightningShot,
  dangerZone,
  blastingZone,
  trajectory,
  bowShock,
  sonicBreak,
  camouflage,
  aurora,
  nebula,
  superbolide,
  heartOfLight,
  heartOfStone,
  heartOfCorundum,
  demonSlice,
  demonSlaughter,
  fatedCircle,
];

export const gnbEpics = combineEpics(
  removeRipContinuationEpic,
  removeTearContinuationEpic,
  removeGougeContinuationEpic,
  removeBlastContinuationEpic
);
