import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  findAll() {
    return [
      {
        id: 1,
        name: 'Alya Putri',
        email: 'alya@example.com',
        password: 'hashed-password',
        role: 'user',
        created_at: '2026-07-01T08:00:00.000Z',
      },
    ];
  }
}
