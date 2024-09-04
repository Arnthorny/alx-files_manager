import Queue from 'bull';

const fileQueue = new Queue('thumbnail create');
const userQueue = new Queue('Welcome user');

fileQueue.on('waiting', (jobId) => {
  console.log(`This job waits: ${jobId}`);
});

fileQueue.on('active', (job) => {
  console.log(`This job began: ${job.data}`);
});

fileQueue.on('completed', (job, result) => {
  console.log(`This job-${job.id} completed: ${result}`);
  // A job successfully completed with a `result`.
});

function addToFileQueue(userId, fileId) {
  fileQueue.add({
    fileId,
    userId,
  });
}

function addToUserQueue(userId) {
  userQueue.add({
    userId,
  });
}
export {
  addToFileQueue, fileQueue, userQueue, addToUserQueue,
};
