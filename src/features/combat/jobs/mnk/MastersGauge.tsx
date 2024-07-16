import { FC } from 'react';
import { useAppSelector } from '../../../../app/hooks';
import { selectBeastChakra, selectCoeurlsFury, selectLunarNadi, selectOpooposFury, selectRaptorsFury, selectSolarNadi } from '../../combatSlice';
import { HudItem } from '../../../hud/HudItem';
import { BeastChakra } from './mnk';

import style from './MastersGauge.module.css';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { GaugeCircle } from '../../GaugeCircle';

type BeastChakraIconProps = {
  fill: BeastChakra;
};

export const BeastChakraIcon: FC<BeastChakraIconProps> = ({ fill }) => {
  const map = {
    [BeastChakra.OpoOpo]: {
      color: '#B478E6',
      letter: 'U',
    },
    [BeastChakra.Raptor]: {
      color: '#47E17D',
      letter: 'T',
    },
    [BeastChakra.Couerl]: {
      color: '#D76FA6',
      letter: 'Z',
    },
  };

  const value = map[fill];

  return (
    <div className={clsx(style.beast_chakra, 'grid justify-center leading-snug font-extrabold')}>
      {value && <div style={{ color: value.color }}>{value.letter}</div>}
    </div>
  );
};

export const MastersGauge = () => {
  const beastChakra = useAppSelector(selectBeastChakra);
  const solarNadi = useAppSelector(selectSolarNadi);
  const lunarNadi = useAppSelector(selectLunarNadi);

  const opooposFury = useAppSelector(selectOpooposFury);
  const raptorsFury = useAppSelector(selectRaptorsFury);
  const coeurlsFury = useAppSelector(selectCoeurlsFury);

  const solarNadiFillColor = '#F8F2BF';
  const lunarNadiFillColor = '#EDB1DD';
  const emptyNadiFillColor = '#0D1932';

  const opooposFuryFillColor = '#FF9DED';
  const raptorsFuryFillColor = '#BB89FF';
  const coeurlsFuryFillColor = '#00FFFF';

  return (
    <HudItem name="MastersGauge" defaultPosition={{ x: 20, y: 90 }}>
      <div className="grid w-36 justify-center">
        <div className="grid h-8 auto-cols-max grid-flow-col gap-1 justify-center items-center">
          <BeastChakraIcon fill={beastChakra[0]} />
          <BeastChakraIcon fill={beastChakra[1]} />
          <BeastChakraIcon fill={beastChakra[2]} />
          <FontAwesomeIcon className="ml-1" icon={faCircle} color={lunarNadi ? lunarNadiFillColor : emptyNadiFillColor} />
          <FontAwesomeIcon className="-ml-1" icon={faCircle} color={solarNadi ? solarNadiFillColor : emptyNadiFillColor} />
        </div>
        <div className="grid grid-flow-col auto-cols-max gap-1.5 mt-2 justify-center">
          <GaugeCircle fill={opooposFury > 0} fillColor={opooposFuryFillColor} />
          <GaugeCircle fill={raptorsFury > 0} fillColor={raptorsFuryFillColor} />
          <GaugeCircle fill={coeurlsFury > 0} fillColor={coeurlsFuryFillColor} />
          <GaugeCircle fill={coeurlsFury > 1} fillColor={coeurlsFuryFillColor} />
        </div>
      </div>
    </HudItem>
  );
};
