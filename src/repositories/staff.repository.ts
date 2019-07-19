import {DefaultCrudRepository} from '@loopback/repository';
import {Staff, StaffRelations} from '../models';
import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class StaffRepository extends DefaultCrudRepository<
  Staff,
  typeof Staff.prototype.id,
  StaffRelations
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
  ) {
    super(Staff, dataSource);
  }
}
