import { FC, useEffect, useState } from 'react';
import { StatusState } from './combatSlice';
import { getStatusById } from '../actions/status';
import { StatusTooltip } from './StatusTooltip';

type BuffProps = {
  buff: StatusState;
};

export const Status: FC<BuffProps> = ({ buff }) => {
  const status = getStatusById(buff.id);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [icon, setIcon] = useState<string>(status.icon);

  useEffect(() => {
    function set() {
      if (buff.duration) {
        setRemainingTime(Math.ceil(buff.duration - (Date.now() - buff.timestamp) / 1000));
        if (buff.stacks && buff.stacks > 1) {
          const stackIcon = status.icon.replace(/(\/i\/\d{6}\/)(\d{6})(_hr1\.png)/, (_: string, start: string, id: string, end: string) => {
            return `${start}${(parseInt(id) + buff.stacks! - 1).toString().padStart(6, '0')}${end}`;
          });

          setIcon(stackIcon);
        } else {
          setIcon(status.icon);
        }
      } else {
        setRemainingTime(null);
      }
    }

    set();
    const timer = setInterval(() => {
      set();
    }, 100);

    return () => clearInterval(timer);
  }, [setRemainingTime, setIcon, buff, status]);

  return (
    <div className="grid grid-flow-row-dense">
      <StatusTooltip status={status} anchorId={`status_${status.id}`} />
      <img id={`status_${status.id}`} src={'https://xivapi.com' + icon} alt={status.name} />
      <div className="justify-self-center self-start text-xl -mt-4 text-teal-300">{remainingTime}</div>
    </div>
  );
};
