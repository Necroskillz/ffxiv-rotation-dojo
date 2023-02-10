import { useEffect, useState } from 'react';
import { useAppSelector } from '../../app/hooks';
import { StatusId } from '../actions/status_enums';
import { selectBuff } from './combatSlice';

export function useBuffTimer(id: StatusId) {
  const [remainingTimeMS, setRemaningTimeMS] = useState<number | null>(null);
  const [remainingTime, setRemaningTime] = useState<number | null>(null);
  const [timeMS, setTimeMS] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const status = useAppSelector((state) => selectBuff(state, id));

  useEffect(() => {
    function set() {
      if (status) {
        const time = Date.now() - status.timestamp;
        setTimeMS(time);
        setTime(Math.round(time / 1000));
        const remainingTime = status.duration! * 1000 - time;
        setRemaningTimeMS(remainingTime);
        setRemaningTime(Math.round(remainingTime / 1000));
      } else {
        setRemaningTime(null);
        setRemaningTimeMS(null);
        setTime(null);
        setTimeMS(null);
      }
    }

    set();
    const timer = setInterval(() => set(), 100);

    return () => clearInterval(timer);
  }, [status]);

  return [{ remainingTime, remainingTimeMS }, { time, timeMS }, { status }];
}
