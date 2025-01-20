export const generateMovementId = (base: number): number => {
  return 888000 + base;
};

let nextId = 999000;
export const generateId = (): number => {
  return nextId++;
};

export const createStatus = (name: string, icon?: string) => ({
  id: generateId(),
  name,
  ...(icon ? { icon } : {}),
});

export const createAction = (params: {
  id: number;
  name: string;
  description: string;
  icon: string;
  type?: string;
  castTime?: number;
  recastTime?: number;
  cooldownGroup?: number;
  cost?: number;
  costType?: string | null;
  job?: string[];
  level?: number;
  maxCharges?: number;
  preservesCombo?: boolean;
  radius?: number | null;
  range?: number | null;
  comboAction?: number | null;
  isAssignableToHotbar?: boolean;
}) => ({
  id: params.id,
  name: params.name,
  description: params.description,
  icon: params.icon,
  type: params.type ?? '',
  castTime: params.castTime ?? 0,
  recastTime: params.recastTime ?? 0,
  cooldownGroup: params.cooldownGroup ?? 0,
  cost: params.cost ?? 0,
  costType: params.costType ?? null,
  isAssignableToHotbar: params.isAssignableToHotbar ?? true,
  job: params.job ?? ['All'],
  level: params.level ?? 1,
  maxCharges: params.maxCharges ?? 0,
  preservesCombo: params.preservesCombo ?? true,
  radius: params.radius ?? null,
  range: params.range ?? null,
  comboAction: params.comboAction ?? null,
});

export const createMovementAction = (base: number, direction: string) => 
  createAction({
    id: generateMovementId(base),
    name: `Move ${direction}`,
    description: `Moves ${direction.toLowerCase()}.`,
    icon: `/api/1/asset/ui/icon/066000/06630${base - 1}_hr1.tex?format=png`,
    type: 'Movement',
  }); 