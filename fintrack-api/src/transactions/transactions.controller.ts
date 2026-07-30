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
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all transactions' })
  @ApiOkResponse({ description: 'List of transactions returned successfully' })
  findAll() {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Transaction ID' })
  @ApiOkResponse({ description: 'Transaction returned successfully' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiCreatedResponse({ description: 'Transaction created successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiParam({ name: 'id', type: Number, description: 'Transaction ID' })
  @ApiOkResponse({ description: 'Transaction updated successfully' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiParam({ name: 'id', type: Number, description: 'Transaction ID' })
  @ApiNoContentResponse({ description: 'Transaction deleted successfully' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.remove(id);
  }
}
