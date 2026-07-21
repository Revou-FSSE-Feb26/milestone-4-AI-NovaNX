import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface Category {
  id: number;
  name: string;
  type: string;
}

@Injectable()
export class CategoriesService {
  private categories: Category[] = [
    { id: 1, name: 'Salary', type: 'income' },
    { id: 2, name: 'Freelance', type: 'income' },
    { id: 3, name: 'Food & Dining', type: 'expense' },
    { id: 4, name: 'Transportation', type: 'expense' },
    { id: 5, name: 'Bills & Utilities', type: 'expense' },
    { id: 6, name: 'Shopping', type: 'expense' },
    { id: 7, name: 'Healthcare', type: 'expense' },
  ];

  private nextId = 8;

  findAll() {
    return this.categories;
  }

  findOne(id: number) {
    const category = this.categories.find((c) => c.id === id);
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  create(dto: CreateCategoryDto) {
    const category: Category = {
      id: this.nextId++,
      name: dto.name,
      type: dto.type,
    };
    this.categories.push(category);
    return category;
  }

  update(id: number, dto: UpdateCategoryDto) {
    const category = this.findOne(id);
    Object.assign(category, dto);
    return category;
  }

  remove(id: number) {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) throw new NotFoundException(`Category #${id} not found`);
    this.categories.splice(index, 1);
  }
}
