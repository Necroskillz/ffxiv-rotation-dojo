import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectAnguineTribute, selectSerpentsOfferings } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeDiamond } from '../../GaugeDiamond';
import { GaugeNumber } from '../../GaugeNumber';
import { useBuffTimer } from '../../hooks';

export const SerpentsOfferingsGauge = () => {
  const anguineTribute = useAppSelector(selectAnguineTribute);
  const serpentsOfferings = useAppSelector(selectSerpentsOfferings);
  const anguineTributeFillColor = '#B6FFFF';

  const [{ remainingTime }] = useBuffTimer(StatusId.Reawakened);

  return (
    <HudItem name="SerpentsOfferingsGauge" defaultPosition={{ x: 20, y: 90 }}>
      <div className="grid w-36 justify-center">
        <div className="grid place-items-end">
          <GaugeNumber className="mr-2 -mt-[7px]" number={serpentsOfferings} />
        </div>
        <div className="grid gap-0.5">
          <GaugeBar
            current={serpentsOfferings}
            max={100}
            texture="linear-gradient(45deg, rgba(40,88,156, 1) 0%, rgba(112,162,232, 1) 50%, rgba(221,255,254) 100%)"
          />
        </div>
        <div className="grid grid-flow-col auto-cols-max gap-1.5 justify-start mt-[2px]">
          <div className="-mt-[7px] -ml-[15px] mr-[5px] w-10">{remainingTime != null && <GaugeNumber number={remainingTime} />}</div>
          <GaugeDiamond fill={anguineTribute >= 1} fillColor={anguineTributeFillColor} />
          <GaugeDiamond fill={anguineTribute >= 2} fillColor={anguineTributeFillColor} />
          <GaugeDiamond fill={anguineTribute >= 3} fillColor={anguineTributeFillColor} />
          <GaugeDiamond fill={anguineTribute >= 4} fillColor={anguineTributeFillColor} />
          <GaugeDiamond fill={anguineTribute >= 5} fillColor={anguineTributeFillColor} />
        </div>
      </div>
    </HudItem>
  );
};
