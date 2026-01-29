import {
  Inject, Injectable, OnApplicationShutdown,
} from "@nestjs/common";
import {
  AggregateOptions, CountOptions, DataSource, DeleteResult, EntityMetadata,
  EntityTarget, FilterOperators, FindManyOptions, FindOneAndUpdateOptions,
  FindOptionsWhere, MongoEntityManager, MongoRepository, ObjectLiteral,
  QueryRunner, SaveOptions, SelectQueryBuilder,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { UpdateResult } from "typeorm/query-builder/result/UpdateResult";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { DeepPartial } from "typeorm/common/DeepPartial";
import { Logger } from "@/logger/logger";
import { MongoFindOneOptions } from "typeorm/find-options/mongodb/MongoFindOneOptions";
import { MongoFindManyOptions } from "typeorm/find-options/mongodb/MongoFindManyOptions";
import { Filter } from "mongodb";
import { MONGO_CONNECTION } from "./mongo.provider";

@Injectable()
export class MongoService implements OnApplicationShutdown {
  private readonly logger = new Logger(MongoService.name);

  onApplicationShutdown() {
    this.logger.info("Application Showdown; Mongo Close");
    if (this.connection?.destroy) {
      this.connection.destroy();
    }
  }

  constructor(@Inject(MONGO_CONNECTION) readonly connection: DataSource) {}

  GetModel<T extends BaseEntity>(entity: new () => T): MongoRepository<T> {
    return this.connection.getMongoRepository(entity);
  }

  getMetadata<T extends BaseEntity>(target: EntityTarget<T>): EntityMetadata {
    return this.connection.getMetadata(target);
  }

  getTableName<T extends BaseEntity>(target: EntityTarget<T>): string {
    return this.getMetadata(target).tableName;
  }

  GetManager(): MongoEntityManager {
    return this.connection.mongoManager;
  }

  public create<T extends BaseEntity>(entity: EntityTarget<T>, options?: DeepPartial<T>): T {
    return this.GetManager().create(entity, options);
  }

  public async save<T extends BaseEntity>(entity: T): Promise<T> {
    return await this.GetManager().save(entity);
  }

  public async batchSave<T extends BaseEntity>(entity: EntityTarget<T>, entities: T[], options?: SaveOptions): Promise<T[]> {
    return this.GetManager().save(entity, entities, options);
  }

  // 提供简单的API
  public async findOne<T extends BaseEntity>(entity: EntityTarget<T>, options: MongoFindOneOptions<T>): Promise<T | null> {
    return await this.GetManager().findOne(entity, options);
  }

  public async findOneBy<T>(entity: EntityTarget<T> , options: any): Promise<T | null> {
    return await this.GetManager().findOneBy(entity, options);
  }

  public async find<T>(
    entity: EntityTarget<T>,
    options?: FindManyOptions<T> | Partial<T> | FilterOperators<T>
  ): Promise<T[]> {
    return await this.GetManager().find(entity, options);
  }

  public async findBy<T extends BaseEntity>(
    entity: EntityTarget<T>,
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[]
  ): Promise<T[]> {
    return await this.GetManager().findBy(entity, where);
  }

  public async findAndCount<T extends BaseEntity>(
    entity: EntityTarget<T>,
    options?: MongoFindManyOptions<T>
  ): Promise<[T[], number]> {
    return await this.GetManager().findAndCount(entity, options);
  }

  public async findOneAndUpdate<T extends BaseEntity>(
    entity: EntityTarget<T>,
    query: any,
    update: any,
    options?: FindOneAndUpdateOptions,
  ): Promise<any | null> {
    return await this.GetManager().findOneAndUpdate(entity, query, update, options);
  }

  public async update<T>(
    entity: EntityTarget<T>,
    options: any,
    partEntity: QueryDeepPartialEntity<T>,
  ): Promise<UpdateResult> {
    return await this.GetManager().update(entity, options, partEntity);
  }

  public async updateMany<T>(
    entity: EntityTarget<T>,
    query: any,
    partEntity: any,
    options?: any
  ): Promise<UpdateResult> {
    return await this.GetManager().updateMany(entity, query, partEntity, options) as UpdateResult;
  }

  public async count<T>(
    entity: EntityTarget<T>,
    query?: Filter<Document>,
    options?: CountOptions
  ): Promise<number> {
    return await this.GetManager().count(entity, query, options);
  }

  public async countBy<T>(
    entity: EntityTarget<T>,
    query?: ObjectLiteral,
    options?: CountOptions
  ): Promise<number> {
    return await this.GetManager().countBy(entity, query, options);
  }

  public async aggregate<T extends BaseEntity>(
    entity: EntityTarget<T>,
    pipeline: Document[],
    options?: AggregateOptions
  ): Promise<any[]> {
    return await this.GetManager().aggregate(entity, pipeline, options).toArray();
  }

  // 硬删
  async delete<T extends BaseEntity>(entity: EntityTarget<T>, options: any): Promise<DeleteResult> {
    return this.GetManager().delete(entity, options);
  }

  createQueryBuilder<T extends BaseEntity>(
    entity: EntityTarget<T>,
    alias: string,
    queryRunner?: QueryRunner,
  ): SelectQueryBuilder<T> {
    return this.GetManager().createQueryBuilder(entity, alias, queryRunner);
  }
}
