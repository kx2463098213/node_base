import { Injectable } from "@nestjs/common";
import { Logger } from "@/common/logger/logger";
import { LabelAddDataDto, LabelDeleteDto, LabelResponseDto } from "./dto/label.dto";
import { LabelOrmEntity } from "./entities/label.orm-entity";
import { CustomException } from "@/common/exceptions/custom.exception";
import { Transactional } from "typeorm-transactional";
import { ListResultDto } from "@/shared/remote/http.service";
import { BaseListDto } from "@/common/common.dto";
import { UserService } from "@/shared/remote/uc/user.service";
import { LabelRepository } from "./repositories/label.repository";
import { ErrorCode } from "@/common/constants/error-code";

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

    const userIds = [...new Set<number>(items.map(it => it.createdBy))];
    const users = await this.userSvc.getUsersByAdminApi(userIds);
    const userMap = new Map(users.items.map(v => [v._id, v.name]));

    const list = items.map(it => {
      const dto = new LabelResponseDto(it);
      const userId = dto.createdBy;
        dto.userInfo = {
          id: userId,
          name: userMap.get(userId) || ''
        }
      return dto;
    });

    return { total, list }
  }

  async add(tenantId: number, data: LabelAddDataDto): Promise<LabelResponseDto> {
    const { name, description } = data;
    const existingLabel = await this.labelRepo.findByNameAndTenant(name, tenantId);
    if (existingLabel) {
      // 通过 CustomExceptionFilter 完成错误信息 i18n
      throw new CustomException(ErrorCode.LabelExists, { name });
    }

    const record = new LabelOrmEntity();
    record.name = name;
    if (description) {
      record.description = description;
    }
    const label = await this.labelRepo.save(record);
    return new LabelResponseDto(label as LabelOrmEntity);
  }

  @Transactional()
  async delete(tenantId: number, data: LabelDeleteDto): Promise<boolean> {
    const ids = data.ids;
    await this.labelRepo.softDeleteByIds(tenantId, ids);
    return true;
  }
}