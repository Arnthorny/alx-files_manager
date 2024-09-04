import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static async getStatus(req, res) {
    if (dbClient.isAlive() && redisClient.isAlive()) res.json({ redis: true, db: true });
  }

  static async getStats(req, res) {
    const newObj = { users: null, files: null };
    newObj.users = await dbClient.nbUsers();
    newObj.files = await dbClient.nbFiles();

    res.json(newObj);
  }
}

export default AppController;
