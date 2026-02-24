import { Injectable } from "@nestjs/common";
import { Logger } from "@/common/logger/logger";
import { LabelAddDataDto, LabelDeleteDto, LabelResponseDto } from "./dto/label.dto";
import { LabelOrmEntity } from "./entities/label.orm-entity";
import { BaseException } from "@/common/exceptions/custom.exception";
import { Transactional } from "typeorm-transactional";
import { ListResultDto } from "@/shared/remote/http.service";
import { BaseListDto } from "@/common/common.dto";
import { UserService } from "@/shared/remote/uc/user.service";
import { LabelRepository } from "./repositories/label.repository";

@Injectable()
export class LabelService {
  private readonly logger = new Logger('labelSvc');

  constructor(
    private readonly labelRepo: LabelRepository,
    private readonly userSvc: UserService,
  ) { }

  async list(tenantId: number, data: BaseListDto): Promise<ListResultDto<LabelResponseDto>> {
    const { page, size, word } = data;
    const [items, total] = await this.labelRepo.findByTenantWithPagination(tenantId, page, size, word);

    const userIds = [...new Set(items.map(item => item.updatedBy))];
    const employeeList = await this.userSvc.getEmployeesByAdminApi(userIds);
    const employeeMap = new Map(employeeList.items.map(v => [v.userId, v.name]));

    const list = items.map(item => { 
      return {
        id: item.id,
        name: item.name,
        updatedAt: item.updatedAt.toString(),
        updatedBy: employeeMap.get(item.updatedBy) || '',
        description: item.description
      }
    });

    return { total, list }
  }

  async add(tenantId: number, data: LabelAddDataDto): Promise<LabelOrmEntity> {
    const existingLabel = await this.labelRepo.findByNameAndTenant(data.name, tenantId);
    if (existingLabel) {
      throw new BaseException(400, "标签已经存在");
    }

    const record = new LabelOrmEntity();
    record.name = data.name;
    if (data.description) {
      record.description = data.description;
    }
    const label = await this.labelRepo.save(record);
    return label;
  }

  @Transactional()
  async delete(tenantId: number, data: LabelDeleteDto): Promise<boolean> {
    const ids = data.ids;
    await this.labelRepo.softDeleteByIds(tenantId, ids);
    return true;
  }
}