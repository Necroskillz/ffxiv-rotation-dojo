import { useState, useEffect } from 'react';
import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectBuff, selectEyeOfTheDragon, selectFirstmindsFocus } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeDiamond } from '../../GaugeDiamond';
import { GaugeNumber } from '../../GaugeNumber';

export const DragonGauge = () => {
  const eyeOfTheDragon = useAppSelector(selectEyeOfTheDragon);
  const firstmindsFocus = useAppSelector(selectFirstmindsFocus);
  const lifeOfTheDragon = useAppSelector((state) => selectBuff(state, StatusId.LifeoftheDragonActive));
  const eyeFillColor = '#ECA498';
  const focusFillColor = '#C688DA';

  const [remainingTime, setSRemainingTime] = useState<number | null>(null);

  useEffect(() => {
    function set() {
      if (lifeOfTheDragon) {
        setSRemainingTime(Math.ceil(lifeOfTheDragon.duration! - (Date.now() - lifeOfTheDragon.timestamp) / 1000));
      } else {
        setSRemainingTime(null);
      }
    }

    set();
    const timer = setInterval(() => set(), 100);

    return () => clearInterval(timer);
  }, [lifeOfTheDragon, setSRemainingTime]);

  return (
    <HudItem name="DragonGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-40 gap-0.5">
      <div className="grid grid-flow-col auto-cols-max gap-1.5 ml-1.5">
            <GaugeDiamond fill={firstmindsFocus > 0} fillColor={focusFillColor} />
            <GaugeDiamond fill={firstmindsFocus > 1} fillColor={focusFillColor} />
          </div>
        <GaugeBar
          current={remainingTime || 0}
          max={30}
          texture="linear-gradient(45deg, rgba(160,5,6, 1) 0%, rgba(204,51,51, 1) 50%, rgba(240,146,147, 1) 100%)"
        />
        <div className="grid grid-flow-col">
          <div className="grid grid-flow-col auto-cols-max gap-1.5 ml-1.5">
            <GaugeDiamond fill={eyeOfTheDragon > 0} fillColor={eyeFillColor} />
            <GaugeDiamond fill={eyeOfTheDragon > 1} fillColor={eyeFillColor} />
          </div>
          {remainingTime && <GaugeNumber className="-mt-[7px]" number={remainingTime} />}
        </div>
      </div>
    </HudItem>
  );
};
