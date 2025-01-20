import { useAppSelector } from '../../../../app/hooks';
import {
  selectCreatureCanvas,
  selectCreaturePortrait,
  selectCreaturePortraitCanvas,
  selectLandscapeCanvas,
  selectWeaponCanvas,
} from '../../combatSlice';
import { HudItem } from '../../../hud/HudItem';

import style from './Pct.module.css';
import clsx from 'clsx';
import {
  FaDragon,
  FaFaceGrinBeamSweat,
  FaFeatherPointed,
  FaHammer,
  FaHandFist,
  FaMountainSun,
  FaTooth,
  FaTowerBroadcast,
} from 'react-icons/fa6';

export const CanvasGauge = () => {
  const creatureCanvas = useAppSelector(selectCreatureCanvas);
  const weaponCanvas = useAppSelector(selectWeaponCanvas);
  const landscapeCanvas = useAppSelector(selectLandscapeCanvas);
  const creaturePortraitCanvas = useAppSelector(selectCreaturePortraitCanvas);
  const creaturePortrait = useAppSelector(selectCreaturePortrait);

  const madeenFillColor = '#AEDB89';
  const moogleFillColor = '#d486f0';
  const pomFillColor = '#E2B6A7';
  const wingFillColor = '#AE5AD3';
  const clawFillColor = '#dfd476';
  const mawFillColor = '#8eec4e';
  const hammerFillColor = '#CE696F';
  const landscapeFillColor = '#4D57CF';

  return (
    <HudItem name="CanvasGauge" defaultPosition={{ x: 20, y: 10 }}>
      <div className="grid w-52 justify-center auto-rows-max">
        <div className="grid grid-flow-col place-items-center w-[70px] h-[16px]">
          {creaturePortrait === 1 && <FaFaceGrinBeamSweat color={moogleFillColor} />}
          {creaturePortrait === 2 && <FaDragon color={madeenFillColor} />}
        </div>
        <div className={clsx('grid grid-flow-col place-items-center h-[27px] mt-0.5', style.canvas)}>
          <div className="w-[18px]">{creaturePortraitCanvas >= 1 && <FaTowerBroadcast color={pomFillColor} />}</div>
          <div className="w-[16px]">{creaturePortraitCanvas >= 2 && <FaFeatherPointed color={wingFillColor} />}</div>
          <div className="w-[14px]">{creaturePortraitCanvas >= 3 && <FaHandFist color={clawFillColor} />}</div>
        </div>
        <div className="grid auto-cols-max mt-[1px] grid-flow-col gap-[1px]">
          <div className={clsx(style.canvas, 'grid grid-flow-col place-items-center')}>
            {creatureCanvas === 1 && <FaTowerBroadcast color={pomFillColor} />}
            {creatureCanvas === 2 && <FaFeatherPointed color={wingFillColor} />}
            {creatureCanvas === 3 && <FaHandFist color={clawFillColor} />}
            {creatureCanvas === 4 && <FaTooth color={mawFillColor} />}
          </div>
          <div className={clsx(style.canvas, 'grid grid-flow-col place-items-center')}>
            {weaponCanvas === 1 && <FaHammer color={hammerFillColor} />}
          </div>
          <div className={clsx(style.canvas, 'grid grid-flow-col place-items-center')}>
            {landscapeCanvas === 1 && <FaMountainSun color={landscapeFillColor} />}
          </div>
        </div>
      </div>
    </HudItem>
  );
};
