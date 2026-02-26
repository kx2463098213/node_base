import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { ArrayMinSize, IsArray, IsOptional, IsString } from "class-validator"
import { TransAny2Str } from "@/common/common-transform"

export class LabelAddDataDto {
  @Transform(TransAny2Str)
  @IsString()
  @ApiProperty({ description: 'param.label.name' })
  name: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'param.label.desc', required: false })
  description?: string
}

export class LabelDeleteDto {
  @IsArray()
  @ArrayMinSize(1)
  @ApiProperty({ description: 'param.label.ids', type: [String], isArray: true })
  ids: string[]
}

export interface LabelResponseDto {
  id: bigint;
  name: string;
  updatedAt: string;
  createdBy: string;
  description: string;
}