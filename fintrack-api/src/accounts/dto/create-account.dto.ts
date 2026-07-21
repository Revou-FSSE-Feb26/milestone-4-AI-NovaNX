import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum AccountType {
  CASH = 'cash',
  BANK = 'bank',
  EWALLET = 'e-wallet',
}

export class CreateAccountDto {
  @IsInt()
  @Min(1)
  user_id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}
