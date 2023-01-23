import { AppThunk, RootState } from '../../app/store';
import { getActionById } from '../actions/actions';
import { ActionId } from '../actions/action_enums';
import { selectPlayer } from '../player/playerSlice';
import {
  breakCombo,
  cooldown,
  CooldownState,
  executeAction,
  modifyCooldown,
  ogcdLock,
  removeCombo,
  selectCombat,
  selectCombo,
  selectInCombat,
  selectResources,
  setCombat,
  setResource,
} from './combatSlice';
import { OGCDLockDuration } from './enums';

const LevelModifiers: Record<number, { SUB: number; DIV: number }> = {
  90: { SUB: 400, DIV: 1900 },
};

export function recastTime(baseRecast: number, level: number, speed: number) {
  const modifiers = LevelModifiers[level];
  return Math.floor((baseRecast * (1000 + Math.ceil((130 * (modifiers.SUB - speed)) / modifiers.DIV))) / 10000) * 10;
}

export interface CombatAction {
  id: ActionId;
  execute: () => AppThunk<void>;
  isUsable: (state: RootState) => boolean;
  isGlowing: (state: RootState) => boolean;
  getCooldown: (state: RootState) => [CooldownState | null, CooldownState | null, CooldownState | null];
  redirect: (state: RootState) => ActionId;
  cooldown: (state: RootState) => number;
  maxCharges: (state: RootState) => number;
  get isGcdAction(): boolean;
}

export interface ExtraCooldownOptions {
  cooldownGroup: number;
  duration: number;
}

export interface CombatActionOptions {
  id: ActionId;
  execute: AppThunk;
  isUsable?: (state: RootState) => boolean;
  isGlowing?: (state: RootState) => boolean;
  redirect?: (state: RootState) => ActionId;
  cooldown?: (state: RootState) => number;
  maxCharges?: (state: RootState) => number;
  extraCooldown?: (state: RootState) => ExtraCooldownOptions;
  entersCombat?: boolean;
  recastReducedBySpeed?: boolean;
}

export function createCombatAction(options: CombatActionOptions): CombatAction {
  const action = getActionById(options.id);
  const isGcdAction = action.type === 'Weaponskill' || action.type === 'Spell';

  const combatAction: CombatAction = {
    id: options.id,
    execute: (): AppThunk => (dispatch, getState) => {
      if (!selectInCombat(getState()) && options.entersCombat !== false) {
        dispatch(setCombat(true));
      }

      if (action.comboAction) {
        const combos = selectCombo(getState());
        if (combos[action.comboAction]) {
          dispatch(removeCombo(action.comboAction));
        }
      }

      if (!action.preservesCombo) {
        dispatch(breakCombo());
      }

      if (action.cost) {
        const resources = selectResources(getState());
        dispatch(
          setResource({
            resourceType: action.costType!,
            amount: resources[action.costType!] - action.cost,
          })
        );
      }

      if (options.extraCooldown) {
        const extraCooldown = options.extraCooldown(getState());
        if (extraCooldown) {
          dispatch(cooldown(extraCooldown.cooldownGroup, extraCooldown.duration * 1000));
        }
      }

      if (combatAction.maxCharges(getState()) > 1 && combatAction.getCooldown(getState())[0]) {
        dispatch(modifyCooldown(action.cooldownGroup, combatAction.cooldown(getState())));
      } else {
        dispatch(cooldown(action.cooldownGroup, combatAction.cooldown(getState())));
      }

      if (isGcdAction) {
        dispatch(ogcdLock(OGCDLockDuration.GCD));
      }

      options.execute(dispatch, getState, null);

      dispatch(executeAction({ id: options.id }));
    },
    isGlowing: options.isGlowing || (() => false),
    isUsable: options.isUsable || (() => true),
    redirect: options.redirect || (() => options.id),
    cooldown: (state) => {
      const baseRecast = options.cooldown ? options.cooldown(state) * 1000 : action.recastTime;
      if (options.recastReducedBySpeed) {
        const player = selectPlayer(state);
        return recastTime(baseRecast, player.level, player.speed);
      }

      return baseRecast;
    },
    maxCharges: options.maxCharges || (() => action.maxCharges),
    getCooldown: (state) => {
      let cooldown: CooldownState | null = null;
      let globalCooldown: CooldownState | null = null;
      let extraCooldown: CooldownState | null = null;
      const combat = selectCombat(state);

      if (action.cooldownGroup !== 58) {
        cooldown = combat.cooldowns[action.cooldownGroup];
      }

      if (isGcdAction) {
        globalCooldown = combat.cooldowns[58];
      }

      if (options.extraCooldown) {
        const extraCd = options.extraCooldown(state);
        if (extraCd) {
          extraCooldown = combat.cooldowns[extraCd.cooldownGroup];
        }
      }

      return [cooldown, globalCooldown, extraCooldown];
    },
    isGcdAction,
  };

  return combatAction;
}
