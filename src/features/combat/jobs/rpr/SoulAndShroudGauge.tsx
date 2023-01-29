import { useAppSelector } from '../../../../app/hooks';
import { HudItem } from '../../../hud/HudItem';
import { selectShroud, selectSoul } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeNumber } from '../../GaugeNumber';

export const SoulAndShroudGauge = () => {
  const soul = useAppSelector(selectSoul);
  const shround = useAppSelector(selectShroud);

  return (
    <HudItem name="SoulAndShroudGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-40 gap-4">
        <div className="grid gap-0.5">
          <GaugeBar
            current={soul}
            max={100}
            texture="linear-gradient(45deg, rgba(177,0,55, 1) 0%, rgba(255,25,100, 1) 50%, rgba(251,106,149, 1) 100%)"
          />
          <div className="grid place-items-end">
            <GaugeNumber className="mr-4 -mt-[7px]" number={soul} />
          </div>
        </div>
        <div className="grid gap-0.5">
          <GaugeBar
            current={shround}
            max={100}
            texture="linear-gradient(45deg, rgba(0,149,175, 1) 0%, rgba(0,205,216, 1) 50%, rgba(0,232,232, 1) 100%)"
          />
          <div className="grid place-items-end">
            <GaugeNumber className="mr-4 -mt-[7px]" number={shround} />
          </div>
        </div>
      </div>
    </HudItem>
  );
};
