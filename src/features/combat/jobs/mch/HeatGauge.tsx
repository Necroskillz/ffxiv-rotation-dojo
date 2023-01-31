import { faChessQueen, faFire } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectBattery, selectBuff, selectHeat } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeNumber } from '../../GaugeNumber';

export const HeatGauge = () => {
  const heat = useAppSelector(selectHeat);
  const battery = useAppSelector(selectBattery);
  const overheated = useAppSelector((state) => selectBuff(state, StatusId.Overheated));
  const queen = useAppSelector((state) => selectBuff(state, StatusId.AutomatonQueenActive));

  const [overheatedRemainingTime, setOverheatedRemainingTime] = useState<number | null>(null);
  const [queenRemainingTime, setQueenRemainingTime] = useState<number | null>(null);

  useEffect(() => {
    function set() {
      if (overheated) {
        setOverheatedRemainingTime(Math.ceil(overheated.duration! - (Date.now() - overheated.timestamp) / 1000));
      } else {
        setOverheatedRemainingTime(null);
      }

      if (queen) {
        setQueenRemainingTime(Math.max(Math.ceil(queen.duration! - (Date.now() - queen.timestamp) / 1000) - 8, 0));
      } else {
        setQueenRemainingTime(null);
      }
    }

    set();
    const timer = setInterval(() => set(), 100);

    return () => clearInterval(timer);
  }, [overheated, setOverheatedRemainingTime, queen, setQueenRemainingTime]);

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
          {queenRemainingTime !== null && (
            <div className="grid grid-flow-col auto-cols-max gap-1.5 absolute items-center left-[3px] bottom-[33px]">
              <FontAwesomeIcon icon={faChessQueen} color="#6697E6" />
              <GaugeNumber number={queenRemainingTime} />
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
