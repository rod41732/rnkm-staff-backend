import {BindingKey, Binding} from '@loopback/context';
import {JwtService, Payload} from './services/jwt.service';
import {HashService} from './services/hash.service';

export const JwtServiceBinding = BindingKey.create<JwtService>('service.jwt');
export const HashServiceBinding = BindingKey.create<HashService>(
  'service.hash',
);

export const PayloadBinding = BindingKey.create<Payload | null>('jwt.payload');
