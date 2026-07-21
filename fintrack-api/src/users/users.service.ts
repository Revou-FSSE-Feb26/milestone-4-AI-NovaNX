import { Injectable, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  created_at: string;
}

@Injectable()
export class UsersService {
  private users: User[] = [
    {
      id: 1,
      name: 'Alya Putri',
      email: 'alya@example.com',
      password: 'hashed-password',
      role: 'user',
      created_at: '2026-05-01T08:00:00.000Z',
    },
    {
      id: 2,
      name: 'Bima Santoso',
      email: 'bima@example.com',
      password: 'hashed-password',
      role: 'user',
      created_at: '2026-05-03T09:15:00.000Z',
    },
    {
      id: 3,
      name: 'Citra Lestari',
      email: 'citra@example.com',
      password: 'hashed-password',
      role: 'user',
      created_at: '2026-05-08T10:30:00.000Z',
    },
    {
      id: 4,
      name: 'Danu Prasetyo',
      email: 'danu@example.com',
      password: 'hashed-password',
      role: 'user',
      created_at: '2026-05-10T11:00:00.000Z',
    },
    {
      id: 5,
      name: 'Eka Rahmawati',
      email: 'eka@example.com',
      password: 'hashed-password',
      role: 'user',
      created_at: '2026-05-12T13:45:00.000Z',
    },
  ];

  private nextId = 6;

  findAll() {
    return this.users;
  }

  create(dto: CreateUserDto) {
    const exists = this.users.find((u) => u.email === dto.email);
    if (exists) throw new ConflictException('Email already registered');
    const user: User = {
      id: this.nextId++,
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    this.users.push(user);
    return user;
  }
}
