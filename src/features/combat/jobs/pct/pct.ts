import { Epic, combineEpics } from 'redux-observable';
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
  removeBuff,
  resource,
  inCombat,
  ogcdLock,
  removeBuffStack,
  dmgEvent,
  addPalette,
  addWhitePaint,
  setCreatureCanvas,
  setCreaturePortrait,
  setWeaponCanvas,
  setLandscapeCanvas,
  addBuff,
  buffStacks,
  executeAction,
  removeBuffAction,
  setCreaturePortraitCanvas,
  recastTime,
} from '../../combatSlice';
import { filter, switchMap, takeUntil, first, withLatestFrom, of } from 'rxjs';

const consumeHyperphantasiaEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    filter((a) => a.type === addBuff.type && a.payload.id === StatusId.Hyperphantasia),
    switchMap(() =>
      action$.pipe(
        filter(
          (aa) =>
            aa.type === executeAction.type &&
            [
              ActionId.FireinRed,
              ActionId.AeroinGreen,
              ActionId.WaterinBlue,
              ActionId.FireIIinRed,
              ActionId.AeroIIinGreen,
              ActionId.WaterIIinBlue,
              ActionId.BlizzardinCyan,
              ActionId.StoneinYellow,
              ActionId.ThunderinMagenta,
              ActionId.BlizzardIIinCyan,
              ActionId.StoneIIinYellow,
              ActionId.ThunderIIinMagenta,
              ActionId.HolyinWhite,
              ActionId.CometinBlack,
              ActionId.StarPrism,
            ].includes(aa.payload.id)
        ),
        takeUntil(action$.pipe(first((a) => a.type === removeBuffAction.type && a.payload === a.payload.id)))
      )
    ),
    withLatestFrom(state$),
    switchMap(([, state]) => {
      const actions = [removeBuffStack(StatusId.Hyperphantasia)];

      if (buffStacks(state, StatusId.Hyperphantasia) === 1) {
        actions.push(buff(StatusId.RainbowBright));
        actions.push(removeBuff(StatusId.Inspiration));
      }

      return of(...actions);
    })
  );

function whitePaint(state: RootState) {
  return resource(state, 'whitePaint');
}

function palette(state: RootState) {
  return resource(state, 'palette');
}

function creatureCanvas(state: RootState) {
  return resource(state, 'creatureCanvas');
}

function creaturePortrait(state: RootState) {
  return resource(state, 'creaturePortrait');
}

function creaturePortraitCanvas(state: RootState) {
  return resource(state, 'creaturePortraitCanvas');
}

function weaponCanvas(state: RootState) {
  return resource(state, 'weaponCanvas');
}

function landscapeCanvas(state: RootState) {
  return resource(state, 'landscapeCanvas');
}

const aetherhuesStatus: CombatStatus = createCombatStatus({
  id: StatusId.Aetherhues,
  duration: 30,
  isHarmful: false,
});

const aetherhuesIIStatus: CombatStatus = createCombatStatus({
  id: StatusId.AetherhuesII,
  duration: 30,
  isHarmful: false,
});

const hyperphantasiaStatus: CombatStatus = createCombatStatus({
  id: StatusId.Hyperphantasia,
  duration: 30,
  isHarmful: false,
  initialStacks: 5,
  onExpire: (dispatch) => dispatch(removeBuff(StatusId.Inspiration)),
});

const hammerTimeStatus: CombatStatus = createCombatStatus({
  id: StatusId.HammerTime,
  duration: 30,
  isHarmful: false,
  initialStacks: 3,
});

const subtractivePaletteStatus: CombatStatus = createCombatStatus({
  id: StatusId.SubtractivePalette,
  duration: null,
  isHarmful: false,
  initialStacks: 3,
});

const monochromeTonesStatus: CombatStatus = createCombatStatus({
  id: StatusId.MonochromeTones,
  duration: null,
  isHarmful: false,
});

const starryMuseStatus: CombatStatus = createCombatStatus({
  id: StatusId.StarryMuse,
  duration: 20,
  isHarmful: false,
});

const subtractiveSpectrumStatus: CombatStatus = createCombatStatus({
  id: StatusId.SubtractiveSpectrum,
  duration: 30,
  isHarmful: false,
});

const inspirationStatus: CombatStatus = createCombatStatus({
  id: StatusId.Inspiration,
  duration: null,
  isHarmful: false,
});

const starstruckStatus: CombatStatus = createCombatStatus({
  id: StatusId.Starstruck,
  duration: 30,
  isHarmful: false,
});

const rainbowBrightStatus: CombatStatus = createCombatStatus({
  id: StatusId.RainbowBright,
  duration: 30,
  isHarmful: false,
});

const smudgeStatus: CombatStatus = createCombatStatus({
  id: StatusId.Smudge,
  duration: 5,
  isHarmful: false,
});

const temperaCoatStatus: CombatStatus = createCombatStatus({
  id: StatusId.TemperaCoat,
  duration: 10,
  isHarmful: false,
});

const temperaGrassaStatus: CombatStatus = createCombatStatus({
  id: StatusId.TemperaGrassa,
  duration: 10,
  isHarmful: false,
});

const fireInRed: CombatAction = createCombatAction({
  id: ActionId.FireinRed,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.FireinRed, context, { potency: 490 }));
    dispatch(buff(StatusId.Aetherhues));
  },
  reducedBySpellSpeed: true,
  redirect: (state) =>
    hasBuff(state, StatusId.AetherhuesII)
      ? ActionId.WaterinBlue
      : hasBuff(state, StatusId.Aetherhues)
      ? ActionId.AeroinGreen
      : ActionId.FireinRed,
});

const aeroInGreen: CombatAction = createCombatAction({
  id: ActionId.AeroinGreen,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.AeroinGreen, context, { potency: 530 }));
    dispatch(removeBuff(StatusId.Aetherhues));
    dispatch(buff(StatusId.AetherhuesII));
  },
  reducedBySpellSpeed: true,
  isGlowing: () => true,
});

const waterInBlue: CombatAction = createCombatAction({
  id: ActionId.WaterinBlue,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.WaterinBlue, context, { potency: 570 }));
    dispatch(removeBuff(StatusId.AetherhuesII));
    dispatch(addPalette(25));
    dispatch(addWhitePaint(1));
  },
  reducedBySpellSpeed: true,
  isGlowing: () => true,
});

const creatureMotif: CombatAction = createCombatAction({
  id: ActionId.CreatureMotif,
  execute: () => {},
  isUsable: () => false,
  cooldown: (state, baseCooldown) => (!inCombat(state) ? 1.5 : baseCooldown),
  redirect: (state) => {
    const canvas = creatureCanvas(state);
    const portraitCanvas = creaturePortraitCanvas(state);

    if (canvas) {
      return ActionId.CreatureMotif;
    }

    switch (portraitCanvas) {
      case 0:
        return ActionId.PomMotif;
      case 1:
        return ActionId.WingMotif;
      case 2:
        return ActionId.ClawMotif;
      case 3:
        return ActionId.MawMotif;
    }

    return ActionId.CreatureMotif;
  },
});

const pomMotif: CombatAction = createCombatAction({
  id: ActionId.PomMotif,
  execute: (dispatch) => {
    dispatch(setCreatureCanvas(1));
  },
  castTime: (state, baseCastTime) => (!inCombat(state) ? 0 : baseCastTime),
  cooldown: (state, baseCooldown) => (!inCombat(state) ? 1.5 : baseCooldown),
  entersCombat: false,
});

const wingMotif: CombatAction = createCombatAction({
  id: ActionId.WingMotif,
  execute: (dispatch) => {
    dispatch(setCreatureCanvas(2));
  },
  castTime: (state, baseCastTime) => (!inCombat(state) ? 0 : baseCastTime),
  cooldown: (state, baseCooldown) => (!inCombat(state) ? 1.5 : baseCooldown),
  entersCombat: false,
});

const clawMotif: CombatAction = createCombatAction({
  id: ActionId.ClawMotif,
  execute: (dispatch) => {
    dispatch(setCreatureCanvas(3));
  },
  castTime: (state, baseCastTime) => (!inCombat(state) ? 0 : baseCastTime),
  cooldown: (state, baseCooldown) => (!inCombat(state) ? 1.5 : baseCooldown),
  entersCombat: false,
});

const mawMotif: CombatAction = createCombatAction({
  id: ActionId.MawMotif,
  execute: (dispatch) => {
    dispatch(setCreatureCanvas(4));
  },
  castTime: (state, baseCastTime) => (!inCombat(state) ? 0 : baseCastTime),
  cooldown: (state, baseCooldown) => (!inCombat(state) ? 1.5 : baseCooldown),
  entersCombat: false,
});

const livingMuse: CombatAction = createCombatAction({
  id: ActionId.LivingMuse,
  execute: () => {},
  maxCharges: () => 3,
  isUsable: () => false,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
  redirect: (state) => {
    const canvas = creatureCanvas(state);

    switch (canvas) {
      case 1:
        return ActionId.PomMuse;
      case 2:
        return ActionId.WingedMuse;
      case 3:
        return ActionId.ClawedMuse;
      case 4:
        return ActionId.FangedMuse;
    }

    return ActionId.LivingMuse;
  },
});

const pomMuse: CombatAction = createCombatAction({
  id: ActionId.PomMuse,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.PomMuse, context, { potency: 800 }));
    dispatch(setCreatureCanvas(0));
    dispatch(setCreaturePortraitCanvas(1));
  },
  maxCharges: () => 3,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
  isGlowing: () => true,
});

const wingedMuse: CombatAction = createCombatAction({
  id: ActionId.WingedMuse,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.WingedMuse, context, { potency: 800 }));
    dispatch(setCreatureCanvas(0));
    dispatch(setCreaturePortraitCanvas(2));
    dispatch(setCreaturePortrait(1));
  },
  maxCharges: () => 3,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
  isGlowing: () => true,
});

const clawedMuse: CombatAction = createCombatAction({
  id: ActionId.ClawedMuse,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.ClawedMuse, context, { potency: 800 }));
    dispatch(setCreatureCanvas(0));
    dispatch(setCreaturePortraitCanvas(3));
  },
  maxCharges: () => 3,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
  isGlowing: () => true,
});

const fangedMuse: CombatAction = createCombatAction({
  id: ActionId.FangedMuse,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.FangedMuse, context, { potency: 800 }));
    dispatch(setCreatureCanvas(0));
    dispatch(setCreaturePortraitCanvas(0));
    dispatch(setCreaturePortrait(2));
  },
  maxCharges: () => 3,
  extraCooldown: () => ({
    cooldownGroup: 1000,
    duration: 1,
  }),
  isGlowing: () => true,
});

const mogOfTheAges: CombatAction = createCombatAction({
  id: ActionId.MogoftheAges,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.MogoftheAges, context, { potency: 1000 }));
    dispatch(setCreaturePortrait(0));
  },
  isUsable: (state) => creaturePortrait(state) === 1,
  isGlowing: (state) => creaturePortrait(state) === 1,
  redirect: (state) => (creaturePortrait(state) === 2 ? ActionId.RetributionoftheMadeen : ActionId.MogoftheAges),
});

const retributionOfTheMadeen: CombatAction = createCombatAction({
  id: ActionId.RetributionoftheMadeen,
  execute: (dispatch, _, context) => {
    dispatch(ogcdLock());
    dispatch(dmgEvent(ActionId.RetributionoftheMadeen, context, { potency: 1100 }));
    dispatch(setCreaturePortrait(0));
  },
  isGlowing: () => true,
});

const weaponMotif: CombatAction = createCombatAction({
  id: ActionId.WeaponMotif,
  execute: () => {},
  isUsable: () => false,
  cooldown: (state, baseCooldown) => (!inCombat(state) ? 1.5 : baseCooldown),
  redirect: (state) => (weaponCanvas(state) ? ActionId.WeaponMotif : ActionId.HammerMotif),
});

const hammerMotif: CombatAction = createCombatAction({
  id: ActionId.HammerMotif,
  execute: (dispatch) => {
    dispatch(setWeaponCanvas(1));
  },
  castTime: (state, baseCastTime) => (!inCombat(state) ? 0 : baseCastTime),
  cooldown: (state, baseCooldown) => (!inCombat(state) ? 1.5 : baseCooldown),
  entersCombat: false,
});

const steelMuse: CombatAction = createCombatAction({
  id: ActionId.SteelMuse,
  execute: () => {},
  maxCharges: () => 2,
  isUsable: () => false,
  extraCooldown: () => ({
    cooldownGroup: 1001,
    duration: 1,
  }),
  redirect: (state) => (weaponCanvas(state) ? ActionId.StrikingMuse : ActionId.SteelMuse),
});

const strikingMuse: CombatAction = createCombatAction({
  id: ActionId.StrikingMuse,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.HammerTime));
    dispatch(setWeaponCanvas(0));
  },
  maxCharges: () => 2,
  extraCooldown: () => ({
    cooldownGroup: 1001,
    duration: 1,
  }),
  isUsable: (state) => inCombat(state),
  isGlowing: (state) => inCombat(state),
});

const hammerStamp: CombatAction = createCombatAction({
  id: ActionId.HammerStamp,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HammerStamp, context, { potency: 560 }));
    dispatch(combo(ActionId.HammerStamp));
    dispatch(removeBuffStack(StatusId.HammerTime));
  },
  reducedBySpellSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.HammerTime),
  isGlowing: (state) => hasBuff(state, StatusId.HammerTime),
  redirect: (state) =>
    hasCombo(state, ActionId.HammerBrush)
      ? ActionId.HammerBrush
      : hasCombo(state, ActionId.PolishingHammer)
      ? ActionId.PolishingHammer
      : ActionId.HammerStamp,
});

const hammerBrush: CombatAction = createCombatAction({
  id: ActionId.HammerBrush,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HammerStamp, context, { potency: 580 }));
    dispatch(combo(ActionId.HammerBrush));
    dispatch(removeBuffStack(StatusId.HammerTime));
  },
  reducedBySpellSpeed: true,
  isGlowing: () => true,
});

const polishingHammer: CombatAction = createCombatAction({
  id: ActionId.PolishingHammer,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.PolishingHammer, context, { potency: 600 }));
    dispatch(removeBuffStack(StatusId.HammerTime));
  },
  reducedBySpellSpeed: true,
  isGlowing: () => true,
});

const blizzardInCyan: CombatAction = createCombatAction({
  id: ActionId.BlizzardinCyan,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.BlizzardinCyan, context, { potency: 860 }));
    dispatch(buff(StatusId.Aetherhues));
    dispatch(removeBuffStack(StatusId.SubtractivePalette));
  },
  reducedBySpellSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.SubtractivePalette),
  isGlowing: (state) => hasBuff(state, StatusId.SubtractivePalette),
  redirect: (state) =>
    hasBuff(state, StatusId.AetherhuesII)
      ? ActionId.ThunderinMagenta
      : hasBuff(state, StatusId.Aetherhues)
      ? ActionId.StoneinYellow
      : ActionId.BlizzardinCyan,
});

const stoneInYellow: CombatAction = createCombatAction({
  id: ActionId.StoneinYellow,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.StoneinYellow, context, { potency: 900 }));
    dispatch(removeBuff(StatusId.Aetherhues));
    dispatch(buff(StatusId.AetherhuesII));
    dispatch(removeBuffStack(StatusId.SubtractivePalette));
  },
  reducedBySpellSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.SubtractivePalette),
  isGlowing: (state) => hasBuff(state, StatusId.SubtractivePalette),
});

const thunderInMagenta: CombatAction = createCombatAction({
  id: ActionId.ThunderinMagenta,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.ThunderinMagenta, context, { potency: 940 }));
    dispatch(removeBuff(StatusId.AetherhuesII));
    dispatch(removeBuffStack(StatusId.SubtractivePalette));
    dispatch(addWhitePaint(1));
  },
  reducedBySpellSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.SubtractivePalette),
  isGlowing: (state) => hasBuff(state, StatusId.SubtractivePalette),
});

const subtractivePalette: CombatAction = createCombatAction({
  id: ActionId.SubtractivePalette,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.SubtractiveSpectrum));
    dispatch(buff(StatusId.SubtractivePalette));
    dispatch(buff(StatusId.MonochromeTones));
  },
  cost: (state, baseCost) => (hasBuff(state, StatusId.SubtractiveSpectrum) ? 0 : baseCost),
  isGlowing: (state) => palette(state) >= 50 || hasBuff(state, StatusId.SubtractiveSpectrum),
});

const holyInWhite: CombatAction = createCombatAction({
  id: ActionId.HolyinWhite,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.HolyinWhite, context, { potency: 570 }));
  },
  reducedBySpellSpeed: true,
  isUsable: (state) => !hasBuff(state, StatusId.MonochromeTones),
  isGlowing: (state) => !hasBuff(state, StatusId.MonochromeTones) && whitePaint(state) > 0,
});

const cometInBlack: CombatAction = createCombatAction({
  id: ActionId.CometinBlack,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.CometinBlack, context, { potency: 940 }));
    dispatch(removeBuff(StatusId.MonochromeTones));
  },
  reducedBySpellSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.MonochromeTones),
  isGlowing: (state) => hasBuff(state, StatusId.MonochromeTones),
});

const landscapeMotif: CombatAction = createCombatAction({
  id: ActionId.LandscapeMotif,
  execute: () => {},
  isUsable: () => false,
  cooldown: (state, baseCooldown) => (!inCombat(state) ? 1.5 : baseCooldown),
  redirect: (state) => (landscapeCanvas(state) ? ActionId.LandscapeMotif : ActionId.StarrySkyMotif),
});

const starrySkyMotif: CombatAction = createCombatAction({
  id: ActionId.StarrySkyMotif,
  execute: (dispatch) => {
    dispatch(setLandscapeCanvas(1));
  },
  castTime: (state, baseCastTime) => (!inCombat(state) ? 0 : baseCastTime),
  cooldown: (state, baseCooldown) => (!inCombat(state) ? 1.5 : baseCooldown),
  entersCombat: false,
});

const scenicMuse: CombatAction = createCombatAction({
  id: ActionId.ScenicMuse,
  execute: () => {},
  isUsable: () => false,
  redirect: (state) => (landscapeCanvas(state) ? ActionId.StarryMuse : ActionId.ScenicMuse),
});

const starryMuse: CombatAction = createCombatAction({
  id: ActionId.StarryMuse,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(setLandscapeCanvas(0));
    dispatch(buff(StatusId.StarryMuse));
    dispatch(buff(StatusId.SubtractiveSpectrum));
    dispatch(buff(StatusId.Inspiration));
    dispatch(buff(StatusId.Hyperphantasia));
    dispatch(buff(StatusId.Starstruck));
  },
  isUsable: (state) => inCombat(state),
  isGlowing: (state) => inCombat(state),
});

const starPrism: CombatAction = createCombatAction({
  id: ActionId.StarPrism,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.StarPrism, context, { potency: 1100, healthPotency: 400 }));
    dispatch(removeBuff(StatusId.Starstruck));
  },
  reducedBySpellSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.Starstruck),
  isGlowing: (state) => hasBuff(state, StatusId.Starstruck),
});

const rainbowDrip: CombatAction = createCombatAction({
  id: ActionId.RainbowDrip,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.RainbowDrip, context, { potency: 1000 }));
    dispatch(removeBuff(StatusId.RainbowBright));
    dispatch(addWhitePaint(1));
  },
  castTime: (state, baseCastTime) => (hasBuff(state, StatusId.RainbowBright) ? 0 : recastTime(state, baseCastTime * 1000, 'Spell') / 1000),
  cooldown: (state, baseCooldown) =>
    (recastTime(state, baseCooldown * 1000, 'Spell') - (hasBuff(state, StatusId.RainbowBright) ? 3500 : 0)) / 1000,
  isGlowing: (state) => hasBuff(state, StatusId.RainbowBright),
});

const fire2InRed: CombatAction = createCombatAction({
  id: ActionId.FireIIinRed,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.FireIIinRed, context, { potency: 180 }));
    dispatch(buff(StatusId.Aetherhues));
  },
  reducedBySpellSpeed: true,
  redirect: (state) =>
    hasBuff(state, StatusId.AetherhuesII)
      ? ActionId.WaterIIinBlue
      : hasBuff(state, StatusId.Aetherhues)
      ? ActionId.AeroIIinGreen
      : ActionId.FireIIinRed,
});

const aero2InGreen: CombatAction = createCombatAction({
  id: ActionId.AeroIIinGreen,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.AeroIIinGreen, context, { potency: 200 }));
    dispatch(removeBuff(StatusId.Aetherhues));
    dispatch(buff(StatusId.AetherhuesII));
  },
  reducedBySpellSpeed: true,
  isGlowing: () => true,
});

const water2InBlue: CombatAction = createCombatAction({
  id: ActionId.WaterIIinBlue,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.WaterIIinBlue, context, { potency: 220 }));
    dispatch(removeBuff(StatusId.AetherhuesII));
    dispatch(addPalette(25));
    dispatch(addWhitePaint(1));
  },
  reducedBySpellSpeed: true,
  isGlowing: () => true,
});

const blizzard2InCyan: CombatAction = createCombatAction({
  id: ActionId.BlizzardIIinCyan,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.BlizzardIIinCyan, context, { potency: 360 }));
    dispatch(buff(StatusId.Aetherhues));
    dispatch(removeBuffStack(StatusId.SubtractivePalette));
  },
  reducedBySpellSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.SubtractivePalette),
  isGlowing: (state) => hasBuff(state, StatusId.SubtractivePalette),
  redirect: (state) =>
    hasBuff(state, StatusId.AetherhuesII)
      ? ActionId.ThunderIIinMagenta
      : hasBuff(state, StatusId.Aetherhues)
      ? ActionId.StoneIIinYellow
      : ActionId.BlizzardIIinCyan,
});

const stone2InYellow: CombatAction = createCombatAction({
  id: ActionId.StoneIIinYellow,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.StoneIIinYellow, context, { potency: 380 }));
    dispatch(removeBuff(StatusId.Aetherhues));
    dispatch(buff(StatusId.AetherhuesII));
    dispatch(removeBuffStack(StatusId.SubtractivePalette));
  },
  reducedBySpellSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.SubtractivePalette),
  isGlowing: (state) => hasBuff(state, StatusId.SubtractivePalette),
});

const thunder2InMagenta: CombatAction = createCombatAction({
  id: ActionId.ThunderIIinMagenta,
  execute: (dispatch, _, context) => {
    dispatch(dmgEvent(ActionId.ThunderIIinMagenta, context, { potency: 400 }));
    dispatch(removeBuff(StatusId.AetherhuesII));
    dispatch(removeBuffStack(StatusId.SubtractivePalette));
    dispatch(addWhitePaint(1));
  },
  reducedBySpellSpeed: true,
  isUsable: (state) => hasBuff(state, StatusId.SubtractivePalette),
  isGlowing: (state) => hasBuff(state, StatusId.SubtractivePalette),
});

const smudge: CombatAction = createCombatAction({
  id: ActionId.Smudge,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.Smudge));
  },
  entersCombat: false,
});

const temperaCoat: CombatAction = createCombatAction({
  id: ActionId.TemperaCoat,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(buff(StatusId.TemperaCoat));
  },
  redirect: (state) => (hasBuff(state, StatusId.TemperaCoat) ? ActionId.TemperaGrassa : ActionId.TemperaCoat),
  entersCombat: false,
});

const temperaGrassa: CombatAction = createCombatAction({
  id: ActionId.TemperaGrassa,
  execute: (dispatch) => {
    dispatch(ogcdLock());
    dispatch(removeBuff(StatusId.TemperaCoat));
    dispatch(buff(StatusId.TemperaGrassa));
  },
  isUsable: (state) => hasBuff(state, StatusId.TemperaCoat),
  isGlowing: (state) => hasBuff(state, StatusId.TemperaCoat),
  entersCombat: false,
});

export const pctStatuses: CombatStatus[] = [
  aetherhuesStatus,
  aetherhuesIIStatus,
  hyperphantasiaStatus,
  hammerTimeStatus,
  subtractivePaletteStatus,
  monochromeTonesStatus,
  subtractiveSpectrumStatus,
  starryMuseStatus,
  starstruckStatus,
  inspirationStatus,
  rainbowBrightStatus,
  smudgeStatus,
  temperaCoatStatus,
  temperaGrassaStatus,
];

export const pct: CombatAction[] = [
  fireInRed,
  aeroInGreen,
  waterInBlue,
  creatureMotif,
  pomMotif,
  wingMotif,
  clawMotif,
  mawMotif,
  livingMuse,
  pomMuse,
  wingedMuse,
  clawedMuse,
  fangedMuse,
  mogOfTheAges,
  retributionOfTheMadeen,
  weaponMotif,
  hammerMotif,
  steelMuse,
  strikingMuse,
  hammerStamp,
  hammerBrush,
  polishingHammer,
  blizzardInCyan,
  stoneInYellow,
  thunderInMagenta,
  subtractivePalette,
  holyInWhite,
  cometInBlack,
  landscapeMotif,
  starrySkyMotif,
  scenicMuse,
  starryMuse,
  rainbowDrip,
  starPrism,
  fire2InRed,
  aero2InGreen,
  water2InBlue,
  blizzard2InCyan,
  stone2InYellow,
  thunder2InMagenta,
  smudge,
  temperaCoat,
  temperaGrassa,
];

export const pctEpics = combineEpics(consumeHyperphantasiaEpic);
