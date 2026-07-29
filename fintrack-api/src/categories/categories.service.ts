import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isForeignKeyConstraintError } from '../prisma/prisma-error.util';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  findAll() {
    return this.categoriesRepository.findAll();
  }

  async findOne(id: number) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  create(dto: CreateCategoryDto) {
    return this.categoriesRepository.create({ name: dto.name, type: dto.type });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.categoriesRepository.update(id, dto);
  }

  // Deleting the category is blocked while any transaction still references
  // it (onDelete: Restrict on Transaction.category_id).
  async remove(id: number) {
    await this.findOne(id);
    try {
      await this.categoriesRepository.delete(id);
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        throw new ConflictException(
          `Category #${id} cannot be deleted: it is still used by existing transactions`,
        );
      }
      throw error;
    }
  }
}
