import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk, RootState } from '../../app/store';
import { getActionById } from '../actions/actions';
import { ActionId } from '../actions/action_enums';
import { StatusId } from '../actions/status_enums';
import { selectJob, selectLevel, selectSkillSpeed, selectSpellSpeed } from '../player/playerSlice';
import { stateInitializer } from '../script_engine/state_initializer';
import { actions } from './actions';
import { CombatAction, CombatActionExecuteContext } from './combat-action';
import { StatusTarget } from './combat-status';
import { OGCDLockDuration } from './enums';
import { collectStatuses } from './event-status-collector';
import { statuses } from './statuses';

const LevelModifiers: Record<number, { SUB: number; DIV: number }> = {
  90: { SUB: 400, DIV: 1900 },
  70: { SUB: 364, DIV: 900 },
};

// https://www.akhmorning.com/allagan-studies/how-to-be-a-math-wizard/shadowbringers/speed/#gcds--cast-times
export function recastTime(state: RootState, time: number, type: string, subType?: string) {
  const level = selectLevel(state);
  const speed = type === 'Spell' ? selectSpellSpeed(state) : selectSkillSpeed(state);
  const modifiers = LevelModifiers[level];
  const spd = Math.floor(130 * ((speed - modifiers.SUB) / modifiers.DIV) + 1000);
  const job = selectJob(state);

  let typeY = 0;
  let typeZ = 0;
  let haste = 0;
  let astralUmbral = 100;

  switch (job) {
    case 'BRD':
      const armyRepertoire = selectArmyRepertoire(state);
      const armysPaeonActive = selectBuff(state, StatusId.ArmysPaeonActive);
      const armysMuse = selectBuff(state, StatusId.ArmysMuse);

      const museMap: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 12 };

      typeZ = armysMuse ? museMap[armyRepertoire] : armysPaeonActive ? armyRepertoire * 4 : 0;
      break;
    case 'NIN':
      const huton = selectBuff(state, StatusId.HutonActive);

      typeZ = huton ? 15 : 0;
      break;
    case 'SAM':
      const fuka = selectBuff(state, StatusId.Fuka);

      typeY = fuka ? 13 : 0;
      break;
    case 'MNK':
      typeZ = 20;
      break;
    case 'BLM':
      if (hasBuff(state, StatusId.LeyLines)) {
        typeY = 15;
      }

      if (
        (subType === 'fire' && buffStacks(state, StatusId.UmbralIceActive) === 3) ||
        (subType === 'ice' && buffStacks(state, StatusId.AstralFireActive) === 3)
      ) {
        astralUmbral = 50;
      }
      break;
  }

  const gcd1 = Math.floor(((2000 - spd) * time) / 1000);
  const gcd2 = Math.floor(((100 - typeY) * (100 - haste)) / 100);
  const gcd3 = (100 - typeZ) / 100;
  const gcd4 = Math.floor((((Math.ceil(gcd2 * gcd3) * gcd1) / 1000) * astralUmbral) / 100);

  return gcd4 * 10;
}

export interface LogEvent {
  timestamp: Date;
  message: string;
}

export interface StatusState {
  timestamp: number;
  id: number;
  duration: number | null;
  timeoutId: NodeJS.Timeout | null;
  stacks: number | null;
  visible: boolean;
  target: StatusTarget;
}

export interface CooldownState {
  timestamp: number;
  duration: number;
  timeoutId: NodeJS.Timeout;
}

export interface CastState {
  actionId: ActionId;
  timestamp: number;
  castTime: number;
  timeoutId: NodeJS.Timeout;
}

export interface QueuedActionState {
  actionId: ActionId;
  timeoutId: NodeJS.Timeout;
}

export interface PetState {
  name: string;
}

export interface CombatState {
  resources: Record<string, number>;
  inCombat: boolean;
  combo: Record<number, NodeJS.Timeout>;
  buffs: StatusState[];
  debuffs: StatusState[];
  cooldowns: Record<number, CooldownState>;
  queuedAction: QueuedActionState | null;
  ogcdLock: NodeJS.Timeout | null;
  pullTimer: number | null;
  cast: CastState | null;
  pet: PetState | null;
}

const initialState: CombatState = {
  resources: {
    mana: 10000,
    hp: 10000,
    esprit: 0,
    fans: 0,
    step: 0,
    steps: 0,
    step1: 0,
    step2: 0,
    step3: 0,
    step4: 0,
    soul: 0,
    shroud: 0,
    hell: 0,
    lemure: 0,
    void: 0,
    topaz: 0,
    ruby: 0,
    emerald: 0,
    bahamut: 0,
    heat: 0,
    battery: 0,
    wildfire: 0,
    beast: 0,
    soulVoice: 0,
    wandererCoda: 0,
    mageCoda: 0,
    armyCoda: 0,
    wandererRepertoire: 0,
    armyRepertoire: 0,
    ninki: 0,
    mudra: 0,
    firstmindsFocus: 0,
    eyeOfTheDragon: 0,
    thrust: 0,
    whiteMana: 0,
    blackMana: 0,
    manaStack: 0,
    sen: 0,
    meditation: 0,
    kenki: 0,
    cartridge: 0,
    chakra: 0,
    beastChakra: 0,
    solarNadi: 0,
    lunarNadi: 0,
    blood: 0,
    polyglot: 0,
    paradox: 0,
    umbralHeart: 0,
    oath: 0,
    mimicry: StatusId.AethericMimicryDPS,
  },
  inCombat: false,
  combo: {},
  cooldowns: {},
  buffs: [],
  debuffs: [],
  queuedAction: null,
  ogcdLock: null,
  pullTimer: null,
  cast: null,
  pet: null,
};

export const ResourceTypes = Object.keys(initialState.resources);

export interface AddComboActionPayload {
  actionId: ActionId;
  timeoutId: NodeJS.Timeout;
}

export interface AddCooldownActionPayload {
  cooldownGroup: number;
  duration: number;
  timeoutId: NodeJS.Timeout;
  timestamp: number;
}

export interface ModifyResourceActionPayload {
  resourceType: string;
  amount: number;
}

export enum DamageType {
  None,
  Physical,
  Magical,
  Darkness,
}

export interface EventStatus {
  id: StatusId;
  stacks: number | null;
}

export interface EventPayload {
  potency: number;
  damage: number;
  damagePercent: number;
  healthPotency: number;
  healthPercent: number;
  health: number;
  mana: number;
  actionId: ActionId;
  type: DamageType;
  statuses: EventStatus[];
  comboed: boolean;
}

function addStatus(state: CombatState, status: StatusState, isHarm: boolean) {
  const collection = isHarm ? state.debuffs : state.buffs;

  const existing = collection.find((s) => s.id === status.id);
  if (existing) {
    if (existing.timeoutId) {
      existing.timeoutId && clearTimeout(existing.timeoutId);
    }
    existing.duration = status.duration;
    existing.timeoutId = status.timeoutId;
    existing.timestamp = status.timestamp;
    existing.stacks = status.stacks;
  } else {
    collection.push(status);
  }
}

function removeStatus(state: CombatState, statusId: number, isHarm: boolean) {
  const collection = isHarm ? state.debuffs : state.buffs;

  const status = collection.find((b) => b.id === statusId)!;
  if (status) {
    status.timeoutId && clearTimeout(status.timeoutId);
  }

  const newCollection = collection.filter((b) => b.id !== statusId);

  if (isHarm) {
    state.debuffs = newCollection;
  } else {
    state.buffs = newCollection;
  }
}

export const combatSlice = createSlice({
  name: 'combat',
  initialState,
  reducers: {
    addCombo: (state, action: PayloadAction<AddComboActionPayload>) => {
      state.combo[action.payload.actionId] = action.payload.timeoutId;
    },
    removeCombo: (state, action: PayloadAction<number>) => {
      const timer = state.combo[action.payload];
      clearTimeout(timer);
      delete state.combo[action.payload];
    },
    breakCombo: (state) => {
      Object.keys(state.combo).forEach((k) => clearTimeout(state.combo[k as any]));
      state.combo = {};
    },
    addCooldown: (state, action: PayloadAction<AddCooldownActionPayload>) => {
      state.cooldowns[action.payload.cooldownGroup] = action.payload;
    },
    removeCooldown: (state, action: PayloadAction<number>) => {
      const cd = state.cooldowns[action.payload];
      clearTimeout(cd.timeoutId);
      delete state.cooldowns[action.payload];
    },
    setCooldown: (state, action: PayloadAction<AddCooldownActionPayload>) => {
      const cd = state.cooldowns[action.payload.cooldownGroup];
      clearTimeout(cd.timeoutId);
      cd.duration = action.payload.duration;
      cd.timeoutId = action.payload.timeoutId;
      cd.timestamp = action.payload.timestamp;
    },
    setResource: (state, action: PayloadAction<ModifyResourceActionPayload>) => {
      state.resources[action.payload.resourceType] = action.payload.amount;
    },
    addBuff: (state, action: PayloadAction<StatusState>) => {
      addStatus(state, action.payload, false);
    },
    removeBuff: (state, action: PayloadAction<number>) => {
      removeStatus(state, action.payload, false);
    },
    addDebuff: (state, action: PayloadAction<StatusState>) => {
      addStatus(state, action.payload, true);
    },
    removeDebuff: (state, action: PayloadAction<number>) => {
      removeStatus(state, action.payload, true);
    },
    addPlayerDebuff: (state, action: PayloadAction<StatusState>) => {
      addStatus(state, action.payload, true);
    },
    removePlayerDebuff: (state, action: PayloadAction<number>) => {
      removeStatus(state, action.payload, true);
    },
    queueAction: (state, action: PayloadAction<QueuedActionState>) => {
      state.queuedAction = action.payload;
    },
    removeQueuedAction: (state) => {
      if (state.queuedAction) {
        const timer = state.queuedAction.timeoutId;
        clearTimeout(timer);
        state.queuedAction = null;
      }
    },
    addOgcdLock: (state, action: PayloadAction<NodeJS.Timeout>) => {
      state.ogcdLock = action.payload;
    },
    removeOgcdLock: (state) => {
      if (state.ogcdLock) {
        clearTimeout(state.ogcdLock);
        state.ogcdLock = null;
      }
    },
    setCombat: (state, action: PayloadAction<boolean>) => {
      state.inCombat = action.payload;
    },
    executeAction: (state, action: PayloadAction<{ id: ActionId }>) => {},
    clear: (state) => {
      state.resources = initialState.resources;
      state.pullTimer = null;
    },
    setPullTimer: (state, action: PayloadAction<number | null>) => {
      if (action.payload) {
        state.pullTimer = Date.now() + action.payload * 1000;
      } else {
        state.pullTimer = null;
      }
    },
    setCast: (state, action: PayloadAction<CastState | null>) => {
      if (state.cast && action.payload === null) {
        clearTimeout(state.cast.timeoutId);
      }
      state.cast = action.payload;
    },
    setPet: (state, action: PayloadAction<PetState | null>) => {
      state.pet = action.payload;
    },
    addEvent: (state, action: PayloadAction<EventPayload>) => {},
  },
});

export const {
  addCombo,
  removeCombo,
  breakCombo,
  addCooldown,
  removeCooldown,
  setResource,
  addBuff,
  addDebuff,
  addPlayerDebuff,
  queueAction,
  removeQueuedAction,
  addOgcdLock,
  removeOgcdLock,
  setCombat,
  setCooldown,
  executeAction,
  clear,
  setPullTimer,
  setCast,
  setPet,
  addEvent,
  removeDebuff: removeDebuffAction,
  removeBuff: removeBuffAction,
  removePlayerDebuff: removePlayerDebuffAction,
} = combatSlice.actions;

export const selectCombat = (state: RootState) => state.combat;
export const selectInCombat = (state: RootState) => state.combat.inCombat;
export const selectResources = (state: RootState) => state.combat.resources;
export const selectMana = (state: RootState) => state.combat.resources.mana;
export const selectHp = (state: RootState) => state.combat.resources.hp;
export const selectEspirt = (state: RootState) => state.combat.resources.esprit;
export const selectFans = (state: RootState) => state.combat.resources.fans;
export const selectSoul = (state: RootState) => state.combat.resources.soul;
export const selectShroud = (state: RootState) => state.combat.resources.shroud;
export const selectLemure = (state: RootState) => state.combat.resources.lemure;
export const selectTopaz = (state: RootState) => state.combat.resources.topaz;
export const selectRuby = (state: RootState) => state.combat.resources.ruby;
export const selectEmerald = (state: RootState) => state.combat.resources.emerald;
export const selectVoid = (state: RootState) => state.combat.resources.void;
export const selectHeat = (state: RootState) => state.combat.resources.heat;
export const selectBattery = (state: RootState) => state.combat.resources.battery;
export const selectBeast = (state: RootState) => state.combat.resources.beast;
export const selectSoulVoice = (state: RootState) => state.combat.resources.soulVoice;
export const selectWandererCoda = (state: RootState) => state.combat.resources.wandererCoda;
export const selectMageCoda = (state: RootState) => state.combat.resources.mageCoda;
export const selectArmyCoda = (state: RootState) => state.combat.resources.armyCoda;
export const selectWandererRepertoire = (state: RootState) => state.combat.resources.wandererRepertoire;
export const selectArmyRepertoire = (state: RootState) => state.combat.resources.armyRepertoire;
export const selectNinki = (state: RootState) => state.combat.resources.ninki;
export const selectEyeOfTheDragon = (state: RootState) => state.combat.resources.eyeOfTheDragon;
export const selectFirstmindsFocus = (state: RootState) => state.combat.resources.firstmindsFocus;
export const selectBlackMana = (state: RootState) => state.combat.resources.blackMana;
export const selectWhiteMana = (state: RootState) => state.combat.resources.whiteMana;
export const selectManaStack = (state: RootState) => state.combat.resources.manaStack;
export const selectSen = (state: RootState) => state.combat.resources.sen;
export const selectMeditation = (state: RootState) => state.combat.resources.meditation;
export const selectKenki = (state: RootState) => state.combat.resources.kenki;
export const selectCartridge = (state: RootState) => state.combat.resources.cartridge;
export const selectChakra = (state: RootState) => state.combat.resources.chakra;
export const selectBeastChakra = (state: RootState) => {
  let value = state.combat.resources.beastChakra;
  const currentChakras = [];

  while (value !== 0) {
    currentChakras.unshift(value % 10);
    value = Math.floor(value / 10);
  }

  return currentChakras;
};
export const selectSolarNadi = (state: RootState) => state.combat.resources.solarNadi;
export const selectLunarNadi = (state: RootState) => state.combat.resources.lunarNadi;
export const selectBlood = (state: RootState) => state.combat.resources.blood;
export const selectDarkArts = (state: RootState) => state.combat.resources.darkArts;
export const selectPolyglot = (state: RootState) => state.combat.resources.polyglot;
export const selectParadox = (state: RootState) => state.combat.resources.paradox;
export const selectUmbralHeart = (state: RootState) => state.combat.resources.umbralHeart;
export const selectOath = (state: RootState) => state.combat.resources.oath;
export const selectMimicry = (state: RootState) => state.combat.resources.mimicry;
export const selectBuffs = (state: RootState) => state.combat.buffs;
export const selectDebuffs = (state: RootState) => state.combat.debuffs;
export const selectCombo = (state: RootState) => state.combat.combo;
export const selectCooldowns = (state: RootState) => state.combat.cooldowns;
export const selectPullTimer = (state: RootState) => state.combat.pullTimer;
export const selectCast = (state: RootState) => state.combat.cast;
export const selectPet = (state: RootState) => state.combat.pet;

export const selectBuff = createSelector(
  selectBuffs,
  (_: any, id: StatusId) => id,
  (buffs, id) => {
    return buffs.find((b) => b.id === id) || null;
  }
);

export const selectDebuff = createSelector(
  selectDebuffs,
  (_: any, id: StatusId) => id,
  (debuffs, id) => {
    return debuffs.find((b) => b.id === id) || null;
  }
);

export const reset =
  (full: boolean): AppThunk =>
  (dispatch, getState) => {
    const state = getState().combat;
    const preservedBuffs = [
      StatusId.ClosedPosition,
      StatusId.Defiance,
      StatusId.RoyalGuard,
      StatusId.Grit,
      StatusId.MightyGuard,
      StatusId.AethericMimicryDPS,
      StatusId.AethericMimicryHealer,
      StatusId.AethericMimicryTank,
    ];
    const buffs = full ? state.buffs : state.buffs.filter((b) => !preservedBuffs.includes(b.id));

    dispatch(setCombat(false));
    dispatch(clear());
    buffs.forEach((b) => dispatch(removeBuff(b.id)));
    state.debuffs.forEach((b) => dispatch(removeDebuff(b.id)));
    Object.keys(state.cooldowns).forEach((k) => dispatch(removeCooldown(k as any)));
    dispatch(breakCombo());
    dispatch(removeQueuedAction());
    dispatch(removeOgcdLock());
    dispatch(setCast(null));

    if (!full) {
      dispatch(stateInitializer.initialize);
    }
  };

export const combo =
  (actionId: ActionId): AppThunk =>
  (dispatch) => {
    dispatch(
      addCombo({
        actionId,
        timeoutId: setTimeout(() => dispatch(removeCombo(actionId)), 30000),
      })
    );
  };

export const buff =
  (id: StatusId, options?: { stacks?: number; duration?: number }): AppThunk =>
  (dispatch, getState) => {
    statuses[id].apply(dispatch as any, getState, options || {});
  };

export const debuff = buff;

export const removeBuff =
  (id: StatusId): AppThunk =>
  (dispatch, getState) => {
    if (hasBuff(getState(), id)) {
      dispatch(statuses[id].remove as any);
    }
  };

export const removeDebuff =
  (id: StatusId): AppThunk =>
  (dispatch, getState) => {
    if (hasDebuff(getState(), id)) {
      dispatch(statuses[id].remove as any);
    }
  };

export const extendableBuff =
  (id: StatusId, duration?: number): AppThunk =>
  (dispatch, getState) => {
    statuses[id].extend(dispatch as any, getState, { duration });
  };

export const extendableDebuff = extendableBuff;

export const removeBuffStack =
  (id: StatusId): AppThunk =>
  (dispatch) => {
    dispatch(statuses[id].removeStack as any);
  };

export const addBuffStack =
  (id: StatusId): AppThunk =>
  (dispatch) => {
    dispatch(statuses[id].addStack as any);
  };

export const cooldown =
  (cooldownGroup: number, duration: number, timestamp?: number): AppThunk =>
  (dispatch) => {
    const now = Date.now();
    timestamp = timestamp ?? now;
    const remaining = timestamp + duration - now;

    dispatch(
      addCooldown({
        cooldownGroup,
        timeoutId: setTimeout(() => {
          dispatch(removeCooldown(cooldownGroup));

          if (cooldownGroup === 58 || cooldownGroup >= 1000) {
            dispatch(drainQueue());
          }
        }, remaining),
        duration,
        timestamp,
      })
    );
  };

export const modifyCooldown =
  (cooldownGroup: number, duration: number): AppThunk =>
  (dispatch, getState) => {
    const cooldowns = selectCooldowns(getState());
    const cooldown = cooldowns[cooldownGroup];

    if (!cooldown) {
      return;
    }

    const remaining = cooldown.timestamp + cooldown.duration - Date.now();

    dispatch(
      setCooldown({
        cooldownGroup,
        timeoutId: setTimeout(() => {
          dispatch(removeCooldown(cooldownGroup));

          if (cooldownGroup === 58) {
            dispatch(drainQueue());
          }
        }, remaining + duration),
        duration: cooldown.duration,
        timestamp: cooldown.timestamp + duration,
      })
    );
  };

function isExecutable(state: RootState, combatAction: CombatAction) {
  const combat = selectCombat(state);

  const [cd, gcd, ecd] = combatAction.getCooldown(state);
  const ogcdLock = combat.ogcdLock;
  const maxCharges = combatAction.maxCharges(state);
  const cast = combat.cast;
  let hasRemainingCharge = false;

  if (maxCharges > 1 && cd) {
    const singleChargeCooldown = combatAction.cooldown(state);
    const currentCharges = maxCharges - Math.ceil((cd.timestamp + cd.duration - Date.now()) / singleChargeCooldown);
    hasRemainingCharge = currentCharges > 0;
  }

  return combatAction.isUsable(state) && (!cd || hasRemainingCharge) && !gcd && !ecd && !ogcdLock && !cast;
}

export const queue =
  (actionId: ActionId): AppThunk =>
  (dispatch, getState) => {
    const combatAction = actions[actionId];

    if (isExecutable(getState(), combatAction)) {
      dispatch(combatAction.execute());
    } else {
      dispatch(removeQueuedAction());
      dispatch(
        queueAction({
          actionId,
          timeoutId: setTimeout(() => dispatch(removeQueuedAction()), 600),
        })
      );
    }
  };

export const drainQueue = (): AppThunk => (dispatch, getState) => {
  const combat = selectCombat(getState());
  if (!combat.queuedAction) {
    return;
  }

  const combatAction = actions[combat.queuedAction.actionId];

  if (isExecutable(getState(), combatAction)) {
    dispatch(removeQueuedAction());
    dispatch(combatAction.execute());
  }
};

export const ogcdLock =
  (duration?: number): AppThunk =>
  (dispatch) => {
    dispatch(
      addOgcdLock(
        setTimeout(() => {
          dispatch(removeOgcdLock());
          dispatch(drainQueue());
        }, duration || OGCDLockDuration.Default)
      )
    );
  };

export const gcd =
  (options?: { time?: number; reducedBySkillSpeed?: boolean; reducedBySpellSpeed?: boolean }): AppThunk =>
  (dispatch, getState) => {
    const time = options?.time || 2500;
    const type = options?.reducedBySpellSpeed ? 'Spell' : options?.reducedBySkillSpeed ? 'Weaponskill' : null;
    dispatch(cooldown(58, type ? recastTime(getState(), time, type) : time));
  };

interface EventOptions extends Partial<Omit<EventPayload, 'actionId'>> {}

export const event =
  (actionId: ActionId, options: EventOptions): AppThunk =>
  (dispatch) => {
    if (options.mana) {
      dispatch(addMana(options.mana));
    }

    dispatch(
      addEvent({
        actionId,
        healthPotency: options.healthPotency || 0,
        healthPercent: options.healthPercent || 0,
        damage: options.damage || 0,
        damagePercent: options.damagePercent || 0,
        health: options.health || 0,
        mana: options.mana || 0,
        potency: options.potency || 0,
        type: options.type || DamageType.None,
        statuses: options.statuses || [],
        comboed: !!options.comboed,
      })
    );
  };

export interface DmgEventOptions extends EventOptions {
  comboPotency?: number;
  rearPotency?: number;
  flankPotency?: number;
  rearComboPotency?: number;
  flankComboPotency?: number;
  enhancedPotency?: number;
  rearEnhancedPotency?: number;
  flankEnhancedPotency?: number;
  isEnhanced?: boolean;
  comboMana?: number;
  comboHealthPotency?: number;
}

export const dmgEvent =
  (actionId: ActionId, context: CombatActionExecuteContext, options: DmgEventOptions): AppThunk =>
  (dispatch, getState) => {
    let { mana, healthPotency, type } = options;
    let potency = options.rearPotency || options.flankPotency || options.potency;

    if (options.isEnhanced) {
      potency = options.rearEnhancedPotency || options.flankEnhancedPotency || options.enhancedPotency || potency;
    } else {
      const comboPotency = options.rearComboPotency || options.flankComboPotency || options.comboPotency;
      if (context.comboed) {
        potency = comboPotency || potency;
        mana = options.comboMana;
        healthPotency = options.comboHealthPotency;
      }
    }

    if (!type && actionId) {
      const action = getActionById(actionId);
      if (action.type === 'Weaponskill') {
        type = DamageType.Physical;
      } else if (action.type === 'Spell') {
        type = DamageType.Magical;
      } else {
        if (['RDM', 'SMN', 'BLM', 'BLU'].includes(selectJob(getState()))) {
          type = DamageType.Magical;
        } else {
          type = DamageType.Physical;
        }
      }
    }

    dispatch(
      event(actionId, {
        potency,
        mana,
        healthPotency,
        type,
        comboed: context.comboed,
        statuses: [
          ...collectStatuses(actionId, getState()),
          ...context.consumedStatuses.map((s) => ({ id: s, stacks: buffStacks(getState(), s) + 1 })),
        ],
        healthPercent: options.healthPercent,
      })
    );
  };

export const addResourceFactory =
  (resourceType: string, max: number) =>
  (amount: number): AppThunk =>
  (dispatch, getState) => {
    const resources = selectResources(getState());
    const value = Math.min(resources[resourceType] + amount, max);

    dispatch(setResource({ resourceType, amount: value }));
  };

export const setResourceFactory =
  (resourceType: string) =>
  (amount: number): AppThunk =>
  (dispatch) => {
    dispatch(setResource({ resourceType, amount: amount }));
  };

export const removeResourceFactory =
  (resourceType: string) =>
  (amount: number): AppThunk =>
  (dispatch, getState) => {
    const resources = selectResources(getState());

    dispatch(setResource({ resourceType, amount: resources[resourceType] - amount }));
  };

export const addMana = addResourceFactory('mana', 10000);
export const addHp = addResourceFactory('hp', 10000);
export const setHp = setResourceFactory('hp');
export const addEsprit = addResourceFactory('esprit', 100);
export const addFans = addResourceFactory('fans', 4);
export const addSoul = addResourceFactory('soul', 100);
export const addShroud = addResourceFactory('shroud', 100);
export const removeShroud = removeResourceFactory('shroud');
export const addLemure = addResourceFactory('lemure', 5);
export const removeLemure = removeResourceFactory('lemure');
export const addVoid = addResourceFactory('void', 5);
export const removeVoid = removeResourceFactory('void');
export const setTopaz = setResourceFactory('topaz');
export const removeTitan = removeResourceFactory('topaz');
export const setRuby = setResourceFactory('ruby');
export const removeIfrit = removeResourceFactory('ruby');
export const setEmerald = setResourceFactory('emerald');
export const removeGaruda = removeResourceFactory('emerald');
export const setBahamut = setResourceFactory('bahamut');
export const addHeat = addResourceFactory('heat', 100);
export const addBattery = addResourceFactory('battery', 100);
export const addWildfire = addResourceFactory('wildfire', 6);
export const setWildfire = setResourceFactory('wildfire');
export const addBeast = addResourceFactory('beast', 100);
export const addSoulVoice = addResourceFactory('soulVoice', 100);
export const addWandererRepertiore = addResourceFactory('wandererRepertoire', 3);
export const setWandererRepertiore = setResourceFactory('wandererRepertoire');
export const addArmyRepertiore = addResourceFactory('armyRepertoire', 4);
export const setArmyRepertiore = setResourceFactory('armyRepertoire');
export const setWandererCoda = setResourceFactory('wandererCoda');
export const setMageCoda = setResourceFactory('mageCoda');
export const setArmyCoda = setResourceFactory('armyCoda');
export const addNinki = addResourceFactory('ninki', 100);
export const setMudra = setResourceFactory('mudra');
export const addEyeOfTheDragon = addResourceFactory('eyeOfTheDragon', 2);
export const setEyeOfTheDragon = setResourceFactory('eyeOfTheDragon');
export const addFirstmindsFocus = addResourceFactory('firstmindsFocus', 2);
export const setFirstmindsFocus = setResourceFactory('firstmindsFocus');
export const setThrust = setResourceFactory('thrust');
export const addManaStack = addResourceFactory('manaStack', 3);
export const setManaStack = setResourceFactory('manaStack');
export const setSen = setResourceFactory('sen');
export const addKenki = addResourceFactory('kenki', 100);
export const addMeditation = addResourceFactory('meditation', 3);
export const setMeditation = setResourceFactory('meditation');
export const addCartridge = addResourceFactory('cartridge', 3);
export const addChakra = addResourceFactory('chakra', 5);
export const setBeastChakra = setResourceFactory('beastChakra');
export const setLunarNadi = setResourceFactory('lunarNadi');
export const setSolarNadi = setResourceFactory('solarNadi');
export const addBlood = addResourceFactory('blood', 100);
export const setDarkArts = setResourceFactory('darkArts');
export const setParadox = setResourceFactory('paradox');
export const addPolyglot = addResourceFactory('polyglot', 2);
export const addUmbralHeart = addResourceFactory('umbralHeart', 3);
export const removeUmbralHeart = removeResourceFactory('umbralHeart');
export const addOath = addResourceFactory('oath', 100);
export const setMimicry = setResourceFactory('mimicry');

export function mana(state: RootState) {
  return resource(state, 'mana');
}

export function hasCombo(state: RootState, id: number) {
  const action = getActionById(id);
  const combat = selectCombat(state);

  return !!combat.combo[action.comboAction!];
}

export function hasBuff(state: RootState, id: number) {
  const combat = selectCombat(state);

  return combat.buffs.some((b) => b.id === id);
}

export function hasPet(state: RootState) {
  const combat = selectCombat(state);

  return combat.pet !== null;
}

export function hasDebuff(state: RootState, id: number) {
  const combat = selectCombat(state);

  return combat.debuffs.some((b) => b.id === id);
}

export function buffStacks(state: RootState, id: number) {
  const combat = selectCombat(state);

  return combat.buffs.find((b) => b.id === id)?.stacks || 0;
}

export function resource(state: RootState, resourceType: string) {
  const combat = selectCombat(state);

  return combat.resources[resourceType];
}

export function inCombat(state: RootState) {
  const combat = selectCombat(state);

  return combat.inCombat;
}

export default combatSlice.reducer;
