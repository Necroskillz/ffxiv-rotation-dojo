import axios, { AxiosInstance } from 'axios';
import {
  ActionInfo,
  StatusInfo,
  DataResponse,
  PatchResponse,
  BoilmasterResponse,
  StatusResponse,
  ActionResponse,
  GtActionResponse,
  ItemResponse,
  GtItemResponse,
} from './types';
import { converter } from './converters';
import { statusIcon } from '../src/features/combat/utils';
import { createAction } from './utils';

// API clients
export const api = axios.create({
  baseURL: 'https://beta.xivapi.com/',
});

export const gtApi = axios.create({
  baseURL: 'https://garlandtools.org/',
});

async function fetchData<T>(apiInstance: AxiosInstance, url: string): Promise<T> {
  const { data } = await apiInstance.get(url);
  return data;
}

async function withErrorHandling<T>(operation: () => Promise<T>, errorContext: string): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new Error(`${errorContext}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// API functions
export async function getPatch(): Promise<string> {
  return withErrorHandling(async () => {
    const data = await fetchData<DataResponse>(gtApi, '/db/doc/core/en/3/data.json');
    const patchData = await fetchData<PatchResponse>(gtApi, `/db/doc/patch/en/2/${data.patch.current}.json`);
    return Object.keys(patchData?.patch?.patches ?? {}).pop() ?? '';
  }, 'Failed to fetch patch data');
}

export async function getStatus(id: number): Promise<StatusInfo> {
  return withErrorHandling(async () => {
    const data = await fetchData<BoilmasterResponse<StatusResponse>>(api, `api/1/sheet/Status/${id}`);
    return {
      id: data.row_id,
      description: converter.description(data.fields.Description),
      name: data.fields.Name,
      icon: converter.icon(data.fields.Icon.path_hr1),
    };
  }, `Failed to fetch status data for ID ${id}`);
}

export async function getAction(id: number): Promise<ActionInfo> {
  return withErrorHandling(async () => {
    const [data, gtData] = await Promise.all([
      fetchData<BoilmasterResponse<ActionResponse>>(api, `api/1/sheet/Action/${id}`),
      fetchData<GtActionResponse>(gtApi, `/db/doc/action/en/2/${id}.json`),
    ]);

    const [costType, costValue] = converter.action.costType(data);

    return createAction({
      id: data.row_id,
      type: data.fields.ActionCategory.fields.Name,
      name: data.fields.Name.charAt(0).toUpperCase() + data.fields.Name.slice(1),
      icon: statusIcon(converter.icon(data.fields.Icon.path_hr1), null),
      description: gtData.action.description || '',
      castTime: data.fields.Cast100ms * 100,
      recastTime: converter.action.recastTime(data),
      level: data.fields.ClassJobLevel,
      cooldownGroup: data.fields.CooldownGroup,
      cost: costValue,
      costType,
      maxCharges: data.fields.MaxCharges,
      job: converter.action.job(data),
      preservesCombo: data.fields.PreservesCombo,
      radius: data.fields.EffectRange,
      range: converter.action.range(data),
      comboAction: data.fields.ActionCombo.row_id === 0 ? null : data.fields.ActionCombo.row_id,
      isAssignableToHotbar: gtData.action.description != null && !gtData.action.description.includes('This action cannot be assigned to a hotbar'),
    });
  }, `Failed to fetch action data for ID ${id}`);
}

export async function getItem(id: number): Promise<ActionInfo> {
  return withErrorHandling(async () => {
    const [data, gtData] = await Promise.all([
      fetchData<BoilmasterResponse<ItemResponse>>(api, `api/1/sheet/Item/${id}`),
      fetchData<GtItemResponse>(gtApi, `/db/doc/item/en/3/${id}.json`),
    ]);

    return createAction({
      id: data.row_id,
      type: data.fields.ItemUICategory.fields.Name,
      name: data.fields.Name,
      icon: converter.icon(data.fields.Icon.path_hr1),
      description: converter.item.description(data.fields, gtData),
      castTime: 0,
      recastTime: converter.item.recastTime(data.fields),
      level: 1,
      cooldownGroup: 9999,
      cost: 0,
      costType: 'unknown',
      maxCharges: 0,
      job: converter.item.job(data.fields, gtData),
      comboAction: null,
      isAssignableToHotbar: true,
      preservesCombo: true,
      radius: null,
      range: null,
    });
  }, `Failed to fetch item data for ID ${id}`);
}


