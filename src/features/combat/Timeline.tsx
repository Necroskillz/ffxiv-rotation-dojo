import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { filter, Subject, takeUntil } from 'rxjs';
import { PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { executeAction, clear, setCast, CastState } from './combatSlice';
import { actionWithStateStream$ } from './general';
import { getActionById } from '../actions/actions';
import { XivIcon } from '@/components/XivIcon';
import styles from './Timeline.module.css';
import clsx from 'clsx';
import { CombatAction } from './combat-action';
import { actions } from './actions';
import { ActionId } from '../actions/action_enums';

interface TimelineAction {
  id: number;
  timestamp: number;
  isGcd: boolean;
  icon: string;
  name: string;
  gcdDrift?: number; // Time in ms that this GCD was delayed
  cancelled: boolean;
}

export const Timeline = () => {
  const hudLock = useSelector((state: RootState) => selectLock(state));
  const [timelineActions, setTimelineActions] = useState<TimelineAction[]>([]);
  const nextExpectedActionTime = useRef<number | null>(null);
  const cast = useRef<number | null>(null);

  const addTimelineAction = (combatAction: CombatAction, timestamp: number, callback: () => void) => {
    let gcdDrift: number | undefined;
    const expected = nextExpectedActionTime.current;

    if (combatAction.isGcdAction && expected !== null && timestamp > expected) {
      const drift = timestamp - expected;
      if (drift > 50) {
        gcdDrift = drift;
      }
    }

    const actionInfo = getActionById(combatAction.id);
    const item: TimelineAction = {
      id: combatAction.id,
      timestamp,
      isGcd: combatAction.isGcdAction,
      icon: actionInfo.icon,
      name: actionInfo.name,
      gcdDrift,
      cancelled: false,
    };

    setTimelineActions((actions) => [...actions, item]);
    callback();
  };

  const removeTimlineAction = (timestamp: number) => {
    setTimelineActions((actions) => actions.filter((action) => action.timestamp !== timestamp));
  };

  const handleClearAction = () => {
    nextExpectedActionTime.current = null;
    cast.current = null;
    setTimelineActions([]);
  };

  const handleSetCastAction = (action: PayloadAction<CastState | null>, state: RootState) => {
    if (!action.payload) {
      return;
    }

    const combatAction = actions[action.payload.actionId];
    cast.current = action.payload.actionId;
    const timestamp = action.payload.timestamp;
    const castTime = combatAction.castTime(state);

    const [_, globalCooldown] = combatAction.getCooldown(state);
    if (!globalCooldown) {
      throw new Error('[Timeline] No global cooldown found after set cast');
    }

    addTimelineAction(combatAction, timestamp, () => {
      nextExpectedActionTime.current = Math.max(timestamp + castTime, globalCooldown.timestamp + globalCooldown.duration);
    });
  };

  const handleMovementAction = () => {
    setTimelineActions((actions) => {
      const newActions = [...actions];
      for (let i = newActions.length - 1; i >= 0; i--) {
        if (cast.current === newActions[i].id) {
          newActions[i] = { ...newActions[i], cancelled: true };
          break;
        }
      }
      return newActions;
    });
    nextExpectedActionTime.current = Date.now();
  };

  const handleExecuteAction = (action: PayloadAction<{ id: ActionId }>, state: RootState) => {
    if (cast.current === action.payload.id) {
      cast.current = null;
      return;
    }

    const combatAction = actions[action.payload.id];
    const [cooldown, globalCooldown] = combatAction.getCooldown(state);
    const timestamp = combatAction.isGcdAction ? globalCooldown?.timestamp : cooldown?.timestamp;

    if (!timestamp) {
      throw new Error('[Timeline] No cooldown found after execute action');
    }

    addTimelineAction(combatAction, timestamp, () => {
      if (globalCooldown) {
        nextExpectedActionTime.current = globalCooldown.timestamp + globalCooldown.duration;
      }
    });
  };

  useEffect(() => {
    const unsubscribe$ = new Subject<void>();

    // Clear subscription
    actionWithStateStream$
      .pipe(
        filter(([action, _state]) => action.type === clear.type),
        takeUntil(unsubscribe$)
      )
      .subscribe(() => handleClearAction());

    // Cast subscription
    actionWithStateStream$
      .pipe(
        filter(([action, _state]) => action.type === setCast.type),
        takeUntil(unsubscribe$)
      )
      .subscribe(([action, state]) => handleSetCastAction(action, state));

    // Movement action subscription
    actionWithStateStream$
      .pipe(
        filter(([action, _state]) => action.type === executeAction.type),
        filter(([action, _state]) => getActionById(action.payload.id).type === 'Movement'),
        takeUntil(unsubscribe$)
      )
      .subscribe(() => handleMovementAction());

    // Execute action subscription (non-movement)
    actionWithStateStream$
      .pipe(
        filter(([action, _state]) => action.type === executeAction.type),
        filter(([action, _state]) => getActionById(action.payload.id).type !== 'Movement'),
        takeUntil(unsubscribe$)
      )
      .subscribe(([action, state]) => handleExecuteAction(action, state));

    return () => {
      unsubscribe$.next();
      unsubscribe$.complete();
    };
  }, []);

  const timeMarkers = Array.from({ length: 12 }, (_, i) => {
    const seconds = -i;
    const position = 545 - (i - 1) * (600 / 12);
    return (
      <div key={i} className={styles.timeMarker} style={{ left: position }}>
        {seconds}s
      </div>
    );
  });

  return (
    <HudItem name="Timeline" defaultPosition={{ x: 650, y: 570 }}>
      {hudLock ? (
        <div className={`w-[601px] h-[110px] relative overflow-hidden ${styles.timelineContainer}`}>
          {timeMarkers}
          {timelineActions.map((action) => {
            return (
              <div
                key={action.timestamp}
                className={clsx(
                  'absolute',
                  action.isGcd ? 'w-12 h-12' : 'w-8 h-8',
                  !action.isGcd ? 'top-1' : 'top-10',
                  styles.timelineEnter,
                  { [styles.cancelled]: action.cancelled }
                )}
                onAnimationEnd={() => removeTimlineAction(action.timestamp)}
              >
                {action.gcdDrift && (
                  <div
                    className={clsx('absolute bg-red-500/30', 'h-12 top-0 flex flex-col items-end justify-center pr-1')}
                    style={{
                      width: `${(action.gcdDrift / 1000) * 50}px`,
                      right: '100%',
                    }}
                  >
                    <span className="text-red-500 text-[10px] leading-none">drift</span>
                    <span className="text-red-500 text-[10px] leading-none">{(action.gcdDrift / 1000).toFixed(2)}s</span>
                  </div>
                )}
                <XivIcon icon={action.icon} alt={action.name} className="relative z-10" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-[600px] h-[110px]">Timeline</div>
      )}
    </HudItem>
  );
};
