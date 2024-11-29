import { combineEpics, Epic } from 'redux-observable';
import { from, of, Subject } from 'rxjs';
import { concatMap, delay, filter, map, mergeMap, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
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
  extendableBuff,
  addBlood,
  addBuff,
  setDarkArts,
  event,
  dmgEvent,
  DamageType,
  setCombat,
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

const popTBNEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.BlackestNight),
    delay(3000),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => inCombat(state)),
    switchMap(() => of(removeBuff(StatusId.BlackestNight), setDarkArts(1)))
  );

const stopLivingShadow = new Subject<void>();

const livingShadowEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.SimulacrumActive),
    switchMap(() => {
      return of([
        { actionId: ActionId.AbyssalDrain, type: DamageType.Magical, delay: 6000, potency: 420 },
        { actionId: ActionId.Shadowstride, type: DamageType.Physical, delay: 2500, potency: 0 },
        { actionId: ActionId.Shadowbringer, type: DamageType.Magical, delay: 2500, potency: 570 },
        { actionId: ActionId.EdgeofShadow, type: DamageType.Magical, delay: 2500, potency: 420 },
        { actionId: ActionId.Bloodspiller, type: DamageType.Physical, delay: 2500, potency: 420 },
        { actionId: ActionId.Disesteem, type: DamageType.Physical, delay: 2500, potency: 620 },
      ]).pipe(
        mergeMap((a) => from(a)),
        concatMap((a) => of(a).pipe(delay(a.delay))),
        takeUntil(stopLivingShadow),
        withLatestFrom(state$),
        map(([a]) =>
          event(a.actionId, {
            potency: a.potency,
            type: a.type,
            statuses: [{ id: StatusId.SimulacrumActive, stacks: null }],
          })
        )
      );
    })
  );

const resetLivingShadowEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === setCombat.type && a.payload === false),
    tap(() => stopLivingShadow.next()),
    switchMap(() => of())
  );

const bloodWeaponStatus: CombatStatus = createCombatStatus({
  id: StatusId.BloodWeapon,
  duration: 15,
  isHarmful: false,
  initialStacks: 3,
});

const deliriumStatus: CombatStatus = createCombatStatus({
  id: StatusId.Delirium,
  duration: 15,
  isHarmful: false,
  initialStacks: 3,
});

const gritStatus: CombatStatus = createCombatStatus({
  id: StatusId.Grit,
  duration: null,
  isHarmful: false,
});

const darksideActiveStatus: CombatStatus = createCombatStatus({
  id: StatusId.DarksideActive,
  duration: 30,
  isHarmful: false,
  isVisible: false,
  maxDuration: 60,
});

const simulacrumActiveStatus: CombatStatus = createCombatStatus({
  id: StatusId.SimulacrumActive,
  duration: 20,
  isHarmful: false,
  isVisible: false,
});

const saltedEarthStatus: CombatStatus = createCombatStatus({
  id: StatusId.SaltedEarth,
  duration: 15,
  isHarmful: false,
  tick: (dispatch) => dispatch(event(0, { potency: 50 })),
});

const shadowedVigilStatus: CombatStatus = createCombatStatus({
  id: StatusId.ShadowedVigil,
  duration: 15,
  isHarmful: false,
});

const darkMindStatus: CombatStatus = createCombatStatus({
  id: StatusId.DarkMind,
  duration: 10,
  isHarmful: false,
});

const theBlackestNightStatus: CombatStatus = createCombatStatus({
  id: StatusId.BlackestNight,
  duration: 7,
  isHarmful: false,
});

const oblationStatus: CombatStatus = createCombatStatus({
  id: StatusId.Oblation,
  duration: 10,
  isHarmful: false,
});

const livingDeadStatus: CombatStatus = createCombatStatus({
  id: StatusId.LivingDead,
  duration: 10,
  isHarmful: false,
});

const darkMissionaryStatus: CombatStatus = createCombatStatus({
  id: StatusId.DarkMissionary,
  duration: 15,
  isHarmful: false,
});

const scornStatus: CombatStatus = createCombatStatus({
  id: StatusId.Scorn,
  duration: 30,
  isHarmful: false,
});

const hardSlash: CombatAction = createCombatAction({
  id: ActionId.HardSlash,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HardSlash, context, { potency: 300 }));
    dispatch(combo(ActionId.HardSlash));
  },
  reducedBySkillSpeed: true,
});

const syphonStrike: CombatAction = createCombatAction({
  id: ActionId.SyphonStrike,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.SyphonStrike, context, { potency: 240, comboPotency: 380, comboMana: 600 }));

    if (context.comboed) {
      dispatch(combo(ActionId.SyphonStrike));
    }
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => hasCombo(state, ActionId.SyphonStrike),
});

const souleater: CombatAction = createCombatAction({
  id: ActionId.Souleater,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Souleater, context, { potency: 260, comboPotency: 480, comboHealthPotency: 300 }));

    if (context.comboed) {
      dispatch(addBlood(20));
    }
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => hasCombo(state, ActionId.Souleater),
});

const bloodWeapon: CombatAction = createCombatAction({
  id: ActionId.BloodWeapon,
  execute: () => {},
  redirect: () => ActionId.Delirium,
});

const bloodspiller: CombatAction = createCombatAction({
  id: ActionId.Bloodspiller,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Bloodspiller, context, { potency: 580 }));
  },
  isGlowing: (state) => blood(state) >= 50,
  reducedBySkillSpeed: true,
  redirect: (state) =>
    hasBuff(state, StatusId.Delirium)
      ? hasCombo(state, ActionId.Comeuppance)
        ? ActionId.Comeuppance
        : hasCombo(state, ActionId.Torcleaver)
        ? ActionId.Torcleaver
        : ActionId.ScarletDelirium
      : ActionId.Bloodspiller,
});

const scarletDelirium: CombatAction = createCombatAction({
  id: ActionId.ScarletDelirium,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.ScarletDelirium, context, { potency: 620, mana: 200 }));
    dispatch(removeBuffStack(StatusId.Delirium));
    dispatch(combo(ActionId.ScarletDelirium));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const comeuppance: CombatAction = createCombatAction({
  id: ActionId.Comeuppance,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Comeuppance, context, { potency: 720, comboMana: 200 }));
    dispatch(removeBuffStack(StatusId.Delirium));
    dispatch(combo(ActionId.Comeuppance));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const torcleaver: CombatAction = createCombatAction({
  id: ActionId.Torcleaver,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Torcleaver, context, { potency: 820, comboMana: 200 }));
    dispatch(removeBuffStack(StatusId.Delirium));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const grit: CombatAction = createCombatAction({
  id: ActionId.Grit,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Grit));
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
    dispatch(buff(StatusId.Delirium));
    dispatch(buff(StatusId.BloodWeapon));
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
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.EdgeofShadow, context, { potency: 460, type: DamageType.Magical }));
    dispatch(extendableBuff(StatusId.DarksideActive));
    dispatch(setDarkArts(0));
  },
  cost: (state) => (darkArts(state) ? 0 : 3000),
  isGlowing: (state) => darkArts(state) > 0,
});

const carveAndSpit: CombatAction = createCombatAction({
  id: ActionId.CarveandSpit,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.CarveandSpit, context, { potency: 540, mana: 600, healthPotency: 500 }));
  },
});

const shadowstride: CombatAction = createCombatAction({
  id: ActionId.Shadowstride,
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
    dispatch(buff(StatusId.SimulacrumActive));
    dispatch(buff(StatusId.Scorn));
  },
  redirect: (state) => (hasBuff(state, StatusId.Scorn) ? ActionId.Disesteem : ActionId.LivingShadow),
  actionChangeTo: ActionId.Disesteem,
});

const disesteem: CombatAction = createCombatAction({
  id: ActionId.Disesteem,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Disesteem, context, { potency: 1000 }));
    dispatch(removeBuff(StatusId.Scorn));
  },
  isUsable: (state) => hasBuff(state, StatusId.Scorn),
  isGlowing: (state) => hasBuff(state, StatusId.Scorn),
  reducedBySkillSpeed: true,
});

const shadowbringer: CombatAction = createCombatAction({
  id: ActionId.Shadowbringer,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.Shadowbringer, context, { potency: 600, type: DamageType.Magical }));
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
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Unmend, context, { potency: 150 }));
    dispatch(modifyCooldown(getActionById(ActionId.Shadowstride).cooldownGroup, -5000));
  },
  reducedBySpellSpeed: true,
});

const saltedEarth: CombatAction = createCombatAction({
  id: ActionId.SaltedEarth,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.SaltedEarth));
  },
  redirect: (state) => (hasBuff(state, StatusId.SaltedEarth) ? ActionId.SaltandDarkness : ActionId.SaltedEarth),
  actionChangeTo: ActionId.SaltandDarkness,
});

const saltAndDarkness: CombatAction = createCombatAction({
  id: ActionId.SaltandDarkness,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.SaltandDarkness, context, { potency: 500, type: DamageType.Magical }));
  },
  isUsable: (state) => hasBuff(state, StatusId.SaltedEarth),
  isGlowing: (state) => hasBuff(state, StatusId.SaltedEarth),
});

const shadowWall: CombatAction = createCombatAction({
  id: ActionId.ShadowWall,
  execute: () => {},
  redirect: () => ActionId.ShadowedVigil,
});

const shadowedVigil: CombatAction = createCombatAction({
  id: ActionId.ShadowedVigil,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.ShadowedVigil));
  },
  entersCombat: false,
});

const darkMind: CombatAction = createCombatAction({
  id: ActionId.DarkMind,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.DarkMind));
  },
  entersCombat: false,
});

const theBlackestNight: CombatAction = createCombatAction({
  id: ActionId.TheBlackestNight,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.BlackestNight));
  },
  entersCombat: false,
});

const oblation: CombatAction = createCombatAction({
  id: ActionId.Oblation,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Oblation));
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
    dispatch(buff(StatusId.DarkMissionary));
  },
  entersCombat: false,
});

const livingDead: CombatAction = createCombatAction({
  id: ActionId.LivingDead,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.LivingDead));
  },
  entersCombat: false,
});

const unleash: CombatAction = createCombatAction({
  id: ActionId.Unleash,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Unleash, context, { potency: 120 }));
    dispatch(combo(ActionId.Unleash));
  },
  reducedBySkillSpeed: true,
});

const stalwartSoul: CombatAction = createCombatAction({
  id: ActionId.StalwartSoul,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.StalwartSoul, context, { potency: 120, comboPotency: 160, comboMana: 600 }));

    if (context.comboed) {
      dispatch(addBlood(20));
    }
  },
  reducedBySkillSpeed: true,
  isGlowing: (state) => hasCombo(state, ActionId.StalwartSoul),
});

const quietus: CombatAction = createCombatAction({
  id: ActionId.Quietus,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Quietus, context, { potency: 240 }));
  },
  isGlowing: (state) => blood(state) >= 50,
  reducedBySkillSpeed: true,
  redirect: (state) => (hasBuff(state, StatusId.Delirium) ? ActionId.Impalement : ActionId.Quietus),
});

const impalement: CombatAction = createCombatAction({
  id: ActionId.Impalement,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Impalement, context, { potency: 320, mana: 500 }));
    dispatch(removeBuffStack(StatusId.Delirium));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const abyssalDrain: CombatAction = createCombatAction({
  id: ActionId.AbyssalDrain,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.AbyssalDrain, context, { potency: 240, mana: 600, healthPotency: 500, type: DamageType.Magical }));
  },
});

const floodofDarkness: CombatAction = createCombatAction({
  id: ActionId.FloodofDarkness,
  execute: () => {},
  redirect: () => ActionId.FloodofShadow,
});

const floodOfShadow: CombatAction = createCombatAction({
  id: ActionId.FloodofShadow,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.FloodofShadow, context, { potency: 160, type: DamageType.Magical }));
    dispatch(extendableBuff(StatusId.DarksideActive));
    dispatch(setDarkArts(0));
  },
  cost: (state) => (darkArts(state) ? 0 : 3000),
  isGlowing: (state) => darkArts(state) > 0,
});

export const drkStatuses: CombatStatus[] = [
  deliriumStatus,
  darksideActiveStatus,
  simulacrumActiveStatus,
  gritStatus,
  saltedEarthStatus,
  shadowedVigilStatus,
  darkMindStatus,
  theBlackestNightStatus,
  oblationStatus,
  darkMissionaryStatus,
  livingDeadStatus,
  scornStatus,
  bloodWeaponStatus,
];

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
  shadowstride,
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
  shadowedVigil,
  scarletDelirium,
  comeuppance,
  torcleaver,
  disesteem,
  impalement,
];

export const drkEpics = combineEpics(consumeBloodWeaponEpic, popTBNEpic, livingShadowEpic, resetLivingShadowEpic);
