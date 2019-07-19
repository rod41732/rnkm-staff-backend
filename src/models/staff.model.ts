import {Entity, model, property} from '@loopback/repository';

@model({settings: {}})
export class Staff extends Entity {
  @property({
    type: 'string',
    id: true,
    required: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
    default: [],
  })
  allowedBaans: string[];

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
    default: [],
  })
  allowedColumns: string[];

  constructor(data?: Partial<Staff>) {
    super(data);
  }
}

export interface StaffRelations {
  // describe navigational properties here
}

export type StaffWithRelations = Staff & StaffRelations;
