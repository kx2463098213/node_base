import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import _ from "lodash";
import { TenantBaseOrmEntity } from "@/core/database/mysql/base-orm.entity";

export enum OrderType {
  DESC = 'DESC',
  ASC = 'ASC',
}

export enum LANGUAGE_TYPE {
  Zh_CN = "zh-CN", // 简体中文
  En_US = "en-US", // English
}

export class BaseCodeResDto {
  @ApiProperty({ description: 'resp.code' })
  code: number;
}

export class BooleanResDto extends BaseCodeResDto  {
  @ApiProperty({ description: 'resp.data', example: true, type: Boolean })
  data: boolean;
}

export class CommonResDto<T extends TenantBaseOrmEntity> {
  constructor(entity: T) {
    if (_.isEmpty(entity)) {
      return;
    }
    this.id = entity.id.toString();
    this.createdAt = +entity.createdAt || 0;
    this.updatedAt = +entity.updatedAt || 0;
    this.createdBy = +entity.createdBy || 0;
    this.updatedBy = +entity.updatedBy || 0;
    this.tenantId = +entity.tenantId || 0;
  }

  @ApiProperty({ description: 'param.common.id' })
  id: string;

  @ApiProperty({ description: 'resp.common.createdTime' })
  createdAt: number;

  @ApiProperty({ description: 'resp.common.createdBy' })
  createdBy: number;

  @ApiProperty({ description: 'resp.common.updatedTime' })
  updatedAt: number;

  @ApiProperty({ description: 'resp.common.updatedBy' })
  updatedBy: number;

  @ApiProperty({ description: 'tenant.id' })
  tenantId: number;
}

export class SimpleUserInfo {
  @ApiProperty({ description: 'user.id' })
  id: number;

  @ApiProperty({ description: 'user.name' })
  name: string;
}

// 这里的 userInfo 默认值为 null，并且在构造中如果不传也默认赋值为 null，防止 v8 隐藏类劣化为多态而降低执行性能
export class CommonResWithUserDto<T extends TenantBaseOrmEntity> extends CommonResDto<T> {
  constructor(entity: T, userInfo?: SimpleUserInfo) {
    if (_.isEmpty(entity)) {
      return;
    }
    super(entity);
    this.userInfo = userInfo || null;
  }

  @ApiPropertyOptional({ description: 'user.info', type: SimpleUserInfo })
  userInfo?: SimpleUserInfo | null = null;
}

export class BaseListDto {
  @ApiProperty({ description: 'param.common.page', default: 1 })
  @IsOptional()
  @IsNumber()
  page: number = 1;

  @ApiProperty({ description: 'param.common.size', default: 10 })
  @IsOptional()
  @IsNumber()
  size: number = 10;

  @ApiProperty({ description: 'param.common.beginTime'})
  @IsOptional()
  @IsNumber()
  beginTime?: number; // unix 时间戳

  @ApiProperty({ description: 'param.common.endTime' })
  @IsOptional()
  @IsNumber()
  endTime?: number; // unix 时间戳

  @ApiProperty({ description: 'param.common.word' })
  @IsOptional()
  @IsString()
  word?: string;

  @IsOptional()
  @IsString()
  orderBy?: string;

  @IsOptional()
  @IsEnum(OrderType)
  order?: OrderType;
}

export class IdReqDTO {
  @ApiProperty({ description: 'param.common.id', example: '1' })
  @IsString()
  @IsNotEmpty()
  id: string;
}