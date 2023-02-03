import { combineEpics, Epic } from 'redux-observable';
import { filter, map, of, switchMap, withLatestFrom } from 'rxjs';
import { AppThunk, RootState } from '../../../../app/store';
import { ActionId } from '../../../actions/action_enums';
import { StatusId } from '../../../actions/status_enums';
import { CombatAction, createCombatAction } from '../../combat-action';
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
    filter((a) => a.type === removeBuff.type && a.payload === StatusId.BahamutActive),
    map(() => setBahamut(1))
  );

const switchToBahamutEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    filter((a) => a.type === removeBuff.type && a.payload === StatusId.PhoenixActive),
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

const resetTopazEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === removeBuff.type && a.payload === StatusId.TitanActive),
    map(() => setTopaz(0))
  );

const resetRubyEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === removeBuff.type && a.payload === StatusId.IfritActive),
    map(() => setRuby(0))
  );

const resetEmeraldEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === removeBuff.type && a.payload === StatusId.GarudaActive),
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
    dispatch(buff(StatusId.RadiantAegis, 30));
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
    dispatch(buff(StatusId.BahamutActive, 15, { isVisible: false }));
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
  execute: (dispatch, getState) => {
    dispatch(buff(StatusId.PhoenixActive, 15, { isVisible: false }));
    dispatch(buff(StatusId.EverlastingFlight, 21));
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
  execute: () => {},
  redirect: ruinRedirect,
  reducedBySpellSpeed: true,
});

const astralImpulse: CombatAction = createCombatAction({
  id: ActionId.AstralImpulse,
  execute: () => {},
  reducedBySpellSpeed: true,
});

const fountainOfFire: CombatAction = createCombatAction({
  id: ActionId.FountainofFire,
  execute: () => {},
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
  execute: (dispatch) => {
    dispatch(buff(StatusId.TitanActive, 30, { isVisible: false }));
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
  execute: (dispatch) => {
    dispatch(buff(StatusId.IfritActive, 30, { isVisible: false }));
    dispatch(setRuby(2));
    dispatch(buff(StatusId.IfritsFavor, null));
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
  execute: (dispatch) => {
    dispatch(buff(StatusId.GarudaActive, 30, { isVisible: false }));
    dispatch(setEmerald(4));
    dispatch(buff(StatusId.GarudasFavor, null));
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
  execute: (dispatch) => {
    dispatch(buff(StatusId.TitansFavor, null));
    dispatch(removeTitan(1));
  },
  reducedBySpellSpeed: true,
});

const emeraldRite: CombatAction = createCombatAction({
  id: ActionId.EmeraldRite,
  execute: (dispatch) => {
    dispatch(removeGaruda(1));
  },
  reducedBySpellSpeed: true,
});

const rubyRite: CombatAction = createCombatAction({
  id: ActionId.RubyRite,
  execute: (dispatch) => {
    dispatch(removeIfrit(1));
  },
  reducedBySpellSpeed: true,
});

const slipstream: CombatAction = createCombatAction({
  id: ActionId.Slipstream,
  execute: (dispatch) => {
    dispatch(removeBuff(StatusId.GarudasFavor));
  },
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const crimsonCyclone: CombatAction = createCombatAction({
  id: ActionId.CrimsonCyclone,
  execute: (dispatch) => {
    dispatch(removeBuff(StatusId.IfritsFavor));
    dispatch(combo(ActionId.CrimsonCyclone));
  },
  isGlowing: () => true,
  reducedBySpellSpeed: true,
});

const crimsonStrike: CombatAction = createCombatAction({
  id: ActionId.CrimsonStrike,
  execute: () => {},
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
  execute: (dispatch) => {
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
  execute: () => {},
  isGlowing: () => true,
});

const rekindle: CombatAction = createCombatAction({
  id: ActionId.Rekindle,
  execute: (dispatch) => {
    dispatch(buff(StatusId.Rekindle, 30));
  },
  isGlowing: () => true,
  entersCombat: false,
});

const enkidleBahamut: CombatAction = createCombatAction({
  id: ActionId.EnkindleBahamut,
  execute: () => {},
  isUsable: (state) => hasBuff(state, StatusId.BahamutActive),
  redirect: (state) => (hasBuff(state, StatusId.PhoenixActive) ? ActionId.EnkindlePhoenix : ActionId.EnkindleBahamut),
});

const enkidlePhoenix: CombatAction = createCombatAction({
  id: ActionId.EnkindlePhoenix,
  execute: () => {},
});

const energyDrain: CombatAction = createCombatAction({
  id: ActionId.EnergyDrain,
  execute: (dispatch) => {
    dispatch(buff(StatusId.Aetherflow, null, { stacks: 2 }));
    dispatch(buff(StatusId.FurtherRuin, 60));
  },
});

const ruin4: CombatAction = createCombatAction({
  id: ActionId.RuinIV,
  execute: (dispatch) => {
    dispatch(removeBuff(StatusId.FurtherRuin));
  },
  isUsable: (state) => hasBuff(state, StatusId.FurtherRuin),
  isGlowing: (state) => hasBuff(state, StatusId.FurtherRuin),
  reducedBySpellSpeed: true,
});

const fester: CombatAction = createCombatAction({
  id: ActionId.Fester,
  execute: (dispatch) => {
    dispatch(removeBuffStack(StatusId.Aetherflow));
  },
  isUsable: (state) => hasBuff(state, StatusId.Aetherflow),
});

const searingLight: CombatAction = createCombatAction({
  id: ActionId.SearingLight,
  execute: (dispatch) => {
    dispatch(buff(StatusId.SearingLight, 30));
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
  execute: () => {},
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
  execute: () => {},
  redirect: triDisasterRedirect,
  reducedBySpellSpeed: true,
});

const astralFlare: CombatAction = createCombatAction({
  id: ActionId.AstralFlare,
  execute: () => {},
  reducedBySpellSpeed: true,
});

const brandofPurgatory: CombatAction = createCombatAction({
  id: ActionId.BrandofPurgatory,
  execute: () => {},
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
  execute: (dispatch) => {
    dispatch(buff(StatusId.TitansFavor, null));
    dispatch(removeTitan(1));
  },
  reducedBySpellSpeed: true,
});

const emeraldCatastrophe: CombatAction = createCombatAction({
  id: ActionId.EmeraldCatastrophe,
  execute: (dispatch) => {
    dispatch(removeGaruda(1));
  },
  reducedBySpellSpeed: true,
});

const rubyCatastrophe: CombatAction = createCombatAction({
  id: ActionId.RubyCatastrophe,
  execute: (dispatch) => {
    dispatch(removeIfrit(1));
  },
  reducedBySpellSpeed: true,
});

const energySiphon: CombatAction = createCombatAction({
  id: ActionId.EnergySiphon,
  execute: (dispatch) => {
    dispatch(buff(StatusId.Aetherflow, null, { stacks: 2 }));
    dispatch(buff(StatusId.FurtherRuin, 60));
  },
});

const painflare: CombatAction = createCombatAction({
  id: ActionId.Painflare,
  execute: (dispatch) => {
    dispatch(removeBuffStack(StatusId.Aetherflow));
  },
  isUsable: (state) => hasBuff(state, StatusId.Aetherflow),
});

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
