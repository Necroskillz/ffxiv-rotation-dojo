import { FC, MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getActionById } from '../actions/actions';
import { actions } from '../combat/actions';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { CooldownState, queue } from '../combat/combatSlice';
import { CooldownSwipe } from './CooldownSwipe';
import { assignAction, assignKeybind, selectHotbarLock, selectKeybind, selectKeybindingMode, selectSlot } from './hotbarSlice';
import { Keybind } from './Keybind';
import { useDrag, useDrop } from 'react-dnd';
import { ActionId } from '../actions/action_enums';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { clsx } from 'clsx';
import { selectElement, selectLock } from '../hud/hudSlice';

import css from './HotbarSlot.module.css';
import { ActionTooltip } from '../actions/ActionTooltip';
import { Cost } from './Cost';
import { selectBlueMagicSpellSet, selectJob } from '../player/playerSlice';
import Tippy from '@tippyjs/react';
import { followCursor } from 'tippy.js';
import { useKeyEvents } from './hooks';
import { Subscription } from 'rxjs';

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
  const state = useAppSelector((state) => state);
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
  const jobId = useMemo(() => (job === 'BLU' ? `${job}${blueMagicSpellSet.id}` : job), [job, blueMagicSpellSet.id]);
  const actionId = slot.actionId[jobId];

  let action = useMemo(() => (actionId ? getActionById(actionId) : null), [actionId]);
  let combatAction = useMemo(() => (actionId ? actions[actionId] : null), [actionId]);

  if (combatAction) {
    const redirectId = combatAction.redirect(state);
    action = getActionById(redirectId);
    combatAction = actions[redirectId];
  }

  const isGlowing = combatAction?.isGlowing(state);
  const isUsable = combatAction?.isUsable(state);
  const maxCharges = combatAction?.maxCharges(state) || 0;
  const [isMouseOver, setMouseOver] = useState(false);
  const [isActive, setActive] = useState(false);

  let cooldown: CooldownState | null = null;
  let globalCooldown: CooldownState | null = null;
  let extraCooldown: CooldownState | null = null;

  if (combatAction) {
    [cooldown, globalCooldown, extraCooldown] = combatAction.getCooldown(state);
  }

  function mouseOver() {
    setMouseOver(true);
  }

  function mouseOut() {
    setMouseOver(false);
  }

  let activeTimer: MutableRefObject<NodeJS.Timer | null> = useRef(null);

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

  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept: 'action',
      drop: (item: { id: ActionId }) => {
        dispatch(assignAction({ hotbarId, slotId, job: jobId, actionId: item.id }));

        return { id: actionId };
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [action, jobId]
  );

  const [, drag, preview] = useDrag(
    () => ({
      type: 'action',
      item: { id: actionId },
      canDrag: () => !!action && hudLock && !hotbarLock,
      end: (item, monitor) => {
        if (!monitor.didDrop()) {
          dispatch(assignAction({ hotbarId, slotId, job: jobId, actionId: null }));
        } else {
          const result = monitor.getDropResult<{ id: number }>();
          if (result && result.id !== action?.id) {
            dispatch(assignAction({ hotbarId, slotId, job: jobId, actionId: result.id }));
          }
        }
      },
    }),
    [action, hudLock, jobId, hotbarLock]
  );

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const [keyEvents] = useKeyEvents();

  useEffect(() => {
    let sub: Subscription;

    function handleKeyEvent(key: string, modifier: string | null, event: KeyboardEvent) {
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
    <div ref={drop}>
      <Tippy
        disabled={!action}
        content={<ActionTooltip action={action!} combatAction={combatAction!} />}
        arrow={false}
        duration={[0, 0]}
        maxWidth={600}
        plugins={[followCursor]}
        followCursor={true}
      >
        <div
          id={`slot_${hotbarId}_${slotId}`}
          onMouseOver={mouseOver}
          onMouseOut={mouseOut}
          className={clsx(css.slot, {
            [css.glowing]: isGlowing,
            [css.active]: (canDrop && isOver) || (keybindingMode && isMouseOver) || isActive,
            [css.unusable]: action && !isUsable,
          })}
          onClick={onClick}
          ref={drag}
          style={{
            width: 40 * size + 2,
            height: 40 * size + 2,
          }}
        >
          <Keybind keybind={keybind} />
          <CooldownSwipe
            cooldown={cooldown}
            globalCooldown={globalCooldown}
            extraCooldown={extraCooldown}
            isGcdAction={!!combatAction?.isGcdAction}
            maxCharges={maxCharges}
            size={size}
          />
          {action && (
            <img
              src={'https://beta.xivapi.com' + action.icon}
              alt={action.name}
              style={{
                width: 40 * size,
                height: 40 * size,
              }}
            />
          )}
          {action && action.cost > 0 && <Cost action={action} size={size} />}
        </div>
      </Tippy>
    </div>
  );
};
