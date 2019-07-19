import {Entity, model, property} from '@loopback/repository';

@model({settings: {}})
export class Session extends Entity {
  @property({
    type: 'string',
    id: true,
    required: true,
  })
  userID: string;

  @property({
    type: 'string',
  })
  sessionID?: string;

  @property({
    type: 'date',
  })
  expireAt?: string;


  constructor(data?: Partial<Session>) {
    super(data);
  }
}

export interface SessionRelations {
  // describe navigational properties here
}

export type SessionWithRelations = Session & SessionRelations;
