import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { filter, Subject, takeUntil } from 'rxjs';
import { RootState } from '../../app/store';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { executeAction } from './combatSlice';
import { actionStream$ } from './general';
import { getActionById } from '../actions/actions';
import { XivIcon } from '@/components/XivIcon';
import styles from './Timeline.module.css';
import clsx from 'clsx';

interface TimelineAction {
  id: number;
  timestamp: number;
  isGcd: boolean;
  icon: string;
  name: string;
}

export const Timeline = () => {
  const hudLock = useSelector((state: RootState) => selectLock(state));
  const [actions, setActions] = useState<TimelineAction[]>([]);

  const removeAction = (timestamp: number) => {
    setActions((actions) => actions.filter((action) => action.timestamp !== timestamp));
  };

  useEffect(() => {
    const unsubscribe$ = new Subject<void>();

    actionStream$
      .pipe(
        filter((a) => a.type === executeAction.type),
        takeUntil(unsubscribe$)
      )
      .subscribe((action) => {
        const actionInfo = getActionById(action.payload.id);
        if (actionInfo.type === 'Movement') {
          return;
        }

        const isGcd = actionInfo.type === 'Weaponskill' || actionInfo.type === 'Spell';
        const now = Date.now();
        const item: TimelineAction = {
          id: action.payload.id,
          timestamp: now,
          isGcd: isGcd,
          icon: actionInfo.icon,
          name: actionInfo.name,
        };

        setActions((actions) => [...actions, item]);
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
          {actions.map((action) => {
            return (
              <div
                key={action.timestamp}
                className={clsx(
                  'absolute',
                  action.isGcd ? 'w-12 h-12' : 'w-8 h-8',
                  !action.isGcd ? 'top-1' : 'top-10',
                  styles.timeline,
                  styles.timelineEnter
                )}
                onAnimationEnd={() => removeAction(action.timestamp)}
              >
                <XivIcon icon={action.icon} alt={action.name} className="w-full h-full" />
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
