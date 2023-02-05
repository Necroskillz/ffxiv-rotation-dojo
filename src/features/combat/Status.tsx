import { FC, useCallback, useEffect, useState } from 'react';
import { StatusState } from './combatSlice';
import { getStatusById } from '../actions/status';
import { StatusTooltip } from './StatusTooltip';

type BuffProps = {
  buff: StatusState;
};

export const Status: FC<BuffProps> = ({ buff }) => {
  const status = getStatusById(buff.id);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  const getIcon = useCallback(() => {
    if (buff.stacks && buff.stacks > 1) {
      const stackIcon = status.icon.replace(/(\/i\/\d{6}\/)(\d{6})(_hr1\.png)/, (_: string, start: string, id: string, end: string) => {
        return `${start}${(parseInt(id) + buff.stacks! - 1).toString().padStart(6, '0')}${end}`;
      });

      return stackIcon;
    } else {
      return status.icon;
    }
  }, [buff.stacks, status]);

  const [icon, setIcon] = useState<string>(getIcon());

  useEffect(() => {
    function set() {
      if (buff.duration) {
        setRemainingTime(Math.round(buff.duration - (Date.now() - buff.timestamp) / 1000));
      } else {
        setRemainingTime(null);
      }

      setIcon(getIcon());
    }

    set();
    const timer = setInterval(() => {
      set();
    }, 100);

    return () => clearInterval(timer);
  }, [setRemainingTime, setIcon, buff, status, getIcon]);

  return (
    <div className="grid grid-flow-row-dense">
      <StatusTooltip status={status} anchorId={`status_${status.id}`} />
      <img id={`status_${status.id}`} src={'https://xivapi.com' + icon} alt={status.name} />
      <div className="justify-self-center self-start text-xl -mt-4 text-teal-300">{remainingTime || null}</div>
    </div>
  );
};
