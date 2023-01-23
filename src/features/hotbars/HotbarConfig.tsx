import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FC, useState } from 'react';
import Select from 'react-select';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { HudItem } from '../hud/HudItem';
import { selectElement, selectLock, setVisility } from '../hud/hudSlice';
import { HotbarState, setRows, setSize } from './hotbarSlice';
import { Option } from '../../types';

type HotbarConfigProps = {
  hotbar: HotbarState;
};

const sizeOptions: Option<number>[] = [
  { value: 0.6, label: '60%' },
  { value: 0.8, label: '80%' },
  { value: 0.9, label: '90%' },
  { value: 1, label: '100%' },
  { value: 1.1, label: '110%' },
  { value: 1.2, label: '120%' },
  { value: 1.4, label: '140%' },
  { value: 1.6, label: '160%' },
  { value: 1.8, label: '180%' },
  { value: 2, label: '200%' },
];

const layoutOptions: Option<number>[] = [
  { value: 1, label: '12x1' },
  { value: 2, label: '6x2' },
  { value: 3, label: '4x3' },
  { value: 4, label: '3x4' },
  { value: 6, label: '2x6' },
  { value: 12, label: '1x12' },
];

export const HotbarConfig: FC<HotbarConfigProps> = ({ hotbar }) => {
  const name = `HotbarConfig${hotbar.id}`;
  const hudElement = useAppSelector((state) => selectElement(state, name));
  const hotBarHudElement = useAppSelector((state) => selectElement(state, `Hotbar${hotbar.id}`));
  const hudLock = useAppSelector(selectLock);
  const dispatch = useAppDispatch();
  const [visible, setVisible] = useState(hotBarHudElement.isVisible);

  function close() {
    dispatch(setVisility({ element: name, isVisible: false }));
  }

  function setHotbarSize(value: Option<number> | null) {
    dispatch(setSize({ hotbarId: hotbar.id, size: value?.value || 1 }));
  }

  function setHotbarLayout(value: Option<number> | null) {
    dispatch(setRows({ hotbarId: hotbar.id, rows: value?.value || 1 }));
  }

  function setHotbarVisible() {
    dispatch(setVisility({ element: `Hotbar${hotbar.id}`, isVisible: !visible }));
    setVisible(!visible);
  }

  if (!hudElement.isVisible || hudLock) {
    return null;
  }

  return (
    <HudItem name={name} dragHandle=".title" defaultPosition={{ x: 250, y: 150 }} z={100}>
      <div className="bg-xiv-bg border px-4 pb-2 pt-1 border-xiv-gold rounded-md w-[500px] h-[400px] overflow-auto">
        <div className="title grid grid-cols-2 items-center mb-4">
          <h2 className="text-2xl">Configure hotbar {hotbar.id}</h2>
          <button className="place-self-end p-1" onClick={close}>
            <FontAwesomeIcon size="2x" icon={faXmark} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-1 w-fit">
          <div className="grid grid-cols-[100px_1fr] gap-1 w-fit items-center">
            <label>Size</label>
            <Select
              options={sizeOptions}
              defaultValue={sizeOptions.find((o) => o.value === hotbar.config.size)}
              styles={{ option: (styles) => ({ ...styles, color: '#000' }) }}
              onChange={setHotbarSize}
            ></Select>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-1 w-fit items-center">
            <label>Layout</label>
            <Select
              options={layoutOptions}
              defaultValue={layoutOptions.find((o) => o.value === hotbar.config.rows)}
              styles={{ option: (styles) => ({ ...styles, color: '#000' }) }}
              onChange={setHotbarLayout}
            ></Select>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-1 w-fit items-center">
            <label>Visible</label>
            <input type="checkbox" checked={visible} onChange={setHotbarVisible}></input>
          </div>
        </div>
      </div>
    </HudItem>
  );
};
