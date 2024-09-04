import mongoDBCore from 'mongodb/lib/core/index';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function getUserFromXToken(req) {
  const token = req.headers['x-token'];

  if (!token) {
    return null;
  }

  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) {
    return null;
  }

  const user = await (await dbClient.usersCollection())
    .findOne({ _id: new mongoDBCore.BSON.ObjectId(userId) });
  return user || null;
}

async function xTokenAuthentication(req, res, next) {
  const user = await getUserFromXToken(req);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.user = user;
  next();
}

async function xTokenAuthenticationWithNoRes(req, res, next) {
  const user = await getUserFromXToken(req);

  req.user = user;
  next();
}

export { xTokenAuthentication, xTokenAuthenticationWithNoRes };
