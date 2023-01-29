import { useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { GaugeBar } from './GaugeBar';
import { selectMana } from './combatSlice';

export const ManaBar = () => {
  const mana = useAppSelector(selectMana);

  return (
    <HudItem name="ManaBar" defaultPosition={{ x: 200, y: 300 }}>
      <div className="grid auto-rows-max grid-flow-row w-40 text-xiv-ui">
        <GaugeBar
          current={mana}
          max={10000}
          texture="linear-gradient(45deg, rgba(134,12,72, 1) 0%, rgba(168,40,100, 1) 50%, rgba(235,133,188, 1) 100%)"
          animate={false}
        />
        <div className="grid grid-cols-[45px_1fr] font-ui-light">
          <div className="text-sm font-bold -mt-1 ml-1">MP</div>
          <div className="text-lg font-semibold -mt-3">{mana}</div>
        </div>
      </div>
    </HudItem>
  );
};
