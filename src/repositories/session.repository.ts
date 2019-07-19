import {DefaultCrudRepository} from '@loopback/repository';
import {Session, SessionRelations} from '../models';
import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class SessionRepository extends DefaultCrudRepository<
  Session,
  typeof Session.prototype.userID,
  SessionRelations
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
  ) {
    super(Session, dataSource);
  }
}
