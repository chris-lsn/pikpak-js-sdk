// src/exceptions/pikpakException.exception.t
var b64DecodeUnicode = function(str) {
  return decodeURIComponent(atob(str).replace(/(.)/g, (m, p) => {
    let code = p.charCodeAt(0).toString(16).toUpperCase();
    if (code.length < 2) {
      code = "0" + code;
    }
    return "%" + code;
  }));
};
var base64UrlDecode = function(str) {
  let output = str.replace(/-/g, "+").replace(/_/g, "/");
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += "==";
      break;
    case 3:
      output += "=";
      break;
    default:
      throw new Error("base64 string is not of the correct length");
  }
  try {
    return b64DecodeUnicode(output);
  } catch (err) {
    return atob(output);
  }
};
function jwtDecode(token, options) {
  if (typeof token !== "string") {
    throw new InvalidTokenError("Invalid token specified: must be a string");
  }
  options || (options = {});
  const pos = options.header === true ? 0 : 1;
  const part = token.split(".")[pos];
  if (typeof part !== "string") {
    throw new InvalidTokenError(`Invalid token specified: missing part #${pos + 1}`);
  }
  let decoded;
  try {
    decoded = base64UrlDecode(part);
  } catch (e) {
    throw new InvalidTokenError(`Invalid token specified: invalid base64 for part #${pos + 1} (${e.message})`);
  }
  try {
    return JSON.parse(decoded);
  } catch (e) {
    throw new InvalidTokenError(`Invalid token specified: invalid json for part #${pos + 1} (${e.message})`);
  }
}

class InvalidTokenError extends Error {
}
InvalidTokenError.prototype.name = "InvalidTokenError";

// src/exceptions/pikpakException
var ResourceKind;
(function(ResourceKind2) {
  ResourceKind2["FILE"] = "drive#file";
  ResourceKind2["FOLDER"] = "drive#folder";
  ResourceKind2["TASK"] = "drive#task";
})(ResourceKind || (ResourceKind = {}));

// src/exceptions/pikpakExcepti
var TaskStatus;
(function(TaskStatus2) {
  TaskStatus2["PHASE_TYPE_COMPLETE"] = "PHASE_TYPE_COMPLETE";
  TaskStatus2["PHASE_TYPE_ERROR"] = "PHASE_TYPE_ERROR";
  TaskStatus2["PHASE_TYPE_RUNNING"] = "PHASE_TYPE_RUNNING";
})(TaskStatus || (TaskStatus = {}));

// src/exceptions/pikpakException.
var ThumbnailSize;
(function(ThumbnailSize2) {
  ThumbnailSize2["SIZE_SMALL"] = "SIZE_SMALL";
  ThumbnailSize2["SIZE_MEDIUM"] = "SIZE_MEDIUM";
  ThumbnailSize2["SIZE_LARGE"] = "SIZE_LARGE";
})(ThumbnailSize || (ThumbnailSize = {}));

// src/exceptions/pikpakException.exception.ts
class PikPakException extends Error {
  details;
  constructor(message, details) {
    super(message);
    this.details = details;
  }
}

// src/exceptions/pik
class PikPak {
  PIKPAK_API_HOST = "https://api-drive.mypikpak.com";
  PIKPAK_USER_HOST = "https://user.mypikpak.com";
  CLIENT_ID = "YNxT9w7GMdWvEOKa";
  CLIENT_SECRET = "dbw2OtmVEeuUvIptb1Coygx";
  CLIENT_VERSION = "2.0.0";
  PAKCAGE_NAME = "mypikpak.com";
  username;
  password;
  accessToken = "";
  refreshToken = "";
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }
  getAccessToken() {
    return this.accessToken;
  }
  getRefreshToken() {
    return this.refreshToken;
  }
  async getHeaders() {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
      "Content-Type": "application/json; charset=utf-8"
    };
    if (this.accessToken) {
      const deocdedJwt = jwtDecode(this.accessToken);
      const exp = deocdedJwt.exp;
      if (!exp || Date.now() >= exp * 1000) {
        await this.refreshAccessToken();
      }
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    return headers;
  }
  async login() {
    const loginUrl = `${this.PIKPAK_USER_HOST}/v1/auth/signin`;
    const loginData = {
      client_id: this.CLIENT_ID,
      username: this.username,
      password: this.password
    };
    const loginResponse = await fetch(loginUrl, {
      method: "POST",
      body: JSON.stringify(loginData),
      headers: await this.getHeaders()
    });
    if (!loginResponse.ok) {
      const loginJson2 = await loginResponse.json();
      throw new PikPakException("Login failed", loginJson2);
    }
    const loginJson = await loginResponse.json();
    this.accessToken = loginJson.access_token;
    this.refreshToken = loginJson.refresh_token;
  }
  async refreshAccessToken() {
    const refreshUrl = `${this.PIKPAK_USER_HOST}/v1/auth/token`;
    const refreshData = {
      client_id: this.CLIENT_ID,
      refresh_token: this.refreshToken,
      grant_type: "refresh_token"
    };
    const refreshResponse = await fetch(refreshUrl, {
      method: "POST",
      body: JSON.stringify(refreshData),
      headers: await this.getHeaders()
    });
    if (!refreshResponse.ok) {
      const refreshJson2 = await refreshResponse.json();
      throw new PikPakException("Refresh access token failed", refreshJson2);
    }
    const refreshJson = await refreshResponse.json();
    this.accessToken = refreshJson.access_token;
    this.refreshToken = refreshJson.refresh_token;
  }
  async createTask(url, parentFolderId, name) {
    const downloadUrk = `${this.PIKPAK_API_HOST}/drive/v1/files`;
    const downloadData = {
      kind: ResourceKind.FILE,
      parmas: {
        from: "manual"
      },
      name,
      upload_type: "UPLOAD_TYPE_URL",
      url: { url },
      parent_id: parentFolderId
    };
    const downloadResponse = await fetch(downloadUrk, {
      method: "POST",
      body: JSON.stringify(downloadData),
      headers: await this.getHeaders()
    });
    if (!downloadResponse.ok) {
      throw new PikPakException("Failed to create task", await downloadResponse.json());
    }
    const downloadJson = await downloadResponse.json();
    return downloadJson;
  }
  async deleteTask(taskId, deleteFiles) {
    const queryParams = new URLSearchParams({
      delete_files: deleteFiles.toString(),
      task_ids: taskId
    });
    const deleteUrl = `${this.PIKPAK_API_HOST}/drive/v1/tasks?${queryParams}`;
    const deleteResponse = await fetch(deleteUrl, {
      method: "DELETE",
      headers: await this.getHeaders()
    });
    if (!deleteResponse.ok) {
      throw new PikPakException("Failed to delete task", await deleteResponse.json());
    }
  }
  async getTasks(statuses = [
    TaskStatus.PHASE_TYPE_COMPLETE,
    TaskStatus.PHASE_TYPE_RUNNING,
    TaskStatus.PHASE_TYPE_ERROR
  ]) {
    const queryParams = new URLSearchParams({
      type: "offline",
      thumbnail_size: ThumbnailSize.SIZE_SMALL,
      limit: "10000",
      filters: JSON.stringify({
        phase: { in: statuses.join(",") }
      })
    });
    const tasksUrl = `${this.PIKPAK_API_HOST}/drive/v1/tasks?${queryParams}`;
    const tasksResponse = await fetch(tasksUrl, {
      method: "GET",
      headers: await this.getHeaders()
    });
    if (!tasksResponse.ok) {
      throw new PikPakException("Failed to get task list", await tasksResponse.json());
    }
    const tasklistJson = await tasksResponse.json();
    return tasklistJson;
  }
  async getFile(fileId) {
    const fileUrl = `${this.PIKPAK_API_HOST}/drive/v1/files/${fileId}?usage=FETCH`;
    const fileResponse = await fetch(fileUrl, {
      method: "GET",
      headers: await this.getHeaders()
    });
    if (!fileResponse.ok) {
      throw new PikPakException("Failed to get file", await fileResponse.json());
    }
    const fileJson = await fileResponse.json();
    return fileJson;
  }
  async getFiles(folderId = "", limit = 500, thumbnailSize2 = ThumbnailSize.SIZE_MEDIUM, filters) {
    const queryParams = new URLSearchParams({
      thumbnail_size: thumbnailSize2,
      limit: limit.toString(),
      with_audit: "true",
      parent_id: folderId
    });
    if (filters)
      queryParams.append("filters", JSON.stringify(filters));
    const folderUrl = `${this.PIKPAK_API_HOST}/drive/v1/files?${queryParams}`;
    const folderResponse = await fetch(folderUrl, {
      method: "GET",
      headers: await this.getHeaders()
    });
    if (!folderResponse.ok) {
      throw new PikPakException("Failed to get files", await folderResponse.json());
    }
    const folderJson = await folderResponse.json();
    return folderJson;
  }
  async createFolder(name, parentFolderId = "") {
    const folderUrl = `${this.PIKPAK_API_HOST}/drive/v1/files`;
    const folderData = {
      kind: ResourceKind.FOLDER,
      name,
      parent_id: parentFolderId
    };
    const folderResponse = await fetch(folderUrl, {
      method: "POST",
      body: JSON.stringify(folderData),
      headers: await this.getHeaders()
    });
    if (!folderResponse.ok) {
      throw new PikPakException("Failed to create folder", await folderResponse.json());
    }
    const folderJson = await folderResponse.json();
    return folderJson;
  }
  async deleteFolders(folderIds) {
    const folderUrl = `${this.PIKPAK_API_HOST}/drive/v1/files:batchTrash`;
    const folderResponse = await fetch(folderUrl, {
      method: "POST",
      headers: await this.getHeaders(),
      body: JSON.stringify({
        ids: folderIds
      })
    });
    if (!folderResponse.ok) {
      throw new PikPakException("Failed to delete folder", await folderResponse.json());
    }
  }
  async getQuota() {
    const quotaUrl = `${this.PIKPAK_API_HOST}/drive/v1/about`;
    const quotaResponse = await fetch(quotaUrl, {
      method: "GET",
      headers: await this.getHeaders()
    });
    if (!quotaResponse.ok) {
      throw new PikPakException("Failed to get quota", await quotaResponse.json());
    }
    const quotaJson = await quotaResponse.json();
    return quotaJson;
  }
}

// src/exceptio
var src_default = PikPak;
export {
  src_default as default
};
