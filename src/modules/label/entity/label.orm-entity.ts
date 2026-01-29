import { Column, Entity } from 'typeorm'
import { TenantBaseEntity } from '@/database/mysql/base-orm.entity'

export enum BusinessLevel {
  Label = 1,
  Material,
  Account,
  Folder,
}

export enum MaterialType {
  Default = 0,
  Image,
  Video,
  Text,
}


@Entity('label')
export class LabelOrmEntity extends TenantBaseEntity {
  @Column({ type: 'varchar', comment: '标签名字' })
  name: string

  @Column({
    type: 'tinyint',
    nullable: false,
    default: BusinessLevel.Label,
    comment: '标签层级',
  })
  businessLevel: BusinessLevel

  @Column({
    type: 'tinyint',
    nullable: true,
    default: 0,
    comment: '素材类型',
  })
  materialType: MaterialType

  @Column({ type: 'varchar', comment: '标签描述' })
  description: string
}
