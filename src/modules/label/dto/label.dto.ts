import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { ArrayMinSize, IsArray, IsOptional, IsString } from "class-validator"
import { TransAny2Str } from "@/common/common-transform"

export class LabelAddDataDto {
  @Transform(TransAny2Str)
  @IsString()
  @ApiProperty({ description: '标签名称' })
  name: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: '标签描述', required: false })
  description?: string
}

export class LabelDeleteDto {
  @IsArray()
  @ArrayMinSize(1)
  @ApiProperty({ description: '标签ID数组', type: [String], isArray: true })
  ids: string[]
}

export interface LabelResponseDto {
  id: bigint;
  name: string;
  updatedAt: string;
  createdBy: string;
  description: string;
}