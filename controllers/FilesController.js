// import mongoDBCore from "mongodb/lib/core/index.js";
import { ObjectID } from 'mongodb';
import mime from 'mime-types';
import dbClient from '../utils/db';
import {
  publishHelper,
  createLocalFile,
  readLocalFile,
} from '../utils/files';
// import ObjectID from "mongodb";

class FilesController {
  static async postUpload(req, res) {
    const {
      name, type, parentId, isPublic, data,
    } = req.body;
    const userId = req.user._id.toString();
    let newFileObj = {};
    let parent;

    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }
    if (!type) {
      res.status(400).json({ error: 'Missing type' });
      return;
    }
    if (!data && type !== 'folder') {
      res.status(400).json({ error: 'Missing data' });
      return;
    }
    if (parentId) {
      if (ObjectID.isValid(parentId)) {
        parent = await (
          await dbClient.filesCollection()
        ).findOne({ _id: ObjectID(parentId) });
      } else {
        parent = null;
      }
      if (!parent) {
        res.status(400).json({ error: 'Parent not found' });
        return;
      }
      if (parent.type !== 'folder') {
        res.status(400).json({ error: 'Parent is not a folder' });
        return;
      }
    }
    newFileObj = {
      name,
      type,
      parentId: (parentId && ObjectID(parentId)) || '0',
      isPublic: isPublic || false,
      userId: ObjectID(userId),
    };
    if (type !== 'folder') {
      const filePath = await createLocalFile(data);
      if (filePath) {
        newFileObj.localPath = filePath;
      } else throw Error(`Could not create file ${name}`);
    }
    await (await dbClient.filesCollection()).insertOne(newFileObj);
    const { _id } = newFileObj;
    delete newFileObj.localPath;
    delete newFileObj._id;

    res.status(201).json({ id: String(_id), ...newFileObj });
  }

  static async getShow(req, res) {
    const userId = req.user._id.toString();
    const fileId = req.params.id;

    const file = await (
      await dbClient.filesCollection()
    ).findOne({
      _id: ObjectID(fileId),
      userId: ObjectID(userId),
    });
    if (!file) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    delete file._id;
    delete file.localPath;
    res.json({ id: fileId, ...file });
  }

  static async getIndex(req, res) {
    const parentId = req.query.parentId || undefined;
    const page = Number(req.query.page) || 0;

    const files = await await (
      await dbClient.filesCollection()
    )
      .aggregate([
        {
          $match: {
            parentId: (parentId && ObjectID(parentId)) || { $exists: true },
          },
        },
        { $skip: page * 20 },
        { $limit: 20 },
      ])
      .toArray();

    files.forEach((file) => {
      const fileDup = file;
      fileDup.id = fileDup._id.toString();
      delete fileDup._id;
      delete fileDup.localPath;
    });
    res.json(files);
  }

  static async putPublish(req, res) {
    publishHelper(req, res, true);
  }

  static async putUnPublish(req, res) {
    publishHelper(req, res, false);
  }

  static async getFile(req, res) {
    const userId = req.user && req.user._id.toString();
    const fileId = req.params.id;

    const file = await (
      await dbClient.filesCollection()
    ).findOne({
      _id: fileId && ObjectID(fileId),
    });
    if (!file || (!file.isPublic && userId !== String(file.userId))) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if (file.type === 'folder') {
      res.status(400).json({ error: "A folder doesn't have content" });
      return;
    }
    const fileBuffer = await readLocalFile(file.localPath);
    if (!fileBuffer) {
      res.status(404).json({ error: 'Not found' });
    } else {
      res.header('Content-Type', mime.lookup(file.name) || 'application/octet-stream');
      res.status(200).send(fileBuffer);
    }
  }
}

export default FilesController;
