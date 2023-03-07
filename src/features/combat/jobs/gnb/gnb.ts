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

const keenEdge: CombatAction = createCombatAction({
  id: ActionId.KeenEdge,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.KeenEdge, context, { potency: 170 }));
    dispatch(combo(ActionId.KeenEdge));
  },
  reducedBySkillSpeed: true,
});

const brutalShell: CombatAction = createCombatAction({
  id: ActionId.BrutalShell,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.BrutalShell, context, { potency: 130, comboPotency: 270, comboHealthPotency: 200 }));

    if (context.comboed) {
      dispatch(combo(ActionId.BrutalShell));
      dispatch(buff(StatusId.BrutalShell, 30));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.BrutalShell),
  reducedBySkillSpeed: true,
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
});

const noMercy: CombatAction = createCombatAction({
  id: ActionId.NoMercy,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.NoMercy, 20));
  },
  entersCombat: false,
});

const royalGuard: CombatAction = createCombatAction({
  id: ActionId.RoyalGuard,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.RoyalGuard, null));
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
    dispatch(buff(StatusId.ReadytoBlast, 10));
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
    dispatch(buff(StatusId.ReadytoRip, 10));
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
      dispatch(buff(StatusId.ReadytoTear, 10));
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
      dispatch(buff(StatusId.ReadytoGouge, 10));
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

const roughDivide: CombatAction = createCombatAction({
  id: ActionId.RoughDivide,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.RoughDivide, context, { potency: 150 }));
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
    dispatch(debuff(StatusId.BowShock, 15, { periodicEffect: () => dispatch(dmgEvent(0, context, { potency: 60 })) }));
  },
});

const sonicBreak: CombatAction = createCombatAction({
  id: ActionId.SonicBreak,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.SonicBreak, context, { potency: 300 }));
    dispatch(gcd({ reducedBySkillSpeed: true }));
    dispatch(debuff(StatusId.SonicBreak, 30, { periodicEffect: () => dispatch(dmgEvent(0, context, { potency: 60 })) }));
  },
  reducedBySkillSpeed: true,
});

const camouflage: CombatAction = createCombatAction({
  id: ActionId.Camouflage,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Camouflage, 20));
  },
  entersCombat: false,
});

const nebula: CombatAction = createCombatAction({
  id: ActionId.Nebula,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Nebula, 15));
  },
  entersCombat: false,
});

const aurora: CombatAction = createCombatAction({
  id: ActionId.Aurora,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Aurora, 18, { periodicEffect: () => dispatch(event(0, { healthPotency: 200 })) }));
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
    dispatch(buff(StatusId.Superbolide, 10));
  },
  entersCombat: false,
});

const heartOfLight: CombatAction = createCombatAction({
  id: ActionId.HeartofLight,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.HeartofLight, 15));
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
    dispatch(buff(StatusId.HeartofCorundum, 8));
    dispatch(buff(StatusId.ClarityofCorundum, 4));
    dispatch(buff(StatusId.CatharsisofCorundum, 20));
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
  roughDivide,
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
