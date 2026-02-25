import { Injectable } from "@nestjs/common";
import { LogEntity } from "../entities/log.entity";
import { MongoService } from "@/core/database/mongo/mongo";
import { DBType } from "@/common/constants/db.enum";
import { MongoBaseRepository } from "@/core/database/mongo/mongo.base.respoitory";

@Injectable()
export class LogRepository extends MongoBaseRepository<LogEntity> {
  constructor(mongo: MongoService) {
    super(mongo, LogEntity, 'Log');
  }

  async findByTenantWithPagination(
    tenantId: number,
    page: number,
    size: number,
    level?: string
  ): Promise<[LogEntity[], number]> {
    const query: any = { tenantId, deletedAt: null };
    if (level) {
      query.level = level;
    }

    return this._getRepo().findAndCount({
      where: query,
      skip: (page - 1) * size,
      take: size,
      order: { createdAt: 'DESC' },
    });
  }

  async findByRequestId(requestId: string): Promise<LogEntity[]> {
    return this._getRepo().find({
      where: { requestId, deletedAt: null },
      order: { createdAt: 'ASC' },
    });
  }

  async softDeleteByIds(tenantId: number, ids: string[]): Promise<void> {
    await this.softDelete({ tenantId, _id: { $in: ids } } as any);
  }
}
