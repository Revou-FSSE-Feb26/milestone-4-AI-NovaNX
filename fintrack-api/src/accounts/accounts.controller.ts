import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth-user.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List all accounts' })
  @ApiOkResponse({ description: 'List of accounts returned successfully' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.accountsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an account by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Account ID' })
  @ApiOkResponse({ description: 'Account returned successfully' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.accountsService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiCreatedResponse({ description: 'Account created successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'User not found' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() createAccountDto: CreateAccountDto,
  ) {
    return this.accountsService.create(user.id, createAccountDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an account' })
  @ApiParam({ name: 'id', type: Number, description: 'Account ID' })
  @ApiOkResponse({ description: 'Account updated successfully' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountsService.update(id, user.id, updateAccountDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an account' })
  @ApiParam({ name: 'id', type: Number, description: 'Account ID' })
  @ApiNoContentResponse({ description: 'Account deleted successfully' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.accountsService.remove(id, user.id);
  }
}
