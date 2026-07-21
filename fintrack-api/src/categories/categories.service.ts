import { Injectable } from '@nestjs/common';

@Injectable()
export class CategoriesService {
  findAll() {
    return [
      {
        id: 1,
        name: 'Salary',
        type: 'income',
      },
      {
        id: 2,
        name: 'Food & Dining',
        type: 'expense',
      },
    ];
  }
}
