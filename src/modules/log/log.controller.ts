import { Controller, Get, Post, Delete, Body, Query, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { LogService } from "./log.service";
import { LogCreateDto, LogDeleteDto } from "./dto/log.dto";
import { BaseListDto } from "@/common/common.dto";

@ApiTags('日志管理')
@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get('list')
  @ApiOperation({ summary: '获取日志列表' })
  async list(@Query() query: BaseListDto & { level?: string }) {
    const tenantId = 1; // TODO: 从上下文获取
    return this.logService.list(tenantId, query);
  }

  @Get('request/:requestId')
  @ApiOperation({ summary: '根据请求ID获取日志' })
  async findByRequestId(@Param('requestId') requestId: string) {
    return this.logService.findByRequestId(requestId);
  }

  @Post('create')
  @ApiOperation({ summary: '创建日志' })
  async create(@Body() data: LogCreateDto) {
    const tenantId = 1; // TODO: 从上下文获取
    return this.logService.create(tenantId, data);
  }

  @Delete('delete')
  @ApiOperation({ summary: '删除日志' })
  async delete(@Body() data: LogDeleteDto) {
    const tenantId = 1; // TODO: 从上下文获取
    return this.logService.delete(tenantId, data);
  }
}
