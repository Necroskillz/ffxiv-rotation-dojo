import { combineEpics, Epic } from 'redux-observable';
import { filter, map, of, switchMap, withLatestFrom } from 'rxjs';
import { AppThunk, RootState } from '../../../../app/store';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
import { CombatStatus, createCombatStatus } from '../../combat-status';
import {
  addBuff,
  buff,
  combo,
  hasBuff,
  hasCombo,
  hasPet,
  removeBuff,
  removeBuffStack,
  removeCombo,
  removeGaruda,
  removeIfrit,
  removeTitan,
  resource,
  setBahamut,
  setEmerald,
  setRuby,
  setPet,
  setResource,
  setTopaz,
  gcd,
  event,
  removeBuffAction,
  dmgEvent,
  DamageType,
  debuff,
} from '../../combatSlice';

function topaz(state: RootState) {
  return resource(state, 'topaz');
}

function ruby(state: RootState) {
  return resource(state, 'ruby');
}

function emerald(state: RootState) {
  return resource(state, 'emerald');
}

function bahamut(state: RootState) {
  return resource(state, 'bahamut');
}

export const petAfk = (): AppThunk => (dispatch) => {
  dispatch(setPet(null));
  setTimeout(() => dispatch(setPet({ name: 'Carbuncle' })), 8000);
};

const switchToPhoenixEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === removeBuffAction.type && a.payload === StatusId.BahamutActive),
    map(() => setBahamut(1))
  );

const switchToBahamutEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === removeBuffAction.type && a.payload === StatusId.PhoenixActive),
    map(() => setBahamut(0))
  );

const endTitanEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(
      (a) =>
        (a.type === setResource.type && a.payload.resourceType === 'topaz' && a.payload.amount === 0) ||
        (a.type === addBuff.type &&
          [StatusId.IfritActive, StatusId.GarudaActive, StatusId.BahamutActive, StatusId.PhoenixActive].includes(a.payload.id))
    ),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => hasBuff(state, StatusId.TitanActive)),
    map(() => removeBuff(StatusId.TitanActive))
  );

const endIfritEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(
      (a) =>
        (a.type === setResource.type && a.payload.resourceType === 'ruby' && a.payload.amount === 0) ||
        (a.type === addBuff.type &&
          [StatusId.TitanActive, StatusId.GarudaActive, StatusId.BahamutActive, StatusId.PhoenixActive].includes(a.payload.id))
    ),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => hasBuff(state, StatusId.IfritActive)),
    map(() => removeBuff(StatusId.IfritActive))
  );

const endGarudaEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(
      (a) =>
        (a.type === setResource.type && a.payload.resourceType === 'emerald' && a.payload.amount === 0) ||
        (a.type === addBuff.type &&
          [StatusId.IfritActive, StatusId.TitanActive, StatusId.BahamutActive, StatusId.PhoenixActive].includes(a.payload.id))
    ),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => hasBuff(state, StatusId.GarudaActive)),
    map(() => removeBuff(StatusId.GarudaActive))
  );

const endTitansFavorEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(
      (a) =>
        a.type === addBuff.type &&
        [StatusId.IfritActive, StatusId.GarudaActive, StatusId.BahamutActive, StatusId.PhoenixActive].includes(a.payload.id)
    ),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => hasBuff(state, StatusId.TitansFavor)),
    map(() => removeBuff(StatusId.TitansFavor))
  );

const endIfritsFavorEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(
      (a) =>
        a.type === addBuff.type &&
        [StatusId.TitanActive, StatusId.GarudaActive, StatusId.BahamutActive, StatusId.PhoenixActive].includes(a.payload.id)
    ),
    withLatestFrom(state$),
    map(([, state]) => state),
    switchMap((state) => {
      const actions = [];

      if (hasBuff(state, StatusId.IfritsFavor)) {
        actions.push(removeBuff(StatusId.IfritsFavor));
      }

      if (hasCombo(state, ActionId.CrimsonStrike)) {
        actions.push(removeCombo(ActionId.CrimsonCyclone));
      }

      return of(...actions);
    })
  );

const resetTopazEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === removeBuffAction.type && a.payload === StatusId.TitanActive),
    map(() => setTopaz(0))
  );

const resetRubyEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === removeBuffAction.type && a.payload === StatusId.IfritActive),
    map(() => setRuby(0))
  );

const resetEmeraldEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === removeBuffAction.type && a.payload === StatusId.GarudaActive),
    map(() => setEmerald(0))
  );

const endGarudasFavorEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter(
      (a) =>
        a.type === addBuff.type &&
        [StatusId.TitanActive, StatusId.IfritActive, StatusId.BahamutActive, StatusId.PhoenixActive].includes(a.payload.id)
    ),
    withLatestFrom(state$),
    map(([, state]) => state),
    filter((state) => hasBuff(state, StatusId.GarudasFavor)),
    map(() => removeBuff(StatusId.GarudasFavor))
  );

const radiantAegisStatus: CombatStatus = createCombatStatus({
  id: StatusId.RadiantAegis,
  duration: 30,
  isHarmful: false,
});

const bahamutActiveStatus: CombatStatus = createCombatStatus({
  id: StatusId.BahamutActive,
  duration: 15,
  isHarmful: false,
  isVisible: false,
  tick: (dispatch) => dispatch(event(ActionId.Wyrmwave, { potency: 150, type: DamageType.Magical })),
  initialDelay: 5000,
});

const phoenixActiveStatus: CombatStatus = createCombatStatus({
  id: StatusId.PhoenixActive,
  duration: 15,
  isHarmful: false,
  isVisible: false,
  tick: (dispatch) => dispatch(event(ActionId.ScarletFlame, { potency: 150, type: DamageType.Magical })),
  initialDelay: 5000,
});

const everlastingFlightStatus: CombatStatus = createCombatStatus({
  id: StatusId.EverlastingFlight,
  duration: 21,
  isHarmful: false,
});

const titanActiveStatus: CombatStatus = createCombatStatus({
  id: StatusId.TitanActive,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const titansFavorStatus: CombatStatus = createCombatStatus({
  id: StatusId.TitansFavor,
  duration: null,
  isHarmful: false,
});

const ifritActiveStatus: CombatStatus = createCombatStatus({
  id: StatusId.IfritActive,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const ifritsFavorStatus: CombatStatus = createCombatStatus({
  id: StatusId.IfritsFavor,
  duration: null,
  isHarmful: false,
});

const garudaActiveStatus: CombatStatus = createCombatStatus({
  id: StatusId.GarudaActive,
  duration: 30,
  isHarmful: false,
  isVisible: false,
});

const garudasFavorStatus: CombatStatus = createCombatStatus({
  id: StatusId.GarudasFavor,
  duration: null,
  isHarmful: false,
});

const slipstreamActiveStatus: CombatStatus = createCombatStatus({
  id: StatusId.SlipstreamActive,
  duration: 15,
  isHarmful: true,
  isVisible: false,
  tick: (dispatch) => dispatch(event(0, { potency: 30 })),
  ticksImmediately: true,
});

const rekindleStatus: CombatStatus = createCombatStatus({
  id: StatusId.Rekindle,
  duration: 30,
  isHarmful: false,
  tick: (dispatch) => dispatch(event(0, { healthPotency: 200 })),
});

const aetherflowStatus: CombatStatus = createCombatStatus({
  id: StatusId.Aetherflow,
  duration: null,
  isHarmful: false,
  initialStacks: 2,
});

const furtherRuinStatus: CombatStatus = createCombatStatus({
  id: StatusId.FurtherRuin,
  duration: 60,
  isHarmful: false,
});

const searingLightStatus: CombatStatus = createCombatStatus({
  id: StatusId.SearingLight,
  duration: 30,
  isHarmful: false,
});

function ruinRedirect(state: RootState) {
  return hasBuff(state, StatusId.BahamutActive)
    ? ActionId.AstralImpulse
    : hasBuff(state, StatusId.PhoenixActive)
    ? ActionId.FountainofFire
    : ActionId.RuinIII;
}

function triDisasterRedirect(state: RootState) {
  return hasBuff(state, StatusId.BahamutActive)
    ? ActionId.AstralFlare
    : hasBuff(state, StatusId.PhoenixActive)
    ? ActionId.BrandofPurgatory
    : ActionId.Tridisaster;
}

const summonCarbuncle: CombatAction = createCombatAction({
  id: ActionId.SummonCarbuncle,
  execute: (dispatch) => {
    dispatch(setPet({ name: 'Carbuncle' }));
  },
  reducedBySpellSpeed: true,
  entersCombat: false,
});

const radiantAegis: CombatAction = createCombatAction({
  id: ActionId.RadiantAegis,
  execute: (dispatch) => {
    dispatch(buff(StatusId.RadiantAegis));
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
  isUsable: (state) => hasPet(state),
});

const aethercharge: CombatAction = createCombatAction({
  id: ActionId.Aethercharge,
  execute: () => {},
  redirect: (state) => (bahamut(state) === 0 ? ActionId.SummonBahamut : ActionId.SummonPhoenix),
  reducedBySpellSpeed: true,
});

const dreadwyrnTrance: CombatAction = createCombatAction({
  id: ActionId.DreadwyrmTrance,
  execute: () => {},
  redirect: (state) => (bahamut(state) === 0 ? ActionId.SummonBahamut : ActionId.SummonPhoenix),
  reducedBySpellSpeed: true,
});

const summonBahamut: CombatAction = createCombatAction({
  id: ActionId.SummonBahamut,
  execute: (dispatch) => {
    dispatch(buff(StatusId.BahamutActive));
    dispatch(gcd({ reducedBySpellSpeed: true }));
    dispatch(petAfk());
    dispatch(setTopaz(9));
    dispatch(setRuby(9));
    dispatch(setEmerald(9));
  },
  isUsable: (state) => hasPet(state),
  redirect: (state) => (bahamut(state) === 0 ? ActionId.SummonBahamut : ActionId.SummonPhoenix),
  reducedBySpellSpeed: true,
});

const summonPhoenix: CombatAction = createCombatAction({
  id: ActionId.SummonPhoenix,
  execute: (dispatch) => {
    dispatch(buff(StatusId.PhoenixActive));
    dispatch(buff(StatusId.EverlastingFlight));
    dispatch(gcd({ reducedBySpellSpeed: true }));
    dispatch(petAfk());
    dispatch(setTopaz(9));
    dispatch(setRuby(9));
    dispatch(setEmerald(9));
  },
  isUsable: (state) => hasPet(state),
  reducedBySpellSpeed: true,
});

const ruin: CombatAction = createCombatAction({
  id: ActionId.Ruin,
  execute: () => {},
  redirect: ruinRedirect,
  reducedBySpellSpeed: true,
});

const ruin2: CombatAction = createCombatAction({
  id: ActionId.RuinII,
  execute: () => {},
  redirect: ruinRedirect,
  reducedBySpellSpeed: true,
});

const ruin3: CombatAction = createCombatAction({
  id: ActionId.RuinIII,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.RuinIII, context, { potency: 310 }));
  },
  redirect: ruinRedirect,
  reducedBySpellSpeed: true,
});

const astralImpulse: CombatAction = createCombatAction({
  id: ActionId.AstralImpulse,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.AstralImpulse, context, { potency: 440 }));
  },
  reducedBySpellSpeed: true,
});

const fountainOfFire: CombatAction = createCombatAction({
  id: ActionId.FountainofFire,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.FountainofFire, context, { potency: 540 }));
  },
  reducedBySpellSpeed: true,
});

const summonTopaz: CombatAction = createCombatAction({
  id: ActionId.SummonTopaz,
  execute: () => {},
  redirect: () => ActionId.SummonTitanII,
  reducedBySpellSpeed: true,
});

const summonTitan: CombatAction = createCombatAction({
  id: ActionId.SummonTitan,
  execute: () => {},
  redirect: () => ActionId.SummonTitanII,
  reducedBySpellSpeed: true,
});

const summonTitan2: CombatAction = createCombatAction({
  id: ActionId.SummonTitanII,
  execute: (dispatch, _, context) => {
    setTimeout(() => dispatch(dmgEvent(ActionId.EarthenFury, context, { potency: 750 })), 4000);
    dispatch(buff(StatusId.TitanActive));
    dispatch(setTopaz(4));
    dispatch(petAfk());
  },
  isUsable: (state) =>
    topaz(state) === 9 && hasPet(state) && !(hasBuff(state, StatusId.BahamutActive) || hasBuff(state, StatusId.PhoenixActive)),
  isGlowing: (state) =>
    topaz(state) === 9 && hasPet(state) && !(hasBuff(state, StatusId.BahamutActive) || hasBuff(state, StatusId.PhoenixActive)),
  reducedBySpellSpeed: true,
});

const summonRuby: CombatAction = createCombatAction({
  id: ActionId.SummonRuby,
  execute: () => {},
  redirect: () => ActionId.SummonIfritII,
  reducedBySpellSpeed: true,
});

const summonIfrit: CombatAction = createCombatAction({
  id: ActionId.SummonIfrit,
  execute: () => {},
  redirect: () => ActionId.SummonIfritII,
  reducedBySpellSpeed: true,
});

const summonIfrit2: CombatAction = createCombatAction({
  id: ActionId.SummonIfritII,
  execute: (dispatch, _, context) => {
    setTimeout(() => dispatch(dmgEvent(ActionId.Inferno, context, { potency: 750 })), 4000);
    dispatch(buff(StatusId.IfritActive));
    dispatch(setRuby(2));
    dispatch(buff(StatusId.IfritsFavor));
    dispatch(petAfk());
  },
  isUsable: (state) =>
    ruby(state) === 9 && hasPet(state) && !(hasBuff(state, StatusId.BahamutActive) || hasBuff(state, StatusId.PhoenixActive)),
  isGlowing: (state) =>
    ruby(state) === 9 && hasPet(state) && !(hasBuff(state, StatusId.BahamutActive) || hasBuff(state, StatusId.PhoenixActive)),
  reducedBySpellSpeed: true,
});

const summonEmerald: CombatAction = createCombatAction({
  id: ActionId.SummonEmerald,
  execute: () => {},
  redirect: () => ActionId.SummonGarudaII,
  reducedBySpellSpeed: true,
});

const summonGaruda: CombatAction = createCombatAction({
  id: ActionId.SummonGaruda,
  execute: () => {},
  redirect: () => ActionId.SummonGarudaII,
  reducedBySpellSpeed: true,
});

const summonGaruda2: CombatAction = createCombatAction({
  id: ActionId.SummonGarudaII,
  execute: (dispatch, _, context) => {
    setTimeout(() => dispatch(dmgEvent(ActionId.AerialBlast, context, { potency: 750 })), 4000);
    dispatch(buff(StatusId.GarudaActive));
    dispatch(setEmerald(4));
    dispatch(buff(StatusId.GarudasFavor));
    dispatch(petAfk());
  },
  isUsable: (state) =>
    emerald(state) === 9 && hasPet(state) && !(hasBuff(state, StatusId.BahamutActive) || hasBuff(state, StatusId.PhoenixActive)),
  isGlowing: (state) =>
    emerald(state) === 9 && hasPet(state) && !(hasBuff(state, StatusId.BahamutActive) || hasBuff(state, StatusId.PhoenixActive)),
  reducedBySpellSpeed: true,
});

const topazRite: CombatAction = createCombatAction({
  id: ActionId.TopazRite,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.TopazRite, context, { potency: 330 }));

    dispatch(buff(StatusId.TitansFavor));
    dispatch(removeTitan(1));
  },
  reducedBySpellSpeed: true,
});

const emeraldRite: CombatAction = createCombatAction({
  id: ActionId.EmeraldRite,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.EmeraldRite, context, { potency: 230 }));

    dispatch(removeGaruda(1));
  },
  reducedBySpellSpeed: true,
});

const rubyRite: CombatAction = createCombatAction({
  id: ActionId.RubyRite,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.RubyRite, context, { potency: 510 }));

    dispatch(removeIfrit(1));
  },
  reducedBySpellSpeed: true,
});

const slipstream: CombatAction = createCombatAction({
  id: ActionId.Slipstream,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Slipstream, context, { potency: 430 }));
    dispatch(debuff(StatusId.SlipstreamActive));

    dispatch(removeBuff(StatusId.GarudasFavor));
  },
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const crimsonCyclone: CombatAction = createCombatAction({
  id: ActionId.CrimsonCyclone,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.CrimsonCyclone, context, { potency: 430 }));
    dispatch(removeBuff(StatusId.IfritsFavor));
    dispatch(combo(ActionId.CrimsonCyclone));
  },
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const crimsonStrike: CombatAction = createCombatAction({
  id: ActionId.CrimsonStrike,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.CrimsonStrike, context, { potency: 430 }));
  },
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const astralFlow: CombatAction = createCombatAction({
  id: ActionId.AstralFlow,
  execute: () => {},
  isUsable: () => false,
  redirect: (state) =>
    hasBuff(state, StatusId.BahamutActive)
      ? ActionId.Deathflare
      : hasBuff(state, StatusId.PhoenixActive)
      ? ActionId.Rekindle
      : hasBuff(state, StatusId.TitansFavor)
      ? ActionId.MountainBuster
      : hasCombo(state, ActionId.CrimsonStrike)
      ? ActionId.CrimsonStrike
      : hasBuff(state, StatusId.IfritsFavor)
      ? ActionId.CrimsonCyclone
      : hasBuff(state, StatusId.GarudasFavor)
      ? ActionId.Slipstream
      : ActionId.AstralFlow,
});

const mountainBuster: CombatAction = createCombatAction({
  id: ActionId.MountainBuster,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.MountainBuster, context, { potency: 150 }));

    dispatch(removeBuff(StatusId.TitansFavor));
  },
  isUsable: (state) => hasBuff(state, StatusId.TitansFavor),
  isGlowing: (state) => hasBuff(state, StatusId.TitansFavor),
});

const gemshine: CombatAction = createCombatAction({
  id: ActionId.Gemshine,
  execute: () => {},
  isUsable: () => false,
  redirect: (state) =>
    hasBuff(state, StatusId.TitanActive)
      ? ActionId.TopazRite
      : hasBuff(state, StatusId.IfritActive)
      ? ActionId.RubyRite
      : hasBuff(state, StatusId.GarudaActive)
      ? ActionId.EmeraldRite
      : ActionId.Gemshine,
  reducedBySpellSpeed: true,
});

const deathflare: CombatAction = createCombatAction({
  id: ActionId.Deathflare,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Deathflare, context, { potency: 500 }));
  },
  isGlowing: () => true,
});

const rekindle: CombatAction = createCombatAction({
  id: ActionId.Rekindle,
  execute: (dispatch) => {
    dispatch(buff(StatusId.Rekindle));
  },
  isGlowing: () => true,
  entersCombat: false,
});

const enkidleBahamut: CombatAction = createCombatAction({
  id: ActionId.EnkindleBahamut,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.AkhMorn, context, { potency: 1300 }));
  },
  isUsable: (state) => hasBuff(state, StatusId.BahamutActive),
  redirect: (state) => (hasBuff(state, StatusId.PhoenixActive) ? ActionId.EnkindlePhoenix : ActionId.EnkindleBahamut),
});

const enkidlePhoenix: CombatAction = createCombatAction({
  id: ActionId.EnkindlePhoenix,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Revelation, context, { potency: 1300 }));
  },
});

const energyDrain: CombatAction = createCombatAction({
  id: ActionId.EnergyDrain,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.EnergyDrain, context, { potency: 200 }));
    dispatch(buff(StatusId.Aetherflow));
    dispatch(buff(StatusId.FurtherRuin));
  },
});

const ruin4: CombatAction = createCombatAction({
  id: ActionId.RuinIV,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.RuinIV, context, { potency: 430 }));
    dispatch(removeBuff(StatusId.FurtherRuin));
  },
  isUsable: (state) => hasBuff(state, StatusId.FurtherRuin),
  isGlowing: (state) => hasBuff(state, StatusId.FurtherRuin),
  reducedBySpellSpeed: true,
});

const fester: CombatAction = createCombatAction({
  id: ActionId.Fester,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Fester, context, { potency: 340 }));
    dispatch(removeBuffStack(StatusId.Aetherflow));
  },
  isUsable: (state) => hasBuff(state, StatusId.Aetherflow),
});

const searingLight: CombatAction = createCombatAction({
  id: ActionId.SearingLight,
  execute: (dispatch) => {
    dispatch(buff(StatusId.SearingLight));
  },
  entersCombat: false,
});

const akhMorn: CombatAction = createCombatAction({
  id: ActionId.AkhMorn,
  execute: () => {},
});

const revelation: CombatAction = createCombatAction({
  id: ActionId.Revelation,
  execute: () => {},
});

const wyrmwave: CombatAction = createCombatAction({
  id: ActionId.Wyrmwave,
  execute: () => {},
});

const scarletFlame: CombatAction = createCombatAction({
  id: ActionId.ScarletFlame,
  execute: () => {},
});

const everlastingFlight: CombatAction = createCombatAction({
  id: ActionId.EverlastingFlight,
  execute: () => {},
});

const resurrection: CombatAction = createCombatAction({
  id: ActionId.Resurrection,
  execute: () => {},
  entersCombat: false,
  reducedBySpellSpeed: true,
});

const physick: CombatAction = createCombatAction({
  id: ActionId.Physick,
  execute: (dispatch) => {
    dispatch(event(ActionId.Physick, { healthPotency: 400 }));
  },
  entersCombat: false,
  reducedBySpellSpeed: true,
});

const outburst: CombatAction = createCombatAction({
  id: ActionId.Outburst,
  execute: () => {},
  redirect: triDisasterRedirect,
  reducedBySpellSpeed: true,
});

const triDisaster: CombatAction = createCombatAction({
  id: ActionId.Tridisaster,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Tridisaster, context, { potency: 120 }));
  },
  redirect: triDisasterRedirect,
  reducedBySpellSpeed: true,
});

const astralFlare: CombatAction = createCombatAction({
  id: ActionId.AstralFlare,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.AstralFlare, context, { potency: 180 }));
  },
  reducedBySpellSpeed: true,
});

const brandofPurgatory: CombatAction = createCombatAction({
  id: ActionId.BrandofPurgatory,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.BrandofPurgatory, context, { potency: 240 }));
  },
  reducedBySpellSpeed: true,
});

const preciousBrilliance: CombatAction = createCombatAction({
  id: ActionId.PreciousBrilliance,
  execute: () => {},
  isUsable: () => false,
  redirect: (state) =>
    hasBuff(state, StatusId.TitanActive)
      ? ActionId.TopazCatastrophe
      : hasBuff(state, StatusId.IfritActive)
      ? ActionId.RubyCatastrophe
      : hasBuff(state, StatusId.GarudaActive)
      ? ActionId.EmeraldCatastrophe
      : ActionId.PreciousBrilliance,
  reducedBySpellSpeed: true,
});

const topazCatastrophe: CombatAction = createCombatAction({
  id: ActionId.TopazCatastrophe,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.TopazCatastrophe, context, { potency: 140 }));
    dispatch(buff(StatusId.TitansFavor));
    dispatch(removeTitan(1));
  },
  reducedBySpellSpeed: true,
});

const emeraldCatastrophe: CombatAction = createCombatAction({
  id: ActionId.EmeraldCatastrophe,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.EmeraldCatastrophe, context, { potency: 100 }));
    dispatch(removeGaruda(1));
  },
  reducedBySpellSpeed: true,
});

const rubyCatastrophe: CombatAction = createCombatAction({
  id: ActionId.RubyCatastrophe,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.RubyCatastrophe, context, { potency: 210 }));
    dispatch(removeIfrit(1));
  },
  reducedBySpellSpeed: true,
});

const energySiphon: CombatAction = createCombatAction({
  id: ActionId.EnergySiphon,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.EnergySiphon, context, { potency: 100 }));
    dispatch(buff(StatusId.Aetherflow));
    dispatch(buff(StatusId.FurtherRuin));
  },
});

const painflare: CombatAction = createCombatAction({
  id: ActionId.Painflare,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.Painflare, context, { potency: 150 }));
    dispatch(removeBuffStack(StatusId.Aetherflow));
  },
  isUsable: (state) => hasBuff(state, StatusId.Aetherflow),
});

export const smnStatuses: CombatStatus[] = [
  radiantAegisStatus,
  bahamutActiveStatus,
  phoenixActiveStatus,
  titanActiveStatus,
  titansFavorStatus,
  ifritActiveStatus,
  ifritsFavorStatus,
  garudaActiveStatus,
  garudasFavorStatus,
  aetherflowStatus,
  furtherRuinStatus,
  everlastingFlightStatus,
  slipstreamActiveStatus,
  rekindleStatus,
  searingLightStatus,
];

export const smn: CombatAction[] = [
  summonCarbuncle,
  radiantAegis,
  summonBahamut,
  ruin,
  ruin2,
  ruin3,
  astralImpulse,
  fountainOfFire,
  summonTopaz,
  summonTitan,
  summonTitan2,
  topazRite,
  astralFlow,
  mountainBuster,
  gemshine,
  summonEmerald,
  summonGaruda,
  summonGaruda2,
  summonRuby,
  summonIfrit,
  summonIfrit2,
  emeraldRite,
  rubyRite,
  slipstream,
  crimsonCyclone,
  crimsonStrike,
  enkidleBahamut,
  enkidlePhoenix,
  deathflare,
  summonPhoenix,
  rekindle,
  energyDrain,
  ruin4,
  fester,
  searingLight,
  aethercharge,
  dreadwyrnTrance,
  akhMorn,
  revelation,
  wyrmwave,
  scarletFlame,
  resurrection,
  physick,
  outburst,
  triDisaster,
  astralFlare,
  brandofPurgatory,
  preciousBrilliance,
  topazCatastrophe,
  rubyCatastrophe,
  emeraldCatastrophe,
  energySiphon,
  painflare,
  everlastingFlight,
];

export const smnEpics = combineEpics(
  endTitanEpic,
  endIfritEpic,
  endGarudaEpic,
  endTitansFavorEpic,
  endIfritsFavorEpic,
  endGarudasFavorEpic,
  switchToBahamutEpic,
  switchToPhoenixEpic,
  resetTopazEpic,
  resetRubyEpic,
  resetEmeraldEpic
);
