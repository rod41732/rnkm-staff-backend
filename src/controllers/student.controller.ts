import {Count, CountSchema, Filter, repository, Where} from '@loopback/repository';
import {
  post,
  param,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  getWhereSchemaFor,
  patch,
  put,
  del,
  requestBody,
  HttpErrors,
} from '@loopback/rest';
import {Student} from '../models';
import {StudentRepository} from '../repositories';
import {inject} from '@loopback/core';
import {PayloadBinding} from '../bindings';
import {Payload} from '../services/jwt.service';
import {Connector} from 'loopback-datasource-juggler';
import {MongoDataSource} from '../datasources';
const _ = require('lodash');

export class StudentController {
  constructor(
    @repository(StudentRepository)
    public studentRepository: StudentRepository,
  ) {}

  @post('/student/create', {
    responses: {
      '200': {
        description: 'Student POST success',
      },
    },
  })
  async replaceById(@requestBody() student: Student): Promise<void> {
    await this.studentRepository.create(student);
  }

  @post('students/find', {
    responses: {
      '200': {
        description: 'Array of Student model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': Student}},
          },
        },
      },
    },
  })
  async queryStudent(
    @requestBody() filter: object,
    @inject(PayloadBinding) payload: Payload,
    @inject(PayloadBinding) user: Payload,
  ) {
    console.log('Your allowed baan');
    console.log(payload.allowedBaans || []);
    console.log('Your allowed cols');
    console.log(payload.allowedColumns || []);
    console.dir(filter);
    verify(filter, payload.allowedColumns || [], payload.allowedBaans || []);
    console.log('After ===============');
    console.dir(filter);

    // this.studentRepository.find({
    //   where: {
    //     baan}
    //   },
    // });
  }
}

function verifyLB(reqFilter: Filter<Student>, allowedColumns: string[], allowedBaans: string[]) {
  const condition = reqFilter.where;
  if (!condition) {
    return reqFilter;
  }
  const unAllowedColumns = _.filter(
    _.keys(condition),
    (key: string) => !_.includes(allowedColumns, key),
  );
  if (unAllowedColumns.length > 0) {
    // return false
    throw new HttpErrors.Unauthorized('Unallowed Columns found: ' + unAllowedColumns.join(', '));
  }

  let requestedBaan: string[] = [];
  if (_.isString(condition.baan)) {
    requestedBaan = [condition.baan];
  } else if (_.isString(condition.baan.$eq)) {
    requestedBaan = [condition.baan.$eq];
  } else if (_.isArray(condition.baan.$in)) {
    requestedBaan = [condition.baan.$in];
  } else if (_.isUndefined(condition.baan)) {
    // return false
    throw new HttpErrors.BadRequest('Bad format of baan query: only $in, $eq allowed!');
  }
  const unallowedBaans = _.filter(requestedBaan, (baan: string) => !_.includes(allowedBaans, baan));
  if (unallowedBaans.length > 0) {
    // return false
    throw new HttpErrors.Unauthorized('Unallowed baans found: ' + unallowedBaans.join(', '));
  }
  reqFilter.baan = {$in: requestedBaan};
  return reqFilter; // return self when validate completed
}

function verify(reqFilter: any, allowedColumns: string[], allowedBaans: string[]) {
  const unAllowedColumns = _.filter(
    _.keys(reqFilter),
    (key: string) => !_.includes(allowedColumns, key),
  );
  if (unAllowedColumns.length > 0) {
    // return false
    throw new HttpErrors.Unauthorized('Unallowed Columns found: ' + unAllowedColumns.join(', '));
  }

  let requestedBaan = [];
  if (_.isString(reqFilter.baan)) {
    requestedBaan = [reqFilter.baan];
  } else if (_.isString(reqFilter.baan.$eq)) {
    requestedBaan = [reqFilter.baan.$eq];
  } else if (_.isArray(reqFilter.baan.$in)) {
    requestedBaan = [reqFilter.baan.$in];
  } else if (_.isUndefined(reqFilter.baan)) {
    // return false
    throw new HttpErrors.BadRequest('Bad format of baan query: only $in, $eq allowed!');
  }
  const unallowedBaans = _.filter(requestedBaan, (baan: string) => !_.includes(allowedBaans, baan));
  if (unallowedBaans.length > 0) {
    // return false
    throw new HttpErrors.Unauthorized('Unallowed baans found: ' + unallowedBaans.join(', '));
  }
  reqFilter.baan = {$in: requestedBaan};
  return reqFilter; // return self when validate completed
}
