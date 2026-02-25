import { EntityTarget, ObjectLiteral, FindOptionsWhere, DeepPartial, UpdateResult } from "typeorm";
import { BaseRepository } from "../base.repository";
import { MysqlService } from "./mysql";
import { DBType } from "@/common/constants/db.enum";

type EntityManager = any;
type CriteriaType<E> = FindOptionsWhere<E> | FindOptionsWhere<E>[];
type UpdateDataType<E> = DeepPartial<E>;
type IdType = string | number | bigint;

export abstract class MysqlBaseRepository<E extends ObjectLiteral> extends BaseRepository<E, MysqlService> {
  constructor(mysql: MysqlService, entity: EntityTarget<E>, name: string) {
    super(mysql, entity, name, DBType.MySQL);
  }

  protected _getRepo(manager?: EntityManager) {
    return (manager || this.dbService.getDataSource().manager).getRepository(this.entity);
  }

  protected _applyUpdate(criteria: CriteriaType<E>, data: UpdateDataType<E>, manager?: EntityManager): Promise<UpdateResult> {
    return this._getRepo(manager).update(criteria, data);
  }

  protected _buildIdCriteria(id: IdType): CriteriaType<E> {
    return { id } as any;
  }
}