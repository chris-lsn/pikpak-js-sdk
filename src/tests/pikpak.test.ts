import { beforeAll, describe, expect, it, test } from "bun:test";
import { TaskStatus } from "../enums/taskStatus.enum";
import PikPak from "../pkgs/pikpak";

let pikPak: PikPak;

beforeAll(() => {
	pikPak = new PikPak(
		process.env.PIKPAK_USERNAME!,
		process.env.PIKPAK_PASSWORD!,
	);
});

describe("login", () => {
	test("should login successfully", async () => {
		// Call the login method

		expect(async () => await pikPak.login()).not.toThrow();
		expect(pikPak.getAccessToken()).not.toBeEmpty();
		expect(pikPak.getRefreshToken()).not.toBeEmpty();
	});

	test("should throw error with invalid credentials", async () => {
		const pikPak = new PikPak("test123", "test123");
		await expect(pikPak.login()).rejects.toThrow();
	});
});

describe("refreshAccessToken", () => {
	test("should refresh access token successfully", async () => {
		const currentAccessToken = pikPak.getAccessToken();
		const currentRefreshToken = pikPak.getRefreshToken();
		await pikPak.refreshAccessToken();
		expect(pikPak.getAccessToken()).not.toEqual(currentAccessToken);
		expect(pikPak.getRefreshToken()).not.toEqual(currentRefreshToken);
	});
});

describe("folder", () => {
	let folderId: string;

	it("should create folder successfully", async () => {
		const name = "testFolder";
		const parentFolderId = "";
		const response = await pikPak.createFolder(name, parentFolderId);
		expect(response.file.id).not.toBeEmpty();
		folderId = response.file.id;
	});

	it("should get folder successfully", async () => {
		const getResponse = await pikPak.getFiles(folderId);
		expect(getResponse.files).toBeEmpty();
	});

	it("should delete folder successfully", async () => {
		expect(async () => await pikPak.deleteFolders([folderId])).not.toThrow();
	});
});

describe("task", () => {
	let taskId: string;

	it("should create task successfully", async () => {
		const url =
			"https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
		const parentFolderId = "";
		const name = "dummy.pdf";

		const response = await pikPak.createTask(url, parentFolderId, name);
		expect(response.task.id).not.toBeEmpty();
		taskId = response.task.id;
	});

	it("should get task successfully", async () => {
		const getResponse = await pikPak.getTasks([
			TaskStatus.PHASE_TYPE_COMPLETE,
			TaskStatus.PHASE_TYPE_RUNNING,
		]);
		const task = getResponse.tasks.find((task) => task.id === taskId);
		expect(task).not.toBeUndefined();
	});

	it("shoud delete task successfully", async () => {
		expect(async () => await pikPak.deleteTask(taskId, false)).not.toThrow();
	});
});
