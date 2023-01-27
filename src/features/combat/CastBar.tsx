import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { GaugeBar } from './GaugeBar';
import { selectCast } from './combatSlice';
import { selectLock } from '../hud/hudSlice';
import { getActionById } from '../actions/actions';

export const CastBar = () => {
  const cast = useAppSelector(selectCast);
  const hudLock = useAppSelector(selectLock);
  const [castTime, setCastTime] = useState<number>(0);
  const [seconds, setSeconds] = useState<string>('');
  const [fraction, setFraction] = useState<string>('');
  const action = useMemo(() => (cast ? getActionById(cast.actionId) : null), [cast]);

  useEffect(() => {
    function set() {
      if (cast) {
        const castProgressTime = Date.now() - cast.timestamp;
        const remainingCastTime = cast.castTime - castProgressTime;
        const seconds = Math.floor(remainingCastTime / 1000);
        setCastTime(castProgressTime);
        setSeconds(seconds.toString().padStart(2, '0'));
        setFraction(Math.floor((remainingCastTime - seconds * 1000) / 10).toString().padEnd(2, '0'));
      } else {
        setSeconds('');
        setFraction('');
        setCastTime(0);
      }
    }

    set();
    const timer = setInterval(() => set(), 1);

    return () => clearInterval(timer);
  }, [cast, setSeconds, setFraction, setCastTime]);

  return (
    <HudItem name="CastBar" defaultPosition={{ x: 200, y: 300 }}>
      {cast && action ? (
        <div className="grid auto-cols-max grid-flow-col gap-2 w-40 gap-0.5 text-xiv-ui">
          <img className="w-10" src={'https://xivapi.com' + action.icon} alt={action.name} />
          <div>
            <div className="text-xs leading-none mb-1">{action.name}</div>
            <GaugeBar
              current={castTime}
              max={cast.castTime}
              texture="linear-gradient(45deg, rgba(134,12,72, 1) 0%, rgba(168,40,100, 1) 50%, rgba(235,133,188, 1) 100%)"
              animate={false}
            />
            <div className="grid grid-flow-col font-ui-light">
              <div className="text-xs">CASTING</div>
              <div className="text-lg leading-0">
                {seconds}.{fraction}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='w-40'>{!hudLock && 'Cast Bar'}</div>
      )}
    </HudItem>
  );
};
