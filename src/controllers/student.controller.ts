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
  RestBindings,
} from '@loopback/rest';
import {Student} from '../models';
import {StudentRepository} from '../repositories';
import {inject} from '@loopback/core';
import {PayloadBinding} from '../bindings';
import {Request, Response} from '@loopback/rest';
import {Payload} from '../services/jwt.service';
import {Connector} from 'loopback-datasource-juggler';
import {MongoDataSource} from '../datasources';
import * as shortid from 'shortid';
const _ = require('lodash');
const faker = require('faker');
const cookie = require('cookie');
const baanList = require('../constant/baanlist').baanList;

const session = new Map();
export class StudentController {
  constructor(
    @repository(StudentRepository)
    public studentRepository: StudentRepository,

    @inject(RestBindings.Http.REQUEST) private request: Request,
    @inject(RestBindings.Http.RESPONSE) private response: Response,
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
      const students = await this.studentRepository.find({
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
      const count = await this.studentRepository.count({
        and: [
          filter.where || {},
          {
            baan: {
              inq: user.allowedBaans,
            },
          },
        ],
      });
      return {
        count,
        students,
        offset: filter.offset || 0,
        limit: Math.min(filter.limit || 20, 20), // limit to 20,
      };
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

  // new paginated find
  @post('student/find-paginate/new', {
    responses: {
      '200': {
        description: 'Array of students',
        content: {
          'application/json': {
            schema: {type: 'object'},
          },
        },
      },
    },
  })
  async paginatedNew(@requestBody() filter: Condition<Student>) {
    const id: string = shortid.generate();
    const students = await this.studentRepository.find({
      where: filter,
      limit: 20 + 1,
      offset: 0,
    });
    this.response.cookie('pagination', students.length <= 20 ? -1 : 20);
    return {
      students,
      count: students.length,
    };
  }

  // continue paginated find (continue from last query)
  @post('student/find-paginate/next', {
    responses: {
      '200': {
        description: 'Array of students',
        content: {
          'application/json': {
            schema: {type: 'object'},
          },
        },
      },
    },
  })
  async paginatedCont(@requestBody() filter: Condition<Student>) {
    const offset = parseInt(cookie.parse(this.request.headers.cookie)['paginate']);
    if (offset < 0) {
      throw new HttpErrors.BadRequest('Paginate ended (-1 offset specified)');
    }
    const students = await this.studentRepository.find({
      where: filter,
      limit: 20 + 1,
      offset,
    });
    this.response.cookie('paginate', students.length <= 20 ? -1 : offset + 20);
    return {
      students,
      count: students.length,
      currentOffset: offset,
    };
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
