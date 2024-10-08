import { v4 as uuidv4 } from "uuid";
import { promises as fs } from "fs";
import path from "path";
// import { ObjectID } from "mongodb";
// import ObjectID from "mongodb";

import BSON from "bson";
const ObjectID = BSON.ObjectID;

import dbClient from "./db.js";

// const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
const fileExists = (path) =>
  fs.stat(path).then(
    () => true,
    () => false
  );

async function createLocalFile(b64Data) {
  const folderPath = process.env.FOLDER_PATH || "/tmp/files_manager";
  try {
    const dataBuffer = Buffer.from(b64Data, "base64");
    if (!(await fileExists(folderPath))) {
      await fs.mkdir(folderPath);
    }
    const filePath = path.join(folderPath, uuidv4());
    await fs.writeFile(filePath, dataBuffer);
    return path.resolve(filePath);
  } catch (err) {
    return null;
  }
}

async function readLocalFile(filePath) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    return fileBuffer;
  } catch (err) {
    return null;
  }
}

async function publishHelper(req, res, bool) {
  const userId = req.user._id.toString();
  const fileId = req.params.id;

  const usr_obj_id = ObjectID.isValid(userId) ? ObjectID(userId) : undefined;
  const file_obj_id = ObjectID.isValid(fileId) ? ObjectID(fileId) : undefined;

  const updateResp = await (
    await dbClient.filesCollection()
  ).findOneAndUpdate(
    { _id: file_obj_id, userId: usr_obj_id },
    { $set: { isPublic: bool } },
    { returnDocument: "after" }
  );
  if (!updateResp.value) {
    res.status(404).json({ error: "Not found" });
  } else {
    updateResp.value.id = String(updateResp.value._id);
    delete updateResp.value._id;
    delete updateResp.value.localPath;

    res.status(200).json(updateResp.value);
  }
}

export { createLocalFile, fileExists, publishHelper, readLocalFile };
