import { Injectable } from "@nestjs/common";
import { Logger } from "@/common/logger/logger";
import {
  GetByReqIdDto,
  LogCreateDto, LogDeleteDto, LogListReqDto, LogResponseDto,
} from "./dto/log.dto";
import { LogEntity } from "./entities/log.entity";
import { LogRepository } from "./repositories/log.repository";
import { ListResultDto } from "@/shared/remote/http.service";
import { Transactional } from "typeorm-transactional";

@Injectable()
export class LogService {
  private readonly logger = new Logger('LogService');

  constructor(
    private readonly logRepo: LogRepository,
  ) {}

  async list(tenantId: number, data: LogListReqDto): Promise<ListResultDto<LogResponseDto>> {
    const { page, size, level } = data;
    const [items, total] = await this.logRepo.findByTenantWithPagination(tenantId, page, size, level);

    const list = this.format(items);
    return { total, list };
  }

  async findByRequestId(data: GetByReqIdDto): Promise<LogResponseDto[]> {
    const { requestId } = data;
    const items = await this.logRepo.findByRequestId(requestId);
    return this.format(items);
  }

  private format(list: LogEntity[]): LogResponseDto[] {
    return list.map(item => ({
      _id: item._id.toString(),
      level: item.level,
      message: item.message,
      source: item.source,
      metadata: item.metadata,
      requestId: item.requestId,
      tenantId: item.tenantId,
      createdAt: item.createdAt,
      createdBy: item.createdBy,
    }));
  }

  async create(tenantId: number, data: LogCreateDto): Promise<LogEntity> {
    const log = new LogEntity();
    log.level = data.level;
    log.message = data.message;
    log.source = data.source;
    log.metadata = data.metadata;
    log.requestId = data.requestId;
    log.tenantId = tenantId;
    const result = await this.logRepo.save(log);
    return result as LogEntity;
  }

  @Transactional()
  async delete(tenantId: number, data: LogDeleteDto): Promise<boolean> {
    await this.logRepo.softDeleteByIds(tenantId, data.ids);
    return true;
  }
}
