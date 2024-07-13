import { faChevronDown, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FC, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { selectElement, setVisility } from '../hud/hudSlice';
import { selectActionChangeSettingsFor, setActionChangeSettings } from '../player/playerSlice';
import { ActionId } from './action_enums';
import { ActionInfo, getActionById } from './actions';
import { actions } from '../combat/actions';
import Tippy from '@tippyjs/react';
import { ActionTooltip } from './ActionTooltip';
import { followCursor } from 'tippy.js';

export const ActionChangeSettings: FC = () => {
  const name = `ActionChangeSettings`;
  const hudElement = useAppSelector((state) => selectElement(state, name));

  const actionId = useMemo<ActionId | null>(
    () => (hudElement && hudElement.extraOptions ? hudElement.extraOptions.actionId : null),
    [hudElement]
  );

  const actionChangeSettings = useAppSelector((state) => (actionId ? selectActionChangeSettingsFor(state, actionId) : null));

  const action = actionId ? getActionById(actionId) : null;
  const combatAction = action ? actions[action.id] : null;
  const targetAction = combatAction ? getActionById(combatAction.actionChangeTo!) : null;

  const enabled = !actionChangeSettings || actionChangeSettings.enabled;
  const recast = !actionChangeSettings || actionChangeSettings.recast;

  const dispatch = useAppDispatch();

  function close() {
    dispatch(setVisility({ element: name, isVisible: false }));
  }

  function setActionChangeEnabled() {
    dispatch(setActionChangeSettings({ actionId: actionId!, enabled: !enabled, recast: recast }));
  }

  function setActionChangeRecast() {
    dispatch(setActionChangeSettings({ actionId: actionId!, enabled: enabled, recast: !recast }));
  }
  if (!hudElement.isVisible || !action || !targetAction) {
    return null;
  }

  return (
    <HudItem name={name} dragHandle=".title" defaultPosition={{ x: 250, y: 150 }} z={100}>
      <div className="bg-xiv-bg border px-4 pb-2 pt-1 border-xiv-gold rounded-md w-[500px] h-[400px] overflow-auto">
        <div className="title grid grid-cols-2 items-center mb-4 grid-cols-[1fr_auto]">
          <h2 className="text-2xl">Action Change Settings</h2>
          <button className="place-self-end p-1" onClick={close}>
            <FontAwesomeIcon size="2x" icon={faXmark} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-1 w-fit">
          <div className="highlight-yellow mb-2">Adjust settings for the actions below when requirements for execution are met.</div>
          <div className="grid grid-cols-[1fr_auto] gap-3 w-fit items-center">
            <input id="ActionChangeSettings_enabled" type="checkbox" checked={enabled} onChange={setActionChangeEnabled}></input>
            <label htmlFor="ActionChangeSettings_enabled">Enable action change.</label>
          </div>
          {action.type === 'Ability' && targetAction.type === 'Ability' && (
            <div className="ml-4 grid grid-cols-[1fr_auto] gap-3 w-fit items-center">
              <input
                id="ActionChangeSettings_recast"
                type="checkbox"
                disabled={!enabled}
                checked={recast}
                onChange={setActionChangeRecast}
              ></input>
              <label htmlFor="ActionChangeSettings_recast">Enable recast timer to prevent errorneous input.</label>
            </div>
          )}
        </div>
        <div className="mt-8 grid place-items-center w-100">
          <ActionPreview action={action} />
          <div className="m-2">
            {enabled ? (
              <FontAwesomeIcon size="2x" icon={faChevronDown} color="#f5c779" />
            ) : (
              <FontAwesomeIcon size="2x" icon={faXmark} color="#CE0010" />
            )}
          </div>
          <ActionPreview action={targetAction} />
        </div>
      </div>
    </HudItem>
  );
};

type ActionPreviewProps = {
  action: ActionInfo;
};

const ActionPreview: FC<ActionPreviewProps> = ({ action }) => {
  const combatAction = actions[action.id];

  return (
    <Tippy
      disabled={!action}
      content={<ActionTooltip action={action!} combatAction={combatAction!} />}
      arrow={false}
      duration={[0, 0]}
      maxWidth={600}
      plugins={[followCursor]}
      followCursor={true}
    >
      <div className="grid auto-cols-max grid-flow-col gap-2 items-center w-64">
        <div className="grid">
          <div className="grid auto-cols-max grid-flow-col gap-2 items-center">
            <img className="w-10" src={'https://beta.xivapi.com' + action.icon} alt={action.name} />
            <div>
              <div>{action.name}</div>
              <div>Lv. {action.level}</div>
            </div>
          </div>
        </div>
      </div>
    </Tippy>
  );
};
