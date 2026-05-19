import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RagService } from './rag.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class AskDto {
  question: string;
}

@Controller('rag')
@UseGuards(JwtAuthGuard)
export class RagController {
  constructor(private readonly ragService: RagService) {}

  /**
   * POST /rag/ask
   * Body: { question: string }
   * Returns: { answer, sources[] }
   */
  @Post('ask')
  @HttpCode(HttpStatus.OK)
  async ask(@Body() body: AskDto, @Request() req: any) {
    const tenantId: string = req.user?.tenantId;
    return this.ragService.ask(body.question, tenantId);
  }
}
