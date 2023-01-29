import { CombatAction } from './combat-action';
import { general } from './general';
import { dnc } from './jobs/dnc/dnc';
import { rpr } from './jobs/rpr/rpr';
import { smn } from './jobs/smn/smn';
import { role } from './role';

function combineActions(...actions: CombatAction[][]): Record<number, CombatAction> {
  const result: Record<number, CombatAction> = {};

  for (const actionSection of actions) {
    actionSection.reduce((r: Record<number, CombatAction>, a: CombatAction) => {
      r[a.id] = a;
      return r;
    }, result);
  }

  return result;
}

export const actions = combineActions(dnc, rpr, smn, role, general);
