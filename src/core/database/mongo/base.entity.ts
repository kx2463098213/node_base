import dayjs from "dayjs";
import { ObjectId } from "mongodb";
import { BeforeInsert, BeforeUpdate, Column, ObjectIdColumn } from "typeorm";
import { scopeUtils } from "@/common/utils/scope-utils";

export class BaseEntity {
  @ObjectIdColumn({comment: '主键ID' })
  _id: ObjectId;

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

  @BeforeUpdate()
  handleBeforeUpdate() {
    this.updatedAt = dayjs().unix();
  }
}

export class BusinessBaseEntity extends BaseEntity {
  @Column({ type: 'int', default: 0, comment: '操作创建的用户ID' })
  createdBy: number;

  @Column({ type: 'int', default: 0, comment: '操作更新的用户ID' })
  updatedBy: number;

  @Column({ type: 'number', nullable: true, comment: '删除时间戳:秒级' })
  deletedAt?: number;

  @Column({ type: 'int', default: 0, comment: '操作删除的用户ID' })
  deletedBy: number;

  @BeforeUpdate()
  handleBeforeUpdate() {
    super.handleBeforeUpdate();
    const opUser = scopeUtils.getUser();
    if (opUser) {
      this.updatedBy = opUser.userId as number;
    }
  }
}

export class TenantBaseEntity extends BusinessBaseEntity {
  @Column({ type: 'integer', default: 0, comment: '租户ID' })
  tenantId: number;

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
    const opUser = scopeUtils.getUser();
    if (opUser) {
      this.createdBy = opUser.userId as number;
      if (!this.tenantId) {
        this.tenantId = opUser.companyId as number;
      }
    }
  }
}