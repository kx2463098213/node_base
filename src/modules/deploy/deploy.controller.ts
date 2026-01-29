import { Controller, Get } from "@nestjs/common";
import { ApiExcludeController, ApiOkResponse, ApiTags } from "@nestjs/swagger";

@Controller("deploy")
@ApiTags('部署')
@ApiExcludeController()
export class DeployController {

  @Get(["ready", "live"])
  @ApiOkResponse({ type: String, description: '健康检查' })
  async readyLive(): Promise<string> {
    return "success";
  }
}
