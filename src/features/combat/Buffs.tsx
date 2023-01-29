import { useAppSelector } from '../../app/hooks';
import { selectBuffs } from './combatSlice';
import { Status } from './Status';
import { HudItem } from '../hud/HudItem';

export const Buffs = () => {
  const buffs = useAppSelector(selectBuffs);

  return (
    <HudItem name="Buffs" defaultPosition={{ x: 20, y: 250 }}>
      <div className="h-20 grid auto-cols-max grid-flow-col gap-x-1">
        {buffs
          .filter((b) => b.visible)
          .map((b) => (
            <Status key={b.id} buff={b} />
          ))}
      </div>
    </HudItem>
  );
};
