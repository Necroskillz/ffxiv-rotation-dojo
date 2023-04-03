import { useAppSelector } from '../../app/hooks';
import { selectDebuffs } from './combatSlice';
import { Status } from './Status';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { StatusTarget } from './combat-status';

export const PlayerDebuffs = () => {
  const debuffs = useAppSelector(selectDebuffs);
  const hudLock = useAppSelector(selectLock);

  return (
    <HudItem name="PlayerDebuffs" defaultPosition={{ x: 515, y: 250 }}>
      <div className="h-20 grid auto-cols-max grid-flow-col gap-x-1">
        {hudLock || debuffs.length
          ? debuffs.filter((d) => d.target === StatusTarget.Player && d.visible).map((d) => <Status key={d.id} status={d} />)
          : 'Player debuffs'}
      </div>
    </HudItem>
  );
};
