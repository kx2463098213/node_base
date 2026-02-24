import { BeforeInsert, BeforeUpdate, Column, DeleteDateColumn, PrimaryColumn } from "typeorm";
import { scopeUtils } from "@/common/utils/scope-utils";
import dayjs from "dayjs";
import { GetSnowflakeId } from "@/common/utils/id-generator";

export class SoftDeletedEntity {
  @DeleteDateColumn({ type: 'timestamp', comment: '删除时间戳' })
  deletedAt: string;

  @Column({ type: 'int', nullable: true, default: 0, comment: '操作删除的用户ID' })
  deletedBy: number;
}

export class BusinessBaseEntity extends SoftDeletedEntity {
  @PrimaryColumn({ type: 'bigint', comment: '主键ID' })
  id: bigint;

  @Column({ type: 'bigint', unsigned: true, default: 0, comment: '创建时间戳' })
  createdAt: number;

  @Column({ type: 'bigint', unsigned: true, default: 0, comment: '更新时间戳' })
  updatedAt: number;

  @Column({ type: 'int', default: 0, comment: '操作创建的用户ID' })
  createdBy: number

  @Column({ type: 'int', default: 0, comment: '操作更新的用户ID' })
  updatedBy: number

  @BeforeUpdate()
  handleBeforeUpdate() {
    this.updatedAt = dayjs().unix()
    const opUserId = scopeUtils.getUserId()
    if (opUserId) {
      this.updatedBy = opUserId;
    }
  }

  @BeforeInsert()
  handleBeforeInsert() {
    if (!this.id) {
      this.id = GetSnowflakeId();
    }
    const now = dayjs().unix();
     if(!this.createdAt){
      this.createdAt = now;
    }
    this.updatedAt = now;
    const opUser = scopeUtils.getUser();
    if (opUser) {
      this.createdBy = opUser.userId as number;
    }
  }
}

export class TenantBaseEntity extends BusinessBaseEntity {
  @Column({ type: 'integer', default: 0, comment: '租户ID' })
  tenantId: number

  @BeforeInsert()
  handleBeforeInsert() {
    if (!this.id) {
      this.id = GetSnowflakeId();
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


