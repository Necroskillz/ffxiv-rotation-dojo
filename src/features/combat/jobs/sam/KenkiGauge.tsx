import { useAppSelector } from '../../../../app/hooks';
import { HudItem } from '../../../hud/HudItem';
import { selectKenki, selectMeditation } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeDiamond } from '../../GaugeDiamond';
import { GaugeNumber } from '../../GaugeNumber';

export const KenkiGauge = () => {
  const kenki = useAppSelector(selectKenki);
  const meditation = useAppSelector(selectMeditation);
  const meditationFillColor = '#E7A793';

  return (
    <HudItem name="KenkiGauge" defaultPosition={{ x: 20, y: 90 }}>
      <div className="grid w-40 gap-0.5">
        <GaugeBar
          current={kenki}
          max={100}
          texture="linear-gradient(45deg, rgba(129,11,11, 1) 0%, rgba(193,74,74, 1) 50%, rgba(255,187,187, 1) 100%)"
        />
        <div className="grid grid-flow-col">
          <div className="grid grid-flow-col auto-cols-max gap-1.5 ml-1.5">
            <GaugeDiamond fill={meditation > 0} fillColor={meditationFillColor} />
            <GaugeDiamond fill={meditation > 1} fillColor={meditationFillColor} />
            <GaugeDiamond fill={meditation > 2} fillColor={meditationFillColor} />
          </div>
          <GaugeNumber className="place-self-end mr-4 -mt-[7px]" number={kenki} />
        </div>
      </div>
    </HudItem>
  );
};
