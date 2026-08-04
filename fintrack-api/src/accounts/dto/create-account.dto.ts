import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
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
  @ApiProperty({ description: 'Account name', example: 'Main Bank Account' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Account type',
    enum: AccountType,
    example: AccountType.BANK,
  })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional({
    description: 'Initial account balance',
    example: 100000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}
