# pikpak-js-sdk (unofficial)

This is a simple javascript SDK for the PikPak API.

## Installation

```bash
npm install pikpak-js
```

## Supported Functions

- [x] Get Tasks
- [x] Create Task
- [x] Delete Task
- [x] Get Folder
- [x] Create Folder
- [x] Delete Folders
- [x] Get File
- [x] Get Quota

> Currently, it only supports the functions mentioned above, but it covers more frequently used features. If you require additional functionality, please [open an issue](https://github.com/chris-lsn/pikpak-js-sdk/issues/new).

## Usage

```javascript
const pikpak = new PikPak("username", "password");
const tasks = await pikpak.getTasks();
```

## Development

This project is based on the js runtime of [Bun](https://github.com/oven-sh/bun). Please make sure you have installed the bun cli before running the project.

To run the project in development mode, run the following command:

```bash
bun run dev
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
