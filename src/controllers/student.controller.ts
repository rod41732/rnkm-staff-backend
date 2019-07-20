import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
  Condition,
  Fields,
} from '@loopback/repository';
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
const faker = require('faker');
const baanList = require('../constant/baanlist').baanList;
export class StudentController {
  constructor(
    @repository(StudentRepository)
    public studentRepository: StudentRepository,
  ) {}

  @put('/student/create', {
    responses: {
      '200': {
        description: 'Student PUT success',
      },
    },
  })
  async create(@requestBody() student: Student): Promise<Student> {
    return await this.studentRepository.create(student);
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
    @requestBody() filter: Filter<Student>,
    @inject(PayloadBinding) user: Payload,
  ) {
    if (user === null) {
      throw new HttpErrors.Unauthorized('No token, please login first');
    }
    console.log('Your allowed baan');
    console.log(user.allowedBaans || []);
    console.log('Your allowed cols');
    console.log(user.allowedColumns || []);
    verify(filter, user.allowedColumns || [], user.allowedBaans || []);
    console.log('After ===============');

    try {
      const students = this.studentRepository.find({
        where: {
          and: [
            filter.where || {},
            {
              baan: {
                inq: user.allowedBaans,
              },
            },
          ],
        },
        limit: Math.min(filter.limit || 20, 20), // limit to 20
        offset: filter.offset || 0,
        fields: makeFieldRestriction(user.allowedColumns || []),
      });
      return students;
    } catch (err) {
      console.log(err);
      throw new HttpErrors.InternalServerError(err);
    }
  }

  @get('students/findAll', {
    responses: {
      '200': {
        description: 'Array of ALL Student model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': Student}},
          },
        },
      },
    },
  })
  async getAll() {
    try {
      const students = this.studentRepository.find({});
      return students;
    } catch (err) {
      console.log(err);
      throw new HttpErrors.InternalServerError(err);
    }
  }

  @get('students/mock', {
    responses: {
      '200': {
        description: 'A newly created instance of student',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': Student}},
          },
        },
      },
    },
  })
  async generateMockStudent() {
    try {
      const fake = new Student({
        id: faker.phone.phoneNumber('623#######'),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        baan: faker.random.arrayElement(baanList),
        allergy: faker.random.arrayElement([
          'Dust',
          'Power',
          'Paracetamol',
          'Seafood',
          'None',
          'Fish',
          'Pork',
        ]),
        phone: faker.phone.phoneNumber('08#-###-####'),
        guardianPhone: faker.phone.phoneNumber('08#-###-####'),
      });
      await this.studentRepository.create(fake);
      return fake;
    } catch (err) {
      console.log(err);
      throw new HttpErrors.InternalServerError(err);
    }
  }
}

/**
 * verify: verify that reqFilter is correct
 * and sanitize it if needed
 * @param reqFilter
 * @param allowedColumns
 * @param allowedBaans
 */
function verify(reqFilter: Filter<Student>, allowedColumns: string[], allowedBaans: string[]) {
  const condition = reqFilter.where;
  const unAllowedColumns = _.filter(
    _.keys(condition),
    (key: string) => !_.includes(allowedColumns, key),
  );
  if (unAllowedColumns.length > 0) {
    // return false
    throw new HttpErrors.Unauthorized('Unallowed Columns found: ' + unAllowedColumns.join(', '));
  }
  return condition; // return self when validate completed
}

function makeFieldRestriction(field: string[]): any {
  let result: any = {};
  field.forEach(f => (result[f] = true));
  return result;
}
