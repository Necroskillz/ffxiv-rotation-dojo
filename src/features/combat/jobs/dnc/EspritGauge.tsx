import { useAppSelector } from '../../../../app/hooks';
import { HudItem } from '../../../hud/HudItem';
import { selectEspirt, selectFans } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeDiamond } from '../../GaugeDiamond';
import { GaugeNumber } from '../../GaugeNumber';

export const EspritGauge = () => {
  const esprit = useAppSelector(selectEspirt);
  const fans = useAppSelector(selectFans);
  const fanFillColor = '#9FE2A9';

  return (
    <HudItem name="EspritGauge" defaultPosition={{ x: 20, y: 90 }}>
      <div className="grid w-40 gap-0.5">
        <GaugeBar
          current={esprit}
          max={100}
          texture="linear-gradient(45deg, rgba(124, 83, 6, 1) 0%, rgba(255, 216, 86, 1) 50%, rgba(255, 255, 148, 1) 100%)"
        />
        <div className="grid grid-flow-col">
          <div className="grid grid-flow-col auto-cols-max gap-1.5 ml-1.5">
            <GaugeDiamond fill={fans > 0} fillColor={fanFillColor} />
            <GaugeDiamond fill={fans > 1} fillColor={fanFillColor} />
            <GaugeDiamond fill={fans > 2} fillColor={fanFillColor} />
            <GaugeDiamond fill={fans > 3} fillColor={fanFillColor} />
          </div>
          <GaugeNumber className="-mt-[7px]" number={esprit} />
        </div>
      </div>
    </HudItem>
  );
};
