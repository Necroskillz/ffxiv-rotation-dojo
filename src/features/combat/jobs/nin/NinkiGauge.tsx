import { useAppSelector } from '../../../../app/hooks';
import { HudItem } from '../../../hud/HudItem';
import { selectNinki } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeNumber } from '../../GaugeNumber';

export const NinkiGauge = () => {
  const ninki = useAppSelector(selectNinki);

  const lowTexture = 'linear-gradient(45deg, rgba(55,9,148, 1) 0%, rgba(128,73,228, 1) 50%, rgba(199,141,251, 1) 100%)';
  const normalTexture = 'linear-gradient(45deg, rgba(235,71,71, 1) 0%, rgba(255,131,131, 1) 50%, rgba(251,211,211, 1) 100%)';

  return (
    <HudItem name="NinkiGauge" defaultPosition={{ x: 20, y: 90 }}>
      <div className="grid w-40">
        <GaugeBar current={ninki} max={100} texture={ninki < 50 ? lowTexture : normalTexture} />
        <div className="grid place-items-end">
          <GaugeNumber className="mr-4 -mt-[7px]" number={ninki} />
        </div>
      </div>
    </HudItem>
  );
};
