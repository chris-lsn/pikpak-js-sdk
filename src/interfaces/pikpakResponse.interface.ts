export interface IPikPakResponse {
	kind: string;
	quotas: unknown;
	expires_at: string;
}

export interface IPikPakFailureResponse {
	error: string;
	error_code: number;
	error_description: string;
	details: Array<{
		"@type": string;
		reason?: string;
		locale?: string;
		message?: string;
	}>;
}

export interface IPikPakLoginResponse {
	access_token: string;
	refresh_token: string;
	sub: string;
}

export interface IPikPakCaptchaResponse {
	captcha_token: string;
	expires_in: number;
}

export interface IPikPakQuotaResponse extends IPikPakResponse {
	quota: {
		limit: string;
		usage: string;
		usage_in_trash: string;
		play_times_limit: string;
		play_times_usage: string;
		is_unlimited: boolean;
	};
}

export interface IPikPakFile {
	id: string;
	parent_id: string;
	name: string;
	user_id: string;
	size: string;
	revision: string;
	file_extension: string;
	mime_type: string;
	starred: boolean;
	web_content_link: string;
	created_time: string;
	modified_time: string;
	icon_link: string;
	thumbnail_link: string;
	md5_checksum: string;
	hash: string;
	links: Record<
		string,
		{
			url: string;
			token: string;
			expire: string;
			type: string;
		}
	>;
	phase: string;
	audit: {
		status: string;
		message: string;
		title: string;
	};
	medias: Array<unknown>;
	trashed: boolean;
	delete_time: string;
	original_url: string;
	params: {
		duration: string;
		height: string;
		platform_icon: string;
		url: string;
		width: string;
	};
	original_file_index: number;
	space: string;
	apps: Array<unknown>;
	writable: boolean;
	folder_type: string;
	collection: unknown;
	sort_name: string;
	user_modified_time: string;
	spell_name: Array<unknown>;
	file_category: string;
	tags: Array<unknown>;
	reference_events: Array<unknown>;
	reference_resource: unknown;
}

export interface IPikPakListFolderResponse extends IPikPakResponse {
	files: Array<IPikPakFile>;
}

export interface IPikPakFileResponse extends IPikPakResponse {
	file: IPikPakFile;
}

export interface IPikPakCreateTaskResponse extends IPikPakResponse {
	upload_type: string;
	url: {
		kind: string;
	};
	file: unknown;
	task: IPikPakTask;
}

export interface IPikPakListTaskResponse {
	tasks: Array<IPikPakTask>;
}

export interface IPikPakTask {
	kind: string;
	id: string;
	name: string;
	type: string;
	user_id: string;
	statuses: Array<string>;
	status_size: number;
	params: {
		age: string;
		predict_speed: string;
		predict_type: string;
		url?: string;
	};
	file_id: string;
	file_name: string;
	file_size: string;
	message: string;
	created_time: string;
	updated_time: string;
	third_task_id: string;
	phase: string;
	progress: number;
	icon_link: string;
	callback: string;
	reference_resource: unknown;
	space: string;
}
