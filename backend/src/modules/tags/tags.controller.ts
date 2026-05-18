import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async findAll() {
    return this.tagsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.findOne(id);
  }

  @Post()
  @Roles('admin', 'staff')
  async create(@Body() body: { name: string }, @Req() req: any) {
    return this.tagsService.createTag(body.name, req.user.id);
  }

  @Delete(':id')
  @Roles('admin', 'staff')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.tagsService.deleteTag(id, req.user.id);
  }
}
