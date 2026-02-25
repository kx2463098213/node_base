import { 
  ObjectLiteral, EntityTarget, Not, IsNull, FindOptionsWhere, FindManyOptions, 
  FindOneOptions, DeepPartial, UpdateResult, DeleteResult,
} from "typeorm";
import { DBOperation, DBType } from "@/common/constants/db.enum";
import { scopeUtils } from "@/common/utils/scope-utils";

// 类型定义
type IdType = string | number | bigint;
type CriteriaType<E> = FindOptionsWhere<E> | FindOptionsWhere<E>[];
type UpdateDataType<E> = DeepPartial<E>;
type EntityManager = any; // 由于 MySQL 和 MongoDB 的 Manager 类型不同，这里用 any

export abstract class BaseRepository<E extends ObjectLiteral, TService> {
  constructor(
    protected readonly dbService: TService,
    protected readonly entity: EntityTarget<E>,
    protected readonly entityName: string,
    protected readonly dbType: DBType,
  ) {
    // 【自动挡监控】：利用 Proxy 拦截所有 public 方法
    return new Proxy(this, {
      get: (target, propKey, receiver) => {
        const prop = Reflect.get(target, propKey, receiver);
        if (typeof prop === 'function' && propKey !== 'constructor' && !propKey.toString().startsWith('_')) {
          return (...args: any[]) => {
            const op = this._resolveOperation(propKey.toString());
            return this._trackQuery(op, propKey.toString(), () => prop.apply(this, args));
          };
        }
        return prop;
      },
    });
  }

  // --- 抽象接口：强制要求 MySQL/Mongo 子类实现差异逻辑 ---
  protected abstract _getRepo(manager?: EntityManager): any;
  protected abstract _applyUpdate(criteria: CriteriaType<E>, data: UpdateDataType<E>, manager?: EntityManager): Promise<UpdateResult>;
  protected abstract _buildIdCriteria(id: IdType): CriteriaType<E>;

  // --- 软删除过滤辅助方法 ---
  protected _buildActiveQuery(criteria: CriteriaType<E> = {} as CriteriaType<E>): CriteriaType<E> {
    return { ...criteria, deletedAt: null } as CriteriaType<E>;
  }

  protected _buildDeletedQuery(criteria: CriteriaType<E> = {} as CriteriaType<E>): CriteriaType<E> {
    if (this.dbType === DBType.MySQL) {
      return { ...criteria, deletedAt: Not(IsNull()) } as CriteriaType<E>;
    } else {
      return { ...criteria, deletedAt: { $exists: true, $ne: null } } as any;
    }
  }

  protected _applyActiveFilter(options: FindManyOptions<E> = {}): FindManyOptions<E> {
    if (!options.where) {
      options.where = this._buildActiveQuery();
    } else {
      options.where = this._buildActiveQuery(options.where as CriteriaType<E>);
    }
    return options;
  }

  // --- 通用标准化 CRUD：默认过滤软删除 ---
  async save(entity: E | E[], manager?: EntityManager): Promise<E | E[]> {
    return this._getRepo(manager).save(entity);
  }

  async findById(id: IdType): Promise<E | null> {
    const criteria = this._buildActiveQuery(this._buildIdCriteria(id));
    return this._getRepo().findOneBy(criteria);
  }

  async findOne(options?: FindOneOptions<E>): Promise<E | null> {
    const filteredOptions = this._applyActiveFilter(options || {});
    return this._getRepo().findOne(filteredOptions);
  }

  async findAll(options?: FindManyOptions<E>): Promise<E[]> {
    const filteredOptions = this._applyActiveFilter(options || {});
    return this._getRepo().find(filteredOptions);
  }

  async findAndCount(options?: FindManyOptions<E>): Promise<[E[], number]> {
    const filteredOptions = this._applyActiveFilter(options || {});
    return this._getRepo().findAndCount(filteredOptions);
  }

  async count(options?: FindManyOptions<E>): Promise<number> {
    const filteredOptions = this._applyActiveFilter(options || {});
    return this._getRepo().count(filteredOptions);
  }

  // --- WithDeleted 变体：查询包含已删除的数据 ---
  async findByIdWithDeleted(id: IdType): Promise<E | null> {
    return this._getRepo().findOneBy(this._buildIdCriteria(id));
  }

  async findOneWithDeleted(options?: FindOneOptions<E>): Promise<E | null> {
    return this._getRepo().findOne(options);
  }

  async findAllWithDeleted(options?: FindManyOptions<E>): Promise<E[]> {
    return this._getRepo().find(options);
  }

  async findAndCountWithDeleted(options?: FindManyOptions<E>): Promise<[E[], number]> {
    return this._getRepo().findAndCount(options);
  }

  async countWithDeleted(options?: FindManyOptions<E>): Promise<number> {
    return this._getRepo().count(options);
  }

  // --- 只查询已删除的数据 ---
  async findAllDeleted(options?: FindManyOptions<E>): Promise<E[]> {
    const deletedOptions = options || {};
    if (!deletedOptions.where) {
      deletedOptions.where = this._buildDeletedQuery();
    } else {
      deletedOptions.where = this._buildDeletedQuery(deletedOptions.where as CriteriaType<E>);
    }
    return this._getRepo().find(deletedOptions);
  }

  async findAndCountDeleted(options?: FindManyOptions<E>): Promise<[E[], number]> {
    const deletedOptions = options || {};
    if (!deletedOptions.where) {
      deletedOptions.where = this._buildDeletedQuery();
    } else {
      deletedOptions.where = this._buildDeletedQuery(deletedOptions.where as CriteriaType<E>);
    }
    return this._getRepo().findAndCount(deletedOptions);
  }

  // --- 更新和删除 ---
  async update(criteria: CriteriaType<E>, updateData: UpdateDataType<E>, manager?: EntityManager): Promise<UpdateResult> {
    return this._applyUpdate(criteria, updateData, manager);
  }

  async hardDelete(criteria: CriteriaType<E>, manager?: EntityManager): Promise<DeleteResult> {
    return this._getRepo(manager).delete(criteria);
  }

  async softDelete(criteria: CriteriaType<E>, manager?: EntityManager): Promise<UpdateResult> {
    const updateParam = {
      deletedAt: this.dbType === DBType.MySQL ? new Date() : Math.floor(Date.now() / 1000),
      deletedBy: scopeUtils.getUserId(),
    };
    return this._applyUpdate(criteria, updateParam as unknown as UpdateDataType<E>, manager);
  }

  // --- 内部逻辑解析 ---
  private _resolveOperation(methodName: string): DBOperation {
    const name = methodName.toLowerCase();
    if (name.startsWith('find') || name.startsWith('get')) return DBOperation.Find;
    if (name.startsWith('save') || name.startsWith('create')) return DBOperation.Save;
    if (name.startsWith('update') || name.startsWith('modify')) return DBOperation.Update;
    if (name.startsWith('delete') || name.startsWith('remove')) return DBOperation.Delete;
    return DBOperation.Other;
  }

  private async _trackQuery<T>(operation: DBOperation, methodName: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      // Prometheus 埋点：entityName, operation, methodName, dbType
      console.log(`[Metrics] ${this.entityName}.${methodName} [${operation}] - ${Date.now() - start}ms`);
      return result;
    } catch (e) { throw e; }
  }
}