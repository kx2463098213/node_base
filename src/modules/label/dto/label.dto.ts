import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { ArrayMinSize, IsArray, IsOptional, IsString } from "class-validator"
import { TransAny2Str } from "@/common/common-transform"
import { BaseCodeResDto, CommonResWithUserDto } from "@/common/common.dto"
import { LabelOrmEntity } from "../entities/label.orm-entity"

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
  @ApiProperty({ description: 'param.label.ids', type: [String], example: ['1', '2'], isArray: true })
  ids: string[]
}

export class LabelResponseDto extends CommonResWithUserDto<LabelOrmEntity> {
  constructor(entity: LabelOrmEntity) {
    super(entity);
    this.name = entity.name;
    this.description = entity.description;
  }

  @ApiProperty({ description: 'resp.label.name', type: String })
  name: string;

  @ApiProperty({ description: 'resp.label.desc', type: String })
  description: string;
}

export class LabelListRespDto extends BaseCodeResDto {
  @ApiProperty({ description: 'resp.data', type: LabelResponseDto })
  data: LabelResponseDto;
}