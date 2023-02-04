import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectEyeOfTheDragon, selectFirstmindsFocus } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeDiamond } from '../../GaugeDiamond';
import { GaugeNumber } from '../../GaugeNumber';
import { useBuffTimer } from '../../hooks';

export const DragonGauge = () => {
  const eyeOfTheDragon = useAppSelector(selectEyeOfTheDragon);
  const firstmindsFocus = useAppSelector(selectFirstmindsFocus);
  const eyeFillColor = '#ECA498';
  const focusFillColor = '#C688DA';

  const [{ remainingTime, remainingTimeMS }] = useBuffTimer(StatusId.LifeoftheDragonActive);

  return (
    <HudItem name="DragonGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-40 gap-0.5">
        <div className="grid grid-flow-col auto-cols-max gap-1.5 ml-1.5">
          <GaugeDiamond fill={firstmindsFocus > 0} fillColor={focusFillColor} />
          <GaugeDiamond fill={firstmindsFocus > 1} fillColor={focusFillColor} />
        </div>
        <GaugeBar
          current={remainingTimeMS || 0}
          max={30000}
          texture="linear-gradient(45deg, rgba(160,5,6, 1) 0%, rgba(204,51,51, 1) 50%, rgba(240,146,147, 1) 100%)"
          animate={false}
        />
        <div className="grid grid-flow-col">
          <div className="grid grid-flow-col auto-cols-max gap-1.5 ml-1.5">
            <GaugeDiamond fill={eyeOfTheDragon > 0} fillColor={eyeFillColor} />
            <GaugeDiamond fill={eyeOfTheDragon > 1} fillColor={eyeFillColor} />
          </div>
          {remainingTime != null && <GaugeNumber className="-mt-[7px]" number={remainingTime} />}
        </div>
      </div>
    </HudItem>
  );
};
