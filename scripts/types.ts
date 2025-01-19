export interface InputData {
  actions: number[];
  statuses: number[];
  items?: number[];
}

export interface StatusInfo {
  id: number;
  icon: string;
  name: string;
  description: string;
}

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

export interface IconResponse {
  path_hr1: string;
}

export interface BoilmasterResponse<T> {
  row_id: number;
  fields: T;
}

export interface StatusResponse {
  Id: number;
  Icon: IconResponse;
  Name: string;
  Description: string;
}

export interface ActionCategoryResponse {
  Name: string;
}

export interface ClassJobCategoryResponse {
  Name: string;
}

export interface ActionResponse {
  ActionCategory: BoilmasterResponse<ActionCategoryResponse>;
  ActionCombo: BoilmasterResponse<any>;
  ClassJobCategory: BoilmasterResponse<ClassJobCategoryResponse>;
  Cast100ms: number;
  ClassJobLevel: number;
  CooldownGroup: number;
  Icon: IconResponse;
  MaxCharges: number;
  Name: string;
  PrimaryCostType: number;
  PrimaryCostValue: number;
  Recast100ms: number;
  IsPlayerAction: boolean;
  PreservesCombo: boolean;
  Range: number;
  EffectRange: number;
}

export interface GtActionResponse {
  action: {
    description: string;
  };
}

export interface ItemUICategory {
  Name: string;
}

export interface ItemResponse {
  Description: string;
  Icon: IconResponse;
  Name: string;
  Cooldowns: number;
  ItemUICategory: BoilmasterResponse<ItemUICategory>;
}

export interface GtItemActionResponse {
  limit: number;
  rate: number;
}

export interface GtAttrResponse {
  action: Record<string, GtItemActionResponse>;
}

export interface GtItemResponse {
  item: {
    attr_hq: GtAttrResponse;
  };
}

export interface DataResponse {
  patch: {
    current: string;
  };
}

export interface PatchResponse {
  patch: {
    id: string;
    name: string;
    patches: Record<string, any>;
  };
}
