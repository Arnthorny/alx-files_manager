// import Queue from "bull";

import Job from 'bull/lib/job'; /* eslint-disable no-unused-vars */
import imageFunction from 'image-thumbnail';
import BSON from 'bson';
import dbClient from './utils/db';
import { createLocalFile } from './utils/files';
import { fileQueue, userQueue } from './utils/jobs';

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

async function userJobProcessor(job) {
  const { userId } = job.data;

  if (!userId) throw new Error('Missing userId');

  const user = await (
    await dbClient.usersCollection()
  ).findOne({
    _id: ObjectID.isValid(userId) ? ObjectID(userId) : null,
  });
  if (!user) throw new Error('User not found');

  console.log(`Welcome ${user.email}!`);
}

fileQueue.process(jobProcessor);
userQueue.process(userJobProcessor);

export { fileQueue, userQueue };
