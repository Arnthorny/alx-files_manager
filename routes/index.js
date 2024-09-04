import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import basicAuthentication from '../middlewares/BasicAuthentication';
import {
  xTokenAuthentication,
  xTokenAuthenticationWithNoRes,
} from '../middlewares/XTokenAuthentication.js';
import FilesController from '../controllers/FilesController.js';

const routes = Router();

routes.get('/status', AppController.getStatus);
routes.get('/stats', AppController.getStats);

routes.post('/users', UsersController.postNew);
routes.get('/users/me', xTokenAuthentication, UsersController.getMe);

routes.get('/connect', basicAuthentication, AuthController.getConnect);
routes.get('/disconnect', xTokenAuthentication, AuthController.getDisconnect);
routes.post('/files', xTokenAuthentication, FilesController.postUpload);
routes.get('/files', xTokenAuthentication, FilesController.getIndex);
routes.get('/files/:id', xTokenAuthentication, FilesController.getShow);
routes.put('/files/:id/publish', xTokenAuthentication, FilesController.putPublish);
routes.put('/files/:id/unpublish', xTokenAuthentication, FilesController.putUnPublish);
routes.get('/files/:id/data', xTokenAuthenticationWithNoRes, FilesController.getFile);

export default routes;
