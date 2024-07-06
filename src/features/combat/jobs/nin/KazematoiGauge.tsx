import { HudItem } from '../../../hud/HudItem';
import { useAppSelector } from '../../../../app/hooks';
import { selectKazematoi } from '../../combatSlice';
import { GaugeDiamond } from '../../GaugeDiamond';

export const KazematoiGauge = () => {
  const kazematoi = useAppSelector(selectKazematoi);
  const kazematoiFillColor = '#E7A5FF';

  return (
    <HudItem name="KazematoiGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-36 justify-center">
        <div className="grid grid-flow-col auto-cols-max gap-1.5">
          <GaugeDiamond fill={kazematoi >= 1} fillColor={kazematoiFillColor} />
          <GaugeDiamond fill={kazematoi >= 2} fillColor={kazematoiFillColor} />
          <GaugeDiamond fill={kazematoi >= 3} fillColor={kazematoiFillColor} />
          <GaugeDiamond fill={kazematoi >= 4} fillColor={kazematoiFillColor} />
          <GaugeDiamond fill={kazematoi >= 5} fillColor={kazematoiFillColor} />
        </div>
      </div>
    </HudItem>
  );
};
