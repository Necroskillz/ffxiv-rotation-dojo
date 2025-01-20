import { FaShieldHalved } from 'react-icons/fa6';
import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectBeast, selectBuff } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeNumber } from '../../GaugeNumber';

export const BeastGauge = () => {
  const beast = useAppSelector(selectBeast);
  const stance = useAppSelector((state) => selectBuff(state, StatusId.Defiance));

  const normalTexture = 'linear-gradient(45deg, rgba(139,70,0, 1) 0%, rgba(187,117,37, 1) 50%, rgba(232,232,159, 1) 100%)';
  const stanceTexture = 'linear-gradient(45deg, rgba(198,8,8, 1) 0%, rgba(255,84,84, 1) 50%, rgba(251,186,186, 1) 100%)';

  return (
    <HudItem name="BeastGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-40 grid-flow-col auto-cols-max">
        <div className="w-5 -mt-[5px]">
          {stance && <FaShieldHalved color="#9B1B1A" />}
        </div>
        <div className="grid">
          <GaugeBar current={beast} max={100} texture={stance ? stanceTexture : normalTexture} />
          <div className="grid place-items-end">
            <GaugeNumber className="mr-4 -mt-[7px]" number={beast} />
          </div>
        </div>
      </div>
    </HudItem>
  );
};
