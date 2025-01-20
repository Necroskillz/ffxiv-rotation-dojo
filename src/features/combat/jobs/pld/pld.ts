import { combineEpics, Epic } from 'redux-observable';
import { filter, switchMap, first, map, delay, interval, startWith, takeWhile, withLatestFrom } from 'rxjs';
import { RootState } from '../../../../app/store';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import { CombatStatus, createCombatStatus } from '../../combat-status';
import {
  buff,
  combo,
  hasBuff,
  hasCombo,
  ogcdLock,
  removeBuff,
  resource,
  removeBuffStack,
  debuff,
  addBuff,
  executeAction,
  setCombat,
  inCombat,
  addOath,
  event,
  removeBuffAction,
  dmgEvent,
  DamageType,
} from '../../combatSlice';

const passageOfArmsStopEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.PassageofArms),
    switchMap(() =>
      action$.pipe(
        first(
          (aa) =>
            (aa.type === executeAction.type && aa.payload.id !== ActionId.PassageofArms) ||
            (aa.type === removeBuffAction.type && aa.payload === StatusId.PassageofArms)
        )
      )
    ),
    map(() => removeBuff(StatusId.PassageofArms))
  );

const autoAttackEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === setCombat.type && a.payload),
    delay(1000),
    switchMap(() =>
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

const divineMightStatus: CombatStatus = createCombatStatus({
  id: StatusId.DivineMight,
  duration: 30,
  isHarmful: false,
});

const atonementReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.AtonementReady,
  duration: 30,
  isHarmful: false,
});

const supplicationReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.SupplicationReady,
  duration: 30,
  isHarmful: false,
});

const sepulchreReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.SepulchreReady,
  duration: 30,
  isHarmful: false,
});

const requiescatStatus: CombatStatus = createCombatStatus({
  id: StatusId.Requiescat,
  duration: 30,
  isHarmful: false,
  initialStacks: 4,
});

const confiteorReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.ConfiteorReady,
  duration: 30,
  isHarmful: false,
});

const circleOfScornStatus: CombatStatus = createCombatStatus({
  id: StatusId.CircleofScorn,
  duration: 15,
  isHarmful: true,
  tick: (dispatch) => dispatch(event(0, { potency: 30 })),
});

const ironWillStatus: CombatStatus = createCombatStatus({
  id: StatusId.IronWill,
  duration: null,
  isHarmful: false,
});

const holySheltronStatus: CombatStatus = createCombatStatus({
  id: StatusId.HolySheltron,
  duration: 8,
  isHarmful: false,
});

const knightsResolveStatus: CombatStatus = createCombatStatus({
  id: StatusId.KnightsResolve,
  duration: 4,
  isHarmful: false,
});

const knightsBenedictionStatus: CombatStatus = createCombatStatus({
  id: StatusId.KnightsBenediction,
  duration: 12,
  isHarmful: false,
});

const guardianStatus: CombatStatus = createCombatStatus({
  id: StatusId.Guardian,
  duration: 15,
  isHarmful: false,
});

const coverStatus: CombatStatus = createCombatStatus({
  id: StatusId.Cover,
  duration: 15,
  isHarmful: false,
});

const hallowedGroundStatus: CombatStatus = createCombatStatus({
  id: StatusId.HallowedGround,
  duration: 10,
  isHarmful: false,
});

const bulwarkStatus: CombatStatus = createCombatStatus({
  id: StatusId.Bulwark,
  duration: 10,
  isHarmful: false,
});

const divineVeilStatus: CombatStatus = createCombatStatus({
  id: StatusId.DivineVeil,
  duration: 30,
  isHarmful: false,
});

const passageOfArmsStatus: CombatStatus = createCombatStatus({
  id: StatusId.PassageofArms,
  duration: 18,
  isHarmful: false,
});

const fightOrFlightStatus: CombatStatus = createCombatStatus({
  id: StatusId.FightorFlight,
  duration: 20,
  isHarmful: false,
});

const bladeOfHonorReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.BladeofHonorReady,
  duration: 30,
  isHarmful: false,
});

const goringBladeReadyStatus: CombatStatus = createCombatStatus({
  id: StatusId.GoringBladeReady,
  duration: 30,
  isHarmful: false,
});

const fastBlade: CombatAction = createCombatAction({
  id: ActionId.FastBlade,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.FastBlade, context, { potency: 220 }));
    dispatch(combo(ActionId.FastBlade));
  },
  reducedBySkillSpeed: true,
});

const riotBlade: CombatAction = createCombatAction({
  id: ActionId.RiotBlade,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.RiotBlade, context, { potency: 170, comboPotency: 330, comboMana: 1000 }));

    if (context.comboed) {
      dispatch(combo(ActionId.RiotBlade));
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
    dispatch(dmgEvent(ActionId.RoyalAuthority, context, { potency: 200, comboPotency: 460 }));

    if (context.comboed) {
      dispatch(buff(StatusId.AtonementReady));
      dispatch(buff(StatusId.DivineMight));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.RoyalAuthority),
  reducedBySkillSpeed: true,
});

const holySpirit: CombatAction = createCombatAction({
  id: ActionId.HolySpirit,
  execute: (dispatch, getState, context) => {
    if (hasBuff(getState(), StatusId.DivineMight)) {
      dispatch(dmgEvent(ActionId.HolySpirit, context, { potency: 500, healthPotency: 400, type: DamageType.Magical }));
    } else if (hasBuff(getState(), StatusId.Requiescat)) {
      dispatch(dmgEvent(ActionId.HolySpirit, context, { potency: 700, healthPotency: 400, type: DamageType.Magical }));
    } else {
      dispatch(dmgEvent(ActionId.HolySpirit, context, { potency: 400, healthPotency: 400, type: DamageType.Magical }));
    }

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
  execute: () => {},
  redirect: (state) => (hasBuff(state, StatusId.BladeofHonorReady) ? ActionId.BladeofHonor : ActionId.Imperator),
});

const imperator: CombatAction = createCombatAction({
  id: ActionId.Imperator,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Requiescat, context, { potency: 580, type: DamageType.Magical }));
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Requiescat));
    dispatch(buff(StatusId.ConfiteorReady));
  },
  redirect: (state) => (hasBuff(state, StatusId.BladeofHonorReady) ? ActionId.BladeofHonor : ActionId.Imperator),
});

const atonement: CombatAction = createCombatAction({
  id: ActionId.Atonement,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Atonement, context, { potency: 460, mana: 400 }));

    dispatch(removeBuff(StatusId.AtonementReady));
    dispatch(buff(StatusId.SupplicationReady));
  },
  isUsable: (state) => hasBuff(state, StatusId.AtonementReady),
  isGlowing: (state) => hasBuff(state, StatusId.AtonementReady),
  reducedBySkillSpeed: true,
  redirect: (state) =>
    hasBuff(state, StatusId.SupplicationReady)
      ? ActionId.Supplication
      : hasBuff(state, StatusId.SepulchreReady)
      ? ActionId.Sepulchre
      : ActionId.Atonement,
});

const supplication: CombatAction = createCombatAction({
  id: ActionId.Supplication,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Supplication, context, { potency: 500, mana: 400 }));

    dispatch(removeBuff(StatusId.SupplicationReady));
    dispatch(buff(StatusId.SepulchreReady));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const sepulchre: CombatAction = createCombatAction({
  id: ActionId.Sepulchre,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Sepulchre, context, { potency: 540, mana: 400 }));

    dispatch(removeBuff(StatusId.SepulchreReady));
  },
  isGlowing: () => true,
  reducedBySkillSpeed: true,
});

const confiteor: CombatAction = createCombatAction({
  id: ActionId.Confiteor,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.Confiteor, context, {
        potency: 500,
        enhancedPotency: 1000,
        isEnhanced: hasBuff(getState(), StatusId.Requiescat),
        healthPotency: 400,
        type: DamageType.Magical,
      })
    );

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
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.BladeofFaith, context, {
        potency: 260,
        enhancedPotency: 760,
        isEnhanced: hasBuff(getState(), StatusId.Requiescat),
        healthPotency: 400,
        type: DamageType.Magical,
      })
    );

    dispatch(combo(ActionId.BladeofFaith));
    dispatch(removeBuffStack(StatusId.Requiescat));
  },
  cost: (_, baseCost) => baseCost / 2,
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const bladeofTruth: CombatAction = createCombatAction({
  id: ActionId.BladeofTruth,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.BladeofTruth, context, {
        potency: 380,
        enhancedPotency: 880,
        isEnhanced: hasBuff(getState(), StatusId.Requiescat),
        healthPotency: 400,
        type: DamageType.Magical,
      })
    );

    dispatch(combo(ActionId.BladeofTruth));
    dispatch(removeBuffStack(StatusId.Requiescat));
  },
  cost: (_, baseCost) => baseCost / 2,
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const bladeOfValor: CombatAction = createCombatAction({
  id: ActionId.BladeofValor,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.BladeofValor, context, {
        potency: 500,
        enhancedPotency: 1000,
        isEnhanced: hasBuff(getState(), StatusId.Requiescat),
        healthPotency: 400,
        type: DamageType.Magical,
      })
    );

    dispatch(removeBuffStack(StatusId.Requiescat));
    dispatch(buff(StatusId.BladeofHonorReady));
  },
  cost: (_, baseCost) => baseCost / 2,
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const bladeOfHonor: CombatAction = createCombatAction({
  id: ActionId.BladeofHonor,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(
      dmgEvent(ActionId.BladeofHonor, context, {
        potency: 1000,
        type: DamageType.Magical,
      })
    );

    dispatch(removeBuff(StatusId.BladeofHonorReady));
  },
  isGlowing: () => true,
});

const fightOrFlight: CombatAction = createCombatAction({
  id: ActionId.FightorFlight,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.FightorFlight));
    dispatch(buff(StatusId.GoringBladeReady));
  },
  entersCombat: false,
  redirect: (state) => (hasBuff(state, StatusId.GoringBladeReady) ? ActionId.GoringBlade : ActionId.FightorFlight),
  actionChangeTo: ActionId.GoringBlade,
});

const spiritsWithin: CombatAction = createCombatAction({
  id: ActionId.SpiritsWithin,
  execute: () => {},
  redirect: () => ActionId.Expiacion,
});

const excipation: CombatAction = createCombatAction({
  id: ActionId.Expiacion,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.Expiacion, context, { potency: 450, mana: 500 }));
  },
});

const goringBlade: CombatAction = createCombatAction({
  id: ActionId.GoringBlade,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.GoringBlade, context, { potency: 700 }));
    dispatch(removeBuff(StatusId.GoringBladeReady));
  },
  isUsable: (state) => hasBuff(state, StatusId.GoringBladeReady),
  isGlowing: (state) => hasBuff(state, StatusId.GoringBladeReady),
});

const intervene: CombatAction = createCombatAction({
  id: ActionId.Intervene,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Intervene, context, { potency: 150 }));
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
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.CircleofScorn, context, { potency: 140 }));
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.CircleofScorn));
  },
});

const ironWill: CombatAction = createCombatAction({
  id: ActionId.IronWill,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.IronWill));
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
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.ShieldLob, context, { potency: 100 }));
  },
  reducedBySkillSpeed: true,
});

const shieldBash: CombatAction = createCombatAction({
  id: ActionId.ShieldBash,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.ShieldBash, context, { potency: 100 }));
    dispatch(debuff(StatusId.Stun, { duration: 6 }));
  },
  reducedBySkillSpeed: true,
});

const totalEclipse: CombatAction = createCombatAction({
  id: ActionId.TotalEclipse,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.TotalEclipse, context, { potency: 100 }));
    dispatch(combo(ActionId.TotalEclipse));
  },
  reducedBySkillSpeed: true,
});

const prominence: CombatAction = createCombatAction({
  id: ActionId.Prominence,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Prominence, context, { potency: 100, comboPotency: 170, comboMana: 1000 }));

    if (context.comboed) {
      dispatch(buff(StatusId.DivineMight));
    }
  },
  isGlowing: (state) => hasCombo(state, ActionId.Prominence),
  reducedBySkillSpeed: true,
});

const holyCircle: CombatAction = createCombatAction({
  id: ActionId.HolyCircle,
  execute: (dispatch, getState, context) => {
    if (hasBuff(getState(), StatusId.DivineMight)) {
      dispatch(dmgEvent(ActionId.HolyCircle, context, { potency: 200, healthPotency: 400, type: DamageType.Magical }));
    } else if (hasBuff(getState(), StatusId.Requiescat)) {
      dispatch(dmgEvent(ActionId.HolyCircle, context, { potency: 300, healthPotency: 400, type: DamageType.Magical }));
    } else {
      dispatch(dmgEvent(ActionId.HolyCircle, context, { potency: 100, healthPotency: 400, type: DamageType.Magical }));
    }

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
    dispatch(buff(StatusId.HolySheltron));
    dispatch(buff(StatusId.KnightsResolve));
    dispatch(buff(StatusId.KnightsBenediction));
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
  execute: () => {},
  redirect: () => ActionId.Guardian,
});

const guardian: CombatAction = createCombatAction({
  id: ActionId.Guardian,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Guardian));
  },
  entersCombat: false,
});

const cover: CombatAction = createCombatAction({
  id: ActionId.Cover,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Cover));
  },
  isGlowing: (state) => oath(state) >= 50,
  entersCombat: false,
});

const hallowedGround: CombatAction = createCombatAction({
  id: ActionId.HallowedGround,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.HallowedGround));
  },
  entersCombat: false,
});

const bulwark: CombatAction = createCombatAction({
  id: ActionId.Bulwark,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Bulwark));
  },
  entersCombat: false,
});

const divineVeil: CombatAction = createCombatAction({
  id: ActionId.DivineVeil,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(event(ActionId.DivineVeil, { healthPotency: 400 }));
    dispatch(buff(StatusId.DivineVeil));
  },
  entersCombat: false,
});

const clemency: CombatAction = createCombatAction({
  id: ActionId.Clemency,
  execute: (dispatch) => {
    dispatch(event(ActionId.Clemency, { healthPotency: 1000 }));
  },
  cost: (_, baseCost) => baseCost / 2,
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const passageOfArms: CombatAction = createCombatAction({
  id: ActionId.PassageofArms,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.PassageofArms));
  },
  entersCombat: false,
});

export const pldStatuses: CombatStatus[] = [
  divineMightStatus,
  requiescatStatus,
  holySheltronStatus,
  knightsResolveStatus,
  knightsBenedictionStatus,
  guardianStatus,
  coverStatus,
  hallowedGroundStatus,
  bulwarkStatus,
  divineVeilStatus,
  passageOfArmsStatus,
  ironWillStatus,
  fightOrFlightStatus,
  atonementReadyStatus,
  confiteorReadyStatus,
  circleOfScornStatus,
  goringBladeReadyStatus,
  bladeOfHonorReadyStatus,
  guardianStatus,
  supplicationReadyStatus,
  sepulchreReadyStatus,
];

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
  supplication,
  sepulchre,
  guardian,
  imperator,
  bladeOfHonor,
];

export const pldEpics = combineEpics(passageOfArmsStopEpic, autoAttackEpic);
