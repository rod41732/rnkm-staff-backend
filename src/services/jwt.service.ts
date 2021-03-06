import {inject} from '@loopback/context';
import {RestBindings, Request, HttpErrors, Response} from '@loopback/rest';

import {repository} from '@loopback/repository';
import {SessionRepository} from '../repositories';
import {promisify} from 'util';
import {verify, sign} from 'jsonwebtoken';
import * as shortid from 'shortid';
const cookie = require('cookie');

const jsonwebtoken = require('jsonwebtoken');

export type Payload = {
  id: string;
  name?: string;
  password?: string;
  allowedColumns?: string[];
  allowedBaans?: string[];
};

type hasCookie = {
  cookie?: string;
};

const cookieName = 'token';
const secret = 'Ac0r38kv1xc0PE9q8zb7Ve0';
const TOKEN_AGE = '2h';

export class JwtService {
  constructor(
    @inject(RestBindings.Http.REQUEST) private request: Request,
    @inject(RestBindings.Http.RESPONSE) private response: Response,

    @repository(SessionRepository) private sessionRepo: SessionRepository,
  ) {}

  async getPayload(): Promise<Payload | null> {
    try {
      return <Payload>verify(this.getCookie(), secret);
    } catch (err) {
      return null;
    }
  }

  getCookie(): string {
    return cookie.parse(this.request.headers.cookie || '')[cookieName];
  }

  clearCookie(): void {
    this.request.clearCookie(cookieName);
  }

  async setCookie(payload: Payload): Promise<string> {
    if (!payload) {
      throw new HttpErrors.Unauthorized('No payload');
    }
    try {
      const ck = sign(payload, secret, {expiresIn: TOKEN_AGE});
      console.log(ck);
      this.response.cookie(cookieName, ck, {
        httpOnly: true,
      });
      return ck;
    } catch (err) {
      console.log('[catcherrr]', err);
      throw new HttpErrors.InternalServerError(err);
    }
  }
}
