import { RootState } from '../../app/store';
import { getActionById } from '../actions/actions';
import { ActionId } from '../actions/action_enums';
import { StatusId } from '../actions/status_enums';
import { buffStacks, EventStatus, selectBuffs, selectDebuffs } from './combatSlice';

const always = () => true;
const actionType = (type: string) => (actionId: ActionId) => getActionById(actionId).type === type;
const weaponskill = actionType('Weaponskill');
const spell = actionType('Spell');
const id =
  (...id: number[]) =>
  (actionId: ActionId) =>
    id.includes(actionId);

const bluPhysical = (actionId: ActionId) =>
  id(
    ActionId.DrillCannons,
    ActionId.SharpenedKnife,
    ActionId.TripleTrident,
    ActionId.FinalSting,
    ActionId.FlyingFrenzy,
    ActionId.FourTonzeWeight,
    ActionId.FlyingFrenzy,
    ActionId.Kaltstrahl,
    ActionId.AbyssalTransfixion,
    ActionId.RevengeBlast,
    ActionId.PeripheralSynthesis
  )(actionId);

const bluDarkness = (actionId: ActionId) =>
  id(ActionId.ThousandNeedles, ActionId.Missile, ActionId.Launcher, ActionId.FinalSting)(actionId);

const statusMatchers: Record<number, (actionId: ActionId, state: RootState) => boolean> = {
  [StatusId.Medicated]: always,
  // DRK
  [StatusId.BloodWeapon]: (id) => weaponskill(id) || spell(id),
  [StatusId.Delirium]: id(ActionId.ScarletDelirium, ActionId.Comeuppance, ActionId.Torcleaver, ActionId.Impalement),
  // GNB
  [StatusId.NoMercy]: always,
  // PLD
  [StatusId.Requiescat]: id(
    ActionId.HolySpirit,
    ActionId.HolyCircle,
    ActionId.Confiteor,
    ActionId.BladeofFaith,
    ActionId.BladeofTruth,
    ActionId.BladeofValor
  ),
  [StatusId.DivineMight]: id(ActionId.HolySpirit, ActionId.HolyCircle),
  [StatusId.AtonementReady]: id(ActionId.Atonement),
  // WAR
  [StatusId.InnerRelease]: id(ActionId.FellCleave, ActionId.Decimate),
  // DRG
  [StatusId.BattleLitany]: always,
  [StatusId.LanceCharge]: always,
  [StatusId.LifeSurge]: weaponskill,
  // MNK
  [StatusId.Brotherhood]: always,
  [StatusId.RiddleofFire]: always,
  [StatusId.PerfectBalance]: id(
    ActionId.LeapingOpo,
    ActionId.RisingRaptor,
    ActionId.PouncingCoeurl,
    ActionId.DragonKick,
    ActionId.TwinSnakes,
    ActionId.Demolish,
    ActionId.Rockbreaker,
    ActionId.ShadowoftheDestroyer,
    ActionId.FourpointFury
  ),
  [StatusId.FormlessFist]: id(
    ActionId.LeapingOpo,
    ActionId.RisingRaptor,
    ActionId.PouncingCoeurl,
    ActionId.DragonKick,
    ActionId.TwinSnakes,
    ActionId.Demolish,
    ActionId.Rockbreaker,
    ActionId.ShadowoftheDestroyer,
    ActionId.FourpointFury
  ),
  [StatusId.OpoopoForm]: id(ActionId.LeapingOpo, ActionId.ShadowoftheDestroyer),
  // NIN
  [StatusId.Dokumori]: always,
  [StatusId.KunaisBane]: always,
  [StatusId.Meisui]: id(ActionId.Bhavacakra),
  // RPR
  [StatusId.ArcaneCircle]: always,
  [StatusId.EnhancedHarpe]: id(ActionId.Harpe),
  [StatusId.EnhancedGallows]: id(ActionId.Gallows),
  [StatusId.EnhancedGibbet]: id(ActionId.Gibbet),
  [StatusId.EnhancedCrossReaping]: id(ActionId.CrossReaping),
  [StatusId.EnhancedVoidReaping]: id(ActionId.VoidReaping),
  // SAM
  [StatusId.MeikyoShisui]: (actionId) =>
    weaponskill(actionId) &&
    !id(
      ActionId.OgiNamikiri,
      ActionId.Higanbana,
      ActionId.MidareSetsugekka,
      ActionId.TenkaGoken,
      ActionId.KaeshiNamikiri,
      ActionId.KaeshiSetsugekka,
      ActionId.KaeshiGoken,
      ActionId.Enpi
    )(actionId),
  // BLM
  [StatusId.CircleofPower]: always,
  // SMN
  [StatusId.SearingLight]: always,
  // RDM
  [StatusId.Embolden]: always,
  [StatusId.Manafication]: (actionId) =>
    spell(actionId) ||
    id(
      ActionId.EnchantedRiposte,
      ActionId.EnchantedZwerchhau,
      ActionId.EnchantedRedoublement,
      ActionId.EnchantedMoulinet,
      ActionId.EnchantedMoulinetDeux,
      ActionId.EnchantedMoulinetTrois,
      ActionId.EnchantedReprise
    )(actionId),
  [StatusId.MagickedSwordplay]: id(
    ActionId.EnchantedRiposte,
    ActionId.EnchantedZwerchhau,
    ActionId.EnchantedRedoublement,
    ActionId.EnchantedMoulinet,
    ActionId.EnchantedMoulinetDeux,
    ActionId.EnchantedMoulinetTrois,
    ActionId.EnchantedReprise
  ),
  // BLU
  [StatusId.Boost]: (id) => !bluDarkness(id),
  [StatusId.Harmonized]: bluPhysical,
  [StatusId.Tingling]: bluPhysical,
  [StatusId.WaxingNocturne]: (id) => !bluDarkness(id),
  [StatusId.Offguard]: (id) => !bluDarkness(id),
  [StatusId.PeculiarLight]: (id) => !bluDarkness(id) && !bluPhysical(id),
  [StatusId.SurpanakhasFury]: id(ActionId.Surpanakha),
  // BRD
  [StatusId.BattleVoice]: always,
  [StatusId.RadiantFinale]: always,
  [StatusId.RagingStrikes]: always,
  [StatusId.Barrage]: id(ActionId.RefulgentArrow, ActionId.Shadowbite),
  // DNC
  [StatusId.TechnicalFinish]: always,
  [StatusId.Devilment]: always,
  // MCH
  [StatusId.WildfireBuff]: weaponskill,
  [StatusId.Overheated]: id(
    ActionId.BlazingShot,
    ActionId.AutoCrossbow,
    ActionId.HeatedSplitShot,
    ActionId.HeatedSlugShot,
    ActionId.HeatedCleanShot,
    ActionId.Drill,
    ActionId.AirAnchor
  ),
  [StatusId.Reassembled]: (actionId) => weaponskill(actionId) && !id(ActionId.FullMetalField, ActionId.FlameThrower)(actionId),
  // PCT
  [StatusId.StarryMuse]: always,
  [StatusId.Hyperphantasia]: id(
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
    ActionId.StarPrism
  ),
};

export function collectStatuses(actionId: ActionId, state: RootState): EventStatus[] {
  const buffs = selectBuffs(state);
  const debuffs = selectDebuffs(state);

  return buffs
    .map((b) => b.id)
    .concat(debuffs.map((d) => d.id))
    .filter((id) => statusMatchers[id]?.(actionId, state))
    .map((id) => ({ id, stacks: buffStacks(state, id) }));
}
