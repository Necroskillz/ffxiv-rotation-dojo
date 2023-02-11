import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { selectPullTimer } from './combatSlice';

import style from './PullTimer.module.css';

const PullTimer = () => {
  const pullTimestamp = useAppSelector(selectPullTimer);
  const hudLock = useAppSelector(selectLock);
  const [seconds, setSeconds] = useState<number | null>(null);
  const [fraction, setFraction] = useState<number | null>(null);

  useEffect(() => {
    function unset() {
      setSeconds(null);
      setFraction(null);
    }

    if (!pullTimestamp) {
      unset();
      return;
    }

    const timerId = setInterval(() => {
      const duration = pullTimestamp - Date.now();

      if (duration <= 0) {
        unset();
        clearInterval(timerId);
        return;
      }

      const seconds = Math.floor(duration / 1000);
      setSeconds(seconds);
      setFraction(Math.floor((duration - seconds * 1000) / 100));
    }, 20);

    return () => {
      if (timerId) clearInterval(timerId);
    };
  });

  return (
    <HudItem name="PullTimer" defaultPosition={{ x: 400, y: 200 }}>
      {hudLock ? (
        <div className={clsx('grid items-end grid-flow-col gap-4 text-pull-timer', style.text)}>
          <span className="text-9xl">{seconds}</span>
          <span className="text-7xl">{fraction}</span>
        </div>
      ) : (
        <div className="h-[130px] w-[200px]">Pull timer</div>
      )}
    </HudItem>
  );
};

export default PullTimer;
