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
  RestBindings,
} from '@loopback/rest';
import {Staff} from '../models';
import {StaffRepository} from '../repositories';
import {inject} from '@loopback/context';
import {Request, Response} from '@loopback/rest';
import {HashServiceBinding, JwtServiceBinding, PayloadBinding} from '../bindings';
import {HashService} from '../services/hash.service';
import {JwtService, Payload} from '../services/jwt.service';

type credentials = {
  id: string;
  password: string;
};

export class StaffController {
  constructor(
    @repository(StaffRepository)
    public staffRepository: StaffRepository,
    @inject(RestBindings.Http.REQUEST) private request: Request,
    @inject(RestBindings.Http.RESPONSE) private response: Response,

    @inject(HashServiceBinding) private hashService: HashService,
    @inject(JwtServiceBinding) private jwtService: JwtService,
  ) {}

  @get('/me', {
    description: 'get detail of current user',
    responses: {
      '200': {},
    },
  })
  async getCurrentUser(@inject(PayloadBinding) user: Payload) {
    return user;
  }

  @post('/login', {
    responses: {
      '200': {
        description: 'Staff model instance',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
    },
  })
  async loginStaff(
    @requestBody({
      description: 'login credentials',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['id', 'password'],
            properties: {
              id: {
                type: 'string',
              },
              password: {
                type: 'string',
              },
            },
          },
        }, // default
      },
    })
    cred: credentials,
  ) {
    try {
      const staff = await this.staffRepository.findById(cred.id);
      if (!this.hashService.verify(staff.password, cred.password))
        throw new Error('wrong password');

      let payload = {...staff};
      delete payload['password'];
      const cookie = await this.jwtService.setCookie(payload);
      this.response.status(200).send('Login OK' + cookie);
    } catch (err) {
      console.log(err);
      throw new HttpErrors.Unauthorized('wrong username or password');
    }
  }

  @post('/staff', {
    responses: {
      '200': {
        description: 'Staff model instance',
        content: {'application/json': {schema: {'x-ts-type': Staff}}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Staff),
        },
      },
    })
    staff: Staff,
  ): Promise<Staff> {
    staff.password = this.hashService.hash(staff.password);
    return await this.staffRepository.create(staff);
  }

  @get('/staff', {
    responses: {
      '200': {
        description: 'Array of Staff model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': Staff}},
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(Staff)) filter?: Filter<Staff>,
  ): Promise<Staff[]> {
    return await this.staffRepository.find(filter);
  }
}
