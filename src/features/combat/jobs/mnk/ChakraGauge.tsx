import { useAppSelector } from '../../../../app/hooks';
import { HudItem } from '../../../hud/HudItem';
import { selectChakra } from '../../combatSlice';
import { GaugeDiamond } from '../../GaugeDiamond';

export const ChakraGauge = () => {
  const chakra = useAppSelector(selectChakra);
  const chakraFillColor = '#FFF98C';

  return (
    <HudItem name="ChakraGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-36 justify-center">
        <div className="grid grid-flow-col auto-cols-max gap-1.5">
          <GaugeDiamond fill={chakra >= 1} fillColor={chakraFillColor} />
          <GaugeDiamond fill={chakra >= 2} fillColor={chakraFillColor} />
          <GaugeDiamond fill={chakra >= 3} fillColor={chakraFillColor} />
          <GaugeDiamond fill={chakra >= 4} fillColor={chakraFillColor} />
          <GaugeDiamond fill={chakra >= 5} fillColor={chakraFillColor} />
        </div>
      </div>
    </HudItem>
  );
};
