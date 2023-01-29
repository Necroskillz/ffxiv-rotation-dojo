import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectBuff } from '../../combatSlice';
import { GaugeDiamond } from '../../GaugeDiamond';

export const AetherflowGauge = () => {
  const aetherflow = useAppSelector((state) => selectBuff(state, StatusId.Aetherflow));
  const stacks = aetherflow?.stacks || 0;
  const fillColor = '#FFD5FF';

  return (
    <HudItem name="AetherflowGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-8 justify-center">
        <div className="grid grid-flow-col auto-cols-max gap-1.5">
          <GaugeDiamond fill={stacks >= 1} fillColor={fillColor} />
          <GaugeDiamond fill={stacks >= 2} fillColor={fillColor} />
        </div>
      </div>
    </HudItem>
  );
};
