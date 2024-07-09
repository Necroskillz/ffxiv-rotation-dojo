import { useAppSelector } from '../../../../app/hooks';
import { HudItem } from '../../../hud/HudItem';
import { selectAstralSoul } from '../../combatSlice';
import { GaugeDiamond } from '../../GaugeDiamond';

export const AstralSoulGauge = () => {
  const astralSoul = useAppSelector(selectAstralSoul);
  const astralSoulFillColor = '#FFAE69';

  return (
    <HudItem name="AstralSoulGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-36 justify-center">
        <div className="grid grid-flow-col auto-cols-max gap-1.5">
          <GaugeDiamond fill={astralSoul >= 1} fillColor={astralSoulFillColor} />
          <GaugeDiamond fill={astralSoul >= 2} fillColor={astralSoulFillColor} />
          <GaugeDiamond fill={astralSoul >= 3} fillColor={astralSoulFillColor} />
          <GaugeDiamond fill={astralSoul >= 4} fillColor={astralSoulFillColor} />
          <GaugeDiamond fill={astralSoul >= 5} fillColor={astralSoulFillColor} />
          <GaugeDiamond fill={astralSoul >= 6} fillColor={astralSoulFillColor} />
        </div>
      </div>
    </HudItem>
  );
};
