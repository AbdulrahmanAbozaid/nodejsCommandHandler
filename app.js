const fs = require("fs/promises");

// commands
const cmds = {
  CREATE_FILE: "create file",
  DELETE_FILE: "delete file",
  CREATE_DIR: "create directory",
  DELETE_DIR: "delete directory",
  ADD_TO_FILE: "add to file",
  RENAME_FILE: "rename file",
};

// operations
const opts = {
  /**
   * Creates a new file if it doesn't exist.
   *
   * @param {string} filePath - The path of the file to create
   */

  [cmds.CREATE_FILE]: async (filePath) => {
    try {
      const file = await fs.open(filePath, "r");
      file.close();

      return console.log(`File ${filePath} already exists`);
    } catch (error) {
      // console.error(error);
      const newFile = await fs.open(filePath, "w");
      newFile.close();
    }
  },

  /**
   * Deletes a file if it exists.
   *
   * @param {string} filePath - The path of the file to delete
   */
  [cmds.DELETE_FILE]: async (filePath) => {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(`File ${filePath} does not exist`);
      } else console.error(error);
    }
  },

  /**
   * Renames a file if it exists.
   *
   * @param {string} filePath - The original file path
   * @param {string} newPath - The new path to rename it to
   */
  [cmds.RENAME_FILE]: async (filePath, newPath) => {
    try {
      await fs.rename(filePath, newPath);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(`File ${filePath} does not exist`);
      } else console.error(error);
    }
  },

  /**
   * Appends data to a file if it exists.
   *
   * @param {string} filePath - The file path to write to
   * @param {string} data - The data to append
   */
  [cmds.ADD_TO_FILE]: async (filePath, data) => {
    try {
      const file = await fs.open(filePath, "a");
      file.write(data);

      file.close();
    } catch (error) {
      console.error(error);
    }
  },

  /**
   * Deletes a directory recursively.
   *
   * @param {string} filePath - The path of the directory to delete
   */
  [cmds.DELETE_DIR]: async (filePath) => {
    try {
      await fs.rmdir(filePath, {
        force: true,
      });
    } catch (error) {
      console.log(error);
    }
  },

  /**
   * Creates a directory recursively.
   *
   * @param {string} filePath - The path of the directory to create
   */
  [cmds.CREATE_DIR]: async (filePath) => {
    try {
      await fs.mkdir(filePath, { recursive: true });
    } catch (error) {
      console.log(error);
    }
  },
};

(async () => {
  // opening the command file to read the data
  const commandHandler = await fs.open("./command.txt", "r");

  // all the FileHandle Types are EventEmitter instances
  commandHandler.on("change", async () => {
    console.log(`File command has been changed`);
    const size = (await commandHandler.stat()).size; // stat of a file: metadata
    const buff = Buffer.alloc(size); // buffer to store data
    const length = buff.byteLength; // num of bytes
    const offset = 0; // The location in the buffer at which to start filling
    const position = 0; // The location where to begin reading data from the file

    await commandHandler.read(buff, offset, length, position);
    const command = buff.toString("utf-8");

    if (command.includes(cmds.CREATE_FILE)) {
      const filePath = command.substring(cmds.CREATE_FILE.length + 1);
      await opts[cmds.CREATE_FILE](filePath);
    } else if (command.includes(cmds.DELETE_FILE)) {
      const filePath = command.substring(cmds.DELETE_FILE.length + 1);
      await opts[cmds.DELETE_FILE](filePath);
    } else if (command.includes(cmds.ADD_TO_FILE)) {
      const filePath = command
        .substring(cmds.ADD_TO_FILE.length + 1)
        .split(" ");
      await opts[cmds.ADD_TO_FILE](filePath[0], filePath.slice(1).join(" "));
    } else if (command.includes(cmds.DELETE_DIR)) {
      const filePath = command.substring(cmds.DELETE_DIR.length + 1);
      await opts[cmds.DELETE_DIR](filePath);
    } else if (command.includes(cmds.CREATE_DIR)) {
      const filePath = command.substring(cmds.CREATE_DIR.length + 1);
      await opts[cmds.CREATE_DIR](filePath);
    } else if (command.includes(cmds.RENAME_FILE)) {
      const filePath = command
        .substring(cmds.RENAME_FILE.length + 1)
        .split(" to ");
      await opts[cmds.RENAME_FILE](filePath[0], filePath[1]);
    }
  });

  const watcher = fs.watch("./command.txt"); // async iterator

  // produce events and iterate over it
  for await (const event of watcher) {
    // console.log(event);
    if (event.eventType === "change") {
      // ensure that the file handler is an instance of EventEmitter
      commandHandler.emit("change");
    }
  }
})();
