import { FC, useEffect, useState } from 'react';
import { useAppSelector } from '../../../../app/hooks';
import { HudItem } from '../../../hud/HudItem';
import { selectBuff, selectCombo, selectRattlingCoil } from '../../combatSlice';
import { GaugeDiamond } from '../../GaugeDiamond';
import style from './VipersightGauge.module.css';
import clsx from 'clsx';
import { StatusId } from '../../../actions/status_enums';
import { ActionId } from '../../../actions/action_enums';

type VipersightProps = {
  fill1: boolean;
  fill2: boolean;
  fillColor1: string;
  fillColor2: string;
  active1: boolean;
  active2: boolean;
  active3: boolean;
};

export const VipersightBar: FC<VipersightProps> = ({ active1, active2, active3, fill1, fill2, fillColor1, fillColor2 }) => {
  return (
    <div className="grid grid-flow-col auto-cols-max">
      <div
        className={clsx(style.vipersight_bar, style.vipersight_bar_left, {
          [style.active1]: active1,
          [style.active2]: active2,
          [style.active3]: active3,
        })}
      >
        {fill1 && <div className={style.vipersight_bar_fill} style={{ background: fillColor1 }}></div>}
      </div>
      <div
        className={clsx(style.vipersight_bar, style.vipersight_bar_right, {
          [style.active1]: active1,
          [style.active2]: active2,
          [style.active3]: active3,
        })}
      >
        {fill2 && <div className={style.vipersight_bar_fill} style={{ background: fillColor2 }}></div>}
      </div>
    </div>
  );
};

export const VipersightGauge = () => {
  const rattlingCoil = useAppSelector(selectRattlingCoil);
  const combo = useAppSelector(selectCombo);
  const flankstungVenom = useAppSelector((state) => selectBuff(state, StatusId.FlankstungVenom));
  const flanksbaneVenom = useAppSelector((state) => selectBuff(state, StatusId.FlanksbaneVenom));
  const hindstungVenom = useAppSelector((state) => selectBuff(state, StatusId.HindstungVenom));
  const hindsbaneVenom = useAppSelector((state) => selectBuff(state, StatusId.HindsbaneVenom));
  const grimhuntersVenom = useAppSelector((state) => selectBuff(state, StatusId.GrimhuntersVenom));
  const grimskinsVenom = useAppSelector((state) => selectBuff(state, StatusId.GrimskinsVenom));
  const honedSteel = useAppSelector((state) => selectBuff(state, StatusId.HonedSteel));
  const honedReavers = useAppSelector((state) => selectBuff(state, StatusId.HonedReavers));

  const rattlingCoilFillColor = '#DB696D';
  const vipersightLeft1Fillcolor = 'linear-gradient(45deg, rgba(21,67,148, 1) 0%, rgba(107,157,228, 1) 50%, rgba(166,212,250) 100%)';
  const vipersightLeft2Fillcolor = 'linear-gradient(-45deg, rgba(136,63,13, 1) 0%, rgba(201,131,80, 1) 50%, rgba(232,220,175) 100%)';
  const vipersightRight1Fillcolor = 'linear-gradient(45deg, rgba(136,63,13, 1) 0%, rgba(201,131,80, 1) 50%, rgba(232,220,175) 100%)';
  const vipersightRight2Fillcolor = 'linear-gradient(-45deg, rgba(21,67,148, 1) 0%, rgba(107,157,228, 1) 50%, rgba(166,212,250) 100%)';

  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (combo[ActionId.SteelFangs] || combo[ActionId.SteelMaw]) {
      setValue(1);

      if (combo[ActionId.SteelFangs]) {
        if (flanksbaneVenom || flankstungVenom) {
          setLeft(2);
          setRight(0);
        } else if (hindsbaneVenom || hindstungVenom) {
          setRight(2);
          setLeft(0);
        } else {
          setLeft(2);
          setRight(2);
        }
      } else {
        setLeft(2);
        setRight(2);
      }
    } else if (combo[ActionId.HuntersSting] || combo[ActionId.SwiftskinsSting] || combo[ActionId.HuntersBite]) {
      setValue(2);

      if (combo[ActionId.HuntersBite]) {
        if (grimhuntersVenom) {
          setLeft(3);
          setRight(0);
        } else if (grimskinsVenom) {
          setRight(3);
          setLeft(0);
        } else {
          setLeft(3);
          setRight(3);
        }
      } else {
        if (hindstungVenom || flankstungVenom) {
          setLeft(3);
          setRight(0);
        } else if (hindsbaneVenom || flanksbaneVenom) {
          setRight(3);
          setLeft(0);
        } else {
          setLeft(3);
          setRight(3);
        }
      }
    } else {
      setValue(0);

      if (honedReavers) {
        setLeft(0);
        setRight(1);
      } else if (honedSteel) {
        setLeft(1);
        setRight(0);
      } else {
        setLeft(0);
        setRight(0);
      }
    }
  }, [combo, flanksbaneVenom, flankstungVenom, hindsbaneVenom, hindstungVenom, grimhuntersVenom, grimskinsVenom, honedReavers, honedSteel]);

  return (
    <HudItem name="VipersightGauge" defaultPosition={{ x: 20, y: 20 }}>
      <div className="grid w-40 gap-0.5">
        <div className="grid grid-flow-col auto-cols-max">
          <VipersightBar
            active1={left > 0}
            active2={left > 1}
            active3={left > 2}
            fill1={value > 1}
            fill2={value > 0}
            fillColor1={vipersightLeft1Fillcolor}
            fillColor2={vipersightLeft2Fillcolor}
          />
          <VipersightBar
            active1={right > 0}
            active2={right > 1}
            active3={right > 2}
            fill1={value > 0}
            fill2={value > 1}
            fillColor1={vipersightRight1Fillcolor}
            fillColor2={vipersightRight2Fillcolor}
          />
        </div>
        <div className="grid grid-flow-col auto-cols-max gap-1.5 ml-1.5">
          <GaugeDiamond fill={rattlingCoil > 0} fillColor={rattlingCoilFillColor} />
          <GaugeDiamond fill={rattlingCoil > 1} fillColor={rattlingCoilFillColor} />
          <GaugeDiamond fill={rattlingCoil > 2} fillColor={rattlingCoilFillColor} />
        </div>
      </div>
    </HudItem>
  );
};
