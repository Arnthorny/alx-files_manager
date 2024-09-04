// import Queue from "bull";

import Job from 'bull/lib/job'; /* eslint-disable no-unused-vars */
import imageFunction from 'image-thumbnail';
import BSON from 'bson';
import dbClient from './utils/db';
import { createLocalFile } from './utils/files';
import { fileQueue } from './utils/jobs';

const { ObjectID } = BSON;

// const fileQueue = new Queue("thumbnail create");
const thumbnailWidths = [500, 250, 100];

/**
 *
 * @param {Job} job - Job to be processed
 */
async function jobProcessor(job) {
  const { fileId, userId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  else if (!userId) throw new Error('Missing userId');

  const file = await (
    await dbClient.filesCollection()
  ).findOne({
    _id: ObjectID.isValid(fileId) ? ObjectID(fileId) : null,
    userId: ObjectID.isValid(userId) ? ObjectID(userId) : null,
  });
  if (!file) throw new Error('File not found');

  const allThumbnailPaths = [];
  thumbnailWidths.forEach(async (width) => {
    const options = { width, responseType: 'base64' };

    try {
      const thumbnail = await imageFunction(file.localPath, options);
      const thumbnailPath = `${file.localPath}_${width}`;

      const storedPath = await createLocalFile(thumbnail, thumbnailPath);
      allThumbnailPaths.push(storedPath);
    } catch (err) {
      console.log('Error occured');
      throw err;
    }
  });
  return allThumbnailPaths;
}

fileQueue.process(jobProcessor);

module.exports = fileQueue;
