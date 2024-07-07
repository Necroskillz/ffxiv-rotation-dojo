import { useAppSelector } from '../../../../app/hooks';
import { HudItem } from '../../../hud/HudItem';
import { selectChakra } from '../../combatSlice';
import { GaugeDiamond } from '../../GaugeDiamond';

export const ChakraGauge = () => {
  const chakra = useAppSelector(selectChakra);
  const chakraFillColor = '#FFF98C';
  const chakraOverfillColor = '#FF9E00';

  return (
    <HudItem name="ChakraGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-36 justify-center">
        <div className="grid grid-flow-col auto-cols-max gap-1.5">
          <GaugeDiamond fill={chakra >= 1} fillColor={chakra >= 6 ? chakraOverfillColor : chakraFillColor} />
          <GaugeDiamond fill={chakra >= 2} fillColor={chakra >= 7 ? chakraOverfillColor : chakraFillColor} />
          <GaugeDiamond fill={chakra >= 3} fillColor={chakra >= 8 ? chakraOverfillColor : chakraFillColor} />
          <GaugeDiamond fill={chakra >= 4} fillColor={chakra >= 9 ? chakraOverfillColor : chakraFillColor} />
          <GaugeDiamond fill={chakra >= 5} fillColor={chakra >= 10 ? chakraOverfillColor : chakraFillColor} />
        </div>
      </div>
    </HudItem>
  );
};
