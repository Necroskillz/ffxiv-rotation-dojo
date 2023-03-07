import { useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { selectLock } from '../hud/hudSlice';
import { addDebuff, removeDebuffAction } from './combatSlice';
import { StatusScrollingText } from './StatusScrollingText';

export const DebuffScrollingText = () => {
  const hudLock = useAppSelector(selectLock);

  return (
    <HudItem name="DebuffScrollingText" defaultPosition={{ x: 600, y: 20 }}>
      {hudLock ? (
        <StatusScrollingText
          addType={addDebuff.type}
          removeType={removeDebuffAction.type}
          direction="up"
          multipleText="Multiple Debuffs"
          addTextColor="text-xiv-offensive"
          time={2000}
        />
      ) : (
        <div className="h-[120px] w-[350px]">Debuff scrolling text</div>
      )}
    </HudItem>
  );
};
