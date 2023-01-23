import { useAppSelector } from '../../app/hooks';
import { selectDebuffs } from './combatSlice';
import { Status } from './Status';
import { HudItem } from '../hud/HudItem';

export const Debuffs = () => {
  const buffs = useAppSelector(selectDebuffs);

  return (
    <HudItem name="Debuffs" defaultPosition={{ x: 20, y: 150 }}>
      <div className="h-20 grid auto-cols-max grid-flow-col gap-x-1">
        {buffs.map((b) => (
          <Status key={b.id} buff={b} />
        ))}
      </div>
    </HudItem>
  );
};
