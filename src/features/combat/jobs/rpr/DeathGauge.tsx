import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectLemure, selectVoid } from '../../combatSlice';
import { GaugeDiamond } from '../../GaugeDiamond';
import { GaugeNumber } from '../../GaugeNumber';
import { useBuffTimer } from '../../hooks';

export const DeathGauge = () => {
  const lemure = useAppSelector(selectLemure);
  const voidShroud = useAppSelector(selectVoid);
  const lemureFillColor = '#7EFFFF';
  const voidFillColor = '#FF49FF';

  const [{ remainingTime }] = useBuffTimer(StatusId.Enshrouded);

  return (
    <HudItem name="DeathGauge" defaultPosition={{ x: 20, y: 90 }}>
      <div className="grid w-36 justify-center">
        <div className="h-8 text-center w-full">{remainingTime != null && <GaugeNumber number={remainingTime} />}</div>

        <div className="grid grid-flow-col auto-cols-max gap-1.5">
          <GaugeDiamond fill={lemure >= 1} fillColor={lemureFillColor} />
          <GaugeDiamond fill={lemure >= 2 || lemure + voidShroud >= 2} fillColor={lemure >= 2 ? lemureFillColor : voidFillColor} />
          <GaugeDiamond fill={lemure >= 3 || lemure + voidShroud >= 3} fillColor={lemure >= 3 ? lemureFillColor : voidFillColor} />
          <GaugeDiamond fill={lemure >= 4 || lemure + voidShroud >= 4} fillColor={lemure >= 4 ? lemureFillColor : voidFillColor} />
          <GaugeDiamond fill={lemure >= 5 || lemure + voidShroud >= 5} fillColor={lemure >= 5 ? lemureFillColor : voidFillColor} />
        </div>
      </div>
    </HudItem>
  );
};
