import { faClock } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { GaugeBar } from '../../GaugeBar';
import { GaugeNumber } from '../../GaugeNumber';
import { useBuffTimer } from '../../hooks';

export const HutonGauge = () => {
  const [{ remainingTimeMS, remainingTime }] = useBuffTimer(StatusId.HutonActive);

  return (
    <HudItem name="HutonGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-40 grid-flow-col auto-cols-max gap-0.5">
        <FontAwesomeIcon icon={faClock} color="#ad925a" className="-mt-[2px]" />
        <div className="grid">
          <GaugeBar
            current={remainingTimeMS || 0}
            max={60000}
            texture="linear-gradient(45deg, rgba(0,65,76, 1) 0%, rgba(44,136,146, 1) 50%, rgba(157,243,246, 1) 100%)"
            animate={false}
          />
          <div className="grid place-items-end">
            <GaugeNumber className="mr-2 -mt-[7px]" number={remainingTime || 0} />
          </div>
        </div>
      </div>
    </HudItem>
  );
};
