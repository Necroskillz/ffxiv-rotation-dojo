import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectDarkArts } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeDiamond } from '../../GaugeDiamond';
import { GaugeNumber } from '../../GaugeNumber';
import { useBuffTimer } from '../../hooks';

export const DarksideGauge = () => {
  const [{ remainingTimeMS, remainingTime }] = useBuffTimer(StatusId.DarksideActive);
  const [{ remainingTime: simulacrumRemainingTime }] = useBuffTimer(StatusId.SimulacrumActive);
  const darkArts = useAppSelector(selectDarkArts);

  const darkArtsFillColor = '#FFD973';

  return (
    <HudItem name="DarksideGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-40 grid-flow-row auto-rows-max">
        <div className="h-8 w-full">
          {simulacrumRemainingTime != null && <GaugeNumber className="ml-5" number={simulacrumRemainingTime} />}
        </div>
        <GaugeBar
          current={remainingTimeMS || 0}
          max={60000}
          texture="linear-gradient(45deg, rgba(90,0,60, 1) 0%, rgba(141,1,111, 1) 50%, rgba(200,101,187, 1) 100%)"
          animate={false}
        />
        <div className="grid grid-flow-col">
          <div className="ml-2">
            <GaugeDiamond fill={darkArts > 0} fillColor={darkArtsFillColor} />
          </div>
          <GaugeNumber className="place-self-end mr-6 -mt-[7px]" number={remainingTime || 0} />
        </div>
      </div>
    </HudItem>
  );
};
