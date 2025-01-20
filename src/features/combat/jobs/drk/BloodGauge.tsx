import { FaSun } from 'react-icons/fa6';
import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectBlood, selectBuff } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeNumber } from '../../GaugeNumber';

export const BloodGauge = () => {
  const blood = useAppSelector(selectBlood);
  const stance = useAppSelector((state) => selectBuff(state, StatusId.Grit));

  const normalTexture = 'linear-gradient(45deg, rgba(184,34,34, 1) 0%, rgba(224,74,74, 1) 50%, rgba(234,166,166, 1) 100%)';
  const stanceTexture = 'linear-gradient(45deg, rgba(41,0,231, 1) 0%, rgba(124,64,255, 1) 50%, rgba(193,141,222, 1) 100%)';

  return (
    <HudItem name="BloodGauge" defaultPosition={{ x: 20, y: 90 }}>
      <div className="grid w-40 grid-flow-col auto-cols-max">
        <div className="w-5 -mt-[5px]">
          {stance && <FaSun color="#6A9FE7" />}
        </div>
        <div className="grid">
          <GaugeBar current={blood} max={100} texture={stance ? stanceTexture : normalTexture} />
          <div className="grid place-items-end">
            <GaugeNumber className="mr-4 -mt-[7px]" number={blood} />
          </div>
        </div>
      </div>
    </HudItem>
  );
};
