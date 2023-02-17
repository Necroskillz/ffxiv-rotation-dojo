import { combineEpics, Epic } from 'redux-observable';
import { filter, switchMap, first, map, delay, interval, startWith, takeWhile, withLatestFrom } from 'rxjs';
import { RootState } from '../../../../app/store';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import {
  buff,
  combo,
  hasBuff,
  hasCombo,
  ogcdLock,
  removeBuff,
  resource,
  removeBuffStack,
  gcd,
  debuff,
  addBuff,
  executeAction,
  setCombat,
  inCombat,
  addOath,
  event,
} from '../../combatSlice';

const passageOfArmsStopEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.PassageofArms),
    switchMap(() =>
      action$.pipe(
        first(
          (aa) =>
            (aa.type === executeAction.type && aa.payload.id !== ActionId.PassageofArms) ||
            (aa.type === removeBuff.type && aa.payload === StatusId.PassageofArms)
        )
      )
    ),
    map(() => removeBuff(StatusId.PassageofArms))
  );

const autoAttackEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === setCombat.type && a.payload),
    delay(1000),
    switchMap((a) =>
      interval(2250).pipe(
        startWith(0),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => inCombat(state)),
        map(() => addOath(5))
      )
    )
  );

function oath(state: RootState) {
  return resource(state, 'oath');
}

const fastBlade: CombatAction = createCombatAction({
  id: ActionId.FastBlade,
  execute: (dispatch) => {
    dispatch(combo(ActionId.FastBlade));
  },
  reducedBySkillSpeed: true,
});

const riotBlade: CombatAction = createCombatAction({
  id: ActionId.RiotBlade,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(combo(ActionId.RiotBlade));
      dispatch(event(ActionId.RiotBlade, { potency: 280, mana: 1000 }));
    } else {
      dispatch(event(ActionId.RiotBlade, { potency: 120 }));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.RiotBlade),
  reducedBySkillSpeed: true,
});

const rageOfHalone: CombatAction = createCombatAction({
  id: ActionId.RageofHalone,
  execute: () => {},
  redirect: () => ActionId.RoyalAuthority,
  reducedBySkillSpeed: true,
});

const royalAuthority: CombatAction = createCombatAction({
  id: ActionId.RoyalAuthority,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(buff(StatusId.SwordOath, 30, { stacks: 3 }));
      dispatch(buff(StatusId.DivineMight, 30));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.RoyalAuthority),
  reducedBySkillSpeed: true,
});

const holySpirit: CombatAction = createCombatAction({
  id: ActionId.HolySpirit,
  execute: (dispatch, getState) => {
    if (hasBuff(getState(), StatusId.DivineMight)) {
      dispatch(removeBuff(StatusId.DivineMight));
    } else if (hasBuff(getState(), StatusId.Requiescat)) {
      dispatch(removeBuffStack(StatusId.Requiescat));
    }
  },
  cost: (_, baseCost) => baseCost / 2,
  castTime: (state, baseCastTime) => (hasBuff(state, StatusId.DivineMight) || hasBuff(state, StatusId.Requiescat) ? 0 : baseCastTime),
  isGlowing: (state) => hasBuff(state, StatusId.DivineMight) || hasBuff(state, StatusId.Requiescat),
  reducedBySpellSpeed: true,
});

const requiescat: CombatAction = createCombatAction({
  id: ActionId.Requiescat,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Requiescat, 30, { stacks: 4 }));
    dispatch(buff(StatusId.ConfiteorReady, 30));
  },
});

const atonement: CombatAction = createCombatAction({
  id: ActionId.Atonement,
  execute: (dispatch) => {
    dispatch(event(ActionId.Atonement, { potency: 380, mana: 400 }));

    dispatch(removeBuffStack(StatusId.SwordOath));
  },
  isUsable: (state) => hasBuff(state, StatusId.SwordOath),
  isGlowing: (state) => hasBuff(state, StatusId.SwordOath),
  reducedBySkillSpeed: true,
});

const confiteor: CombatAction = createCombatAction({
  id: ActionId.Confiteor,
  execute: (dispatch) => {
    dispatch(removeBuff(StatusId.ConfiteorReady));
    dispatch(combo(ActionId.Confiteor));
    dispatch(removeBuffStack(StatusId.Requiescat));
  },
  cost: (_, baseCost) => baseCost / 2,
  isUsable: (state) => hasBuff(state, StatusId.ConfiteorReady),
  isGlowing: (state) => hasBuff(state, StatusId.ConfiteorReady),
  redirect: (state) =>
    hasCombo(state, ActionId.BladeofValor)
      ? ActionId.BladeofValor
      : hasCombo(state, ActionId.BladeofTruth)
      ? ActionId.BladeofTruth
      : hasCombo(state, ActionId.BladeofFaith)
      ? ActionId.BladeofFaith
      : ActionId.Confiteor,
  reducedBySpellSpeed: true,
});

const bladeofFaith: CombatAction = createCombatAction({
  id: ActionId.BladeofFaith,
  execute: (dispatch) => {
    dispatch(combo(ActionId.BladeofFaith));
    dispatch(removeBuffStack(StatusId.Requiescat));
  },
  cost: (_, baseCost) => baseCost / 2,
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const bladeofTruth: CombatAction = createCombatAction({
  id: ActionId.BladeofTruth,
  execute: (dispatch) => {
    dispatch(combo(ActionId.BladeofTruth));
    dispatch(removeBuffStack(StatusId.Requiescat));
  },
  cost: (_, baseCost) => baseCost / 2,
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const bladeOfValor: CombatAction = createCombatAction({
  id: ActionId.BladeofValor,
  execute: (dispatch) => {
    dispatch(removeBuffStack(StatusId.Requiescat));
  },
  cost: (_, baseCost) => baseCost / 2,
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const fightOrFlight: CombatAction = createCombatAction({
  id: ActionId.FightorFlight,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.FightorFlight, 20));
  },
  entersCombat: false,
});

const spiritsWithin: CombatAction = createCombatAction({
  id: ActionId.SpiritsWithin,
  execute: () => {},
  redirect: () => ActionId.Expiacion,
});

const excipation: CombatAction = createCombatAction({
  id: ActionId.Expiacion,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(event(ActionId.Atonement, { potency: 450, mana: 500 }));
  },
});

const goringBlade: CombatAction = createCombatAction({
  id: ActionId.GoringBlade,
  execute: (dispatch) => {
    dispatch(gcd({ reducedBySkillSpeed: true }));
  },
});

const intervene: CombatAction = createCombatAction({
  id: ActionId.Intervene,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
});

const circleOfScorn: CombatAction = createCombatAction({
  id: ActionId.CircleofScorn,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.CircleofScorn, 15));
  },
});

const ironWill: CombatAction = createCombatAction({
  id: ActionId.IronWill,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.IronWill, null));
  },
  entersCombat: false,
  redirect: (state) => (hasBuff(state, StatusId.IronWill) ? ActionId.ReleaseIronWill : ActionId.IronWill),
});

const releaseIronWill: CombatAction = createCombatAction({
  id: ActionId.ReleaseIronWill,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.IronWill));
  },
  entersCombat: false,
});

const shieldLob: CombatAction = createCombatAction({
  id: ActionId.ShieldLob,
  execute: () => {},
  reducedBySkillSpeed: true,
});

const shieldBash: CombatAction = createCombatAction({
  id: ActionId.ShieldBash,
  execute: (dispatch) => {
    dispatch(debuff(StatusId.Stun, 6));
  },
  reducedBySkillSpeed: true,
});

const totalEclipse: CombatAction = createCombatAction({
  id: ActionId.TotalEclipse,
  execute: (dispatch) => {
    dispatch(combo(ActionId.TotalEclipse));
  },
  reducedBySkillSpeed: true,
});

const prominence: CombatAction = createCombatAction({
  id: ActionId.Prominence,
  execute: (dispatch, _, context) => {
    if (context.comboed) {
      dispatch(event(ActionId.Prominence, { potency: 170, mana: 1000 }));
      dispatch(buff(StatusId.DivineMight, 30));
    } else {
      dispatch(event(ActionId.Prominence, { potency: 100 }));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Prominence),
  reducedBySkillSpeed: true,
});

const holyCircle: CombatAction = createCombatAction({
  id: ActionId.HolyCircle,
  execute: (dispatch, getState) => {
    if (hasBuff(getState(), StatusId.DivineMight)) {
      dispatch(removeBuff(StatusId.DivineMight));
    } else if (hasBuff(getState(), StatusId.Requiescat)) {
      dispatch(removeBuffStack(StatusId.Requiescat));
    }
  },
  cost: (_, baseCost) => baseCost / 2,
  castTime: (state, baseCastTime) => (hasBuff(state, StatusId.DivineMight) || hasBuff(state, StatusId.Requiescat) ? 0 : baseCastTime),
  isGlowing: (state) => hasBuff(state, StatusId.DivineMight) || hasBuff(state, StatusId.Requiescat),
  reducedBySpellSpeed: true,
});

const sheltron: CombatAction = createCombatAction({
  id: ActionId.Sheltron,
  execute: () => {},
  redirect: () => ActionId.HolySheltron,
});

const holySheltron: CombatAction = createCombatAction({
  id: ActionId.HolySheltron,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.HolySheltron, 8));
    dispatch(buff(StatusId.KnightsResolve, 4));
    dispatch(buff(StatusId.KnightsBenediction, 12));
  },
  isGlowing: (state) => oath(state) >= 50,
  entersCombat: false,
});

const intervention: CombatAction = createCombatAction({
  id: ActionId.Intervention,
  execute: (dispatch) => {
    dispatch(ogcdLock());
  },
  isGlowing: (state) => oath(state) >= 50,
  entersCombat: false,
});

const sentinel: CombatAction = createCombatAction({
  id: ActionId.Sentinel,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Sentinel, 15));
  },
  entersCombat: false,
});

const cover: CombatAction = createCombatAction({
  id: ActionId.Cover,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Cover, 15));
  },
  isGlowing: (state) => oath(state) >= 50,
  entersCombat: false,
});

const hallowedGround: CombatAction = createCombatAction({
  id: ActionId.HallowedGround,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.HallowedGround, 10));
  },
  entersCombat: false,
});

const bulwark: CombatAction = createCombatAction({
  id: ActionId.Bulwark,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Bulwark, 10));
  },
  entersCombat: false,
});

const divineVeil: CombatAction = createCombatAction({
  id: ActionId.DivineVeil,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.DivineVeil, 30));
  },
  entersCombat: false,
});

const clemency: CombatAction = createCombatAction({
  id: ActionId.Clemency,
  execute: () => {},
  cost: (_, baseCost) => baseCost / 2,
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const passageOfArms: CombatAction = createCombatAction({
  id: ActionId.PassageofArms,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.PassageofArms, 18));
  },
  entersCombat: false,
});

export const pld: CombatAction[] = [
  fastBlade,
  riotBlade,
  rageOfHalone,
  royalAuthority,
  holySpirit,
  requiescat,
  atonement,
  confiteor,
  bladeofFaith,
  bladeofTruth,
  bladeOfValor,
  fightOrFlight,
  spiritsWithin,
  excipation,
  goringBlade,
  intervene,
  circleOfScorn,
  ironWill,
  releaseIronWill,
  shieldLob,
  shieldBash,
  totalEclipse,
  prominence,
  holyCircle,
  sheltron,
  holySheltron,
  intervention,
  sentinel,
  cover,
  hallowedGround,
  bulwark,
  divineVeil,
  clemency,
  passageOfArms,
];

export const pldEpics = combineEpics(passageOfArmsStopEpic, autoAttackEpic);
