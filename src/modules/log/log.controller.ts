import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from "@nestjs/swagger";
import { LogService } from "./log.service";
import {
  GetByReqIdDto, LogCreateDto, LogDeleteDto, LogListReqDto,
} from "./dto/log.dto";
import { scopeUtils } from "@/common/utils/scope-utils";

@ApiTags('tag.log')
@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Post('list')
  @ApiOperation({ summary: 'api.log.list' })
  async list(@Body() data: LogListReqDto) {
    const tenantId = scopeUtils.getTenantId();
    return this.logService.list(tenantId, data);
  }

  @Post('get-by-request-id')
  @ApiOperation({ summary: 'api.log.getByReqId' })
  async findByRequestId(@Body() data: GetByReqIdDto) {
    return this.logService.findByRequestId(data);
  }

  @ApiExcludeEndpoint()
  @Post('create')
  @ApiOperation({ summary: '创建日志' })
  async create(@Body() data: LogCreateDto) {
    const tenantId = scopeUtils.getTenantId();
    return this.logService.create(tenantId, data);
  }

  @ApiExcludeEndpoint()
  @Post('delete')
  @ApiOperation({ summary: '删除日志' })
  async delete(@Body() data: LogDeleteDto) {
    const tenantId = scopeUtils.getTenantId();
    return this.logService.delete(tenantId, data);
  }
}
