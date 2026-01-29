import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { LabelService } from "./label.service";
import { LabelOrmEntity } from "./entity/label.orm-entity";
import { LabelAddDataDto, LabelDeleteDto, LabelResponseDto } from "./dto/label.dto";
import { BaseListDto } from "@/common/common.dto";
import { ListResultDto } from "../remote/http.service";

@ApiTags("标签")
@Controller('label')
export class LabelController {
  constructor(
    private readonly labelSvc: LabelService,
  ) { }

  @Post('/list')
  @ApiOperation({ summary: '获取标签列表' })
  @ApiBody({ type: BaseListDto })
  @ApiResponse({ status: 200, description: '成功获取标签列表' })
  async getLabelList(@Body() data: BaseListDto): Promise<ListResultDto<LabelResponseDto>> {
    return await this.labelSvc.list(data)
  }

  @Post('/add')
  @ApiOperation({ summary: '添加标签' })
  @ApiBody({ type: LabelAddDataDto })
  @ApiResponse({ status: 200, description: '成功添加标签' })
  async add(@Body() data: LabelAddDataDto): Promise<LabelOrmEntity> {
    return await this.labelSvc.add(data)
  }

  @Post('/delete')
  @ApiOperation({ summary: '删除标签' })
  @ApiBody({ type: LabelDeleteDto })
  @ApiResponse({ status: 200, description: '成功删除标签' })
  async delete(@Body() data: LabelDeleteDto): Promise<boolean> {
    return await this.labelSvc.delete(data)
  }
}