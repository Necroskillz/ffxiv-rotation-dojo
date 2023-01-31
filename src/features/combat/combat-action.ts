import { AppThunk, RootState } from '../../app/store';
import { getActionById } from '../actions/actions';
import { ActionId } from '../actions/action_enums';
import { StatusId } from '../actions/status_enums';
import { selectPlayer } from '../player/playerSlice';
import {
  breakCombo,
  cooldown,
  CooldownState,
  executeAction,
  hasBuff,
  modifyCooldown,
  ogcdLock,
  removeBuff,
  removeCombo,
  resource,
  selectCombat,
  selectCombo,
  selectInCombat,
  selectResources,
  setCast,
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
  castTime: (state: RootState) => number;
  get isGcdAction(): boolean;
}

export interface ExtraCooldownOptions {
  cooldownGroup: number;
  duration: number;
}

export interface CombatActionExecuteContext {
  comboed: boolean;
}

export interface CombatActionOptions {
  id: ActionId;
  execute: AppThunk<void, CombatActionExecuteContext>;
  isUsable?: (state: RootState) => boolean;
  isGlowing?: (state: RootState) => boolean;
  redirect?: (state: RootState) => ActionId;
  cooldown?: (state: RootState) => number;
  maxCharges?: (state: RootState) => number;
  extraCooldown?: (state: RootState) => ExtraCooldownOptions;
  castTime?: (state: RootState) => number;
  entersCombat?: boolean;
  reducedBySkillSpeed?: boolean;
  reducedBySpellSpeed?: boolean;
  isGcdAction?: boolean;
}

export function createCombatAction(options: CombatActionOptions): CombatAction {
  const action = getActionById(options.id);
  const isGcdAction = options.isGcdAction != null ? options.isGcdAction : action.type === 'Weaponskill' || action.type === 'Spell';

  const combatAction: CombatAction = {
    id: options.id,
    execute: (): AppThunk => (dispatch, getState) => {
      const context: CombatActionExecuteContext = { comboed: false };
      const castTime = combatAction.castTime(getState());

      if (action.comboAction) {
        const combos = selectCombo(getState());
        if (combos[action.comboAction]) {
          context.comboed = true;
          dispatch(removeCombo(action.comboAction));
        }
      }

      if (!action.preservesCombo) {
        dispatch(breakCombo());
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

      function resolve() {
        if (!selectInCombat(getState()) && options.entersCombat !== false) {
          dispatch(setCombat(true));
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

        options.execute(dispatch as any, getState, context);

        dispatch(executeAction({ id: options.id }));
      }

      if (castTime === 0) {
        if (hasBuff(getState(), StatusId.Swiftcast)) {
          dispatch(removeBuff(StatusId.Swiftcast));
        }

        resolve();
      } else {
        const resolveTimer = setTimeout(() => {
          dispatch(setCast(null));
          resolve();
        }, castTime);
        dispatch(setCast({ castTime, timeoutId: resolveTimer, timestamp: Date.now(), actionId: action.id }));
      }
    },
    isGlowing: options.isGlowing || (() => false),
    isUsable: (state) => {
      if (action.costType && action.costType !== 'unknown' && resource(state, action.costType) < action.cost) {
        return false;
      }

      return options.isUsable ? options.isUsable(state) : true;
    },
    redirect: options.redirect || (() => options.id),
    cooldown: (state) => {
      const baseRecast = options.cooldown ? options.cooldown(state) * 1000 : action.recastTime;
      if ((options.reducedBySkillSpeed && action.type === 'Weaponskill') || (options.reducedBySpellSpeed && action.type === 'Spell')) {
        const player = selectPlayer(state);
        return recastTime(baseRecast, player.level, action.type === 'Spell' ? player.spellSpeed : player.skillSpeed);
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
    castTime: (state) => {
      if (hasBuff(state, StatusId.Swiftcast)) {
        return 0;
      }

      const baseCast = options.castTime ? options.castTime(state) * 1000 : action.castTime;
      if (options.reducedBySpellSpeed) {
        const player = selectPlayer(state);
        return recastTime(baseCast, player.level, player.spellSpeed);
      }

      return baseCast;
    },
    isGcdAction,
  };

  return combatAction;
}
