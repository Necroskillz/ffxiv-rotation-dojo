import { combineEpics, Epic } from 'redux-observable';
import { filter, switchMap, withLatestFrom, takeWhile, map, delay, of } from 'rxjs';
import { RootState } from '../../../../app/store';
import { getActionById } from '../../../actions/actions';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { selectBlueMagicSpellSet } from '../../../player/playerSlice';
import { CombatAction, createCombatAction } from '../../combat-action';
import { CombatStatus, createCombatStatus, StatusTarget } from '../../combat-status';
import {
  addBuff,
  addBuffStack,
  addEvent,
  buff,
  buffStacks,
  DamageType,
  debuff,
  dmgEvent,
  DmgEventOptions,
  event,
  executeAction,
  hasBuff,
  hasDebuff,
  hp,
  inCombat,
  ogcdLock,
  recastTime,
  removeBuff,
  removeBuffAction,
  removeDebuff,
  resource,
  setCast,
  setHp,
} from '../../combatSlice';
import { rng } from '../../utils';

function mimicry(state: RootState): StatusId {
  return resource(state, 'mimicry');
}

function gcd(state: RootState) {
  return {
    cooldownGroup: 58,
    duration: recastTime(state, 2500, 'Spell') / 1000,
  };
}

const consumeBoostEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Boost),
    switchMap(() =>
      action$.pipe(
        filter((aa) => aa.type === addEvent.type && getActionById(aa.payload.actionId)?.type === 'Spell' && aa.payload.potency > 0),
        withLatestFrom(state$),
        takeWhile(([, state]) => hasBuff(state, StatusId.Boost))
      )
    ),
    map(() => removeBuff(StatusId.Boost))
  );

const consumeHarmonizedEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Harmonized),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === addEvent.type &&
            getActionById(aa.payload.actionId)?.type === 'Spell' &&
            aa.payload.type === DamageType.Physical &&
            aa.payload.potency > 0
        ),
        withLatestFrom(state$),
        takeWhile(([, state]) => hasBuff(state, StatusId.Harmonized))
      )
    ),
    map(() => removeBuff(StatusId.Harmonized))
  );

const consumeTinglingEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Tingling),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === addEvent.type &&
            getActionById(aa.payload.actionId)?.type === 'Spell' &&
            aa.payload.type === DamageType.Physical &&
            aa.payload.potency > 0
        ),
        withLatestFrom(state$),
        takeWhile(([, state]) => hasBuff(state, StatusId.Tingling))
      )
    ),
    map(() => removeBuff(StatusId.Tingling))
  );

const removeSurpanakhasFuryEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.SurpanakhasFury),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === executeAction.type && getActionById(aa.payload.id).type !== 'Movement' && aa.payload.id !== ActionId.Surpanakha
        ),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.SurpanakhasFury))
      )
    ),
    map(() => removeBuff(StatusId.SurpanakhasFury))
  );

const removeChelonianGateEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.ChelonianGate),
    switchMap(() =>
      action$.pipe(
        filter((aa) => aa.type === executeAction.type && aa.payload.id !== ActionId.ChelonianGate),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.ChelonianGate))
      )
    ),
    map(() => removeBuff(StatusId.ChelonianGate))
  );

const removeAuspiciousTranceEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.AuspiciousTrance),
    switchMap(() =>
      action$.pipe(
        filter((aa) => aa.type === removeBuffAction.type && aa.payload === StatusId.ChelonianGate),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.AuspiciousTrance))
      )
    ),
    map(() => removeBuff(StatusId.AuspiciousTrance))
  );

const removePhantomFlurryEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.PhantomFlurry),
    switchMap(() =>
      action$.pipe(
        filter((aa) => aa.type === executeAction.type && aa.payload.id !== ActionId.PhantomFlurry),
        withLatestFrom(state$),
        map(([, state]) => state),
        takeWhile((state) => hasBuff(state, StatusId.PhantomFlurry))
      )
    ),
    map(() => removeBuff(StatusId.PhantomFlurry))
  );

const tripleTridentEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((aa) => aa.type === addEvent.type && aa.payload.actionId === ActionId.TripleTrident && aa.payload.count !== 2),
    delay(300),
    map((a) =>
      addEvent({
        ...a.payload,
        count: (a.payload.count ?? 0) + 1,
      })
    )
  );

const matraMagicEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((aa) => aa.type === addEvent.type && aa.payload.actionId === ActionId.MatraMagic && aa.payload.count !== 8),
    delay(100),
    map((a) =>
      addEvent({
        ...a.payload,
        count: (a.payload.count ?? 0) + 1,
      })
    )
  );

const popColdFogpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.ColdFog),
    delay(3000),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => inCombat(state)),
    switchMap(() => of(removeBuff(StatusId.ColdFog), buff(StatusId.TouchofFrost)))
  );

const popChelonianGatepic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.ChelonianGate),
    delay(5000),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => inCombat(state) && hasBuff(state, StatusId.ChelonianGate)),
    switchMap(() => of(buff(StatusId.AuspiciousTrance)))
  );

const removeApokalypsisEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => (a.type === executeAction.type && a.payload.id !== ActionId.Apokalypsis) || a.type === setCast.type),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => hasBuff(state, StatusId.Apokalypsis)),
    map(() => removeBuff(StatusId.Apokalypsis))
  );

const dropsyStatus: CombatStatus = createCombatStatus({
  id: StatusId.Dropsy,
  duration: 20,
  isHarmful: true,
  tick: (dispatch) => dispatch(event(0, { potency: 20 })),
});

const paralysisStatus: CombatStatus = createCombatStatus({
  id: StatusId.Paralysis,
  duration: 15,
  isHarmful: true,
});

const brushWithDeathStatus: CombatStatus = createCombatStatus({
  id: StatusId.BrushwithDeath,
  duration: 600,
  isHarmful: true,
  target: StatusTarget.Player,
});

const bleedingStatus: CombatStatus = createCombatStatus({
  id: StatusId.Bleeding,
  duration: 30,
  isHarmful: true,
  tick: (dispatch) => dispatch(event(0, { potency: 50 })),
});

const boostStatus: CombatStatus = createCombatStatus({
  id: StatusId.Boost,
  duration: 30,
  isHarmful: false,
});

const petrificationStatus: CombatStatus = createCombatStatus({
  id: StatusId.Petrification,
  duration: 20,
  isHarmful: true,
});

const iceSpikesStatus: CombatStatus = createCombatStatus({
  id: StatusId.IceSpikes,
  duration: 15,
  isHarmful: false,
});

const offGuardStatus: CombatStatus = createCombatStatus({
  id: StatusId.Offguard,
  duration: 15,
  isHarmful: true,
});

const slowStatus: CombatStatus = createCombatStatus({
  id: StatusId.Slow,
  duration: 15,
  isHarmful: true,
});

const blindStatus: CombatStatus = createCombatStatus({
  id: StatusId.Blind,
  duration: 15,
  isHarmful: true,
});

const malodorousStatus: CombatStatus = createCombatStatus({
  id: StatusId.Malodorous,
  duration: 15,
  isHarmful: true,
});

const poisonStatus: CombatStatus = createCombatStatus({
  id: StatusId.Poison,
  duration: 15,
  isHarmful: true,
  tick: (dispatch) => dispatch(event(0, { potency: 20 })),
});

const diamondbackStatus: CombatStatus = createCombatStatus({
  id: StatusId.Diamondback,
  duration: 10,
  isHarmful: false,
});

const mightyGuardStatus: CombatStatus = createCombatStatus({
  id: StatusId.MightyGuard,
  duration: null,
  isHarmful: false,
});

const toadOilStatus: CombatStatus = createCombatStatus({
  id: StatusId.ToadOil,
  duration: 180,
  isHarmful: false,
});

const deepFreezeStatus: CombatStatus = createCombatStatus({
  id: StatusId.DeepFreeze,
  duration: 12,
  isHarmful: true,
});

const waxingNocturneStatus: CombatStatus = createCombatStatus({
  id: StatusId.WaxingNocturne,
  duration: 15,
  isHarmful: false,
  onExpire: (dispatch) => dispatch(debuff(StatusId.WaningNocturne)),
});

const waningNocturneStatus: CombatStatus = createCombatStatus({
  id: StatusId.WaningNocturne,
  duration: 15,
  isHarmful: true,
  target: StatusTarget.Player,
});

const doomStatus: CombatStatus = createCombatStatus({
  id: StatusId.Doom,
  duration: 15,
  isHarmful: true,
});

const peculiarLightStatus: CombatStatus = createCombatStatus({
  id: StatusId.PeculiarLight,
  duration: 15,
  isHarmful: true,
});

const windburnStatus: CombatStatus = createCombatStatus({
  id: StatusId.Windburn,
  duration: 6,
  isHarmful: true,
  tick: (dispatch) => dispatch(event(0, { potency: 40 })),
});

const veilOfTheWhorlStatus: CombatStatus = createCombatStatus({
  id: StatusId.VeiloftheWhorl,
  duration: 30,
  isHarmful: false,
});

const gobskinStatus: CombatStatus = createCombatStatus({
  id: StatusId.Gobskin,
  duration: 30,
  isHarmful: false,
});

const conkedStatus: CombatStatus = createCombatStatus({
  id: StatusId.Conked,
  duration: 10,
  isHarmful: true,
});

const harmonizedStatus: CombatStatus = createCombatStatus({
  id: StatusId.Harmonized,
  duration: 30,
  isHarmful: false,
});

const hpBoostStatus: CombatStatus = createCombatStatus({
  id: StatusId.HPBoost,
  duration: 15,
  isHarmful: false,
});

const umbralAttenuationStatus: CombatStatus = createCombatStatus({
  id: StatusId.UmbralAttenuation,
  duration: 30,
  isHarmful: true,
});

const astralAttenuationStatus: CombatStatus = createCombatStatus({
  id: StatusId.AstralAttenuation,
  duration: 30,
  isHarmful: true,
});

const physicalAttenuationStatus: CombatStatus = createCombatStatus({
  id: StatusId.PhysicalAttenuation,
  duration: 30,
  isHarmful: true,
});

const aethericMimicryDPSStatus: CombatStatus = createCombatStatus({
  id: StatusId.AethericMimicryDPS,
  duration: null,
  isHarmful: false,
});

const aethericMimicryTankStatus: CombatStatus = createCombatStatus({
  id: StatusId.AethericMimicryTank,
  duration: null,
  isHarmful: false,
});

const aethericMimicryHealerStatus: CombatStatus = createCombatStatus({
  id: StatusId.AethericMimicryHealer,
  duration: null,
  isHarmful: false,
});

const surpanakhasFuryStatus: CombatStatus = createCombatStatus({
  id: StatusId.SurpanakhasFury,
  duration: 3,
  isHarmful: false,
  maxStacks: 3,
});

const tinglingStatus: CombatStatus = createCombatStatus({
  id: StatusId.Tingling,
  duration: 15,
  isHarmful: false,
});

const coldFogStatus: CombatStatus = createCombatStatus({
  id: StatusId.ColdFog,
  duration: 5,
  isHarmful: false,
});

const touchOfFrostStatus: CombatStatus = createCombatStatus({
  id: StatusId.TouchofFrost,
  duration: 15,
  isHarmful: false,
});

const angelsSnackStatus: CombatStatus = createCombatStatus({
  id: StatusId.AngelsSnack,
  duration: 15,
  isHarmful: false,
  tick: (dispatch) => dispatch(event(0, { healthPotency: 200 })),
});

const chelonianGateStatus: CombatStatus = createCombatStatus({
  id: StatusId.ChelonianGate,
  duration: 10,
  isHarmful: false,
});

const auspiciousTranceStatus: CombatStatus = createCombatStatus({
  id: StatusId.AuspiciousTrance,
  duration: 10,
  isHarmful: false,
});

const basicInstinctStatus: CombatStatus = createCombatStatus({
  id: StatusId.BasicInstinct,
  duration: null,
  isHarmful: false,
});

const incendiaryBurnsStatus: CombatStatus = createCombatStatus({
  id: StatusId.IncendiaryBurns,
  duration: 15,
  isHarmful: true,
  tick: (dispatch) => dispatch(event(0, { potency: 50 })),
});

const dragonForceStatus: CombatStatus = createCombatStatus({
  id: StatusId.DragonForce,
  duration: 15,
  isHarmful: false,
});

const lightheadedStatus: CombatStatus = createCombatStatus({
  id: StatusId.Lightheaded,
  duration: 5,
  isHarmful: true,
});

const phantomFlurryStatus: CombatStatus = createCombatStatus({
  id: StatusId.PhantomFlurry,
  duration: 5,
  isHarmful: false,
  tick: (dispatch) => dispatch(event(0, { potency: 200 })),
  ticksImmediately: true,
  initialDelay: 900,
  interval: 1000,
});

const schiltronStatus: CombatStatus = createCombatStatus({
  id: StatusId.Schiltron,
  duration: 15,
  isHarmful: false,
});

const breathOfMagicStatus: CombatStatus = createCombatStatus({
  id: StatusId.BreathofMagic,
  duration: 60,
  isHarmful: true,
  tick: (dispatch) => dispatch(event(0, { potency: 120 })),
});

const begrimedStatus: CombatStatus = createCombatStatus({
  id: StatusId.Begrimed,
  duration: 9,
  isHarmful: true,
  tick: (dispatch) => dispatch(event(0, { potency: 10 })),
});

const spickAndSpanStatus: CombatStatus = createCombatStatus({
  id: StatusId.Spickandspan,
  duration: 15,
  maxStacks: 6,
  isHarmful: false,
  tick: (dispatch, getState) => dispatch(event(0, { healthPotency: 50 * buffStacks(getState(), StatusId.Spickandspan) })),
});

const magicVulnerabilityDownStatus: CombatStatus = createCombatStatus({
  id: StatusId.MagicVulnerabilityDown,
  duration: 10,
  isHarmful: false,
});

const physicalVulnerabilityDownStatus: CombatStatus = createCombatStatus({
  id: StatusId.PhysicalVulnerabilityDown,
  duration: 10,
  isHarmful: false,
});

const wingedReprobationStatus: CombatStatus = createCombatStatus({
  id: StatusId.WingedReprobation,
  duration: null,
  maxStacks: 3,
  isHarmful: false,
});

const wingedRedemptionStatus: CombatStatus = createCombatStatus({
  id: StatusId.WingedRedemption,
  duration: 10,
  isHarmful: false,
});

const candyCaneStatus: CombatStatus = createCombatStatus({
  id: StatusId.CandyCane,
  duration: 10,
  isHarmful: true,
});

const mortalFlameStatus: CombatStatus = createCombatStatus({
  id: StatusId.MortalFlame,
  duration: null,
  isHarmful: true,
  tick: (dispatch) => dispatch(event(0, { potency: 40 })),
});

const apokalypsisStatus: CombatStatus = createCombatStatus({
  id: StatusId.Apokalypsis,
  duration: 10,
  isHarmful: false,
  tick: (dispatch) => dispatch(event(0, { potency: 140 })),
  ticksImmediately: true,
  initialDelay: 900,
  interval: 1000,
});

function physicalPotency(state: RootState, options: DmgEventOptions) {
  if (hasBuff(state, StatusId.Harmonized)) {
    options.potency = Math.floor(options.potency! * 1.8);

    if (options.enhancedPotency) {
      options.enhancedPotency = Math.floor(options.enhancedPotency * 1.8);
    }
  } else if (hasBuff(state, StatusId.Boost)) {
    options.potency = Math.floor(options.potency! * 1.5);

    if (options.enhancedPotency) {
      options.enhancedPotency = Math.floor(options.enhancedPotency * 1.5);
    }
  }

  options.type = DamageType.Physical;

  return options;
}

function magicalPotency(state: RootState, options: DmgEventOptions) {
  if (hasBuff(state, StatusId.Boost)) {
    options.potency = Math.floor(options.potency! * 1.5);

    if (options.enhancedPotency) {
      options.enhancedPotency = Math.floor(options.enhancedPotency * 1.5);
    }
  }

  options.type = DamageType.Magical;

  return options;
}

function isUsable(actionId: ActionId, fn: (state: RootState) => boolean = () => true) {
  return (state: RootState): boolean => {
    const spellSet = selectBlueMagicSpellSet(state);

    if (!spellSet.spells.includes(actionId)) {
      return false;
    }

    if (hasBuff(state, StatusId.Diamondback) || hasDebuff(state, StatusId.WaningNocturne)) {
      return false;
    }

    return fn(state);
  };
}

const waterCannon: CombatAction = createCombatAction({
  id: ActionId.WaterCannon,
  bluNo: 1,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.WaterCannon, context, magicalPotency(getState(), { potency: 200 })));
  },
  isUsable: isUsable(ActionId.WaterCannon),
  reducedBySpellSpeed: true,
});

const flamethrower: CombatAction = createCombatAction({
  id: ActionId.FlameThrower,
  bluNo: 2,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.FlameThrower, context, magicalPotency(getState(), { potency: 220 })));
  },
  isUsable: isUsable(ActionId.FlameThrower),
  reducedBySpellSpeed: true,
});

const aquaBreath: CombatAction = createCombatAction({
  id: ActionId.AquaBreath,
  bluNo: 3,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.AquaBreath, context, magicalPotency(getState(), { potency: 140 })));
    dispatch(debuff(StatusId.Dropsy));
  },
  isUsable: isUsable(ActionId.AquaBreath),
  reducedBySpellSpeed: true,
});

const flyingFrenzy: CombatAction = createCombatAction({
  id: ActionId.FlyingFrenzy,
  bluNo: 4,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.FlyingFrenzy, context, physicalPotency(getState(), { potency: 150 })));
  },
  isUsable: isUsable(ActionId.FlyingFrenzy),
  reducedBySpellSpeed: true,
});

const drillCannons: CombatAction = createCombatAction({
  id: ActionId.DrillCannons,
  bluNo: 5,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(
        ActionId.DrillCannons,
        context,
        physicalPotency(getState(), {
          potency: 200,
          enhancedPotency: 600,
          isEnhanced: hasDebuff(getState(), StatusId.Petrification),
          type: DamageType.Physical,
        })
      )
    );

    dispatch(removeDebuff(StatusId.Petrification));
  },
  isUsable: isUsable(ActionId.DrillCannons),
  reducedBySpellSpeed: true,
});

const highVoltage: CombatAction = createCombatAction({
  id: ActionId.HighVoltage,
  bluNo: 6,
  execute: (dispatch, getState, context) => {
    const hasDropsy = hasDebuff(getState(), StatusId.Dropsy);
    dispatch(
      dmgEvent(ActionId.HighVoltage, context, magicalPotency(getState(), { potency: 180, enhancedPotency: 220, isEnhanced: hasDropsy }))
    );
    dispatch(debuff(StatusId.Paralysis, { duration: hasDropsy ? 30 : 15 }));
  },
  isUsable: isUsable(ActionId.HighVoltage),
  reducedBySpellSpeed: true,
});

const loom: CombatAction = createCombatAction({
  id: ActionId.Loom,
  bluNo: 7,
  execute: () => {},
  isUsable: isUsable(ActionId.Loom),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const finalSting: CombatAction = createCombatAction({
  id: ActionId.FinalSting,
  bluNo: 8,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.FinalSting, context, physicalPotency(getState(), { potency: 2000 })));
    dispatch(debuff(StatusId.BrushwithDeath));
    dispatch(setHp(0));
  },
  isUsable: isUsable(ActionId.FinalSting, (state) => !hasDebuff(state, StatusId.BrushwithDeath)),
  reducedBySpellSpeed: true,
});

const songOfTorment: CombatAction = createCombatAction({
  id: ActionId.SongofTorment,
  bluNo: 9,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.SongofTorment, context, magicalPotency(getState(), { potency: 50 })));
    dispatch(debuff(StatusId.Bleeding, { duration: 30 }));
  },
  isUsable: isUsable(ActionId.SongofTorment),
  reducedBySpellSpeed: true,
});

const glower: CombatAction = createCombatAction({
  id: ActionId.Glower,
  bluNo: 10,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Glower, context, magicalPotency(getState(), { potency: 220 })));
    dispatch(debuff(StatusId.Paralysis, { duration: 6 }));
  },
  isUsable: isUsable(ActionId.Glower),
  reducedBySpellSpeed: true,
});

const plaincracker: CombatAction = createCombatAction({
  id: ActionId.Plaincracker,
  bluNo: 11,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Plaincracker, context, magicalPotency(getState(), { potency: 220 })));
  },
  isUsable: isUsable(ActionId.Plaincracker),
  reducedBySpellSpeed: true,
});

const bristle: CombatAction = createCombatAction({
  id: ActionId.Bristle,
  bluNo: 12,
  execute: (dispatch) => {
    dispatch(buff(StatusId.Boost));
    dispatch(removeBuff(StatusId.Harmonized));
  },
  isUsable: isUsable(ActionId.Bristle),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const whiteWind: CombatAction = createCombatAction({
  id: ActionId.WhiteWind,
  bluNo: 13,
  execute: (dispatch, getState) => {
    dispatch(event(ActionId.WhiteWind, { health: resource(getState(), 'hp') }));
  },
  isUsable: isUsable(ActionId.WhiteWind),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const level5Petrify: CombatAction = createCombatAction({
  id: ActionId.Level5Petrify,
  bluNo: 14,
  execute: (dispatch) => {
    dispatch(debuff(StatusId.Petrification));
  },
  isUsable: isUsable(ActionId.Level5Petrify),
  reducedBySpellSpeed: true,
});

const sharpenedKnife: CombatAction = createCombatAction({
  id: ActionId.SharpenedKnife,
  bluNo: 15,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(
        ActionId.SharpenedKnife,
        context,
        physicalPotency(getState(), { potency: 220, enhancedPotency: 450, isEnhanced: hasDebuff(getState(), StatusId.Stun) })
      )
    );
  },
  isUsable: isUsable(ActionId.SharpenedKnife),
  reducedBySpellSpeed: true,
});

const iceSpikes: CombatAction = createCombatAction({
  id: ActionId.IceSpikes,
  bluNo: 16,
  execute: (dispatch) => {
    dispatch(buff(StatusId.IceSpikes));
    dispatch(removeBuff(StatusId.Schiltron));
    dispatch(removeBuff(StatusId.VeiloftheWhorl));
  },
  isUsable: isUsable(ActionId.IceSpikes),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const bloodDrain: CombatAction = createCombatAction({
  id: ActionId.BloodDrain,
  bluNo: 17,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.BloodDrain, context, magicalPotency(getState(), { potency: 50, mana: 500 })));
  },
  isUsable: isUsable(ActionId.BloodDrain),
  reducedBySpellSpeed: true,
});

const acornBomb: CombatAction = createCombatAction({
  id: ActionId.AcornBomb,
  bluNo: 18,
  execute: (dispatch) => {
    dispatch(debuff(StatusId.Sleep, { duration: 30 }));
  },
  isUsable: isUsable(ActionId.AcornBomb),
  reducedBySpellSpeed: true,
});

const bombToss: CombatAction = createCombatAction({
  id: ActionId.BombToss,
  bluNo: 19,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.BombToss, context, magicalPotency(getState(), { potency: 220 })));
    dispatch(debuff(StatusId.Stun, { duration: 3 }));
  },
  isUsable: isUsable(ActionId.BombToss),
  reducedBySpellSpeed: true,
});

const offGuard: CombatAction = createCombatAction({
  id: ActionId.Offguard,
  bluNo: 20,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(debuff(StatusId.Offguard));
  },
  isUsable: isUsable(ActionId.Offguard),
  reducedBySpellSpeed: true,
  isGcdAction: false,
});

const selfDestruct: CombatAction = createCombatAction({
  id: ActionId.Selfdestruct,
  bluNo: 21,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(
        ActionId.Selfdestruct,
        context,
        magicalPotency(getState(), { potency: 1500, enhancedPotency: 1800, isEnhanced: hasBuff(getState(), StatusId.ToadOil) })
      )
    );
    dispatch(debuff(StatusId.BrushwithDeath));
    dispatch(setHp(0));
  },
  isUsable: isUsable(ActionId.Selfdestruct),
  reducedBySpellSpeed: true,
});

const transfusion: CombatAction = createCombatAction({
  id: ActionId.Transfusion,
  bluNo: 22,
  execute: (dispatch) => {
    dispatch(debuff(StatusId.BrushwithDeath));
    dispatch(setHp(0));
  },
  isUsable: isUsable(ActionId.Transfusion),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const faze: CombatAction = createCombatAction({
  id: ActionId.Faze,
  bluNo: 23,
  execute: (dispatch) => {
    dispatch(debuff(StatusId.Stun, { duration: 6 }));
  },
  isUsable: isUsable(ActionId.Faze),
  reducedBySpellSpeed: true,
});

const flyingSardine: CombatAction = createCombatAction({
  id: ActionId.FlyingSardine,
  bluNo: 24,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.FlyingSardine, context, physicalPotency(getState(), { potency: 10 })));
  },
  isUsable: isUsable(ActionId.FlyingSardine),
  reducedBySpellSpeed: true,
});

const snort: CombatAction = createCombatAction({
  id: ActionId.Snort,
  bluNo: 25,
  execute: () => {},
  isUsable: isUsable(ActionId.Snort),
  reducedBySpellSpeed: true,
});

const fourTonzeWeight: CombatAction = createCombatAction({
  id: ActionId.FourTonzeWeight,
  bluNo: 26,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.FourTonzeWeight, context, physicalPotency(getState(), { potency: 200 })));
    dispatch(debuff(StatusId.Heavy, { duration: 30 }));
  },
  isUsable: isUsable(ActionId.FourTonzeWeight),
  reducedBySpellSpeed: true,
});

const theLook: CombatAction = createCombatAction({
  id: ActionId.TheLook,
  bluNo: 27,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.TheLook, context, magicalPotency(getState(), { potency: 220 })));
  },
  isUsable: isUsable(ActionId.TheLook),
  reducedBySpellSpeed: true,
});

const badBreath: CombatAction = createCombatAction({
  id: ActionId.BadBreath,
  bluNo: 28,
  execute: (dispatch) => {
    dispatch(debuff(StatusId.Slow));
    dispatch(debuff(StatusId.Heavy, { duration: 15 }));
    dispatch(debuff(StatusId.Blind));
    dispatch(debuff(StatusId.Paralysis));
    dispatch(debuff(StatusId.Poison));
    dispatch(debuff(StatusId.Malodorous));
  },
  isUsable: isUsable(ActionId.BadBreath),
  reducedBySpellSpeed: true,
});

const diamondback: CombatAction = createCombatAction({
  id: ActionId.Diamondback,
  bluNo: 29,
  execute: (dispatch, getState) => {
    dispatch(buff(StatusId.Diamondback));

    if (hasBuff(getState(), StatusId.WaxingNocturne)) {
      dispatch(removeBuff(StatusId.WaxingNocturne));
      dispatch(debuff(StatusId.WaningNocturne));
    }
  },
  isUsable: isUsable(ActionId.Diamondback),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const mightyGuard: CombatAction = createCombatAction({
  id: ActionId.MightyGuard,
  bluNo: 30,
  execute: (dispatch, getState) => {
    if (hasBuff(getState(), StatusId.MightyGuard)) {
      dispatch(removeBuff(StatusId.MightyGuard));
    } else {
      dispatch(buff(StatusId.MightyGuard));
    }
  },
  isUsable: isUsable(ActionId.MightyGuard),
  reducedBySpellSpeed: true,
  castTime: (state, baseCastTime) => (hasBuff(state, StatusId.MightyGuard) ? 0 : baseCastTime),
  cooldown: (state) => (hasBuff(state, StatusId.MightyGuard) ? 0 : 2.5),
  entersCombat: false,
});

const stickyTongue: CombatAction = createCombatAction({
  id: ActionId.StickyTongue,
  bluNo: 31,
  execute: (dispatch) => {
    dispatch(debuff(StatusId.Stun, { duration: 4 }));
  },
  isUsable: isUsable(ActionId.StickyTongue),
  reducedBySpellSpeed: true,
});

const toadOil: CombatAction = createCombatAction({
  id: ActionId.ToadOil,
  bluNo: 32,
  execute: (dispatch) => {
    dispatch(buff(StatusId.ToadOil));
  },
  isUsable: isUsable(ActionId.ToadOil),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const theRamsVoice: CombatAction = createCombatAction({
  id: ActionId.TheRamsVoice,
  bluNo: 33,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.TheRamsVoice, context, magicalPotency(getState(), { potency: 220 })));
    dispatch(debuff(StatusId.DeepFreeze));
  },
  isUsable: isUsable(ActionId.TheRamsVoice),
  reducedBySpellSpeed: true,
});

const theDragonsVoice: CombatAction = createCombatAction({
  id: ActionId.TheDragonsVoice,
  bluNo: 34,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(
        ActionId.TheDragonsVoice,
        context,
        magicalPotency(getState(), { potency: 200, enhancedPotency: 400, isEnhanced: hasDebuff(getState(), StatusId.DeepFreeze) })
      )
    );
    dispatch(debuff(StatusId.Paralysis, { duration: 9 }));
    dispatch(removeDebuff(StatusId.DeepFreeze));
  },
  isUsable: isUsable(ActionId.TheDragonsVoice),
  reducedBySpellSpeed: true,
});

const missile: CombatAction = createCombatAction({
  id: ActionId.Missile,
  bluNo: 35,
  execute: (dispatch) => {
    dispatch(event(ActionId.Missile, { damagePercent: 50, type: DamageType.Darkness }));
  },
  isUsable: isUsable(ActionId.Missile),
  reducedBySpellSpeed: true,
});

const thousandNeedles: CombatAction = createCombatAction({
  id: ActionId.ThousandNeedles,
  bluNo: 36,
  execute: (dispatch) => {
    dispatch(event(ActionId.ThousandNeedles, { damage: 1000, type: DamageType.Darkness }));
  },
  isUsable: isUsable(ActionId.ThousandNeedles),
  reducedBySpellSpeed: true,
});

const inkJet: CombatAction = createCombatAction({
  id: ActionId.InkJet,
  bluNo: 37,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.InkJet, context, magicalPotency(getState(), { potency: 200 })));
    dispatch(debuff(StatusId.Blind, { duration: 30 }));
  },
  isUsable: isUsable(ActionId.InkJet),
  reducedBySpellSpeed: true,
});

const fireAngon: CombatAction = createCombatAction({
  id: ActionId.FireAngon,
  bluNo: 38,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.FireAngon, context, physicalPotency(getState(), { potency: 200 })));
  },
  isUsable: isUsable(ActionId.FireAngon),
  reducedBySpellSpeed: true,
});

const moonFlute: CombatAction = createCombatAction({
  id: ActionId.MoonFlute,
  bluNo: 39,
  execute: (dispatch) => {
    dispatch(buff(StatusId.WaxingNocturne));
  },
  isUsable: isUsable(ActionId.MoonFlute),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const tailScrew: CombatAction = createCombatAction({
  id: ActionId.TailScrew,
  bluNo: 40,
  execute: () => {},
  isUsable: isUsable(ActionId.TailScrew),
  reducedBySpellSpeed: true,
});

const mindBlast: CombatAction = createCombatAction({
  id: ActionId.MindBlast,
  bluNo: 41,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.MindBlast, context, magicalPotency(getState(), { potency: 200 })));
    dispatch(debuff(StatusId.Paralysis, { duration: 30 }));
  },
  isUsable: isUsable(ActionId.MindBlast),
  reducedBySpellSpeed: true,
});

const doom: CombatAction = createCombatAction({
  id: ActionId.Doom,
  bluNo: 42,
  execute: (dispatch) => {
    dispatch(debuff(StatusId.Doom));
  },
  isUsable: isUsable(ActionId.Doom),
  reducedBySpellSpeed: true,
});

const peculiarLight: CombatAction = createCombatAction({
  id: ActionId.PeculiarLight,
  bluNo: 43,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.PeculiarLight));
  },
  isUsable: isUsable(ActionId.PeculiarLight),
  reducedBySpellSpeed: true,
  isGcdAction: false,
});

const featherRain: CombatAction = createCombatAction({
  id: ActionId.FeatherRain,
  bluNo: 44,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.FeatherRain, context, { potency: 220 }));
    dispatch(debuff(StatusId.Windburn));
  },
  isUsable: isUsable(ActionId.FeatherRain),
});

const eruption: CombatAction = createCombatAction({
  id: ActionId.Eruption,
  bluNo: 45,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.Eruption, context, { potency: 300 }));
  },
  isUsable: isUsable(ActionId.Eruption),
});

const mountainBuster: CombatAction = createCombatAction({
  id: ActionId.MountainBusterBlu,
  bluNo: 46,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.MountainBusterBlu, context, { potency: 400 }));
  },
  isUsable: isUsable(ActionId.MountainBusterBlu),
});

const shockStrike: CombatAction = createCombatAction({
  id: ActionId.ShockStrike,
  bluNo: 47,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.ShockStrike, context, { potency: 400 }));
  },
  isUsable: isUsable(ActionId.ShockStrike),
});

const glassDance: CombatAction = createCombatAction({
  id: ActionId.GlassDance,
  bluNo: 48,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.GlassDance, context, { potency: 350 }));
  },
  isUsable: isUsable(ActionId.GlassDance),
});

const veilOfTheWhorl: CombatAction = createCombatAction({
  id: ActionId.VeiloftheWhorl,
  bluNo: 49,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.VeiloftheWhorl));
    dispatch(removeBuff(StatusId.Schiltron));
    dispatch(removeBuff(StatusId.IceSpikes));
  },
  isUsable: isUsable(ActionId.VeiloftheWhorl),
  entersCombat: false,
});

const alpineDraft: CombatAction = createCombatAction({
  id: ActionId.AlpineDraft,
  bluNo: 50,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.AlpineDraft, context, magicalPotency(getState(), { potency: 220 })));
  },
  isUsable: isUsable(ActionId.AlpineDraft),
  reducedBySpellSpeed: true,
});

const proteanWave: CombatAction = createCombatAction({
  id: ActionId.ProteanWave,
  bluNo: 51,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.ProteanWave, context, magicalPotency(getState(), { potency: 220 })));
  },
  isUsable: isUsable(ActionId.ProteanWave),
  reducedBySpellSpeed: true,
});

const northerlies: CombatAction = createCombatAction({
  id: ActionId.Northerlies,
  bluNo: 52,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Northerlies, context, magicalPotency(getState(), { potency: 220 })));

    if (hasDebuff(getState(), StatusId.Dropsy)) {
      dispatch(removeBuff(StatusId.Dropsy));
      dispatch(debuff(StatusId.DeepFreeze, { duration: 20 }));
    }
  },
  isUsable: isUsable(ActionId.Northerlies),
  reducedBySpellSpeed: true,
});

const electrogenesis: CombatAction = createCombatAction({
  id: ActionId.Electrogenesis,
  bluNo: 53,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Electrogenesis, context, magicalPotency(getState(), { potency: 220 })));
  },
  isUsable: isUsable(ActionId.Electrogenesis),
  reducedBySpellSpeed: true,
});

const kaltstrahl: CombatAction = createCombatAction({
  id: ActionId.Kaltstrahl,
  bluNo: 54,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Kaltstrahl, context, physicalPotency(getState(), { potency: 220 })));
  },
  isUsable: isUsable(ActionId.Kaltstrahl),
  reducedBySpellSpeed: true,
});

const abyssalTransfixion: CombatAction = createCombatAction({
  id: ActionId.AbyssalTransfixion,
  bluNo: 55,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.AbyssalTransfixion, context, physicalPotency(getState(), { potency: 220 })));
    dispatch(debuff(StatusId.Paralysis, { duration: 30 }));
  },
  isUsable: isUsable(ActionId.AbyssalTransfixion),
  reducedBySpellSpeed: true,
});

const chirp: CombatAction = createCombatAction({
  id: ActionId.Chirp,
  bluNo: 56,
  execute: (dispatch) => {
    dispatch(debuff(StatusId.Sleep, { duration: 40 }));
  },
  isUsable: isUsable(ActionId.Chirp),
  reducedBySpellSpeed: true,
});

const eerieSoundwave: CombatAction = createCombatAction({
  id: ActionId.EerieSoundwave,
  bluNo: 57,
  execute: () => {},
  isUsable: isUsable(ActionId.EerieSoundwave),
  reducedBySpellSpeed: true,
});

const pomCure: CombatAction = createCombatAction({
  id: ActionId.PomCure,
  bluNo: 58,
  execute: (dispatch, getState) => {
    dispatch(event(ActionId.PomCure, { healthPotency: hasBuff(getState(), StatusId.AethericMimicryHealer) ? 500 : 100 }));
  },
  isUsable: isUsable(ActionId.PomCure),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const gobskin: CombatAction = createCombatAction({
  id: ActionId.Gobskin,
  bluNo: 59,
  execute: (dispatch) => {
    dispatch(buff(StatusId.Gobskin));
  },
  isUsable: isUsable(ActionId.Gobskin),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const magicHammer: CombatAction = createCombatAction({
  id: ActionId.MagicHammer,
  bluNo: 60,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.MagicHammer, context, magicalPotency(getState(), { potency: 250, mana: 1000 })));
    dispatch(debuff(StatusId.Conked));
  },
  isUsable: isUsable(ActionId.MagicHammer),
  reducedBySpellSpeed: true,
  extraCooldown: gcd,
});

const avail: CombatAction = createCombatAction({
  id: ActionId.Avail,
  bluNo: 61,
  execute: () => {},
  isUsable: isUsable(ActionId.Avail),
  reducedBySpellSpeed: true,
  entersCombat: false,
  extraCooldown: gcd,
});

const frogLegs: CombatAction = createCombatAction({
  id: ActionId.FrogLegs,
  bluNo: 62,
  execute: () => {},
  isUsable: isUsable(ActionId.FrogLegs),
  reducedBySpellSpeed: true,
});

const sonicBoom: CombatAction = createCombatAction({
  id: ActionId.SonicBoom,
  bluNo: 63,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.SonicBoom, context, magicalPotency(getState(), { potency: 210 })));
  },
  isUsable: isUsable(ActionId.SonicBoom),
  reducedBySpellSpeed: true,
});

const whistle: CombatAction = createCombatAction({
  id: ActionId.Whistle,
  bluNo: 64,
  execute: (dispatch) => {
    dispatch(buff(StatusId.Harmonized));
  },
  isUsable: isUsable(ActionId.Whistle),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const whiteKnightsTour: CombatAction = createCombatAction({
  id: ActionId.WhiteKnightsTour,
  bluNo: 65,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(
        ActionId.WhiteKnightsTour,
        context,
        magicalPotency(getState(), { potency: 200, enhancedPotency: 400, isEnhanced: hasDebuff(getState(), StatusId.Bind) })
      )
    );

    dispatch(removeDebuff(StatusId.Bind));
    dispatch(debuff(StatusId.Slow, { duration: 20 }));
  },
  isUsable: isUsable(ActionId.WhiteKnightsTour),
  reducedBySpellSpeed: true,
});

const blackKnightsTour: CombatAction = createCombatAction({
  id: ActionId.BlackKnightsTour,
  bluNo: 66,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(
        ActionId.BlackKnightsTour,
        context,
        magicalPotency(getState(), { potency: 200, enhancedPotency: 400, isEnhanced: hasDebuff(getState(), StatusId.Slow) })
      )
    );

    dispatch(removeDebuff(StatusId.Slow));
    dispatch(debuff(StatusId.Bind, { duration: 20 }));
  },
  isUsable: isUsable(ActionId.BlackKnightsTour),
  reducedBySpellSpeed: true,
});

const level5Death: CombatAction = createCombatAction({
  id: ActionId.Level5Death,
  bluNo: 67,
  execute: () => {},
  isUsable: isUsable(ActionId.Level5Death),
  reducedBySpellSpeed: true,
  extraCooldown: gcd,
});

const launcher: CombatAction = createCombatAction({
  id: ActionId.Launcher,
  bluNo: 68,
  execute: (dispatch) => {
    const percent = [10, 20, 30, 50][Math.floor(Math.random() * 4)];

    dispatch(event(ActionId.Launcher, { damagePercent: percent }));
  },
  isUsable: isUsable(ActionId.Launcher),
  reducedBySpellSpeed: true,
});

const perpetualRay: CombatAction = createCombatAction({
  id: ActionId.PerpetualRay,
  bluNo: 69,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.PerpetualRay, context, magicalPotency(getState(), { potency: 200 })));

    dispatch(debuff(StatusId.Stun, { duration: 1 }));
  },
  isUsable: isUsable(ActionId.PerpetualRay),
  reducedBySpellSpeed: true,
});

const cactguard: CombatAction = createCombatAction({
  id: ActionId.Cactguard,
  bluNo: 70,
  execute: () => {},
  isUsable: isUsable(ActionId.Cactguard),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const revengeBlast: CombatAction = createCombatAction({
  id: ActionId.RevengeBlast,
  bluNo: 71,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.RevengeBlast, context, physicalPotency(getState(), { potency: 50 })));
  },
  isUsable: isUsable(ActionId.RevengeBlast),
  reducedBySpellSpeed: true,
});

const angelWhisper: CombatAction = createCombatAction({
  id: ActionId.AngelWhisper,
  bluNo: 72,
  execute: () => {},
  isUsable: isUsable(ActionId.AngelWhisper),
  reducedBySpellSpeed: true,
});

const exuviation: CombatAction = createCombatAction({
  id: ActionId.Exuviation,
  bluNo: 73,
  execute: (dispatch, getState) => {
    dispatch(event(ActionId.Exuviation, { healthPotency: hasBuff(getState(), StatusId.AethericMimicryHealer) ? 300 : 50 }));
  },
  isUsable: isUsable(ActionId.Exuviation),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const reflux: CombatAction = createCombatAction({
  id: ActionId.Reflux,
  bluNo: 74,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Reflux, context, magicalPotency(getState(), { potency: 220 })));

    dispatch(debuff(StatusId.Heavy, { duration: 10 }));
  },
  isUsable: isUsable(ActionId.Reflux),
  reducedBySpellSpeed: true,
});

const devour: CombatAction = createCombatAction({
  id: ActionId.Devour,
  bluNo: 75,
  execute: (dispatch, getState, context) => {
    const potency = magicalPotency(getState(), { potency: 250 });
    potency.healthPotency = potency.potency;

    dispatch(dmgEvent(ActionId.Devour, context, potency));

    dispatch(buff(StatusId.HPBoost, { duration: hasBuff(getState(), StatusId.AethericMimicryTank) ? 70 : 15 }));
  },
  isUsable: isUsable(ActionId.Devour),
  reducedBySpellSpeed: true,
  extraCooldown: gcd,
});

const condensedLibra: CombatAction = createCombatAction({
  id: ActionId.CondensedLibra,
  bluNo: 76,
  execute: (dispatch) => {
    const statuses = [StatusId.UmbralAttenuation, StatusId.AstralAttenuation, StatusId.PhysicalAttenuation];
    const status = statuses[Math.floor(Math.random() * 3)];

    dispatch(debuff(status));

    statuses.filter((s) => s !== status).forEach((s) => dispatch(removeDebuff(s)));
  },
  isUsable: isUsable(ActionId.CondensedLibra),
  reducedBySpellSpeed: true,
});

const aethericMimicry: CombatAction = createCombatAction({
  id: ActionId.AethericMimicry,
  bluNo: 77,
  execute: (dispatch, getState) => {
    if (
      hasBuff(getState(), StatusId.AethericMimicryDPS) ||
      hasBuff(getState(), StatusId.AethericMimicryHealer) ||
      hasBuff(getState(), StatusId.AethericMimicryTank)
    ) {
      dispatch(removeBuff(StatusId.AethericMimicryDPS));
      dispatch(removeBuff(StatusId.AethericMimicryHealer));
      dispatch(removeBuff(StatusId.AethericMimicryTank));
    } else {
      dispatch(buff(mimicry(getState())));
    }
  },
  isUsable: isUsable(ActionId.AethericMimicry),
  castTime: (state, baseCastTime) =>
    hasBuff(state, StatusId.AethericMimicryDPS) ||
    hasBuff(state, StatusId.AethericMimicryHealer) ||
    hasBuff(state, StatusId.AethericMimicryTank)
      ? 0
      : baseCastTime,
  reducedBySpellSpeed: true,
  cooldown: (state) =>
    hasBuff(state, StatusId.AethericMimicryDPS) ||
    hasBuff(state, StatusId.AethericMimicryHealer) ||
    hasBuff(state, StatusId.AethericMimicryTank)
      ? 0
      : 2.5,
  entersCombat: false,
});

const surpanakha: CombatAction = createCombatAction({
  id: ActionId.Surpanakha,
  bluNo: 78,
  execute: (dispatch, getState, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.Surpanakha, context, { potency: 200 * (1 + buffStacks(getState(), StatusId.SurpanakhasFury) * 0.5) }));
    dispatch(addBuffStack(StatusId.SurpanakhasFury));
  },
  isUsable: isUsable(ActionId.Surpanakha),
  maxCharges: () => 4,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
});

const quasar: CombatAction = createCombatAction({
  id: ActionId.Quasar,
  bluNo: 79,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.Quasar, context, { potency: 300 }));
  },
  isUsable: isUsable(ActionId.Quasar),
});

const jkick: CombatAction = createCombatAction({
  id: ActionId.JKick,
  bluNo: 80,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.JKick, context, { potency: 300, type: DamageType.Physical }));
  },
  isUsable: isUsable(ActionId.JKick),
});

const tripleTrident: CombatAction = createCombatAction({
  id: ActionId.TripleTrident,
  bluNo: 81,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.TripleTrident, context, physicalPotency(getState(), { potency: 150 })));
  },
  isUsable: isUsable(ActionId.TripleTrident),
  reducedBySpellSpeed: true,
  extraCooldown: gcd,
});

const tingle: CombatAction = createCombatAction({
  id: ActionId.Tingle,
  bluNo: 82,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Tingle, context, magicalPotency(getState(), { potency: 100 })));
    dispatch(buff(StatusId.Tingling));
  },
  isUsable: isUsable(ActionId.Tingle),
  reducedBySpellSpeed: true,
});

const tatamiGaeshi: CombatAction = createCombatAction({
  id: ActionId.Tatamigaeshi,
  bluNo: 83,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Tatamigaeshi, context, magicalPotency(getState(), { potency: 220 })));
    dispatch(debuff(StatusId.Stun, { duration: 3 }));
  },
  isUsable: isUsable(ActionId.Tatamigaeshi),
  reducedBySpellSpeed: true,
});

const coldFog: CombatAction = createCombatAction({
  id: ActionId.ColdFog,
  bluNo: 84,
  execute: (dispatch) => {
    dispatch(buff(StatusId.ColdFog));
  },
  isUsable: isUsable(ActionId.ColdFog),
  redirect: (state) => (hasBuff(state, StatusId.TouchofFrost) ? ActionId.WhiteDeath : ActionId.ColdFog),
  reducedBySpellSpeed: true,
  entersCombat: false,
  extraCooldown: gcd,
});

const whiteDeath: CombatAction = createCombatAction({
  id: ActionId.WhiteDeath,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.WhiteDeath, context, magicalPotency(getState(), { potency: 400 })));
    dispatch(debuff(StatusId.DeepFreeze, { duration: 10 }));
  },
  isUsable: (state) => !(hasBuff(state, StatusId.Diamondback) || hasDebuff(state, StatusId.WaningNocturne)),
  reducedBySpellSpeed: true,
});

const stotram: CombatAction = createCombatAction({
  id: ActionId.Stotram,
  bluNo: 85,
  execute: (dispatch, getState, context) => {
    if (hasBuff(getState(), StatusId.AethericMimicryHealer)) {
      dispatch(event(ActionId.Stotram, { healthPotency: 300 }));
    } else {
      dispatch(dmgEvent(ActionId.Stotram, context, magicalPotency(getState(), { potency: 140 })));
    }
  },
  isUsable: isUsable(ActionId.Stotram),
  reducedBySpellSpeed: true,
});

const saintlyBeam: CombatAction = createCombatAction({
  id: ActionId.SaintlyBeam,
  bluNo: 86,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.SaintlyBeam, context, magicalPotency(getState(), { potency: 100 })));
  },
  isUsable: isUsable(ActionId.SaintlyBeam),
  reducedBySpellSpeed: true,
});

const feculentFlood: CombatAction = createCombatAction({
  id: ActionId.FeculentFlood,
  bluNo: 87,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.FeculentFlood, context, magicalPotency(getState(), { potency: 220 })));
  },
  isUsable: isUsable(ActionId.FeculentFlood),
  reducedBySpellSpeed: true,
});

const angelsSnack: CombatAction = createCombatAction({
  id: ActionId.AngelsSnack,
  bluNo: 88,
  execute: (dispatch, getState) => {
    dispatch(event(ActionId.AngelsSnack, { healthPotency: 400 }));
    if (hasBuff(getState(), StatusId.AethericMimicryHealer)) {
      dispatch(buff(StatusId.AngelsSnack));
    }
  },
  isUsable: isUsable(ActionId.AngelsSnack),
  reducedBySpellSpeed: true,
  entersCombat: false,
  extraCooldown: gcd,
});

const chelonianGate: CombatAction = createCombatAction({
  id: ActionId.ChelonianGate,
  bluNo: 89,
  execute: (dispatch) => {
    dispatch(buff(StatusId.ChelonianGate));
  },
  isUsable: isUsable(ActionId.ChelonianGate),
  redirect: (state) => (hasBuff(state, StatusId.AuspiciousTrance) ? ActionId.DivineCataract : ActionId.ChelonianGate),
  reducedBySpellSpeed: true,
  entersCombat: false,
  extraCooldown: gcd,
});

const divineCataract: CombatAction = createCombatAction({
  id: ActionId.DivineCataract,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(
        ActionId.DivineCataract,
        context,
        magicalPotency(getState(), { potency: 500, enhancedPotency: 1000, isEnhanced: hasBuff(getState(), StatusId.AethericMimicryTank) })
      )
    );
  },
  isUsable: (state) => !(hasBuff(state, StatusId.Diamondback) || hasDebuff(state, StatusId.WaningNocturne)),
  reducedBySpellSpeed: true,
});

const theRoseOfDestruction: CombatAction = createCombatAction({
  id: ActionId.TheRoseofDestruction,
  bluNo: 90,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.TheRoseofDestruction, context, magicalPotency(getState(), { potency: 400 })));
  },
  isUsable: isUsable(ActionId.TheRoseofDestruction),
  reducedBySpellSpeed: true,
  extraCooldown: gcd,
});

const basicInstinct: CombatAction = createCombatAction({
  id: ActionId.BasicInstinct,
  bluNo: 91,
  execute: (dispatch, getState) => {
    if (hasBuff(getState(), StatusId.BasicInstinct)) {
      dispatch(removeBuff(StatusId.BasicInstinct));
    } else {
      dispatch(buff(StatusId.BasicInstinct));
    }
  },
  isUsable: isUsable(ActionId.BasicInstinct),
  reducedBySpellSpeed: true,
  castTime: (state, baseCastTime) => (hasBuff(state, StatusId.BasicInstinct) ? 0 : baseCastTime),
  cooldown: (state) => (hasBuff(state, StatusId.BasicInstinct) ? 0 : 2.5),
  entersCombat: false,
});

const ultravibration: CombatAction = createCombatAction({
  id: ActionId.Ultravibration,
  bluNo: 92,
  execute: () => {},
  isUsable: isUsable(ActionId.Ultravibration),
  reducedBySpellSpeed: true,
  extraCooldown: gcd,
});

const blaze: CombatAction = createCombatAction({
  id: ActionId.Blaze,
  bluNo: 93,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.Blaze, context, magicalPotency(getState(), { potency: 220 })));
  },
  isUsable: isUsable(ActionId.Blaze),
  reducedBySpellSpeed: true,
});

const mustardBomb: CombatAction = createCombatAction({
  id: ActionId.MustardBomb,
  bluNo: 94,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.MustardBomb, context, magicalPotency(getState(), { potency: 220 })));

    if (hasDebuff(getState(), StatusId.Lightheaded)) {
      dispatch(debuff(StatusId.IncendiaryBurns));
    }
  },
  isUsable: isUsable(ActionId.MustardBomb),
  reducedBySpellSpeed: true,
});

const dragonForce: CombatAction = createCombatAction({
  id: ActionId.DragonForce,
  bluNo: 95,
  execute: (dispatch) => {
    dispatch(buff(StatusId.DragonForce));
  },
  isUsable: isUsable(ActionId.DragonForce),
  reducedBySpellSpeed: true,
  entersCombat: false,
  extraCooldown: gcd,
});

const aetherialSpark: CombatAction = createCombatAction({
  id: ActionId.AetherialSpark,
  bluNo: 96,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.AetherialSpark, context, magicalPotency(getState(), { potency: 50 })));
    dispatch(debuff(StatusId.Bleeding, { duration: 15 }));
  },
  isUsable: isUsable(ActionId.AetherialSpark),
  reducedBySpellSpeed: true,
});

const hydroPull: CombatAction = createCombatAction({
  id: ActionId.HydroPull,
  bluNo: 97,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.HydroPull, context, magicalPotency(getState(), { potency: 220 })));
  },
  isUsable: isUsable(ActionId.HydroPull),
  reducedBySpellSpeed: true,
});

const maledictionOfWater: CombatAction = createCombatAction({
  id: ActionId.MaledictionofWater,
  bluNo: 98,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.MaledictionofWater, context, magicalPotency(getState(), { potency: 200 })));
  },
  isUsable: isUsable(ActionId.MaledictionofWater),
  reducedBySpellSpeed: true,
});

const chocoMeteor: CombatAction = createCombatAction({
  id: ActionId.ChocoMeteor,
  bluNo: 99,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.ChocoMeteor, context, magicalPotency(getState(), { potency: 300 })));
  },
  isUsable: isUsable(ActionId.ChocoMeteor),
  reducedBySpellSpeed: true,
});

const matraMagic: CombatAction = createCombatAction({
  id: ActionId.MatraMagic,
  bluNo: 100,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(
        ActionId.MatraMagic,
        context,
        magicalPotency(getState(), { potency: 50, enhancedPotency: 100, isEnhanced: hasBuff(getState(), StatusId.AethericMimicryDPS) })
      )
    );
  },
  isUsable: isUsable(ActionId.MatraMagic),
  reducedBySpellSpeed: true,
  extraCooldown: gcd,
});

const peripheralSynthesis: CombatAction = createCombatAction({
  id: ActionId.PeripheralSynthesis,
  bluNo: 101,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(
        ActionId.PeripheralSynthesis,
        context,
        magicalPotency(getState(), { potency: 220, enhancedPotency: 400, isEnhanced: true /* TODO: diminishing returns*/ })
      )
    );
    dispatch(debuff(StatusId.Lightheaded));
  },
  isUsable: isUsable(ActionId.PeripheralSynthesis),
  reducedBySpellSpeed: true,
});

const bothEnds: CombatAction = createCombatAction({
  id: ActionId.BothEnds,
  bluNo: 102,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.BothEnds, context, { potency: 600 }));
  },
  isUsable: isUsable(ActionId.BothEnds),
});

const phantomFlurry: CombatAction = createCombatAction({
  id: ActionId.PhantomFlurry,
  bluNo: 103,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.PhantomFlurry));
  },
  redirect: (state) => (hasBuff(state, StatusId.PhantomFlurry) ? ActionId.PhantomFlurryFinisher : ActionId.PhantomFlurry),
  isUsable: isUsable(ActionId.PhantomFlurry),
});

const phantomFlurryFinisher: CombatAction = createCombatAction({
  id: ActionId.PhantomFlurryFinisher,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.PhantomFlurryFinisher, context, { potency: 600, type: DamageType.Physical }));
  },
  isUsable: (state) => !(hasBuff(state, StatusId.Diamondback) || hasDebuff(state, StatusId.WaningNocturne)),
});

const nightbloom: CombatAction = createCombatAction({
  id: ActionId.Nightbloom,
  bluNo: 104,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.Nightbloom, context, { potency: 400 }));
    dispatch(debuff(StatusId.Bleeding, { duration: 60 }));
  },
  isUsable: isUsable(ActionId.Nightbloom),
});

const goblinPunch: CombatAction = createCombatAction({
  id: ActionId.GoblinPunch,
  bluNo: 105,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.GoblinPunch, context, {
        potency: 120,
        frontPotency: 220,
        frontEnhancedPotency: 320,
        isEnhanced: hasBuff(getState(), StatusId.MightyGuard),
        type: DamageType.Physical,
      })
    );
  },
  isUsable: isUsable(ActionId.GoblinPunch),
  reducedBySpellSpeed: true,
});

const rightRound: CombatAction = createCombatAction({
  id: ActionId.RightRound,
  bluNo: 106,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.RightRound, context, { potency: 110, type: DamageType.Physical }));
  },
  isUsable: isUsable(ActionId.RightRound, (s) => inCombat(s)),
  reducedBySpellSpeed: true,
});

const schiltron: CombatAction = createCombatAction({
  id: ActionId.Schiltron,
  bluNo: 107,
  execute: (dispatch) => {
    dispatch(buff(StatusId.Schiltron));
    dispatch(removeBuff(StatusId.IceSpikes));
    dispatch(removeBuff(StatusId.VeiloftheWhorl));
  },
  isUsable: isUsable(ActionId.Schiltron),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const rehydration: CombatAction = createCombatAction({
  id: ActionId.Rehydration,
  bluNo: 108,
  execute: (dispatch) => {
    dispatch(event(ActionId.Rehydration, { healthPotency: 600 }));
  },
  isUsable: isUsable(ActionId.Rehydration),
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const breathOfMagic: CombatAction = createCombatAction({
  id: ActionId.BreathofMagic,
  bluNo: 109,
  execute: (dispatch) => {
    dispatch(debuff(StatusId.BreathofMagic));
  },
  isUsable: isUsable(ActionId.BreathofMagic),
  reducedBySpellSpeed: true,
});

const wildRage: CombatAction = createCombatAction({
  id: ActionId.WildRage,
  bluNo: 110,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.WildRage, context, { potency: 500, type: DamageType.Physical }));
    const currentHp = hp(getState());
    dispatch(setHp(Math.ceil(currentHp / 2)));
  },
  isUsable: isUsable(ActionId.WildRage),
  reducedBySpellSpeed: true,
});

const peatPelt: CombatAction = createCombatAction({
  id: ActionId.PeatPelt,
  bluNo: 111,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.PeatPelt, context, { potency: 100 }));
    dispatch(debuff(StatusId.Begrimed));
  },
  isUsable: isUsable(ActionId.PeatPelt),
  reducedBySpellSpeed: true,
});

const deepClean: CombatAction = createCombatAction({
  id: ActionId.DeepClean,
  bluNo: 112,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.DeepClean, context, { potency: 220 }));
    if (hasBuff(getState(), StatusId.Begrimed)) {
      dispatch(removeDebuff(StatusId.Begrimed));
      dispatch(addBuffStack(StatusId.Spickandspan, { keepDuration: true }));
    }
  },
  isUsable: isUsable(ActionId.DeepClean),
  reducedBySpellSpeed: true,
});

const rubyDynamics: CombatAction = createCombatAction({
  id: ActionId.RubyDynamics,
  bluNo: 113,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.RubyDynamics, context, { potency: 220, type: DamageType.Physical }));
  },
  isUsable: isUsable(ActionId.RubyDynamics),
  reducedBySpellSpeed: true,
  extraCooldown: gcd,
});

const divinationRune: CombatAction = createCombatAction({
  id: ActionId.DivinationRune,
  bluNo: 114,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.DivinationRune, context, { potency: 100, mana: 200 }));
  },
  isUsable: isUsable(ActionId.DivinationRune),
  reducedBySpellSpeed: true,
});

const dimensionalShift: CombatAction = createCombatAction({
  id: ActionId.DimensionalShift,
  bluNo: 115,
  execute: (dispatch) => {
    dispatch(event(ActionId.DimensionalShift, { damagePercent: 30, type: DamageType.Darkness }));
  },
  isUsable: isUsable(ActionId.DimensionalShift),
  reducedBySpellSpeed: true,
});

const convictionMarcato: CombatAction = createCombatAction({
  id: ActionId.ConvictionMarcato,
  bluNo: 116,
  execute: (dispatch, getState, context) => {
    dispatch(
      dmgEvent(ActionId.ConvictionMarcato, context, {
        potency: 220,
        enhancedPotency: 440,
        isEnhanced: hasBuff(getState(), StatusId.WingedRedemption),
      })
    );
    dispatch(removeBuff(StatusId.WingedRedemption));
  },
  isUsable: isUsable(ActionId.ConvictionMarcato),
  reducedBySpellSpeed: true,
});

const forceField: CombatAction = createCombatAction({
  id: ActionId.ForceField,
  bluNo: 117,
  execute: (dispatch) => {
    if (rng(50)) {
      dispatch(buff(StatusId.MagicVulnerabilityDown));
    } else {
      dispatch(buff(StatusId.PhysicalVulnerabilityDown));
    }
  },
  isUsable: isUsable(ActionId.ForceField),
  reducedBySpellSpeed: true,
  extraCooldown: gcd,
});

const wingedReprobation: CombatAction = createCombatAction({
  id: ActionId.WingedReprobation,
  bluNo: 118,
  execute: (dispatch, getState, context) => {
    dispatch(dmgEvent(ActionId.WingedReprobation, context, { potency: 300 }));
    if (buffStacks(getState(), StatusId.WingedReprobation) === 3) {
      dispatch(removeBuff(StatusId.WingedReprobation));
      dispatch(buff(StatusId.WingedRedemption));
    } else {
      dispatch(addBuffStack(StatusId.WingedReprobation));
    }
  },
  isUsable: isUsable(ActionId.WingedReprobation),
  reducedBySpellSpeed: true,
  cooldown: (state) => (buffStacks(state, StatusId.WingedReprobation) === 3 ? 90 : 0),
  extraCooldown: gcd,
});

const laserEye: CombatAction = createCombatAction({
  id: ActionId.LaserEye,
  bluNo: 119,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.LaserEye, context, { potency: 220 }));
  },
  isUsable: isUsable(ActionId.LaserEye),
  reducedBySpellSpeed: true,
});

const candyCane: CombatAction = createCombatAction({
  id: ActionId.CandyCane,
  bluNo: 120,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.CandyCane, context, { potency: 250, mana: 1000 }));
    dispatch(debuff(StatusId.CandyCane));
  },
  isUsable: isUsable(ActionId.CandyCane),
  reducedBySpellSpeed: true,
  extraCooldown: gcd,
});

const mortalFlame: CombatAction = createCombatAction({
  id: ActionId.MortalFlame,
  bluNo: 121,
  execute: (dispatch, _, context) => {
    if (!context.startedCombat) {
      dispatch(debuff(StatusId.MortalFlame));
    }
  },
  isUsable: isUsable(ActionId.MortalFlame),
  reducedBySpellSpeed: true,
});

const seaShanty: CombatAction = createCombatAction({
  id: ActionId.SeaShanty,
  bluNo: 122,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.SeaShanty, context, { potency: 500 }));
  },
  isUsable: isUsable(ActionId.SeaShanty),
});

const apokalypsis: CombatAction = createCombatAction({
  id: ActionId.Apokalypsis,
  bluNo: 123,
  execute: (dispatch) => {
    dispatch(buff(StatusId.Apokalypsis));
  },
  isUsable: isUsable(ActionId.Apokalypsis),
});

const beingMortal: CombatAction = createCombatAction({
  id: ActionId.BeingMortal,
  bluNo: 124,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.BeingMortal, context, { potency: 800 }));
  },
  isUsable: isUsable(ActionId.BeingMortal),
});

export const bluStatuses: CombatStatus[] = [
  dropsyStatus,
  paralysisStatus,
  brushWithDeathStatus,
  bleedingStatus,
  boostStatus,
  petrificationStatus,
  iceSpikesStatus,
  offGuardStatus,
  slowStatus,
  blindStatus,
  poisonStatus,
  malodorousStatus,
  diamondbackStatus,
  mightyGuardStatus,
  toadOilStatus,
  deepFreezeStatus,
  waxingNocturneStatus,
  waningNocturneStatus,
  doomStatus,
  peculiarLightStatus,
  windburnStatus,
  veilOfTheWhorlStatus,
  gobskinStatus,
  conkedStatus,
  harmonizedStatus,
  hpBoostStatus,
  umbralAttenuationStatus,
  astralAttenuationStatus,
  physicalAttenuationStatus,
  aethericMimicryDPSStatus,
  aethericMimicryHealerStatus,
  aethericMimicryTankStatus,
  surpanakhasFuryStatus,
  tinglingStatus,
  coldFogStatus,
  touchOfFrostStatus,
  angelsSnackStatus,
  chelonianGateStatus,
  auspiciousTranceStatus,
  basicInstinctStatus,
  incendiaryBurnsStatus,
  dragonForceStatus,
  lightheadedStatus,
  phantomFlurryStatus,
  schiltronStatus,
  breathOfMagicStatus,
  begrimedStatus,
  magicVulnerabilityDownStatus,
  physicalVulnerabilityDownStatus,
  spickAndSpanStatus,
  wingedReprobationStatus,
  wingedRedemptionStatus,
  candyCaneStatus,
  mortalFlameStatus,
  apokalypsisStatus,
];

export const blu: CombatAction[] = [
  waterCannon,
  flamethrower,
  flyingFrenzy,
  aquaBreath,
  drillCannons,
  highVoltage,
  loom,
  finalSting,
  songOfTorment,
  glower,
  plaincracker,
  bristle,
  whiteWind,
  level5Petrify,
  sharpenedKnife,
  iceSpikes,
  bloodDrain,
  acornBomb,
  bombToss,
  offGuard,
  selfDestruct,
  transfusion,
  faze,
  flyingSardine,
  snort,
  fourTonzeWeight,
  theLook,
  badBreath,
  diamondback,
  mightyGuard,
  stickyTongue,
  toadOil,
  theRamsVoice,
  theDragonsVoice,
  missile,
  thousandNeedles,
  inkJet,
  fireAngon,
  moonFlute,
  tailScrew,
  mindBlast,
  doom,
  peculiarLight,
  featherRain,
  eruption,
  mountainBuster,
  shockStrike,
  glassDance,
  veilOfTheWhorl,
  alpineDraft,
  proteanWave,
  northerlies,
  electrogenesis,
  kaltstrahl,
  abyssalTransfixion,
  chirp,
  eerieSoundwave,
  pomCure,
  gobskin,
  magicHammer,
  avail,
  frogLegs,
  sonicBoom,
  whistle,
  whiteKnightsTour,
  blackKnightsTour,
  level5Death,
  launcher,
  perpetualRay,
  cactguard,
  revengeBlast,
  angelWhisper,
  exuviation,
  reflux,
  devour,
  condensedLibra,
  aethericMimicry,
  surpanakha,
  quasar,
  jkick,
  tripleTrident,
  tingle,
  tatamiGaeshi,
  coldFog,
  whiteDeath,
  stotram,
  saintlyBeam,
  feculentFlood,
  angelsSnack,
  chelonianGate,
  divineCataract,
  theRoseOfDestruction,
  basicInstinct,
  ultravibration,
  blaze,
  mustardBomb,
  dragonForce,
  aetherialSpark,
  hydroPull,
  maledictionOfWater,
  chocoMeteor,
  matraMagic,
  peripheralSynthesis,
  bothEnds,
  phantomFlurry,
  phantomFlurryFinisher,
  nightbloom,
  goblinPunch,
  rightRound,
  schiltron,
  rehydration,
  breathOfMagic,
  wildRage,
  peatPelt,
  deepClean,
  rubyDynamics,
  divinationRune,
  dimensionalShift,
  convictionMarcato,
  forceField,
  wingedReprobation,
  laserEye,
  candyCane,
  mortalFlame,
  seaShanty,
  apokalypsis,
  beingMortal,
];

export const bluEpics = combineEpics(
  consumeBoostEpic,
  consumeHarmonizedEpic,
  removeSurpanakhasFuryEpic,
  tripleTridentEpic,
  popColdFogpic,
  popChelonianGatepic,
  removeChelonianGateEpic,
  removeAuspiciousTranceEpic,
  matraMagicEpic,
  removePhantomFlurryEpic,
  consumeTinglingEpic,
  removeApokalypsisEpic
);
