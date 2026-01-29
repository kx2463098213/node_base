import dayjs from "dayjs";
import { ObjectId } from "mongodb";
import { BeforeInsert, Column, ObjectIdColumn } from "typeorm";

export class BaseEntity {
  @ObjectIdColumn({comment: '主键ID' })
  _id: ObjectId; // new ObjectId();

  @Column({ type: 'number', comment: '创建时间戳:秒级' })
  createdAt: number;

  @Column({ type: 'number', comment: '更新时间戳:秒级' })
  updatedAt: number;

  @BeforeInsert()
  handleBeforeInsert() {
    if (!this._id) {
      this._id = new ObjectId();
    }
    const now = dayjs().unix();
      if(!this.createdAt){
      this.createdAt = now;
    }
    this.updatedAt = now;
  }
}

export class BusinessBaseEntity extends BaseEntity {
  @Column({type: 'boolean', default: false, comment: '是否软删'})
  isDeleted: boolean = false;
}