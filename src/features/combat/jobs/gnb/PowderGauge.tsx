import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectBuff, selectCartridge } from '../../combatSlice';
import { GaugeDiamond } from '../../GaugeDiamond';

export const PowderGauge = () => {
  const cartridge = useAppSelector(selectCartridge);
  const stance = useAppSelector((state) => selectBuff(state, StatusId.RoyalGuard));
  const fillColor = '#A0D5FD';

  return (
    <HudItem name="PowderGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-20 justify-center">
        <div className="grid grid-flow-col auto-cols-max gap-1.5">
          <div className="w-5 -mt-[5px]">{stance && <FontAwesomeIcon icon={faShieldHalved} color="#9B1B1A" />}</div>
          <GaugeDiamond fill={cartridge > 0} fillColor={fillColor} />
          <GaugeDiamond fill={cartridge > 1} fillColor={fillColor} />
          <GaugeDiamond fill={cartridge > 2} fillColor={fillColor} />
        </div>
      </div>
    </HudItem>
  );
};
