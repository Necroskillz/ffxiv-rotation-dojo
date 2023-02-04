import { faChessQueen, faFire } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectBattery, selectHeat } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeNumber } from '../../GaugeNumber';
import { useBuffTimer } from '../../hooks';

export const HeatGauge = () => {
  const heat = useAppSelector(selectHeat);
  const battery = useAppSelector(selectBattery);

  const [{ remainingTime: overheatedRemainingTime }] = useBuffTimer(StatusId.Overheated);
  const [{ remainingTime: queenRemainingTime }] = useBuffTimer(StatusId.AutomatonQueenActive);

  return (
    <HudItem name="HeatGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-40 gap-4">
        <div className="grid">
          {overheatedRemainingTime && (
            <div className="grid grid-flow-col auto-cols-max gap-1.5 absolute items-center left-[3px] -top-[25px]">
              <FontAwesomeIcon icon={faFire} color="#E25856" />
              <GaugeNumber number={overheatedRemainingTime} />
            </div>
          )}
          <GaugeBar
            current={heat}
            max={100}
            texture="linear-gradient(45deg, rgba(162,61,17, 1) 0%, rgba(255,150,73, 1) 50%, rgba(255,196,101, 1) 100%)"
          />
          <div className="grid place-items-end">
            <GaugeNumber className="mr-4 -mt-[7px]" number={heat} />
          </div>
        </div>
        <div className="grid">
          {queenRemainingTime != null && (
            <div className="grid grid-flow-col auto-cols-max gap-1.5 absolute items-center left-[3px] bottom-[33px]">
              <FontAwesomeIcon icon={faChessQueen} color="#6697E6" />
              <GaugeNumber number={Math.max(queenRemainingTime - 8, 0)} />
            </div>
          )}
          <GaugeBar
            current={battery}
            max={100}
            texture="linear-gradient(45deg, rgba(82,164,194, 1) 0%, rgba(122,241,250, 1) 50%, rgba(160,255,255, 1) 100%)"
          />
          <div className="grid place-items-end">
            <GaugeNumber className="mr-4 -mt-[7px]" number={battery} />
          </div>
        </div>
      </div>
    </HudItem>
  );
};
