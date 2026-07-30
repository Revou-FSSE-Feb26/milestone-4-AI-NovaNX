import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export class CreateTransactionDto {
  @ApiProperty({ description: 'ID of the source account', example: 1 })
  @IsInt()
  @Min(1)
  account_id: number;

  @ApiPropertyOptional({
    description:
      'ID of the destination account (required when type is transfer)',
    example: 2,
  })
  @ValidateIf((o: CreateTransactionDto) => o.type === TransactionType.TRANSFER)
  @IsInt()
  @Min(1)
  to_account_id?: number;

  @ApiPropertyOptional({
    description: 'ID of the category (required unless type is transfer)',
    example: 3,
  })
  @ValidateIf((o: CreateTransactionDto) => o.type !== TransactionType.TRANSFER)
  @IsInt()
  @Min(1)
  category_id?: number;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Transaction amount',
    example: 50000,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'Transaction description',
    example: 'Weekly groceries',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Transaction date (ISO 8601)',
    example: '2026-07-30',
  })
  @IsDateString()
  transaction_date: string;
}
