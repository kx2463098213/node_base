import { Inject, Injectable, OnApplicationShutdown } from "@nestjs/common";
import {
  DataSource, DeleteResult, EntityMetadata, EntityTarget, FindManyOptions, FindOneOptions,
  FindOptionsWhere, ObjectId, ObjectLiteral, QueryRunner, RemoveOptions,  SaveOptions,
  SelectQueryBuilder,
} from "typeorm";
import { Repository } from "typeorm/repository/Repository";
import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { UpdateResult } from "typeorm/query-builder/result/UpdateResult";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { DeepPartial } from "typeorm/common/DeepPartial";
import { MYSQL_CONNECTION } from "./mysql.provider";
import { Logger } from "@/common/logger/logger";
import { SoftDeletedEntity } from "./base-orm.entity";
import dayjs from "dayjs";
import { scopeUtils } from "@/common/utils/scope-utils";

type UpdateOptions = string | string[] | number | number[] | Date | Date[] | ObjectId | ObjectId[] | any;
type CustomFindOptions<T> = FindOptionsWhere<T> | FindOptionsWhere<T>[];

@Injectable()
export class MysqlService implements OnApplicationShutdown {
  logger = new Logger(MysqlService.name);
  onApplicationShutdown() {
    this.logger.info("Application Showdown; MysqlService Close");
    if (this.connection?.destroy) {
      this.connection.destroy();
    }
  }

  constructor(@Inject(MYSQL_CONNECTION) readonly connection: DataSource) {}

  GetModel<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
    return this.connection.getRepository(entity);
  }

  getMetadata<T>(target: EntityTarget<T>): EntityMetadata {
    return this.connection.getMetadata(target);
  }

  getTableName<T>(target: EntityTarget<T>): string {
    return this.getMetadata(target).tableName;
  }

  getManager(): EntityManager {
    return this.connection.manager;
  }

  public create<T>(entity: new () => T, options?: DeepPartial<T>): T {
    return this.getManager().create(entity, options);
  }

  public batchCreate<T>(entity: new () => T, options?: DeepPartial<T>[]): T[] {
    return this.getManager().create(entity, options);
  }

  async save<T>(entity: T, options?: SaveOptions): Promise<T> {
    return this.getManager().save(entity, options);
  }

  public async batchSave<T>(entities: T[]): Promise<T[]> {
    return this.getManager().save(entities);
  }

  async findOneBy<T extends ObjectLiteral>(
    entity: EntityTarget<T>, 
    options: CustomFindOptions<T>
  ): Promise<T|null> {
    return this.getManager().findOneBy(entity, options);
  }

  async findOne<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    options: FindOneOptions<T>
  ): Promise<T|null> {
    return this.getManager().findOne(entity, options);
  }

  public async find<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    options: FindManyOptions<T>
  ): Promise<T[]> {
    return this.getManager().find(entity, options);
  }

  public async update<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    options: UpdateOptions,
    partEntity: QueryDeepPartialEntity<T>
  ) :Promise<UpdateResult> {
    return this.getManager().update(entity, options, partEntity);
  }

  async remove<T>(entity: T, options: RemoveOptions): Promise<T> {
    return this.getManager().remove(entity, options);
  }

  async delete<T extends ObjectLiteral>(entity: EntityTarget<T>, criteria: UpdateOptions): Promise<DeleteResult> {
    return this.getManager().delete(entity, criteria);
  }

  async softDelete<T extends SoftDeletedEntity> (
    entity: EntityTarget<T>,
    criteria: UpdateOptions
  ) {
    const deletedAt = dayjs().startOf('second').toDate();
    const deletedBy = scopeUtils.getUserId() || 0;
    const updateParam = {
      deletedAt,
      deletedBy
    } as unknown as QueryDeepPartialEntity<T>;
    return this.getManager().update(entity, criteria, updateParam);
  }

  async count<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    options?: FindManyOptions<T>
  ): Promise<number> {
    return this.getManager().count(entity, options);
  }

  async countBy<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    where: CustomFindOptions<T>
  ): Promise<number> {
    return this.getManager().countBy(entity, where);
  }

  async exists<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    options?: FindManyOptions<T>
  ): Promise<boolean> {
    return this.getManager().exists(entity, options);
  }

  async existsBy<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    where: CustomFindOptions<T>
  ): Promise<boolean> {
    return this.getManager().existsBy(entity, where);
  }

  async findBy<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    options: CustomFindOptions<T>
  ): Promise<Array<T>> {
    return this.getManager().findBy(entity, options);
  }

  createQueryBuilder<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    alias: string,
    queryRunner?: QueryRunner
  ): SelectQueryBuilder<T> {
    return this.getManager().createQueryBuilder(entity, alias, queryRunner);
  }

  createBuilder(queryRunner?: QueryRunner): SelectQueryBuilder<any> {
    return this.getManager().createQueryBuilder(queryRunner);
  }
}