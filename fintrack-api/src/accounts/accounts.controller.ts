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
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List all accounts' })
  @ApiOkResponse({ description: 'List of accounts returned successfully' })
  findAll() {
    return this.accountsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an account by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Account ID' })
  @ApiOkResponse({ description: 'Account returned successfully' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.accountsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiCreatedResponse({ description: 'Account created successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(createAccountDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an account' })
  @ApiParam({ name: 'id', type: Number, description: 'Account ID' })
  @ApiOkResponse({ description: 'Account updated successfully' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountsService.update(id, updateAccountDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an account' })
  @ApiParam({ name: 'id', type: Number, description: 'Account ID' })
  @ApiNoContentResponse({ description: 'Account deleted successfully' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.accountsService.remove(id);
  }
}
