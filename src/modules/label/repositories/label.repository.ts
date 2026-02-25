import { Injectable } from "@nestjs/common";
import { EntityManager, In } from "typeorm";
import { LabelOrmEntity } from "../entities/label.orm-entity";
import { MysqlService } from "@/core/database/mysql/mysql";
import { MysqlBaseRepository } from "@/core/database/mysql/mysql.base.repository";

@Injectable()
export class LabelRepository extends MysqlBaseRepository<LabelOrmEntity> {

  constructor(mysql: MysqlService) {
    super(mysql, LabelOrmEntity, 'Label');
  }

  async findByNameAndTenant(name: string, tenantId: number) {
    return this._getRepo().createQueryBuilder('label')
      .where('label.name = :name', { name })
      .andWhere('label.tenantId = :tenantId', { tenantId })
      .getOne();
  }

  async findByTenantWithPagination(tenantId: number, page: number, size: number, word?: string): Promise<[LabelOrmEntity[], number]> {
    const builder = this._getRepo().createQueryBuilder('label')
      .andWhere('label.tenantId = :tenantId', { tenantId })
      .orderBy('label.updatedAt', 'DESC')
      .skip((page - 1) * size)
      .take(size);

    if (word) {
      builder.andWhere('label.name like :word', { word: `%${word}%` });
    }

    return builder.getManyAndCount();
  }

  async softDeleteByIds(tenantId: number, ids: string[], manager?: EntityManager) {
    return this.softDelete({ tenantId, id: In(ids) }, manager);
  }
}