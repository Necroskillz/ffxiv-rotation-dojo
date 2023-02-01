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
  addHeat,
  addBattery,
  gcd,
  debuff,
  removeBuffStack,
  modifyCooldown,
  hasDebuff,
  removeDebuff,
} from '../../combatSlice';

function heat(state: RootState) {
  return resource(state, 'heat');
}

function battery(state: RootState) {
  return resource(state, 'battery');
}

const removeReassembleEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === executeAction.type && getActionById(a.payload.id).type === 'Weaponskill'),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => hasBuff(state, StatusId.Reassembled)),
    map(() => removeBuff(StatusId.Reassembled))
  );

const removeFlamethrowerEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === executeAction.type && a.payload.id !== ActionId.Flamethrower),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => hasBuff(state, StatusId.Flamethrower)),
    map(() => removeBuff(StatusId.Flamethrower))
  );

const splitShot: CombatAction = createCombatAction({
  id: ActionId.SplitShot,
  execute: () => {},
  redirect: () => ActionId.HeatedSplitShot,
  reducedBySkillSpeed: true,
});

const heatedSplitShot: CombatAction = createCombatAction({
  id: ActionId.HeatedSplitShot,
  execute: (dispatch) => {
    dispatch(combo(ActionId.SplitShot));
    dispatch(addHeat(5));
  },
  reducedBySkillSpeed: true,
});

const slugShot: CombatAction = createCombatAction({
  id: ActionId.SlugShot,
  execute: () => {},
  redirect: () => ActionId.HeatedSlugShot,
  reducedBySkillSpeed: true,
});

const heatedSlugShot: CombatAction = createCombatAction({
  id: ActionId.HeatedSlugShot,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(combo(ActionId.SlugShot));
      dispatch(addHeat(5));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.SlugShot),
  reducedBySkillSpeed: true,
});

const cleanShot: CombatAction = createCombatAction({
  id: ActionId.CleanShot,
  execute: () => {},
  redirect: () => ActionId.HeatedCleanShot,
  reducedBySkillSpeed: true,
});

const heatedCleanShot: CombatAction = createCombatAction({
  id: ActionId.HeatedCleanShot,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(addHeat(5));
      dispatch(addBattery(10));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.CleanShot),
  reducedBySkillSpeed: true,
});

const drill: CombatAction = createCombatAction({
  id: ActionId.Drill,
  execute: (dispatch) => {
    dispatch(gcd({ reducedBySkillSpeed: true }));
  },
  reducedBySkillSpeed: true,
});

const hotShot: CombatAction = createCombatAction({
  id: ActionId.HotShot,
  execute: () => {},
  redirect: () => ActionId.AirAnchor,
  reducedBySkillSpeed: true,
});

const airAnchor: CombatAction = createCombatAction({
  id: ActionId.AirAnchor,
  execute: (dispatch) => {
    dispatch(gcd({ reducedBySkillSpeed: true }));
    dispatch(addBattery(20));
  },
  reducedBySkillSpeed: true,
});

const chainsaw: CombatAction = createCombatAction({
  id: ActionId.ChainSaw,
  execute: (dispatch) => {
    dispatch(gcd({ reducedBySkillSpeed: true }));
    dispatch(addBattery(20));
  },
  reducedBySkillSpeed: true,
});

const reassemble: CombatAction = createCombatAction({
  id: ActionId.Reassemble,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Reassembled, 5));
  },
  maxCharges: () => 2,
  entersCombat: false,
});

const ricochet: CombatAction = createCombatAction({
  id: ActionId.Ricochet,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  maxCharges: () => 3,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
});

const gaussRound: CombatAction = createCombatAction({
  id: ActionId.GaussRound,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  maxCharges: () => 3,
  extraCooldown: () => ({
    cooldownGroup: 1001,
    duration: 1,
  }),
});

const barrelStabilizer: CombatAction = createCombatAction({
  id: ActionId.BarrelStabilizer,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(addHeat(50));
  },
  isUsable: (state) => inCombat(state),
});

const wildfire: CombatAction = createCombatAction({
  id: ActionId.Wildfire,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Wildfire, 10));
  },
  redirect: (state) => (hasDebuff(state, StatusId.Wildfire) ? ActionId.Detonator : ActionId.Wildfire),
});

const detonator: CombatAction = createCombatAction({
  id: ActionId.Detonator,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(removeDebuff(StatusId.Wildfire));
  },
});

const hypercharge: CombatAction = createCombatAction({
  id: ActionId.Hypercharge,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Overheated, 10, { stacks: 5 }));
  },
  isUsable: (state) => heat(state) >= 50,
  isGlowing: (state) => heat(state) >= 50,
  entersCombat: false,
});

const heatBlast: CombatAction = createCombatAction({
  id: ActionId.HeatBlast,
  execute: (dispatch) => {
    dispatch(removeBuffStack(StatusId.Overheated));
    dispatch(modifyCooldown(10, -15000));
    dispatch(modifyCooldown(11, -15000));
  },
  isUsable: (state) => hasBuff(state, StatusId.Overheated),
});

const rookAutoturret: CombatAction = createCombatAction({
  id: ActionId.RookAutoturret,
  execute: () => {},
  redirect: () => ActionId.AutomatonQueen,
});

const automatonQueen: CombatAction = createCombatAction({
  id: ActionId.AutomatonQueen,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.AutomatonQueenActive, 20, { isVisible: false }));
  },
  isUsable: (state) => battery(state) >= 50,
  isGlowing: (state) => battery(state) >= 50,
});

const rookOverdrive: CombatAction = createCombatAction({
  id: ActionId.RookOverdrive,
  execute: () => {},
  redirect: () => ActionId.QueenOverdrive,
});

const queenOverdrive: CombatAction = createCombatAction({
  id: ActionId.QueenOverdrive,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isUsable: (state) => hasBuff(state, StatusId.AutomatonQueenActive),
});

const tactician: CombatAction = createCombatAction({
  id: ActionId.Tactician,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Tactician, 15));
  },
  entersCombat: false,
});

const dismantle: CombatAction = createCombatAction({
  id: ActionId.Dismantle,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Dismantled, 10));
  },
});

const spreadShot: CombatAction = createCombatAction({
  id: ActionId.SpreadShot,
  execute: () => {},
  redirect: () => ActionId.Scattergun,
  reducedBySkillSpeed: true,
});

const scattergun: CombatAction = createCombatAction({
  id: ActionId.Scattergun,
  execute: (dispatch) => {
    dispatch(addHeat(10));
  },
  reducedBySkillSpeed: true,
});

const bioblaster: CombatAction = createCombatAction({
  id: ActionId.Bioblaster,
  execute: (dispatch) => {
    dispatch(gcd({ reducedBySkillSpeed: true }));
    dispatch(debuff(StatusId.Bioblaster, 15));
  },
  reducedBySkillSpeed: true,
});

const flamethrower: CombatAction = createCombatAction({
  id: ActionId.Flamethrower,
  execute: (dispatch) => {
    dispatch(buff(StatusId.Flamethrower, 10));
    dispatch(gcd({ reducedBySkillSpeed: true }));
  },
  isGcdAction: true,
});

const autoCrossbow: CombatAction = createCombatAction({
  id: ActionId.AutoCrossbow,
  execute: (dispatch) => {
    dispatch(removeBuffStack(StatusId.Overheated));
  },
  isUsable: (state) => hasBuff(state, StatusId.Overheated),
});

const rookOverload: CombatAction = createCombatAction({
  id: ActionId.RookOverload,
  execute: () => {},
});

const armPunch: CombatAction = createCombatAction({
  id: ActionId.ArmPunch,
  execute: () => {},
});

const rollerDash: CombatAction = createCombatAction({
  id: ActionId.RollerDash,
  execute: () => {},
});

const pileBunker: CombatAction = createCombatAction({
  id: ActionId.PileBunker,
  execute: () => {},
});

const crownedCollider: CombatAction = createCombatAction({
  id: ActionId.CrownedCollider,
  execute: () => {},
});

export const mch: CombatAction[] = [
  splitShot,
  heatedSplitShot,
  slugShot,
  heatedSlugShot,
  cleanShot,
  heatedCleanShot,
  drill,
  airAnchor,
  chainsaw,
  reassemble,
  ricochet,
  gaussRound,
  barrelStabilizer,
  wildfire,
  hypercharge,
  heatBlast,
  rookAutoturret,
  automatonQueen,
  rookOverdrive,
  queenOverdrive,
  tactician,
  detonator,
  hotShot,
  dismantle,
  spreadShot,
  scattergun,
  bioblaster,
  flamethrower,
  rookOverload,
  armPunch,
  rollerDash,
  pileBunker,
  crownedCollider,
  autoCrossbow,
];

export const mchEpics = combineEpics(removeReassembleEpic, removeFlamethrowerEpic);
