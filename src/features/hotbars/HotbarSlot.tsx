import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { getActionById } from '../actions/actions';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { CooldownState, queue, selectAction } from '../combat/combatSlice';
import { CooldownSwipe } from './CooldownSwipe';
import { assignKeybind, selectHotbarLock, selectKeybind, selectKeybindingMode, selectSlot } from './hotbarSlice';
import { Keybind } from './Keybind';
import { clsx } from 'clsx';
import { selectElement, selectLock } from '../hud/hudSlice';
import css from './HotbarSlot.module.css';
import { Cost } from './Cost';
import { selectBlueMagicSpellSet, selectJob } from '../player/playerSlice';
import { useKeyEvents } from './hooks';
import { Subscription } from 'rxjs';
import { WithActionTooltip } from '@/components/WithActionTooltip';
import { XivIcon } from '@/components/XivIcon';

type HotbarProps = {
  hotbarId: number;
  slotId: number;
  size: number;
};

const specialKeys = new Set();
specialKeys.add('ArrowDown');
specialKeys.add('ArrowUp');
specialKeys.add('ArrowLeft');
specialKeys.add('ArrowRight');
specialKeys.add('PageUp');
specialKeys.add('PageDown');
specialKeys.add('Home');
specialKeys.add('End');
specialKeys.add('Clear');
specialKeys.add('Insert');

export const HotbarSlot: FC<HotbarProps> = ({ hotbarId, slotId, size }) => {
  const dispatch = useAppDispatch();
  const slot = useAppSelector((state) => selectSlot(state, { hotbarId, slotId }));
  const keybind = useAppSelector((state) => selectKeybind(state, { hotbarId, slotId }));
  const settings = useAppSelector((state) => selectElement(state, 'Settings'));
  const script = useAppSelector((state) => selectElement(state, 'Script'));
  const hudEditor = useAppSelector((state) => selectElement(state, 'HudEditor'));
  const keybindingMode = useAppSelector(selectKeybindingMode);
  const hudLock = useAppSelector(selectLock);
  const hotbarLock = useAppSelector(selectHotbarLock);
  const job = useAppSelector(selectJob);
  const blueMagicSpellSet = useAppSelector(selectBlueMagicSpellSet);
  const jobId = job === 'BLU' ? `${job}${blueMagicSpellSet.id}` : job;
  const actionId = slot.actionId[jobId];

  const baseCombatAction = useAppSelector((state) => selectAction(state, actionId));
  const redirectedAction = useAppSelector((state) => selectAction(state, baseCombatAction?.redirect));
  const combatAction = redirectedAction ? redirectedAction : baseCombatAction;
  const action = combatAction ? getActionById(combatAction.id) : actionId ? getActionById(actionId) : null;

  const isGlowing = combatAction?.isGlowing;
  const isUsable = combatAction?.isUsable;
  const maxCharges = combatAction?.maxCharges || 0;
  const [isMouseOver, setMouseOver] = useState(false);
  const [isActive, setActive] = useState(false);

  let cooldown: CooldownState | null = null;
  let globalCooldown: CooldownState | null = null;
  let extraCooldown: CooldownState | null = null;

  if (combatAction) {
    [cooldown, globalCooldown, extraCooldown] = combatAction.cooldown;
  }

  function mouseOver() {
    setMouseOver(true);
  }

  function mouseOut() {
    setMouseOver(false);
  }

  const activeTimer = useRef<NodeJS.Timer | null>(null);

  const onClick = useCallback(() => {
    if (!combatAction || !action || !hudLock) {
      return;
    }

    setActive(true);
    activeTimer.current = setTimeout(() => setActive(false), 300);

    if (action.type === 'Movement') {
      dispatch(combatAction.execute());
    } else {
      dispatch(queue(combatAction.id));
    }
  }, [combatAction, dispatch, hudLock, action]);

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `slot-${hotbarId}-${slotId}`,
    data: { type: 'slot', hotbarId, slotId },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
  } = useDraggable({
    id: `action-${hotbarId}-${slotId}`,
    data: { id: actionId, type: 'action', hotbarId, slotId },
    disabled: !action || !hudLock || hotbarLock,
  });

  const [keyEvents] = useKeyEvents();

  useEffect(() => {
    let sub: Subscription;

    function handleKeyEvent(key: string, modifier: string | null, event: Event) {
      if (keybindingMode) {
        if (isMouseOver) {
          dispatch(assignKeybind({ hotbarId, slotId, key: key === 'Escape' ? null : key, modifier }));

          event.stopPropagation();
          event.preventDefault();
        }
      } else {
        if (!(settings.isVisible || script.isVisible || hudEditor.isVisible) && keybind.key === key && keybind.modifier === modifier) {
          onClick();

          event.stopPropagation();
          event.preventDefault();
        }
      }
    }

    sub = keyEvents.subscribe((e) => handleKeyEvent(e.key, e.modifier, e.event));

    return () => sub?.unsubscribe();
  }, [keybind, keyEvents, onClick, dispatch, hotbarId, keybindingMode, slotId, isMouseOver, settings, script, hudEditor]);

  return (
    <div ref={setDropRef}>
      <WithActionTooltip action={action}>
        <div
          style={{
            width: 40 * size + 2,
            height: 40 * size + 2,
          }}
          className={clsx(css.slot, {
            [css.glowing]: isGlowing,
            [css.active]: isOver || (keybindingMode && isMouseOver) || isActive,
            [css.unusable]: action && !isUsable,
          })}
          onClick={onClick}
          onMouseOver={mouseOver}
          onMouseOut={mouseOut}
        >
          <Keybind keybind={keybind} />

          {action && (
            <div
              ref={setDragRef}
              {...listeners}
              {...attributes}
              style={{
                width: 40 * size,
                height: 40 * size,
                position: 'relative',
              }}
            >
              <CooldownSwipe
                cooldown={cooldown}
                globalCooldown={globalCooldown}
                extraCooldown={extraCooldown}
                isGcdAction={!!combatAction?.isGcdAction}
                maxCharges={maxCharges}
                size={size}
              />
              <XivIcon icon={action.icon} alt={action.name} width={40 * size} />
            </div>
          )}
          {action && action.cost > 0 && <Cost action={action} size={size} />}
        </div>
      </WithActionTooltip>
    </div>
  );
};
