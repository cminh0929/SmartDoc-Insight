import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get('tree')
  getTree() {
    return this.foldersService.getFoldersTree();
  }

  @Get()
  findAll(@Query('parentId') parentId?: string) {
    if (parentId !== undefined) {
      return this.foldersService.findByParent(
        parentId === 'null' ? null : parentId,
      );
    }
    return this.foldersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foldersService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.foldersService.createWithLog(data, req.user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.foldersService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.foldersService.removeWithLog(id, req.user.id);
  }
}
