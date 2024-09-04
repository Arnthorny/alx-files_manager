import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const user = await (await dbClient.usersCollection()).findOne({ email });
    if (user) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }

    const hashedPassword = sha1(password);
    const result = await (await dbClient.usersCollection())
      .insertOne({ email, password: hashedPassword });

    res.status(201).json({ id: result.insertedId.toString(), email });
  }

  static async getMe(req, res) {
    const { user } = req;

    res.json({ email: user.email, id: user._id.toString() });
  }
}

export default UsersController;
