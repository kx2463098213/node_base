import { EntityTarget, ObjectLiteral, FindOptionsWhere, DeepPartial, UpdateResult } from "typeorm";
import { BaseRepository } from "../base.repository";
import { MongoService } from "./mongo";
import { DBType } from "@/common/constants/db.enum";
import { ObjectId } from "mongodb";

type EntityManager = any;
type CriteriaType<E> = FindOptionsWhere<E> | FindOptionsWhere<E>[];
type UpdateDataType<E> = DeepPartial<E>;
type IdType = string | number | bigint;

export abstract class MongoBaseRepository<E extends ObjectLiteral> extends BaseRepository<E, MongoService> {
  constructor(mongo: MongoService, entity: EntityTarget<E>, name: string) {
    super(mongo, entity, name, DBType.Mongo);
  }

  protected _getRepo(manager?: EntityManager) {
    return (manager || this.dbService.getDataSource().mongoManager).getMongoRepository(this.entity);
  }

  protected _applyUpdate(criteria: CriteriaType<E>, data: UpdateDataType<E>, manager?: EntityManager): Promise<UpdateResult> {
    return this._getRepo(manager).updateMany(criteria, { $set: data });
  }

  protected _buildIdCriteria(id: IdType): CriteriaType<E> {
    if (typeof id === 'string' && ObjectId.isValid(id)) {
      return { _id: new ObjectId(id) } as any;
    }
    return { _id: id } as any;
  }
}