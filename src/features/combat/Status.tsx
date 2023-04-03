import { FC, useCallback, useEffect, useState } from 'react';
import { StatusState } from './combatSlice';
import { getStatusById } from '../actions/status';
import { StatusTooltip } from './StatusTooltip';
import { statusIcon } from './utils';
import Tippy from '@tippyjs/react';
import { followCursor } from 'tippy.js';
import React from 'react';

type BuffProps = {
  status: StatusState;
};

export const Status: FC<BuffProps> = ({ status }) => {
  const statusInfo = getStatusById(status.id);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  const getIcon = useCallback(() => statusIcon(statusInfo.icon, status.stacks), [status.stacks, statusInfo]);

  const [icon, setIcon] = useState<string>(getIcon());

  useEffect(() => {
    function set() {
      if (status.duration) {
        setRemainingTime(Math.round(status.duration - (Date.now() - status.timestamp) / 1000));
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
  }, [setRemainingTime, setIcon, status, getIcon]);

  return (
    <Tippy
      content={<StatusTooltip status={statusInfo} />}
      arrow={false}
      duration={[0, 0]}
      maxWidth={600}
      plugins={[followCursor]}
      followCursor={true}
    >
      <div className="grid grid-flow-row-dense">
        <img id={`status_${status.id}`} src={'https://xivapi.com' + icon} alt={statusInfo.name} />
        <div className="justify-self-center self-start text-xl -mt-4 text-teal-300">{remainingTime || null}</div>
      </div>
    </Tippy>
  );
};
