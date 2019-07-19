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
import {HashServiceBinding, JwtServiceBinding} from '../bindings';
import {HashService} from '../services/hash.service';
import {JwtService} from '../services/jwt.service';

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
      throw new HttpErrors.Unauthorized('Bad username or password');
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
          schema: getModelSchemaRef(Staff, {exclude: ['id']}),
        },
      },
    })
    staff: Omit<Staff, 'id'>,
  ): Promise<Staff> {
    staff.password = this.hashService.hash(staff.password);
    return await this.staffRepository.create(staff);
  }

  // @get('/staff/count', {
  //   responses: {
  //     '200': {
  //       description: 'Staff model count',
  //       content: {'application/json': {schema: CountSchema}},
  //     },
  //   },
  // })
  // async count(
  //   @param.query.object('where', getWhereSchemaFor(Staff)) where?: Where<Staff>,
  // ): Promise<Count> {
  //   return await this.staffRepository.count(where);
  // }

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

  // @patch('/staff', {
  //   responses: {
  //     '200': {
  //       description: 'Staff PATCH success count',
  //       content: {'application/json': {schema: CountSchema}},
  //     },
  //   },
  // })
  // async updateAll(
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(Staff, {partial: true}),
  //       },
  //     },
  //   })
  //   staff: Staff,
  //   @param.query.object('where', getWhereSchemaFor(Staff)) where?: Where<Staff>,
  // ): Promise<Count> {
  //   return await this.staffRepository.updateAll(staff, where);
  // }

  // @get('/staff/{id}', {
  //   responses: {
  //     '200': {
  //       description: 'Staff model instance',
  //       content: {'application/json': {schema: {'x-ts-type': Staff}}},
  //     },
  //   },
  // })
  // async findById(@param.path.string('id') id: string): Promise<Staff> {
  //   return await this.staffRepository.findById(id);
  // }

  // @patch('/staff/{id}', {
  //   responses: {
  //     '204': {
  //       description: 'Staff PATCH success',
  //     },
  //   },
  // })
  // async updateById(
  //   @param.path.string('id') id: string,
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(Staff, {partial: true}),
  //       },
  //     },
  //   })
  //   staff: Staff,
  // ): Promise<void> {
  //   await this.staffRepository.updateById(id, staff);
  // }

  // @put('/staff/{id}', {
  //   responses: {
  //     '204': {
  //       description: 'Staff PUT success',
  //     },
  //   },
  // })
  // async replaceById(
  //   @param.path.string('id') id: string,
  //   @requestBody() staff: Staff,
  // ): Promise<void> {
  //   await this.staffRepository.replaceById(id, staff);
  // }

  // @del('/staff/{id}', {
  //   responses: {
  //     '204': {
  //       description: 'Staff DELETE success',
  //     },
  //   },
  // })
  // async deleteById(@param.path.string('id') id: string): Promise<void> {
  //   await this.staffRepository.deleteById(id);
  // }
}
