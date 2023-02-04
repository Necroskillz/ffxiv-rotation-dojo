import { faClock } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectBuff } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeNumber } from '../../GaugeNumber';

export const HutonGauge = () => {
  const huton = useAppSelector((state) => selectBuff(state, StatusId.HutonActive));
  const [hutonRemainingTime, setHutonRemainingTime] = useState<number | null>(null);

  useEffect(() => {
    function set() {
      if (huton) {
        setHutonRemainingTime(Math.ceil(huton.duration! - (Date.now() - huton.timestamp) / 1000));
      } else {
        setHutonRemainingTime(null);
      }
    }

    set();
    const timer = setInterval(() => set(), 100);

    return () => clearInterval(timer);
  }, [huton, setHutonRemainingTime]);

  return (
    <HudItem name="HutonGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-40 grid-flow-col auto-cols-max gap-0.5">
        <FontAwesomeIcon icon={faClock} color="#ad925a" className="-mt-[2px]" />
        <div className="grid">
          <GaugeBar
            current={hutonRemainingTime || 0}
            max={60}
            texture="linear-gradient(45deg, rgba(0,65,76, 1) 0%, rgba(44,136,146, 1) 50%, rgba(157,243,246, 1) 100%)"
          />
          <div className="grid place-items-end">
            <GaugeNumber className="mr-2 -mt-[7px]" number={hutonRemainingTime || 0} />
          </div>
        </div>
      </div>
    </HudItem>
  );
};
