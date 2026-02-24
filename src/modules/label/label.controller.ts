import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { LabelService } from "./label.service";
import { LabelOrmEntity } from "./entities/label.orm-entity";
import { LabelAddDataDto, LabelDeleteDto, LabelResponseDto } from "./dto/label.dto";
import { BaseListDto } from "@/common/common.dto";
import { ListResultDto } from "@/shared/remote/http.service";
import { scopeUtils } from "@/common/utils/scope-utils";

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
    const tenantId = scopeUtils.getTenantId();
    return this.labelSvc.list(tenantId, data)
  }

  @Post('/add')
  @ApiOperation({ summary: '添加标签' })
  @ApiBody({ type: LabelAddDataDto })
  @ApiResponse({ status: 200, description: '成功添加标签' })
  async add(@Body() data: LabelAddDataDto): Promise<LabelOrmEntity> {
    const tenantId = scopeUtils.getTenantId();
    return this.labelSvc.add(tenantId, data);
  }

  @Post('/delete')
  @ApiOperation({ summary: '删除标签' })
  @ApiBody({ type: LabelDeleteDto })
  @ApiResponse({ status: 200, description: '成功删除标签' })
  async delete(@Body() data: LabelDeleteDto): Promise<boolean> {
    const tenantId = scopeUtils.getTenantId();
    return this.labelSvc.delete(tenantId, data);
  }
}