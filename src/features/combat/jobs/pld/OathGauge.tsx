import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectBuff, selectOath } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeNumber } from '../../GaugeNumber';

export const OathGauge = () => {
  const oath = useAppSelector(selectOath);
  const stance = useAppSelector((state) => selectBuff(state, StatusId.IronWill));

  const normalTexture = 'linear-gradient(45deg, rgba(58,97,115, 1) 0%, rgba(95,172,206, 1) 50%, rgba(195,240,242, 1) 100%)';
  const stanceTexture = 'linear-gradient(45deg, rgba(189,160,42, 1) 0%, rgba(230,200,80, 1) 50%, rgba(255,255,217, 1) 100%)';

  return (
    <HudItem name="OathGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-40 grid-flow-col auto-cols-max">
        <div className="w-5 -mt-[5px]">{stance && <FontAwesomeIcon icon={faShieldHalved} color="#FFF7CE" />}</div>
        <div className="grid">
          <GaugeBar current={oath} max={100} texture={stance ? stanceTexture : normalTexture} />
          <div className="grid place-items-end">
            <GaugeNumber className="mr-4 -mt-[7px]" number={oath} />
          </div>
        </div>
      </div>
    </HudItem>
  );
};
