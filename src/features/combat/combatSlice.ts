import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk, RootState } from '../../app/store';
import { getActionById } from '../actions/actions';
import { ActionId } from '../actions/action_enums';
import { StatusId } from '../actions/status_enums';
import { actions } from './actions';
import { CombatAction } from './combat-action';
import { OGCDLockDuration } from './enums';

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
}

export interface CooldownState {
  timestamp: number;
  duration: number;
  timeoutId: NodeJS.Timeout;
}

export interface QueuedActionState {
  actionId: ActionId;
  timeoutId: NodeJS.Timeout;
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
}

const initialState: CombatState = {
  resources: {
    esprit: 0,
    fans: 0,
    step: 0,
    steps: 0,
    step1: 0,
    step2: 0,
    step3: 0,
    step4: 0,
  },
  inCombat: false,
  combo: {},
  cooldowns: {},
  buffs: [],
  debuffs: [],
  queuedAction: null,
  ogcdLock: null,
  pullTimer: null,
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
} = combatSlice.actions;

export const selectCombat = (state: RootState) => state.combat;
export const selectInCombat = (state: RootState) => state.combat.inCombat;
export const selectResources = (state: RootState) => state.combat.resources;
export const selectEspirt = (state: RootState) => state.combat.resources.esprit;
export const selectFans = (state: RootState) => state.combat.resources.fans;
export const selectBuffs = (state: RootState) => state.combat.buffs;
export const selectDebuffs = (state: RootState) => state.combat.debuffs;
export const selectCombo = (state: RootState) => state.combat.combo;
export const selectCooldowns = (state: RootState) => state.combat.cooldowns;
export const selectPullTimer = (state: RootState) => state.combat.pullTimer;

export const selectBuff = createSelector(
  selectBuffs,
  (_: any, id: StatusId) => id,
  (buffs, id) => {
    return buffs.find((b) => b.id === id) || null;
  }
);

export const reset = (): AppThunk => (dispatch, getState) => {
  const state = getState().combat;
  const preservedBuffs = [StatusId.ClosedPosition];
  const buffs = state.buffs.filter((b) => !preservedBuffs.includes(b.id));

  buffs.forEach((b) => dispatch(removeBuff(b.id)));
  state.debuffs.forEach((b) => dispatch(removeDebuff(b.id)));
  Object.keys(state.cooldowns).forEach((k) => dispatch(removeCooldown(k as any)));
  dispatch(breakCombo());
  dispatch(removeQueuedAction());
  dispatch(removeOgcdLock());

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
  (id: StatusId, duration: number | null, stacks: number | null, isHarm: boolean): AppThunk =>
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
          }, duration * 1000)
        : null,
      duration,
      timestamp: Date.now(),
      stacks: stacks || null,
    };

    if (isHarm) {
      dispatch(addDebuff(status));
    } else {
      dispatch(addBuff(status));
    }
  };

export const buff =
  (id: StatusId, duration: number | null, stacks?: number): AppThunk =>
  (dispatch) => {
    dispatch(status(id, duration, stacks || null, false));
  };

export const debuff =
  (id: StatusId, duration: number | null, stacks?: number): AppThunk =>
  (dispatch) => {
    dispatch(status(id, duration, stacks || null, true));
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
  let hasRemainingCharge = false;

  if (maxCharges > 1 && cd) {
    const singleChargeCooldown = combatAction.cooldown(state);
    const currentCharges = maxCharges - Math.ceil((cd.timestamp + cd.duration - Date.now()) / singleChargeCooldown);
    hasRemainingCharge = currentCharges > 0;
  }

  return combatAction.isUsable(state) && (!cd || hasRemainingCharge) && !gcd && !ecd && !ogcdLock;
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

export const addResourceFactory =
  (resourceType: string, max: number) =>
  (amount: number): AppThunk =>
  (dispatch, getState) => {
    const resources = selectResources(getState());
    const value = Math.min(resources[resourceType] + amount, max);

    dispatch(setResource({ resourceType, amount: value }));
  };

export const removeResourceFactory =
  (resourceType: string) =>
  (amount: number): AppThunk =>
  (dispatch, getState) => {
    const resources = selectResources(getState());

    dispatch(setResource({ resourceType, amount: resources[resourceType] - amount }));
  };

export const addEsprit = addResourceFactory('esprit', 100);
export const removeEsprit = removeResourceFactory('esprit');
export const addFans = addResourceFactory('fans', 4);
export const removeFans = removeResourceFactory('fans');

export function hasCombo(state: RootState, id: number) {
  const action = getActionById(id);
  const combat = selectCombat(state);

  return !!combat.combo[action.comboAction!];
}

export function hasBuff(state: RootState, id: number) {
  const combat = selectCombat(state);

  return combat.buffs.some((b) => b.id === id);
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
