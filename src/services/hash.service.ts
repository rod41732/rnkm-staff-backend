const hasha = require('hasha');

const secret1 = 'MTIwOGUwKkRfKkAjUk9JVUA=';
const secret2 = 'MzJ1ZXp2bG0zNGV3ZmlzdmQ=';

export class HashService {
  hash(text: string): string {
    return hasha(text + hasha(text + secret1) + secret2);
  }

  verify(hashed: string, orig: string): Boolean {
    return this.hash(orig) == hashed;
  }
}
