import { Injectable } from "@nestjs/common";
import { MysqlService } from "@/core/database/mysql/mysql";
import { LabelOrmEntity } from "../entities/label.orm-entity";
import { In } from "typeorm";

@Injectable()
export class LabelRepository {

  constructor(
    private readonly mysql: MysqlService
  ) {}

  async findByNameAndTenant(name: string, tenantId: number): Promise<LabelOrmEntity | null> {
    return this.mysql.createQueryBuilder(LabelOrmEntity, 'label')
      .where('label.name = :name', { name })
      .andWhere('label.tenantId = :tenantId', { tenantId })
      .getOne();
  }

  async findByTenantWithPagination(tenantId: number, page: number, size: number, word?: string): Promise<[LabelOrmEntity[], number]> {
    const builder = this.mysql.createQueryBuilder(LabelOrmEntity, 'label')
      .andWhere('label.tenantId = :tenantId', { tenantId })
      .orderBy('label.updatedAt', 'DESC')
      .skip((page - 1) * size)
      .take(size);

    if (word) {
      builder.andWhere('label.name like :word', { word: `%${word}%` });
    }

    return builder.getManyAndCount();
  }

  async save(label: LabelOrmEntity): Promise<LabelOrmEntity> {
    return this.mysql.save(label);
  }

  async softDeleteByIds(tenantId: number, ids: string[]): Promise<void> {
    await this.mysql.softDelete(LabelOrmEntity, { tenantId, id: In(ids) });
  }
}
