import clsx from 'clsx';
import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectBuff, selectPalette, selectWhitePaint } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeDiamond } from '../../GaugeDiamond';
import { GaugeNumber } from '../../GaugeNumber';

import style from './Pct.module.css';

export const PaletteGauge = () => {
  const whitePaint = useAppSelector(selectWhitePaint);
  const palette = useAppSelector(selectPalette);
  const monochrome = useAppSelector((state) => selectBuff(state, StatusId.MonochromeTones));
  const subtractivePalette = useAppSelector((state) => selectBuff(state, StatusId.SubtractivePalette));

  const whitePaintFillColor = '#00FFFF';
  const blackPaintFillColor = '#DB57DB';
  const paletteTexture = 'linear-gradient(in hsl longer hue 90deg, red 0 0)';
  const subtractivePaletteActiveTexture = 'linear-gradient(in lch longer hue 90deg, cyan 0 0)';

  return (
    <HudItem name="PaletteGauge" defaultPosition={{ x: 20, y: 90 }}>
      <div className="grid w-36 justify-center">
        <div className="grid gap-0.5">
          <GaugeBar current={palette} max={100} texture={subtractivePalette ? subtractivePaletteActiveTexture : paletteTexture} />
        </div>
        <div className="grid grid-flow-col auto-cols-max gap-1.5 justify-start mt-[2px] ml-2">
          <GaugeDiamond fill={whitePaint >= 1} fillColor={monochrome && whitePaint === 1 ? blackPaintFillColor : whitePaintFillColor} />
          <GaugeDiamond fill={whitePaint >= 2} fillColor={monochrome && whitePaint === 2 ? blackPaintFillColor : whitePaintFillColor} />
          <GaugeDiamond fill={whitePaint >= 3} fillColor={monochrome && whitePaint === 3 ? blackPaintFillColor : whitePaintFillColor} />
          <GaugeDiamond fill={whitePaint >= 4} fillColor={monochrome && whitePaint === 4 ? blackPaintFillColor : whitePaintFillColor} />
          <GaugeDiamond fill={whitePaint >= 5} fillColor={monochrome && whitePaint === 5 ? blackPaintFillColor : whitePaintFillColor} />
          <div className="grid place-items-center w-[65px]">
            <GaugeNumber
              className={clsx('-ml-[5px] -mt-[4px]', { [style.smudge_rainbow]: subtractivePalette, [style.smudge]: !subtractivePalette })}
              number={palette}
              shadow={false}
            />
          </div>
        </div>
      </div>
    </HudItem>
  );
};
