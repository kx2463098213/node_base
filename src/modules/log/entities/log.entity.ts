import { Entity, Column } from "typeorm";
import { TenantBaseEntity } from "@/core/database/mongo/base.entity";

@Entity('logs')
export class LogEntity extends TenantBaseEntity {
  @Column({ type: 'string', comment: '日志级别' })
  level: string;

  @Column({ type: 'string', comment: '日志消息' })
  message: string;

  @Column({ type: 'string', nullable: true, comment: '日志来源' })
  source?: string;

  @Column({ nullable: true, comment: '额外数据' })
  metadata?: Record<string, any>;

  @Column({ type: 'string', nullable: true, comment: '请求ID' })
  requestId?: string;
}
