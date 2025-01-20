import { useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';

import { FaChevronDown, FaChevronLeft, FaChevronRight, FaChevronUp } from 'react-icons/fa6';
import { selectPosition } from './combatSlice';

export const Positionals = () => {
  const hudLock = useAppSelector(selectLock);
  const position = useAppSelector(selectPosition);

  return (
    <HudItem name="Positionals" defaultPosition={{ x: 170, y: 150 }}>
      {hudLock ? (
        <div className="grid grid-cols-[1fr_auto_1fr] w-[150px] h-[150px]">
          <div className="grid items-center justify-center">
            <FaChevronRight size="lg" color="#CE0010" visibility={position === 'W' ? 'visible' : 'hidden'} />
          </div>
          <div className="grid grid-rows-[1fr_auto_1fr] items-center place-items-center">
            <FaChevronDown size="lg" color="#CE0010" visibility={position === 'N' ? 'visible' : 'hidden'} />
            <img className="rotate-180" src="/img/ff-boss.svg" alt="boss" />
            <FaChevronUp size="lg" color="#CE0010" visibility={position === 'S' ? 'visible' : 'hidden'} />
          </div>
          <div className="grid items-center justify-center">
            <FaChevronLeft size="lg" color="#CE0010" visibility={position === 'E' ? 'visible' : 'hidden'} />
          </div>
        </div>
      ) : (
        <div className="h-[150px] w-[150px]">Positionals</div>
      )}
    </HudItem>
  );
};
