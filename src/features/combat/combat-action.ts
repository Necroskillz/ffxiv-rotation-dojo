import { AppThunk, RootState } from '../../app/store';
import { getActionById } from '../actions/actions';
import { ActionId } from '../actions/action_enums';
import { StatusId } from '../actions/status_enums';
import { selectJob } from '../player/playerSlice';
import {
  breakCombo,
  buff,
  cooldown,
  CooldownState,
  drainQueue,
  executeAction,
  hasBuff,
  modifyCooldown,
  ogcdLock,
  recastTime,
  removeBuff,
  removeBuffStack,
  removeCombo,
  resource,
  selectCombat,
  selectCombo,
  selectHp,
  selectInCombat,
  selectResources,
  setCast,
  setCombat,
  setPreviousGCDAction,
  setResource,
} from './combatSlice';
import { OGCDLockDuration } from './enums';

const subTypeMap: Record<number, string> = {
  [ActionId.Fire]: 'fire',
  [ActionId.FireIII]: 'fire',
  [ActionId.FireIV]: 'fire',
  [ActionId.HighFireII]: 'fire',
  [ActionId.Flare]: 'fire',
  [ActionId.Despair]: 'fire',
  [ActionId.Blizzard]: 'ice',
  [ActionId.BlizzardIII]: 'ice',
  [ActionId.BlizzardIV]: 'ice',
  [ActionId.Freeze]: 'ice',
  [ActionId.HighBlizzardII]: 'ice',
  [ActionId.FireinRed]: 'inspired',
  [ActionId.AeroinGreen]: 'inspired',
  [ActionId.WaterinBlue]: 'inspired',
  [ActionId.FireIIinRed]: 'inspired',
  [ActionId.AeroIIinGreen]: 'inspired',
  [ActionId.WaterIIinBlue]: 'inspired',
  [ActionId.BlizzardinCyan]: 'inspired',
  [ActionId.StoneinYellow]: 'inspired',
  [ActionId.ThunderinMagenta]: 'inspired',
  [ActionId.BlizzardIIinCyan]: 'inspired',
  [ActionId.StoneIIinYellow]: 'inspired',
  [ActionId.ThunderIIinMagenta]: 'inspired',
  [ActionId.HolyinWhite]: 'inspired',
  [ActionId.CometinBlack]: 'inspired',
  [ActionId.StarPrism]: 'inspired',
};

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
  cost: (state: RootState) => number;
  get isGcdAction(): boolean;
  bluNo: number;
}

export interface ExtraCooldownOptions {
  cooldownGroup: number;
  duration: number;
}

export interface CombatActionExecuteContext {
  comboed: boolean;
  cost: number;
  consumedStatuses: StatusId[];
  startedCombat?: boolean;
}

export interface CombatActionOptions {
  id: ActionId;
  execute: AppThunk<void, CombatActionExecuteContext>;
  isUsable?: (state: RootState) => boolean;
  isGlowing?: (state: RootState) => boolean;
  redirect?: (state: RootState) => ActionId;
  cooldown?: (state: RootState, baseCooldown: number) => number;
  maxCharges?: (state: RootState) => number;
  extraCooldown?: (state: RootState) => ExtraCooldownOptions;
  castTime?: (state: RootState, baseCastTime: number) => number;
  cost?: (state: RootState, baseCost: number) => number;
  cooldownGroup?: (state: RootState) => number;
  entersCombat?: boolean;
  reducedBySkillSpeed?: boolean;
  reducedBySpellSpeed?: boolean;
  isGcdAction?: boolean;
  animationLock?: number;
  bluNo?: number;
}

export function createCombatAction(options: CombatActionOptions): CombatAction {
  const action = getActionById(options.id);
  const isGcdAction = options.isGcdAction != null ? options.isGcdAction : action.type === 'Weaponskill' || action.type === 'Spell';

  function getCooldownGroup(state: RootState) {
    return options.cooldownGroup ? options.cooldownGroup(state) : action.cooldownGroup;
  }

  const combatAction: CombatAction = {
    id: options.id,
    execute: (): AppThunk => (dispatch, getState) => {
      const context: CombatActionExecuteContext = { comboed: false, cost: 0, consumedStatuses: [] };
      const castTime = combatAction.castTime(getState());

      if (action.comboAction) {
        const combos = selectCombo(getState());
        if (combos[action.comboAction]) {
          context.comboed = true;
        }
      }

      if (!action.preservesCombo) {
        dispatch(breakCombo());
      }

      if (action.type !== 'Movement') {
        if (options.extraCooldown) {
          const extraCooldown = options.extraCooldown(getState());
          if (extraCooldown) {
            dispatch(cooldown(extraCooldown.cooldownGroup, extraCooldown.duration * 1000));
          }
        }

        if (combatAction.maxCharges(getState()) > 1 && combatAction.getCooldown(getState())[0]) {
          dispatch(modifyCooldown(getCooldownGroup(getState()), combatAction.cooldown(getState())));
        } else {
          dispatch(cooldown(getCooldownGroup(getState()), combatAction.cooldown(getState())));
        }

        if (isGcdAction) {
          dispatch(ogcdLock(options.animationLock != null ? options.animationLock : OGCDLockDuration.GCD));
        }
      }

      function resolve() {
        if (!combatAction.isUsable(getState())) {
          return;
        }

        if (action.comboAction) {
          dispatch(removeCombo(action.comboAction));
        }

        if (!selectInCombat(getState()) && options.entersCombat !== false) {
          context.startedCombat = true;
          dispatch(setCombat(true));
        }
        const cost = combatAction.cost(getState());

        if (cost) {
          context.cost = cost;
          const resources = selectResources(getState());

          action.costType!.split(',').forEach((ct) => {
            dispatch(
              setResource({
                resourceType: ct,
                amount: resources[ct] - cost,
              })
            );
          });
        }

        options.execute(dispatch as any, getState, context);

        dispatch(executeAction({ id: options.id }));

        if (combatAction.isGcdAction) {
          dispatch(setPreviousGCDAction(action.id));
        }
      }

      if (castTime === 0) {
        if (action.castTime > 0) {
          if (
            hasBuff(getState(), StatusId.Acceleration) &&
            [ActionId.VerthunderIII, ActionId.VeraeroIII, ActionId.Impact].includes(action.id)
          ) {
            context.consumedStatuses.push(StatusId.Acceleration);
            dispatch(removeBuff(StatusId.Acceleration));
          } else if (hasBuff(getState(), StatusId.Dualcast)) {
            context.consumedStatuses.push(StatusId.Dualcast);
            dispatch(removeBuff(StatusId.Dualcast));
          } else if (hasBuff(getState(), StatusId.Triplecast)) {
            context.consumedStatuses.push(StatusId.Triplecast);
            dispatch(removeBuffStack(StatusId.Triplecast));
          } else if (hasBuff(getState(), StatusId.Swiftcast)) {
            context.consumedStatuses.push(StatusId.Swiftcast);
            dispatch(removeBuff(StatusId.Swiftcast));
          }
        }

        resolve();
        dispatch(drainQueue());
      } else {
        const resolveTimer = setTimeout(() => {
          dispatch(setCast(null));

          resolve();

          if (selectJob(getState()) === 'RDM') {
            dispatch(buff(StatusId.Dualcast));
          }

          dispatch(drainQueue());
        }, castTime);
        dispatch(setCast({ castTime, timeoutId: resolveTimer, timestamp: Date.now(), actionId: action.id }));
      }
    },
    isGlowing: options.isGlowing || (() => false),
    isUsable: (state) => {
      if (selectHp(state) === 0) {
        return false;
      }

      if (action.costType && action.costType !== 'unknown' && resource(state, action.costType) < combatAction.cost(state)) {
        return false;
      }

      return options.isUsable ? options.isUsable(state) : true;
    },
    redirect: options.redirect || (() => options.id),
    cooldown: (state) => {
      const baseRecast = options.cooldown ? options.cooldown(state, action.recastTime / 1000) * 1000 : action.recastTime;
      
      if (options.reducedBySpellSpeed || options.reducedBySkillSpeed) {
        return recastTime(state, baseRecast, action.type, subTypeMap[action.id]);
      }

      return baseRecast;
    },
    maxCharges: options.maxCharges || (() => action.maxCharges),
    getCooldown: (state) => {
      let cooldown: CooldownState | null = null;
      let globalCooldown: CooldownState | null = null;
      let extraCooldown: CooldownState | null = null;
      const combat = selectCombat(state);
      const cooldownGroup = getCooldownGroup(state);

      if (cooldownGroup !== 58) {
        cooldown = combat.cooldowns[cooldownGroup];
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
      if (hasBuff(state, StatusId.Swiftcast) || hasBuff(state, StatusId.Dualcast) || hasBuff(state, StatusId.Triplecast)) {
        return 0;
      }

      const baseCast = options.castTime ? options.castTime(state, action.castTime / 1000) * 1000 : action.castTime;
      if (options.reducedBySpellSpeed || options.reducedBySkillSpeed) {
        return recastTime(state, baseCast, action.type, subTypeMap[action.id]);
      }

      return baseCast;
    },
    cost: (state) => (options.cost ? options.cost(state, action.cost) : action.cost),
    isGcdAction,
    bluNo: options.bluNo ?? 0,
  };

  return combatAction;
}
