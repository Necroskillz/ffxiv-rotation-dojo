import data from './job_actions_data.json';

export interface ActionInfo {
  id: number;
  type: string;
  name: string;
  icon: string;
  description: string;
  castTime: number;
  recastTime: number;
  cooldownGroup: number;
  level: number;
  cost: number;
  costType: string | null;
  maxCharges: number;
  job: string[];
  comboAction: number | null;
  isAssignableToHotbar: boolean;
  preservesCombo: boolean;
  range: number | null;
  radius: number | null;
}

const actions: ActionInfo[] = data;

export function getActionsByJob(job: string) {
  return actions.filter((a) => a.job.some(j => j === job || j === 'All'));
}

export function getActionById(actionId: number) {
  return actions.find((a) => a.id === actionId)!;
}

export function getActionByName(name: string) {
  return actions.find((a) => a.name === name)!;
}
