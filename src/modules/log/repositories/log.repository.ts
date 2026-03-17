import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { LogEntity } from "../entities/log.entity";
import { MongoService } from "@/core/database/mongo/mongo";
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
    // 将 string[] 转换为 ObjectId[] 以匹配 MongoDB _id 类型
    const objectIds = ids.map(id => {
      try {
        return new ObjectId(id);
      } catch (e) {
        // 如果转换失败，返回原始字符串（让 MongoDB 处理错误）
        return id;
      }
    });
    // 使用 as any 绕过 TypeORM 的类型检查，因为 MongoDB 的 $in 操作符不在 TypeORM 类型定义中
    await this.softDelete({ tenantId, _id: { $in: objectIds } } as any);
  }
}
