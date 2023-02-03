import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk, RootState } from '../../app/store';
import { getActionById } from '../actions/actions';
import { ActionId } from '../actions/action_enums';
import { StatusId } from '../actions/status_enums';
import { selectJob, selectLevel, selectSkillSpeed, selectSpellSpeed } from '../player/playerSlice';
import { actions } from './actions';
import { CombatAction } from './combat-action';
import { OGCDLockDuration } from './enums';

const LevelModifiers: Record<number, { SUB: number; DIV: number }> = {
  90: { SUB: 400, DIV: 1900 },
};

// https://www.akhmorning.com/allagan-studies/how-to-be-a-math-wizard/shadowbringers/speed/#gcds--cast-times
export function recastTime(state: RootState, time: number, type: string) {
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

      typeY = armysMuse ? museMap[armyRepertoire] : armysPaeonActive ? armyRepertoire * 4 : 0;
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
    beast: 0,
    soulVoice: 0,
    wandererCoda: 0,
    mageCoda: 0,
    armyCoda: 0,
    wandererRepertoire: 0,
    armyRepertoire: 0,
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

function addStatus(state: CombatState, status: StatusState, isHarm: boolean) {
  const collection = isHarm ? state.debuffs : state.buffs;

  const existing = collection.find((s) => s.id === status.id);
  if (existing) {
    if (existing.timeoutId) {
      clearTimeout(existing.timeoutId);
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
  if (status.timeoutId) {
    clearTimeout(status.timeoutId);
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
      state.inCombat = false;
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
  removeBuff,
  addDebuff,
  removeDebuff,
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
} = combatSlice.actions;

export const selectCombat = (state: RootState) => state.combat;
export const selectInCombat = (state: RootState) => state.combat.inCombat;
export const selectResources = (state: RootState) => state.combat.resources;
export const selectMana = (state: RootState) => state.combat.resources.mana;
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

export const reset =
  (full: boolean): AppThunk =>
  (dispatch, getState) => {
    const state = getState().combat;
    const preservedBuffs = [StatusId.ClosedPosition, StatusId.Defiance];
    const buffs = full ? state.buffs : state.buffs.filter((b) => !preservedBuffs.includes(b.id));

    buffs.forEach((b) => dispatch(removeBuff(b.id)));
    state.debuffs.forEach((b) => dispatch(removeDebuff(b.id)));
    Object.keys(state.cooldowns).forEach((k) => dispatch(removeCooldown(k as any)));
    dispatch(breakCombo());
    dispatch(removeQueuedAction());
    dispatch(removeOgcdLock());
    dispatch(setCast(null));

    dispatch(clear());
  };

export const combo =
  (actionId: ActionId): AppThunk =>
  (dispatch) => {
    dispatch(
      addCombo({
        actionId,
        timeoutId: setTimeout(() => dispatch(removeCombo(actionId)), 20000),
      })
    );
  };

export const status =
  (
    id: StatusId,
    duration: number | null,
    stacks: number | null,
    isHarm: boolean,
    isVisible: boolean,
    expireCallback: (() => void) | null
  ): AppThunk =>
  (dispatch) => {
    const status: StatusState = {
      id,
      timeoutId: duration
        ? setTimeout(() => {
            if (isHarm) {
              dispatch(removeDebuff(id));
            } else {
              dispatch(removeBuff(id));
            }

            expireCallback && expireCallback();
          }, duration * 1000)
        : null,
      duration,
      timestamp: Date.now(),
      stacks: stacks || null,
      visible: isVisible,
    };

    if (isHarm) {
      dispatch(addDebuff(status));
    } else {
      dispatch(addBuff(status));
    }
  };

export interface StatusOptions {
  stacks?: number;
  isVisible?: boolean;
  expireCallback?: () => void;
}

export const buff =
  (id: StatusId, duration: number | null, options?: StatusOptions): AppThunk =>
  (dispatch) => {
    dispatch(
      status(
        id,
        duration,
        options?.stacks || null,
        false,
        options?.isVisible === undefined ? true : options.isVisible,
        options?.expireCallback || null
      )
    );
  };

export const debuff =
  (id: StatusId, duration: number | null, stacks?: number): AppThunk =>
  (dispatch) => {
    dispatch(status(id, duration, stacks || null, true, true, null));
  };

export const extendableDebuff =
  (id: StatusId, duration: number, maxDuration: number): AppThunk =>
  (dispatch, getState) => {
    let extendedDuration = duration;
    if (hasDebuff(getState(), id)) {
      const combat = selectCombat(getState());

      const status = combat.debuffs.find((b) => b.id === id)!;
      const remainingDuration = status.duration! - (Date.now() - status.timestamp) / 1000;
      extendedDuration = Math.min(extendedDuration + remainingDuration, maxDuration);
    }
    dispatch(debuff(id, extendedDuration));
  };

export const extendableBuff =
  (id: StatusId, duration: number, maxDuration: number): AppThunk =>
  (dispatch, getState) => {
    let extendedDuration = duration;
    if (hasBuff(getState(), id)) {
      const combat = selectCombat(getState());

      const status = combat.buffs.find((b) => b.id === id)!;
      const remainingDuration = status.duration! - (Date.now() - status.timestamp) / 1000;
      extendedDuration = Math.min(extendedDuration + remainingDuration, maxDuration);
    }
    dispatch(buff(id, extendedDuration));
  };

export const removeBuffStack =
  (id: StatusId): AppThunk =>
  (dispatch, getState) => {
    const stacks = buffStacks(getState(), id);
    if (stacks === 1) {
      dispatch(removeBuff(id));
    } else {
      const combat = selectCombat(getState());

      const status = combat.buffs.find((b) => b.id === id)!;
      const remainingDuration = status.duration ? status.duration - (Date.now() - status.timestamp) / 1000 : null;

      dispatch(buff(id, remainingDuration, { stacks: stacks - 1 }));
    }
  };

export const addBuffStack =
  (id: StatusId, duration: number): AppThunk =>
  (dispatch, getState) => {
    const stacks = buffStacks(getState(), id);
    if (stacks === 0) {
      dispatch(buff(id, duration, { stacks: 1 }));
    } else {
      const combat = selectCombat(getState());

      const status = combat.buffs.find((b) => b.id === id)!;
      const remainingDuration = status.duration! - (Date.now() - status.timestamp) / 1000;

      dispatch(buff(id, remainingDuration, { stacks: stacks + 1 }));
    }
  };

export const cooldown =
  (cooldownGroup: number, duration: number): AppThunk =>
  (dispatch) => {
    dispatch(
      addCooldown({
        cooldownGroup,
        timeoutId: setTimeout(() => {
          dispatch(removeCooldown(cooldownGroup));

          if (cooldownGroup === 58) {
            dispatch(drainQueue());
          }
        }, duration),
        duration,
        timestamp: Date.now(),
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
export const removeMana = removeResourceFactory('mana');
export const addEsprit = addResourceFactory('esprit', 100);
export const removeEsprit = removeResourceFactory('esprit');
export const addFans = addResourceFactory('fans', 4);
export const removeFans = removeResourceFactory('fans');
export const addSoul = addResourceFactory('soul', 100);
export const removeSoul = removeResourceFactory('soul');
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
export const removeHeat = removeResourceFactory('heat');
export const addBattery = addResourceFactory('battery', 100);
export const removeBattery = removeResourceFactory('battery');
export const addBeast = addResourceFactory('beast', 100);
export const removeBeast = removeResourceFactory('beast');
export const addSoulVoice = addResourceFactory('soulVoice', 100);
export const removeSoulVoice = removeResourceFactory('soulVoice');
export const addWandererRepertiore = addResourceFactory('wandererRepertoire', 3);
export const setWandererRepertiore = setResourceFactory('wandererRepertoire');
export const addArmyRepertiore = addResourceFactory('armyRepertoire', 4);
export const setArmyRepertiore = setResourceFactory('armyRepertoire');
export const setWandererCoda = setResourceFactory('wandererCoda');
export const setMageCoda = setResourceFactory('mageCoda');
export const setArmyCoda = setResourceFactory('armyCoda');

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
