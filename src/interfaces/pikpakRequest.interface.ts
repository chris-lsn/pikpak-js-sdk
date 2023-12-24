import { ResourceKind } from "../enums/resourceKind.enum";
import { TaskStatus } from "../enums/taskStatus.enum";

export interface IPikPakGetFilesRequestFilter {
	id?: string;
	kind?: { eq: ResourceKind };
	mime_type?: string;
	phase?: { eq: TaskStatus };
	trashed?: {
		eq: boolean;
	};
	starred?: {
		eq: boolean;
	};
	modified_time?: string;
	created_time?: string;
}
