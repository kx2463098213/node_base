import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { LabelService } from "./label.service";
import {
  LabelAddDataDto, LabelDeleteDto, LabelListRespDto, LabelResponseDto,
} from "./dto/label.dto";
import { BaseListDto, BooleanResDto } from "@/common/common.dto";
import { ListResultDto } from "@/shared/remote/http.service";
import { scopeUtils } from "@/common/utils/scope-utils";

@ApiTags("tag.label")
@Controller('label')
export class LabelController {
  constructor(
    private readonly labelSvc: LabelService,
  ) { }

  @Post('/list')
  @ApiOperation({ summary: 'api.label.list' })
  @ApiBody({ type: BaseListDto })
  @ApiResponse({ status: 200, description: 'api.label.list', type: LabelListRespDto })
  async getLabelList(@Body() data: BaseListDto): Promise<ListResultDto<LabelResponseDto>> {
    const tenantId = scopeUtils.getTenantId();
    return this.labelSvc.list(tenantId, data)
  }

  @Post('/add')
  @ApiOperation({ summary: 'api.label.add' })
  @ApiBody({ type: LabelAddDataDto })
  @ApiResponse({ status: 200, description: 'api.label.add', type: LabelResponseDto })
  async add(@Body() data: LabelAddDataDto): Promise<LabelResponseDto> {
    const tenantId = scopeUtils.getTenantId();
    return this.labelSvc.add(tenantId, data);
  }

  @Post('/delete')
  @ApiOperation({ summary: 'api.label.delete' })
  @ApiBody({ type: LabelDeleteDto })
  @ApiResponse({ status: 200, description: 'api.label.delete', type: BooleanResDto })
  async delete(@Body() data: LabelDeleteDto): Promise<boolean> {
    const tenantId = scopeUtils.getTenantId();
    return this.labelSvc.delete(tenantId, data);
  }
}