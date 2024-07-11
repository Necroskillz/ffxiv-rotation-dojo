import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { selectElement, setVisility } from '../hud/hudSlice';

export function Help() {
  const hudElement = useAppSelector((state) => selectElement(state, 'Help'));
  const dispatch = useAppDispatch();

  function close() {
    dispatch(setVisility({ element: 'Help', isVisible: false }));
  }

  if (!hudElement.isVisible) {
    return null;
  }

  return (
    <HudItem name="Help" dragHandle=".title" defaultPosition={{ x: 50, y: 50 }} z={101}>
      <div className="bg-xiv-bg border px-4 pb-2 pt-1 border-xiv-gold rounded-md w-[800px] h-[600px] overflow-auto">
        <div className="title grid grid-cols-2 items-center mb-4">
          <h2 className="text-2xl">About FFXIV Rotation Dojo</h2>
          <button className="place-self-end p-1" onClick={close}>
            <FontAwesomeIcon size="2x" icon={faXmark} />
          </button>
        </div>
        <div className="w-[700px]">
          <h2 className="text-xl mb-2">How to use</h2>
          <ol className="list-decimal ml-8">
            <li>Choose a job in the bottom left corner</li>
            <li>
              Click <b>Unlock</b> and drag elements around/set hotbar settings to set up your HUD (the layout is shared between jobs).
              Afterwards click <b>Lock</b>.
            </li>
            <li>
              Click <b>Keybinding Mode</b> to set up your binds. While this is active, mouseover a hotbar slot, and press a key (optionaly
              with a modifier) to bind it to that slot (keybinds are shared between jobs, ESC to unbind). Afterwards click{' '}
              <b>End keybinding mode</b>.
            </li>
            <li>
              Click <b>Actions</b> and drag abilities to hotbars.
            </li>
            <li>
              Click <b>Settings</b> to customize skill/spell speed, party size and pull timer.
            </li>
            <li>
              Click <b>Reset</b> at any point to reset combat to the initial state (cooldowns, resources, buffs, debuffs, etc.).
            </li>
          </ol>
          <h2 className="text-xl mb-2 mt-2">Note about hosting change</h2>
          <p>
            Previously the app was hosted at{' '}
            <a className="text-xiv-orange" href="https://necroskillz.github.io/ffxiv-rotation-dojo/">
              https://necroskillz.github.io/ffxiv-rotation-dojo
            </a>
            . If you had <b>existing configuration</b> there (keybinds, hotbar setup, scripts etc.) you can copy your settings at the old
            site, and import them here.
          </p>
          <h2 className="text-xl mb-2 mt-2">About</h2>
          <p>
            This project is open source hosted at{' '}
            <a className="text-xiv-orange" href="https://github.com/Necroskillz/ffxiv-rotation-dojo">
              https://github.com/Necroskillz/ffxiv-rotation-dojo
            </a>
            . Report issues{' '}
            <a className="text-xiv-orange" href="https://github.com/Necroskillz/ffxiv-rotation-dojo/issues">
              here
            </a>
            .
          </p>
          <p>
            In case of issues when keybinds overlap with browser, try out the{' '}
            <a className="text-xiv-orange" href="https://github.com/Necroskillz/ffxiv-rotation-dojo/releases/">
              wrapper desktop app
            </a>
            .
          </p>
        </div>
      </div>
    </HudItem>
  );
}
