import { jwtDecode } from "jwt-decode";
import { ResourceKind } from "../enums/resourceKind.enum";
import { TaskStatus } from "../enums/taskStatus.enum";
import { ThumbnailSize } from "../enums/thumbnailSize.enum";
import { PikPakException } from "../exceptions/pikpakException.exception";
import { IPikPakGetFilesRequestFilter } from "../interfaces/pikpakRequest.interface";
import {
	IPikPakCreateTaskResponse,
	IPikPakFailureResponse,
	IPikPakFileResponse,
	IPikPakListFolderResponse,
	IPikPakListTaskResponse,
	IPikPakLoginResponse,
	IPikPakQuotaResponse,
} from "../interfaces/pikpakResponse.interface";

export default class PikPak {
	readonly PIKPAK_API_HOST = "https://api-drive.mypikpak.com";
	readonly PIKPAK_USER_HOST = "https://user.mypikpak.com";
	readonly CLIENT_ID = "YNxT9w7GMdWvEOKa";
	readonly CLIENT_SECRET = "dbw2OtmVEeuUvIptb1Coygx";
	readonly CLIENT_VERSION = "2.0.0";
	readonly PAKCAGE_NAME = "mypikpak.com";

	private username: string;
	private password: string;

	private accessToken = "";
	private refreshToken = "";

	constructor(username: string, password: string) {
		this.username = username;
		this.password = password;
	}

	getAccessToken() {
		return this.accessToken;
	}

	getRefreshToken() {
		return this.refreshToken;
	}

	private async getHeaders(authRequired = true) {
		const headers: Record<string, string> = {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
			"Content-Type": "application/json; charset=utf-8",
		};

		if (authRequired && this.accessToken) {
			// check if access token is expired
			const deocdedJwt = jwtDecode(this.accessToken);
			const exp = deocdedJwt.exp;

			if (!exp || Date.now() >= exp * 1000) {
				// refresh access token
				await this.refreshAccessToken();
			}

			headers.Authorization = `Bearer ${this.accessToken}`;
		}
		return headers;
	}

	/**
	 * Logs in the user and retrieves access and refresh tokens.
	 * @returns A Promise that resolves to void.
	 */
	public async login(): Promise<void> {
		const loginUrl = `${this.PIKPAK_USER_HOST}/v1/auth/signin`;
		const loginData = {
			client_id: this.CLIENT_ID,
			username: this.username,
			password: this.password,
		};

		const loginResponse = await fetch(loginUrl, {
			method: "POST",
			body: JSON.stringify(loginData),
			headers: await this.getHeaders(),
		});

		if (!loginResponse.ok) {
			const loginJson = (await loginResponse.json()) as IPikPakFailureResponse;
			throw new PikPakException("Login failed", loginJson);
		}

		const loginJson = (await loginResponse.json()) as IPikPakLoginResponse;

		this.accessToken = loginJson.access_token;
		this.refreshToken = loginJson.refresh_token;
	}

	/**
	 * Refreshes the access token by making a request to the PIKPAK authentication server.
	 * @returns A Promise that resolves to void.
	 */
	public async refreshAccessToken(): Promise<void> {
		const refreshUrl = `${this.PIKPAK_USER_HOST}/v1/auth/token`;
		const refreshData = {
			client_id: this.CLIENT_ID,
			refresh_token: this.refreshToken,
			grant_type: "refresh_token",
		};

		const refreshResponse = await fetch(refreshUrl, {
			method: "POST",
			body: JSON.stringify(refreshData),
			headers: await this.getHeaders(false),
		});

		if (!refreshResponse.ok) {
			const refreshJson =
				(await refreshResponse.json()) as IPikPakFailureResponse;
			throw new PikPakException("Refresh access token failed", refreshJson);
		}

		const refreshJson = (await refreshResponse.json()) as IPikPakLoginResponse;
		this.accessToken = refreshJson.access_token;
		this.refreshToken = refreshJson.refresh_token;
	}

	/**
	 * Creates a task in PikPak.
	 * @param url - The URL of the file to be downloaded.
	 * @param parentFolderId - The ID of the parent folder where the file will be stored.
	 * @param name - The name of the file.
	 * @returns A Promise that resolves to the response containing the created task information.
	 */
	public async createTask(
		url: string,
		parentFolderId?: string,
		name?: string,
	): Promise<IPikPakCreateTaskResponse> {
		const downloadUrk = `${this.PIKPAK_API_HOST}/drive/v1/files`;
		const downloadData: Record<string, unknown> = {
			kind: ResourceKind.FILE,
			parmas: {
				from: "manual",
			},
			upload_type: "UPLOAD_TYPE_URL",
			url: { url: url },
		};

		if (name) downloadData.name = name;
		if (parentFolderId) downloadData.parent_id = parentFolderId;

		const downloadResponse = await fetch(downloadUrk, {
			method: "POST",
			body: JSON.stringify(downloadData),
			headers: await this.getHeaders(),
		});

		if (!downloadResponse.ok) {
			throw new PikPakException(
				"Failed to create task",
				(await downloadResponse.json()) as IPikPakFailureResponse,
			);
		}
		const downloadJson =
			(await downloadResponse.json()) as IPikPakCreateTaskResponse;
		return downloadJson;
	}

	/**
	 * Deletes a task from PikPak.
	 * @param taskId - The ID of the task to be deleted.
	 * @param deleteFiles - Whether to delete the downloaded files or not.
	 */
	public async deleteTask(taskId: string, deleteFiles: boolean): Promise<void> {
		const queryParams = new URLSearchParams({
			delete_files: deleteFiles.toString(),
			task_ids: taskId,
		});

		const deleteUrl = `${this.PIKPAK_API_HOST}/drive/v1/tasks?${queryParams}`;
		const deleteResponse = await fetch(deleteUrl, {
			method: "DELETE",
			headers: await this.getHeaders(),
		});

		if (!deleteResponse.ok) {
			throw new PikPakException(
				"Failed to delete task",
				await deleteResponse.json(),
			);
		}
	}

	/**
	 * Retrieves the task list from the PikPak API.
	 * @returns A promise that resolves to an object representing the task list response.
	 */
	public async getTasks(
		statuses: TaskStatus[] = [
			TaskStatus.PHASE_TYPE_COMPLETE,
			TaskStatus.PHASE_TYPE_RUNNING,
			TaskStatus.PHASE_TYPE_ERROR,
		],
	): Promise<IPikPakListTaskResponse> {
		const queryParams = new URLSearchParams({
			type: "offline",
			thumbnail_size: ThumbnailSize.SIZE_SMALL,
			limit: "10000",
			filters: JSON.stringify({
				phase: { in: statuses.join(",") },
			}),
		});
		const tasksUrl = `${this.PIKPAK_API_HOST}/drive/v1/tasks?${queryParams}`;

		const tasksResponse = await fetch(tasksUrl, {
			method: "GET",
			headers: await this.getHeaders(),
		});

		if (!tasksResponse.ok) {
			throw new PikPakException(
				"Failed to get task list",
				(await tasksResponse.json()) as IPikPakFailureResponse,
			);
		}

		const tasklistJson =
			(await tasksResponse.json()) as IPikPakListTaskResponse;
		return tasklistJson;
	}

	/**
	 * Retrieves a file from the PikPak API based on the provided fileId.
	 * @param fileId The ID of the file to retrieve.
	 * @returns A Promise that resolves to an IPikPakFileResponse object representing the retrieved file.
	 */
	public async getFile(fileId: string): Promise<IPikPakFileResponse> {
		const fileUrl = `${this.PIKPAK_API_HOST}/drive/v1/files/${fileId}?usage=FETCH`;
		const fileResponse = await fetch(fileUrl, {
			method: "GET",
			headers: await this.getHeaders(),
		});

		if (!fileResponse.ok) {
			throw new PikPakException(
				"Failed to get file",
				(await fileResponse.json()) as IPikPakFailureResponse,
			);
		}

		const fileJson = (await fileResponse.json()) as IPikPakFileResponse;
		return fileJson;
	}

	/**
	 * Retrieves a list of files from the PikPak API.
	 *
	 * @param folderId The ID of the folder to retrieve files from. Defaults to the root folder.
	 * @param limit The maximum number of files to retrieve. Defaults to 500.
	 * @param thumbnailSize The size of the thumbnail to include in the response. Defaults to ThumbnailSize.SIZE_MEDIUM.
	 * @param filters Optional filters to apply to the file list.
	 * @returns A promise that resolves to the list of files in the specified folder.
	 * @throws PikPakException if there is an error retrieving the files.
	 */
	public async getFiles(
		folderId = "", // root folder
		limit = 500,
		thumbnailSize: ThumbnailSize = ThumbnailSize.SIZE_MEDIUM,
		filters?: IPikPakGetFilesRequestFilter,
	): Promise<IPikPakListFolderResponse> {
		const queryParams = new URLSearchParams({
			thumbnail_size: thumbnailSize,
			limit: limit.toString(),
			with_audit: "true",
			parent_id: folderId,
		});
		if (filters) queryParams.append("filters", JSON.stringify(filters));

		const folderUrl = `${this.PIKPAK_API_HOST}/drive/v1/files?${queryParams}`;
		const folderResponse = await fetch(folderUrl, {
			method: "GET",
			headers: await this.getHeaders(),
		});

		if (!folderResponse.ok) {
			throw new PikPakException(
				"Failed to get files",
				(await folderResponse.json()) as IPikPakFailureResponse,
			);
		}

		const folderJson =
			(await folderResponse.json()) as IPikPakListFolderResponse;
		return folderJson;
	}

	/**
	 * Creates a new folder in the PikPak drive.
	 * @param name - The name of the folder.
	 * @param parentFolderId - The ID of the parent folder where the new folder will be created. Defaults to root folder.
	 * @returns A promise that resolves to the created folder object.
	 */
	public async createFolder(name: string, parentFolderId = "") {
		const folderUrl = `${this.PIKPAK_API_HOST}/drive/v1/files`;
		const folderData = {
			kind: ResourceKind.FOLDER,
			name: name,
			parent_id: parentFolderId,
		};

		const folderResponse = await fetch(folderUrl, {
			method: "POST",
			body: JSON.stringify(folderData),
			headers: await this.getHeaders(),
		});

		if (!folderResponse.ok) {
			throw new PikPakException(
				"Failed to create folder",
				(await folderResponse.json()) as IPikPakFailureResponse,
			);
		}

		const folderJson = (await folderResponse.json()) as IPikPakFileResponse;
		return folderJson;
	}

	/**
	 * Deletes a folder from the PikPak drive.
	 * @param folderIds - The IDs of the folders to be deleted.
	 */
	public async deleteFolders(folderIds: string[]): Promise<void> {
		const folderUrl = `${this.PIKPAK_API_HOST}/drive/v1/files:batchTrash`;
		const folderResponse = await fetch(folderUrl, {
			method: "POST",
			headers: await this.getHeaders(),
			body: JSON.stringify({
				ids: folderIds,
			}),
		});

		if (!folderResponse.ok) {
			throw new PikPakException(
				"Failed to delete folder",
				await folderResponse.json(),
			);
		}
	}

	/**
	 * Retrieves the quota information from the PikPak API.
	 * @returns A Promise that resolves to an object containing the quota information.
	 */
	public async getQuota(): Promise<IPikPakQuotaResponse> {
		const quotaUrl = `${this.PIKPAK_API_HOST}/drive/v1/about`;
		const quotaResponse = await fetch(quotaUrl, {
			method: "GET",
			headers: await this.getHeaders(),
		});

		if (!quotaResponse.ok) {
			throw new PikPakException(
				"Failed to get quota",
				await quotaResponse.json(),
			);
		}

		const quotaJson = (await quotaResponse.json()) as IPikPakQuotaResponse;
		return quotaJson;
	}
}
