import { faSun } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSelector } from '../../../../app/hooks';
import { StatusId } from '../../../actions/status_enums';
import { HudItem } from '../../../hud/HudItem';
import { selectParadox, selectPolyglot, selectUmbralHeart } from '../../combatSlice';
import { GaugeBar } from '../../GaugeBar';
import { GaugeDiamond } from '../../GaugeDiamond';
import { GaugeNumber } from '../../GaugeNumber';
import { useBuffTimer } from '../../hooks';

export const ElementalGauge = () => {
  const [, { timeMS: enochianTimeMS }] = useBuffTimer(StatusId.EnochianActive);
  const [{ remainingTime: iceRemainingTime }, , { status: ice }] = useBuffTimer(StatusId.UmbralIceActive);
  const [{ remainingTime: fireRemainingTime }, , { status: fire }] = useBuffTimer(StatusId.AstralFireActive);
  const polyglot = useAppSelector(selectPolyglot);
  const paradox = useAppSelector(selectParadox);
  const umbralHeart = useAppSelector(selectUmbralHeart);

  const iceFillColor = '#7EB4FF';
  const fireFillColor = '#FF8F8E';
  const umbralHeartFillColor = '#F5F7FF';
  const polyglotFillColor = '#FFA6D8';
  const paradoxFillColor = 'linear-gradient(-45deg, rgba(65,130,223, 1) 0%, rgba(216,152,231, 1) 50%, rgba(238,76,117, 1) 100%)';

  return (
    <HudItem name="ElementalGauge" defaultPosition={{ x: 20, y: 90 }}>
      <div className="grid w-60 grid-flow-col auto-cols-max">
        <div className="mr-3 w-4 mt-[7px]">{!!enochianTimeMS && <FontAwesomeIcon icon={faSun} color="#F1EADE" />}</div>
        <div className="grid">
          <div className="grid place-items-center">
            <GaugeDiamond fill={paradox > 0} fillColor={paradoxFillColor} />
          </div>
          <GaugeBar
            current={enochianTimeMS ? enochianTimeMS % 30000 : 0}
            max={30000}
            animate={false}
            texture="linear-gradient(45deg, rgba(76,24,93, 1) 0%, rgba(124,61,144, 1) 50%, rgba(224,157,243, 1) 100%)"
          />
          <div className="grid grid-flow-col auto-cols-max gap-1">
            <div className="-ml-4 -mt-[7px] w-8">
              {(iceRemainingTime != null || fireRemainingTime != null) && (
                <GaugeNumber number={iceRemainingTime ? iceRemainingTime : fireRemainingTime!} />
              )}
            </div>
            {ice && (
              <div className="w-12 grid grid-flow-col auto-cols-max gap-1.5 ml-1.5">
                <GaugeDiamond fill={ice.stacks! > 0} fillColor={iceFillColor} />
                <GaugeDiamond fill={ice.stacks! > 1} fillColor={iceFillColor} />
                <GaugeDiamond fill={ice.stacks! > 2} fillColor={iceFillColor} />
              </div>
            )}
            {!ice && (
              <div className="w-14 grid grid-flow-col auto-cols-max gap-1.5 ml-1.5">
                <GaugeDiamond fill={fire ? fire.stacks! > 0 : false} fillColor={fireFillColor} />
                <GaugeDiamond fill={fire ? fire.stacks! > 1 : false} fillColor={fireFillColor} />
                <GaugeDiamond fill={fire ? fire.stacks! > 2 : false} fillColor={fireFillColor} />
              </div>
            )}
            <div className="w-14 ml-1.5">
              {!!umbralHeart && (
                <div className="grid grid-flow-col auto-cols-max gap-1.5">
                  <GaugeDiamond fill={umbralHeart > 0} fillColor={umbralHeartFillColor} />
                  <GaugeDiamond fill={umbralHeart > 1} fillColor={umbralHeartFillColor} />
                  <GaugeDiamond fill={umbralHeart > 2} fillColor={umbralHeartFillColor} />
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <div className="grid grid-flow-col auto-cols-max gap-1.5 ml-1.5 mt-[12px]">
            <GaugeDiamond fill={polyglot > 0} fillColor={polyglotFillColor} />
            <GaugeDiamond fill={polyglot > 1} fillColor={polyglotFillColor} />
          </div>
        </div>
      </div>
    </HudItem>
  );
};
