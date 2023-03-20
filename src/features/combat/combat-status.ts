import { timer, switchMap, interval, startWith, Subscription } from 'rxjs';
import { AppThunk } from '../../app/store';
import { StatusId } from '../actions/status_enums';
import {
  addBuff,
  addDebuff,
  buffStacks,
  hasBuff,
  hasDebuff,
  removeBuff,
  removeDebuff,
  selectBuff,
  selectDebuff,
  StatusState,
} from './combatSlice';

const periodicSubscriptions: Map<number, Subscription> = new Map();

export interface CombatStatus {
  id: StatusId;
  apply: AppThunk<void, CombatStatusAdditionalOptions>;
  remove: AppThunk<void>;
  extend: AppThunk<void, CombatStatusAdditionalOptions>;
  addStack: AppThunk<void, CombatStatusAdditionalOptions>;
  removeStack: AppThunk<void, CombatStatusAdditionalOptions>;
  tick: AppThunk<void> | null;
  onExpire: AppThunk<void> | null;
  isHarmful: boolean;
  ticksImmediately: boolean;
  firstTickDelay: number;
  tickInterval: number;
  isVisible: boolean;
  initialStacks: number | null;
  duration: number | null;
  maxDuration: number | null;
  maxStacks: number | null;
}

export interface CombatStatusOptions {
  id: StatusId;
  tick?: AppThunk<void> | null;
  onExpire?: AppThunk<void> | null;
  duration: number | null;
  isHarmful: boolean;
  ticksImmediately?: boolean;
  initialDelay?: number;
  interval?: number;
  isVisible?: boolean;
  initialStacks?: number;
  maxDuration?: number;
  maxStacks?: number;
}

export interface CombatStatusAdditionalOptions {
  duration?: number | null;
  stacks?: number;
}

function nextOccurence(initial: number, periodic: number, timePassed: number): number {
  const timeLeft = timePassed % periodic;
  return timeLeft < initial ? initial - timeLeft : periodic - timeLeft;
}

export function createCombatStatus(options: CombatStatusOptions) {
  const id = options.id;

  const combatStatus: CombatStatus = {
    id,
    apply: (dispatch, getState, applyOptions) => {
      const duration = applyOptions.duration ?? combatStatus.duration;
      const stacks = applyOptions.stacks ?? combatStatus.initialStacks;

      const status: StatusState = {
        id: options.id,
        timeoutId: duration
          ? setTimeout(() => {
              dispatch(combatStatus.remove);
            }, duration * 1000)
          : null,
        duration,
        timestamp: Date.now(),
        stacks: stacks,
        visible: combatStatus.isVisible,
      };

      if (combatStatus.tick) {
        if (combatStatus.ticksImmediately && combatStatus.duration! - duration! === 0) {
          dispatch(combatStatus.tick);
        }

        if (hasBuff(getState(), id) || hasDebuff(getState(), id)) {
          periodicSubscriptions.get(id)?.unsubscribe();
        }

        periodicSubscriptions.set(
          id,
          timer(nextOccurence(combatStatus.firstTickDelay, combatStatus.tickInterval, combatStatus.duration! - duration!))
            .pipe(switchMap(() => interval(combatStatus.tickInterval).pipe(startWith(0))))
            .subscribe(() => dispatch(combatStatus.tick!))
        );
      }

      if (combatStatus.isHarmful) {
        dispatch(addDebuff(status));
      } else {
        dispatch(addBuff(status));
      }
    },
    remove: (dispatch) => {
      if (combatStatus.isHarmful) {
        dispatch(removeDebuff(id));
      } else {
        dispatch(removeBuff(id));
      }

      periodicSubscriptions.get(id)?.unsubscribe();
      combatStatus.onExpire && dispatch(combatStatus.onExpire);
    },
    extend: (dispatch, getState, applyOptions) => {
      if (!combatStatus.maxDuration) return;

      let extendedDuration = applyOptions.duration ?? combatStatus.duration!;
      const status = combatStatus.isHarmful ? selectDebuff(getState(), id)! : selectBuff(getState(), id)!;
      if (status) {
        const remainingDuration = status.duration! - (Date.now() - status.timestamp) / 1000;
        extendedDuration = Math.min(extendedDuration + remainingDuration, combatStatus.maxDuration);
      }

      combatStatus.apply(dispatch, getState, { duration: extendedDuration });
    },
    addStack: (dispatch, getState) => {
      const stacks = buffStacks(getState(), id);

      if (combatStatus.maxStacks !== null && stacks >= combatStatus.maxStacks) return;

      if (stacks === 0) {
        combatStatus.apply(dispatch, getState, { stacks: 1 });
      } else {
        const status = combatStatus.isHarmful ? selectDebuff(getState(), id)! : selectBuff(getState(), id)!;
        const remainingDuration = status.duration ? status.duration - (Date.now() - status.timestamp) / 1000 : null;

        combatStatus.apply(dispatch, getState, { duration: remainingDuration, stacks: stacks + 1 });
      }
    },
    removeStack: (dispatch, getState) => {
      const stacks = buffStacks(getState(), id);
      if (stacks === 1) {
        combatStatus.remove(dispatch, getState, null);
      } else {
        const status = combatStatus.isHarmful ? selectBuff(getState(), id)! : selectDebuff(getState(), id)!;
        if (!status) {
          return;
        }

        const remainingDuration = status.duration ? status.duration - (Date.now() - status.timestamp) / 1000 : null;

        combatStatus.apply(dispatch, getState, { duration: remainingDuration, stacks: stacks - 1 });
      }
    },
    tick: options.tick ?? null,
    onExpire: options.onExpire ?? null,
    isHarmful: options.isHarmful,
    ticksImmediately: options.ticksImmediately ?? false,
    firstTickDelay: options.initialDelay ?? (options.isHarmful ? 1000 : 2000),
    tickInterval: options.interval ?? 3000,
    isVisible: options?.isVisible === undefined ? true : options.isVisible,
    initialStacks: options.initialStacks ?? null,
    duration: options.duration,
    maxDuration: options.maxDuration ?? null,
    maxStacks: options.maxStacks ?? null,
  };

  return combatStatus;
}
