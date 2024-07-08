import { useEffect, useState } from 'react';
import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectBuff, selectEmerald, selectRuby, selectTopaz, StatusState } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeDiamond } from '../../GaugeDiamond';
import { GaugeNumber } from '../../GaugeNumber';

export const TranceGauge = () => {
  const solarBahamut = useAppSelector((state) => selectBuff(state, StatusId.SolarBahamutActive));
  const bahamut = useAppSelector((state) => selectBuff(state, StatusId.BahamutActive));
  const phoenix = useAppSelector((state) => selectBuff(state, StatusId.PhoenixActive));
  const ifrit = useAppSelector((state) => selectBuff(state, StatusId.IfritActive));
  const titan = useAppSelector((state) => selectBuff(state, StatusId.TitanActive));
  const garuda = useAppSelector((state) => selectBuff(state, StatusId.GarudaActive));
  const topaz = useAppSelector(selectTopaz);
  const ruby = useAppSelector(selectRuby);
  const emerald = useAppSelector(selectEmerald);
  const [timer, setTimer] = useState<number | null>(null);
  const disabledRubyFillColor = '#786161';
  const rubyFillColor = '#F8C1C1';
  const disabledTopazFillColor = '#796555';
  const topazFillColor = '#FFE4C3';
  const disabledEmeraldFillColor = '#588051';
  const emeraldFillColor = '#81E677';
  const solarBahamutTexture = 'linear-gradient(45deg, rgba(85,151,255, 1) 0%, rgba(144,207,255) 50%, rgba(243,255,255) 100%)';
  const bahamutTexture = 'linear-gradient(45deg, rgba(0,149,175, 1) 0%, rgba(0,205,216, 1) 50%, rgba(0,232,232, 1) 100%)';
  const phoenixTexture = 'linear-gradient(45deg, rgba(107,4,0, 1) 0%, rgba(220,122,83, 1) 50%, rgba(247,188,150, 1) 100%)';

  function getRemainingTime(buff: StatusState) {
    return buff.duration! * 1000 - (Date.now() - buff.timestamp);
  }

  useEffect(() => {
    function set() {
      if (solarBahamut) {
        setTimer(getRemainingTime(solarBahamut));
      } else if (bahamut) {
        setTimer(getRemainingTime(bahamut));
      } else if (phoenix) {
        setTimer(getRemainingTime(phoenix));
      } else if (ifrit) {
        setTimer(getRemainingTime(ifrit));
      } else if (titan) {
        setTimer(getRemainingTime(titan));
      } else if (garuda) {
        setTimer(getRemainingTime(garuda));
      } else {
        setTimer(null);
      }
    }

    set();
    const timer = setInterval(() => set(), 10);

    return () => clearInterval(timer);
  }, [bahamut, phoenix, solarBahamut, ifrit, titan, garuda, setTimer]);

  return (
    <HudItem name="TranceGauge" defaultPosition={{ x: 20, y: 90 }}>
      <div className="grid w-40 gap-0.5">
        <GaugeBar
          current={(bahamut || phoenix || solarBahamut) && timer ? timer : 0}
          max={15000}
          texture={solarBahamut ? solarBahamutTexture : bahamut ? bahamutTexture : phoenixTexture}
          animate={false}
        />
        <div className="grid grid-flow-col">
          <div className="grid grid-flow-col auto-cols-max gap-1.5 ml-1.5 font-ui-light text-xs font-bold text-center">
            <div className="grid gap-1 grid-flow-row">
              <GaugeDiamond fill={ruby > 0} fillColor={bahamut || phoenix || solarBahamut ? disabledRubyFillColor : rubyFillColor} />
              {ifrit && <div>{ruby}</div>}
            </div>
            <div className="grid gap-1 grid-flow-row">
              <GaugeDiamond fill={topaz > 0} fillColor={bahamut || phoenix || solarBahamut ? disabledTopazFillColor : topazFillColor} />
              {titan && <div>{topaz}</div>}
            </div>
            <div className="grid gap-1 grid-flow-row">
              <GaugeDiamond
                fill={emerald > 0}
                fillColor={bahamut || phoenix || solarBahamut ? disabledEmeraldFillColor : emeraldFillColor}
              />
              {garuda && <div>{emerald}</div>}
            </div>
          </div>
          {timer !== null && <GaugeNumber className="-mt-[7px]" number={Math.round(timer / 1000)} />}
        </div>
      </div>
    </HudItem>
  );
};
