import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsArray, ArrayMinSize, IsNotEmpty } from "class-validator";
import { BaseListDto } from "@/common/common.dto";

export class LogCreateDto {
  @IsString()
  @ApiProperty({ description: '日志级别' })
  level: string;

  @IsString()
  @ApiProperty({ description: '日志消息' })
  message: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: '日志来源' })
  source?: string;

  @IsOptional()
  @ApiPropertyOptional({ description: '额外数据' })
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: '请求ID' })
  requestId?: string;
}

export class LogDeleteDto {
  @IsArray()
  @ArrayMinSize(1)
  @ApiProperty({ description: '日志ID数组', type: [String], isArray: true })
  ids: string[];
}

export class GetByReqIdDto {
  @ApiProperty({ description: 'param.log.reqId', example: '1' })
  @IsString()
  @IsNotEmpty()
  requestId: string;
}

export class LogListReqDto extends BaseListDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description:  'param.log.reqId' })
  level?: string;
}

export interface LogResponseDto {
  _id: string;
  level: string;
  message: string;
  source?: string;
  metadata?: Record<string, any>;
  requestId?: string;
  tenantId: number;
  createdAt: number;
  createdBy: number;
}
