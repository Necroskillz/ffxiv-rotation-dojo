import data from "./job_status_data.json";

export interface StatusInfo {
    id: number;
	name: string;
	icon: string;
	description: string;
}

const actions: StatusInfo[] = data;

export function getStatusById(actionId: number) {
	return actions.find(a => a.id === actionId)!;
}
