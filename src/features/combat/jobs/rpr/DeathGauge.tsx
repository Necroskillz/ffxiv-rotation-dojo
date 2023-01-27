import { useEffect, useState } from 'react';
import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectBuff, selectLemure, selectVoid } from '../../combatSlice';
import { GaugeDiamond } from '../../GaugeDiamond';
import { GaugeNumber } from '../../GaugeNumber';

export const DeathGauge = () => {
  const lemure = useAppSelector(selectLemure);
  const voidShroud = useAppSelector(selectVoid);
  const enshroud = useAppSelector((state) => selectBuff(state, StatusId.Enshrouded));
  const [enshroudRemainingTime, setEnshroudRemainingTime] = useState<number | null>(null);
  const lemureFillColor = '#7EFFFF';
  const voidFillColor = '#FF49FF';

  useEffect(() => {
    function set() {
      if (enshroud) {
        setEnshroudRemainingTime(Math.ceil(enshroud.duration! - (Date.now() - enshroud.timestamp) / 1000));
      } else {
        setEnshroudRemainingTime(null);
      }
    }

    set();
    const timer = setInterval(() => set(), 100);

    return () => clearInterval(timer);
  }, [enshroud, setEnshroudRemainingTime]);

  return (
    <HudItem name="DeathGauge" defaultPosition={{ x: 20, y: 180 }}>
      <div className="grid w-36 justify-center">
        <div className="h-8 text-center w-full">{!!enshroudRemainingTime && <GaugeNumber number={enshroudRemainingTime} />}</div>

        <div className="grid grid-flow-col auto-cols-max gap-1.5 ml-1.5">
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
