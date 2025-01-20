import { useEffect, useState } from 'react';
import { filter, scan, Subject, takeUntil } from 'rxjs';
import { HudItem } from '../hud/HudItem';
import { addEvent, setCombat } from './combatSlice';
import { actionStream$ } from './general';

export const PotencyPerSecondDisplay = () => {
  const [value, setValue] = useState(0);
  const [time, setTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState(0);

  useEffect(() => {
    const unsubscribe = new Subject<void>();

    actionStream$
      .pipe(
        filter((a) => a.type === addEvent.type && a.payload.potency > 0),
        takeUntil(unsubscribe),
        scan((acc, a) => acc + a.payload.potency, 0)
      )
      .subscribe(setValue);

    actionStream$
      .pipe(
        filter((a) => a.type === setCombat.type),
        takeUntil(unsubscribe)
      )
      .subscribe((action) => {
        setTimerRunning(action.payload);
        if (action.payload) {
          setTimerStart(Date.now());
        }
      });

    const timer = setInterval(() => {
      if (timerRunning) {
        setTime(Date.now() - timerStart);
      }
    }, 500);

    return () => {
      unsubscribe.next();
      clearInterval(timer);
    };
  }, [timerRunning, timerStart]);

  return (
    <HudItem name="PotencyPerSecondDisplay" defaultPosition={{ x: 650, y: 175 }}>
      <div className="grid grid-flow-row w-60">
        <div>
          Combat time:{' '}
          <b>
            {Math.floor(time / 60000)
              .toString()
              .padStart(2, '0')}
            :
            {Math.floor((time % 60000) / 1000)
              .toString()
              .padStart(2, '0')}
          </b>
        </div>
        <div>
          Potency per second: <strong>{time ? Math.round(value / (time / 1000)) : 0}</strong>
        </div>
      </div>
    </HudItem>
  );
};
