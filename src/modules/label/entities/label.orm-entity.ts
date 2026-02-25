import { Column, Entity } from 'typeorm'
import { TenantBaseOrmEntity } from '@/core/database/mysql/base-orm.entity'
import { BusinessLevel, MaterialType } from '@/common/constants/label.enum';

@Entity('label')
export class LabelOrmEntity extends TenantBaseOrmEntity {
  @Column({ type: 'varchar', comment: '标签名字' })
  name: string

  @Column({
    type: 'tinyint',
    nullable: false,
    default: BusinessLevel.Label,
    comment: '标签层级',
  })
  businessLevel: BusinessLevel;

  @Column({
    type: 'tinyint',
    nullable: true,
    default: 0,
    comment: '素材类型',
  })
  materialType: MaterialType;

  @Column({ type: 'varchar', comment: '标签描述' })
  description: string;
}
