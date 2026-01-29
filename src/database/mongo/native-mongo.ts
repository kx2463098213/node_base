import { Injectable, Inject, OnApplicationShutdown } from '@nestjs/common';
import { 
  Db, Collection, Document, ObjectId, FindOptions, UpdateFilter, Filter,
} from 'mongodb';
import dayjs from 'dayjs';
import { Logger } from '@/logger/logger';
import { MONGO_NATIVE_DB } from './mongo.provider';

/**
 * 扩展 Filter 类型，允许 _id 直接传入字符串
 */
export type FilterWithId = Filter<Document> & {
  _id?: string | ObjectId | any;
};

@Injectable()
export class NativeMongoService implements OnApplicationShutdown {
  private readonly logger = new Logger(NativeMongoService.name);

  constructor(
    @Inject(MONGO_NATIVE_DB) private readonly db: Db,
  ) {}

  private getNowTick(): number {
    return dayjs().unix();
  }

  /**
   * 自动处理 Filter 中的 _id 转换
   * 将字符串类型的 _id 转换为 MongoDB 原生的 ObjectId
   */
  private formatFilter(filter: any): Filter<Document> {
    if (!filter) return {};
    
    // 浅拷贝一份 filter 防止污染原始数据
    const newFilter = { ...filter };

    // 处理字符串类型的 _id
    if (newFilter._id && typeof newFilter._id === 'string' && ObjectId.isValid(newFilter._id)) {
      newFilter._id = new ObjectId(newFilter._id);
    }

    return newFilter as Filter<Document>;
  }

  getCollection(name: string): Collection<Document> {
    return this.db.collection(name);
  }

  async insertOne(collectionName: string, data: any) {
    const tick = this.getNowTick();
    const doc = {
      ...data,
      createdAt: data.createdAt || tick,
      updatedAt: data.updatedAt || tick,
    };
    return this.getCollection(collectionName).insertOne(doc);
  }

  async insertMany(collectionName: string, data: any[]) {
    const tick = this.getNowTick();
    const docs = data.map(item => ({
      ...item,
      createdAt: item.createdAt || tick,
      updatedAt: item.updatedAt || tick,
    }));
    return this.getCollection(collectionName).insertMany(docs);
  }

  async find(collectionName: string, filter: any, options?: FindOptions) {
    const formattedFilter = this.formatFilter(filter);
    return this.getCollection(collectionName).find(formattedFilter, options).toArray();
  }

  /**
   * 分页查询并返回总数 (findAndCount)
   * @returns [数据列表, 总条数]
   */
  async findAndCount(collectionName: string, filter: any, options: FindOptions): Promise<[any[], number]> {
    const formattedFilter = this.formatFilter(filter);
    const collection = this.getCollection(collectionName);

    const [data, count] = await Promise.all([
      collection.find(formattedFilter, options).toArray(),
      collection.countDocuments(formattedFilter),
    ]);

    return [data, count];
  }

  async findOne(collectionName: string, filter: any): Promise<any> {
    const formattedFilter = this.formatFilter(filter);
    return this.getCollection(collectionName).findOne(formattedFilter);
  }

  async updateOne(collectionName: string, filter: any, update: any) {
    const tick = this.getNowTick();
    const formattedFilter = this.formatFilter(filter);
    
    let updateDoc: UpdateFilter<Document>;

    // 检查是否使用了 $set, $inc 等原子操作符
    const isAtomicUpdate = Object.keys(update).some(key => key.startsWith('$'));

    if (isAtomicUpdate) {
      updateDoc = { ...update };
      if (!updateDoc.$set) updateDoc.$set = {};
      updateDoc.$set.updatedAt = tick;
    } else {
      // 普通对象自动转为 $set 模式，防止覆盖整个文档
      updateDoc = {
        $set: { ...update, updatedAt: tick }
      };
    }

    return this.getCollection(collectionName).updateOne(formattedFilter, updateDoc);
  }

  async deleteOne(collectionName: string, filter: any) {
    const formattedFilter = this.formatFilter(filter);
    return this.getCollection(collectionName).deleteOne(formattedFilter);
  }

  async deleteMany(collectionName: string, filter: any) {
    const formattedFilter = this.formatFilter(filter);
    return this.getCollection(collectionName).deleteMany(formattedFilter);
  }

  async count(collectionName: string, filter: any) {
    const formattedFilter = this.formatFilter(filter);
    return this.getCollection(collectionName).countDocuments(formattedFilter);
  }

  async dropCollection(collectionName: string) {
    try {
      await this.getCollection(collectionName).drop();
      this.logger.info('Successfully dropped collection: %s', collectionName);
      return true;
    } catch (error) {
      if (error.message?.includes('ns not found')) {
        this.logger.info('Collection does not exist, skip drop: %s', collectionName);
        return true;
      }
      this.logger.error('Failed to drop collection: %s, error: %s', collectionName, error.message);
      return false;
    }
  }

  async onApplicationShutdown() {
    const client = (this.db as any).client;
    if (client) {
      await client.close();
      this.logger.info('Native driver connection closed.');
    }
  }
}