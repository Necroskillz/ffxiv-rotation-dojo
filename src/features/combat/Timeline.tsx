import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { filter, Subject, takeUntil } from 'rxjs';
import { RootState } from '../../app/store';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { executeAction, clear } from './combatSlice';
import { actionWithStateStream$ } from './general';
import { getActionById } from '../actions/actions';
import { XivIcon } from '@/components/XivIcon';
import styles from './Timeline.module.css';
import clsx from 'clsx';
import { actions } from './actions';

interface TimelineAction {
  id: number;
  timestamp: number;
  isGcd: boolean;
  icon: string;
  name: string;
  gcdDrift?: number; // Time in ms that this GCD was delayed
}

export const Timeline = () => {
  const hudLock = useSelector((state: RootState) => selectLock(state));
  const [timelineActions, setTimelineActions] = useState<TimelineAction[]>([]);
  const lastGcdEndTime = useRef<number | null>(null);

  const removeAction = (timestamp: number) => {
    setTimelineActions((actions) => actions.filter((action) => action.timestamp !== timestamp));
  };

  useEffect(() => {
    const unsubscribe$ = new Subject<void>();

    actionWithStateStream$
      .pipe(
        filter(([action, _state]) => action.type === executeAction.type || action.type === clear.type),
        takeUntil(unsubscribe$)
      )
      .subscribe(([action, state]) => {
        if (action.type === clear.type) {
          lastGcdEndTime.current = null;
          setTimelineActions([]);
          return;
        }

        const actionInfo = getActionById(action.payload.id);
        if (actionInfo.type === 'Movement') {
          return;
        }
        
        const combatAction = actions[action.payload.id];
        const isGcd = combatAction.isGcdAction;
        const [cooldown, globalCooldown] = combatAction.getCooldown(state);
        const timestamp = (isGcd ? globalCooldown?.timestamp : cooldown?.timestamp) ?? Date.now();

        let gcdDrift: number | undefined;
        if (isGcd && lastGcdEndTime.current !== null && timestamp > lastGcdEndTime.current) {
          // If this GCD was used later than when it could have been, calculate drift
          const drift = timestamp - lastGcdEndTime.current;
          if (drift > 50) {
            gcdDrift = drift;
          }
        }

        const item: TimelineAction = {
          id: action.payload.id,
          timestamp,
          isGcd,
          icon: actionInfo.icon,
          name: actionInfo.name,
          gcdDrift,
        };

        setTimelineActions((actions) => [...actions, item]);

        // Update the expected end time for the next GCD using the combat action's cooldown
        if (isGcd) {
          const combatAction = actions[action.payload.id];
          const [, globalCooldown] = combatAction.getCooldown(state);
          if (globalCooldown) {
            lastGcdEndTime.current = globalCooldown.timestamp + globalCooldown.duration;
          }
        }
      });


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
                  styles.timelineEnter
                )}
                onAnimationEnd={() => removeAction(action.timestamp)}
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
