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
  @IsInt()
  @Min(1)
  account_id: number;

  @ValidateIf((o: CreateTransactionDto) => o.type === TransactionType.TRANSFER)
  @IsInt()
  @Min(1)
  to_account_id?: number;

  @ValidateIf((o: CreateTransactionDto) => o.type !== TransactionType.TRANSFER)
  @IsInt()
  @Min(1)
  category_id?: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  transaction_date: string;
}
