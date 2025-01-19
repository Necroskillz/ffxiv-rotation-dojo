import fs from 'fs/promises';
import path from 'path';
import { ActionInfo, StatusInfo, InputData } from './types';
import cliProgress from 'cli-progress';
import { generateId, createStatus, createMovementAction, createAction } from './utils';
import { getPatch, getStatus, getAction, getItem } from './api';
import { converter } from './converters';

async function writeJson(file: string, content: any): Promise<void> {
  await fs.writeFile(file, JSON.stringify(content));
}

async function writeEnum<T>(
  file: string,
  name: string,
  content: T[],
  nameSelector: (item: T) => string,
  valueSelector: (item: T) => number
): Promise<void> {
  const lines = [`export enum ${name} {`];
  for (const item of content) {
    const enumName = nameSelector(item)
      .replace(/ /g, '')
      .replace(/'/g, '')
      .replace(/-/g, '')
      .replace(/\(/g, '')
      .replace(/\)/g, '')
      .replace(/:/g, '');
    lines.push(`  ${enumName} = ${valueSelector(item)},`);
  }
  lines.push('}');
  await fs.writeFile(file, lines.join('\n'));
}

// Main function
async function main() {
  const baseDir = path.join(__dirname, '..');
  const input = JSON.parse(await fs.readFile(path.join(__dirname, 'data_input.json'), 'utf-8')) as Record<string, InputData>;

  const actionIds: number[] = [];
  const statusIds: number[] = [];
  const itemIds: number[] = [];

  for (const [, value] of Object.entries(input)) {
    value.actions.forEach((a) => actionIds.push(a));
    value.statuses.forEach((s) => statusIds.push(s));
    if (value.items) {
      value.items.forEach((i) => itemIds.push(i));
    }
  }

  const patch = await getPatch();

  // Create progress bars
  const multibar = new cliProgress.MultiBar({
    format: '{bar} | {percentage}% | {value}/{total} | {name}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    clearOnComplete: false,
    hideCursor: true,
  });

  const actionBar = multibar.create(actionIds.length, 0, { name: 'Actions' });
  const statusBar = multibar.create(statusIds.length, 0, { name: 'Statuses' });
  const itemBar = multibar.create(itemIds.length, 0, { name: 'Items' });

  const actions: ActionInfo[] = [];
  for (const id of actionIds) {
    actions.push(await getAction(id));
    actionBar.increment();
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const statuses: StatusInfo[] = [];
  for (const id of statusIds) {
    statuses.push(await getStatus(id));
    statusBar.increment();
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  for (const id of itemIds) {
    actions.push(await getItem(id));
    itemBar.increment();
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  multibar.stop();

  // Add special actions
  actions.push(createAction({
    id: 4,
    name: 'Sprint',
    description: 'Increases movement speed.<br /><span style="color:#00cc22;">Duration:</span> 10s (20s when not in combat)<br />※Unavailable in PvP.',
    icon: '/api/1/asset/ui/icon/000000/000104_hr1.tex?format=png',
    cooldownGroup: 56,
    recastTime: 60000,
  }));

  const shuriken = actions.find((a) => a.id === 2265)!;

  // Add Shuriken variants
  [generateId(), generateId()].forEach((id) => {
    actions.push({
      ...shuriken,
      id,
      preservesCombo: true,
    });
  });

  // Add movement actions
  const movementActions = [
    createMovementAction(2, 'Left'),
    createMovementAction(3, 'Right'),
    createMovementAction(4, 'Forward'),
    createMovementAction(5, 'Back'),
  ];

  movementActions.forEach((action) => {
    actions.push(action);
  });

  // Add special statuses
  const specialStatuses: Partial<StatusInfo>[] = [
    createStatus('Bahamut Active'),
    createStatus('Phoenix Active'),
    createStatus('Titan Active'),
    createStatus('Ifrit Active'),
    createStatus('Garuda Active'),
    createStatus('Automaton Queen Active'),
    createStatus("Wanderer's Minuet Active"),
    createStatus("Mage's Ballad Active"),
    createStatus("Army's Paeon Active"),
    createStatus('Life of the Dragon Active'),
    createStatus('Kaeshi: Goken Active'),
    createStatus('Kaeshi: Setsugekka Active'),
    createStatus('Kaeshi: Namikiri Active'),
    createStatus('Simulacrum Active', '/api/1/asset/ui/icon/003000/003088_hr1.tex?format=png'),
    createStatus('Darkside Active'),
    createStatus('Enochian Active'),
    createStatus('Astral Fire Active'),
    createStatus('Umbral Ice Active'),
    createStatus('Slipstream Active'),
    createStatus('Radiant Encore Coda'),
    createStatus('Kaeshi: Tendo Goken Active'),
    createStatus('Kaeshi: Tendo Setsugekka Active'),
    createStatus('Solar Bahamut Active'),
    createStatus('Ready to Rattle'),
    createStatus('Ready to Lash'),
    createStatus('Ready to Bite'),
    createStatus('Ready to Thresh'),
    createStatus('Ready to Uncoil'),
    createStatus('Ready to Hunt'),
    createStatus('Ready to Swift'),
    createStatus('Generation'),
    createStatus('Ready to Legacy'),
    createStatus('Umbral Soul Active'),
  ];

  specialStatuses.forEach((status) => {
    statuses.push({
      description: '',
      icon: '',
      ...status,
    } as StatusInfo);
  });

  // Write output files
  await writeJson(path.join(baseDir, 'src', 'features', 'actions', 'job_actions_data.json'), actions);
  await writeJson(path.join(baseDir, 'src', 'features', 'actions', 'job_status_data.json'), statuses);
  await writeJson(path.join(baseDir, 'src', 'features', 'actions', 'patch_data.json'), { patch });

  await writeEnum(path.join(baseDir, 'src', 'features', 'actions', 'action_enums.ts'), 'ActionId', actions, (a) => converter.action.name(a), (a) => a.id);

  await writeEnum(
    path.join(baseDir, 'src', 'features', 'actions', 'status_enums.ts'),
    'StatusId',
    statuses,
    (s) => converter.status.name(s),
    (s) => s.id
  );
}

main().catch(console.error);
