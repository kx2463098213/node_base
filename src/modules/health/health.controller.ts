import { Controller, Get } from "@nestjs/common";
import { ApiExcludeController, ApiOkResponse, ApiTags } from "@nestjs/swagger";

@Controller("health")
@ApiTags('健康检查')
@ApiExcludeController()
export class HealthController {

  @Get(["ready", "live"])
  @ApiOkResponse({ type: String, description: '健康检查' })
  async readyLive(): Promise<string> {
    return "success";
  }
}
