import { useAppSelector } from '../../../../app/hooks';
import { HudItem } from '../../../hud/HudItem';
import { selectBlackMana, selectManaStack, selectWhiteMana } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeDiamond } from '../../GaugeDiamond';
import { GaugeNumber } from '../../GaugeNumber';

export const BalanceGauge = () => {
  const whiteMana = useAppSelector(selectWhiteMana);
  const blackMana = useAppSelector(selectBlackMana);
  const manaStack = useAppSelector(selectManaStack);
  const manaStackFillColor = '#FFF0A8';
  const comboFillColor = '#FF5352';
  const favouringBlackFillColor = '#7C90F3';
  const favouringWhiteFillColor = '#FFFFFF';

  return (
    <HudItem name="BalanceGauge" defaultPosition={{ x: 20, y: 90 }}>
      <div className="grid w-40">
        <div className="grid place-items-end">
          <GaugeNumber className="mr-5 -mb-[7px]" number={whiteMana} />
        </div>
        <div className="grid grid-flow-col auto-cols-max">
          <div className="grid gap-0.5">
            <GaugeBar
              current={whiteMana}
              max={100}
              texture="linear-gradient(45deg, rgba(160,150,150, 1) 0%, rgba(218,209,209, 1) 50%, rgba(233,233,233, 1) 100%)"
            />
            <GaugeBar
              current={blackMana}
              max={100}
              texture="linear-gradient(45deg, rgba(1,1,125, 1) 0%, rgba(44,64,204, 1) 50%, rgba(141,160,251, 1) 100%)"
            />
          </div>
          <div className="mt-[6px]">
            {blackMana - whiteMana >= 30 ? (
              <GaugeDiamond fill={true} fillColor={favouringBlackFillColor} />
            ) : whiteMana - blackMana >= 30 ? (
              <GaugeDiamond fill={true} fillColor={favouringWhiteFillColor} />
            ) : whiteMana >= 50 && blackMana >= 50 ? (
              <GaugeDiamond fill={true} fillColor={comboFillColor} />
            ) : (
              <GaugeDiamond fill={false} fillColor={comboFillColor} />
            )}
          </div>
        </div>
        <div className="grid grid-flow-col">
          <div className="grid grid-flow-col auto-cols-max gap-1.5 ml-1.5">
            <GaugeDiamond fill={manaStack > 0} fillColor={manaStackFillColor} />
            <GaugeDiamond fill={manaStack > 1} fillColor={manaStackFillColor} />
            <GaugeDiamond fill={manaStack > 2} fillColor={manaStackFillColor} />
          </div>
          <GaugeNumber className="place-self-end mr-5 -mt-[7px]" number={blackMana} />
        </div>
      </div>
    </HudItem>
  );
};
