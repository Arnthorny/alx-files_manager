import sha1 from 'sha1';
import dbClient from '../utils/db';

async function getUserFromAuthorization(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }
  const authInfo = authHeader.split(' ');
  if (authInfo.length !== 2 || authInfo[0] !== 'Basic') {
    return null;
  }
  const decodedToken = Buffer.from(authInfo[1], 'base64').toString('utf-8');
  const [email, password] = decodedToken.split(':');

  const user = await (await dbClient.usersCollection()).findOne({ email });
  if (!user || user.password !== sha1(password)) {
    return null;
  }
  return user;
}

async function basicAuthentication(req, res, next) {
  const user = await getUserFromAuthorization(req);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.user = user;
  next();
}

export default basicAuthentication;
