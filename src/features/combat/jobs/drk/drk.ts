import { combineEpics, Epic } from 'redux-observable';
import { of } from 'rxjs';
import { delay, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
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
  extendableBuff,
  addBlood,
  addBuff,
  setDarkArts,
  event,
} from '../../combatSlice';

function blood(state: RootState) {
  return resource(state, 'blood');
}

function darkArts(state: RootState) {
  return resource(state, 'darkArts');
}

const consumeBloodWeaponEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === executeAction.type && ['Weaponskill', 'Spell'].includes(getActionById(a.payload.id).type)),
    withLatestFrom(state$),
    filter(([_, state]) => hasBuff(state, StatusId.BloodWeapon)),
    switchMap(([a]) => of(removeBuffStack(StatusId.BloodWeapon), event(a.payload.id, { mana: 600 }), addBlood(10)))
  );

const consumeDeliriumEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === executeAction.type && [ActionId.Bloodspiller, ActionId.Quietus].includes(a.payload.id)),
    withLatestFrom(state$),
    filter(([_, state]) => hasBuff(state, StatusId.Delirium)),
    switchMap(([a]) => of(removeBuffStack(StatusId.Delirium), event(a.payload.id, { mana: 200 })))
  );

const popTBNEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.BlackestNight),
    delay(3000),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => inCombat(state)),
    switchMap(() => of(removeBuff(StatusId.BlackestNight), setDarkArts(1)))
  );

const hardSlash: CombatAction = createCombatAction({
  id: ActionId.HardSlash,
  execute: (dispatch) => {
    dispatch(combo(ActionId.HardSlash));
  },
  reducedBySkillSpeed: true,
});

const syphonStrike: CombatAction = createCombatAction({
  id: ActionId.SyphonStrike,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(event(ActionId.SyphonStrike, { potency: 260, mana: 600 }));
      dispatch(combo(ActionId.SyphonStrike));
    } else {
      dispatch(event(ActionId.SyphonStrike, { potency: 120 }));
    }
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => hasCombo(state, ActionId.SyphonStrike),
});

const souleater: CombatAction = createCombatAction({
  id: ActionId.Souleater,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(addBlood(20));
    }
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => hasCombo(state, ActionId.Souleater),
});

const bloodWeapon: CombatAction = createCombatAction({
  id: ActionId.BloodWeapon,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.BloodWeapon, 15, { stacks: 5 }));
  },
  entersCombat: false,
});

const bloodspiller: CombatAction = createCombatAction({
  id: ActionId.Bloodspiller,
  execute: () => {},
  cost: (state) => (hasBuff(state, StatusId.Delirium) ? 0 : 50),
  isUsable: (state) => blood(state) >= 50 || hasBuff(state, StatusId.Delirium),
  isGlowing: (state) => blood(state) >= 50 || hasBuff(state, StatusId.Delirium),
  reducedBySkillSpeed: true,
});

const grit: CombatAction = createCombatAction({
  id: ActionId.Grit,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Grit, null));
  },
  entersCombat: false,
  redirect: (state) => (hasBuff(state, StatusId.Grit) ? ActionId.ReleaseGrit : ActionId.Grit),
});

const releaseGrit: CombatAction = createCombatAction({
  id: ActionId.ReleaseGrit,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.Grit));
  },
  entersCombat: false,
});

const delirium: CombatAction = createCombatAction({
  id: ActionId.Delirium,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Delirium, 15, { stacks: 3 }));
  },
  entersCombat: false,
});

const edgeOfDarkness: CombatAction = createCombatAction({
  id: ActionId.EdgeofDarkness,
  execute: () => {},
  redirect: () => ActionId.EdgeofShadow,
});

const edgeOfShadow: CombatAction = createCombatAction({
  id: ActionId.EdgeofShadow,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(extendableBuff(StatusId.DarksideActive, 30, 60, { isVisible: false }));
    dispatch(setDarkArts(0));
  },
  cost: (state) => (darkArts(state) ? 0 : 3000),
  isGlowing: (state) => darkArts(state) > 0,
});

const carveAndSpit: CombatAction = createCombatAction({
  id: ActionId.CarveandSpit,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(event(ActionId.CarveandSpit, { potency: 510, mana: 600 }));
  },
});

const plunge: CombatAction = createCombatAction({
  id: ActionId.Plunge,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
});

const livingShadow: CombatAction = createCombatAction({
  id: ActionId.LivingShadow,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.SimulacrumActive, 20, { isVisible: false }));
  },
});

const shadowbringer: CombatAction = createCombatAction({
  id: ActionId.Shadowbringer,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1001,
    duration: 1,
  }),
  isUsable: (state) => hasBuff(state, StatusId.SimulacrumActive),
});

const unmend: CombatAction = createCombatAction({
  id: ActionId.Unmend,
  execute: (dispatch) => {
    dispatch(modifyCooldown(10, -5000));
  },
  reducedBySpellSpeed: true,
});

const saltedEarth: CombatAction = createCombatAction({
  id: ActionId.SaltedEarth,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.SaltedEarth, 15));
  },
  redirect: (state) => (hasBuff(state, StatusId.SaltedEarth) ? ActionId.SaltandDarkness : ActionId.SaltedEarth),
});

const saltAndDarkness: CombatAction = createCombatAction({
  id: ActionId.SaltandDarkness,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isGlowing: () => true,
});

const shadowWall: CombatAction = createCombatAction({
  id: ActionId.ShadowWall,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.ShadowWall, 15));
  },
  entersCombat: false,
});

const darkMind: CombatAction = createCombatAction({
  id: ActionId.DarkMind,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.DarkMind, 10));
  },
  entersCombat: false,
});

const theBlackestNight: CombatAction = createCombatAction({
  id: ActionId.TheBlackestNight,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.BlackestNight, 7));
  },
  entersCombat: false,
});

const oblation: CombatAction = createCombatAction({
  id: ActionId.Oblation,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Oblation, 10));
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1002,
    duration: 1,
  }),
  entersCombat: false,
});

const darkMissionary: CombatAction = createCombatAction({
  id: ActionId.DarkMissionary,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.DarkMissionary, 15));
  },
  entersCombat: false,
});

const livingDead: CombatAction = createCombatAction({
  id: ActionId.LivingDead,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.LivingDead, 10));
  },
  entersCombat: false,
});

const unleash: CombatAction = createCombatAction({
  id: ActionId.Unleash,
  execute: (dispatch) => {
    dispatch(combo(ActionId.Unleash));
  },
  reducedBySkillSpeed: true,
});

const stalwartSoul: CombatAction = createCombatAction({
  id: ActionId.StalwartSoul,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(event(ActionId.StalwartSoul, { potency: 140, mana: 600 }));
      dispatch(addBlood(20));
    } else {
      dispatch(event(ActionId.StalwartSoul, { potency: 100 }));
    }
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => hasCombo(state, ActionId.StalwartSoul),
});

const quietus: CombatAction = createCombatAction({
  id: ActionId.Quietus,
  execute: () => {},
  cost: (state) => (hasBuff(state, StatusId.Delirium) ? 0 : 50),
  isUsable: (state) => blood(state) >= 50 || hasBuff(state, StatusId.Delirium),
  isGlowing: (state) => blood(state) >= 50 || hasBuff(state, StatusId.Delirium),
  reducedBySkillSpeed: true,
});

const abyssalDrain: CombatAction = createCombatAction({
  id: ActionId.AbyssalDrain,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(event(ActionId.AbyssalDrain, { potency: 240, mana: 600, healthPotency: 200 }));
  },
});

const floodofDarkness: CombatAction = createCombatAction({
  id: ActionId.FloodofDarkness,
  execute: () => {},
  redirect: () => ActionId.EdgeofShadow,
});

const floodOfShadow: CombatAction = createCombatAction({
  id: ActionId.FloodofShadow,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(extendableBuff(StatusId.DarksideActive, 30, 60, { isVisible: false }));
    dispatch(setDarkArts(0));
  },
  cost: (state) => (darkArts(state) ? 0 : 3000),
  isGlowing: (state) => darkArts(state) > 0,
});

export const drk: CombatAction[] = [
  hardSlash,
  syphonStrike,
  souleater,
  bloodWeapon,
  bloodspiller,
  grit,
  releaseGrit,
  delirium,
  edgeOfDarkness,
  edgeOfShadow,
  carveAndSpit,
  plunge,
  livingShadow,
  shadowbringer,
  unmend,
  saltedEarth,
  saltAndDarkness,
  shadowWall,
  darkMind,
  theBlackestNight,
  oblation,
  darkMissionary,
  livingDead,
  unleash,
  stalwartSoul,
  quietus,
  abyssalDrain,
  floodofDarkness,
  floodOfShadow,
];

export const drkEpics = combineEpics(consumeBloodWeaponEpic, consumeDeliriumEpic, popTBNEpic);
