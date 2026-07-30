import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Groceries' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Category type',
    enum: CategoryType,
    example: CategoryType.EXPENSE,
  })
  @IsEnum(CategoryType)
  type: CategoryType;
}
