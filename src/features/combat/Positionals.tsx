import { useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronLeft, faChevronRight, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { selectPosition } from './combatSlice';

export const Positionals = () => {
  const hudLock = useAppSelector(selectLock);
  const position = useAppSelector(selectPosition);

  return (
    <HudItem name="Positionals" defaultPosition={{ x: 170, y: 150 }}>
      {hudLock ? (
        <div className="grid grid-cols-[1fr_auto_1fr] w-[150px] h-[150px]">
          <div className="grid items-center justify-center">
            <FontAwesomeIcon icon={faChevronRight} size="lg" color="#CE0010" visibility={position === 'W' ? 'visible' : 'hidden'} />
          </div>
          <div className="grid grid-rows-[1fr_auto_1fr] items-center place-items-center">
            <FontAwesomeIcon icon={faChevronDown} size="lg" color="#CE0010" visibility={position === 'N' ? 'visible' : 'hidden'} />
            <img className="rotate-180" src="/img/ff-boss.svg" alt="boss" />
            <FontAwesomeIcon icon={faChevronUp} size="lg" color="#CE0010" visibility={position === 'S' ? 'visible' : 'hidden'} />
          </div>
          <div className="grid items-center justify-center">
            <FontAwesomeIcon icon={faChevronLeft} size="lg" color="#CE0010" visibility={position === 'E' ? 'visible' : 'hidden'} />
          </div>
        </div>
      ) : (
        <div className="h-[150px] w-[150px]">Positionals</div>
      )}
    </HudItem>
  );
};
