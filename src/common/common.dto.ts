import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export enum OrderType {
  DESC = 'DESC',
  ASC = 'ASC',
}

export enum LANGUAGE_TYPE {
  Zh_CN = "zh-CN", // 简体中文
  En_US = "en-US", // English
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