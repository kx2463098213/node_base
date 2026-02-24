import { Injectable } from "@nestjs/common";
import { Logger } from "@/common/logger/logger";
import { MysqlService } from "@/core/database/mysql/mysql";
import { LabelAddDataDto, LabelDeleteDto, LabelResponseDto } from "./dto/label.dto";
import { LabelOrmEntity } from "./entity/label.orm-entity";
import { BaseException } from "@/common/exceptions/custom.exception";
import { Transactional } from "typeorm-transactional";
import { In } from "typeorm";
import { ListResultDto } from "@/shared/remote/http.service";
import { BaseListDto } from "@/common/common.dto";
import { UserService } from "@/shared/remote/uc/user.service";

@Injectable()
export class LabelService {
  private readonly logger = new Logger('labelSvc');

  constructor(
    private readonly mysql: MysqlService,
    private readonly userSvc: UserService,
  ) { }

  async list(tenantId: number, data: BaseListDto): Promise<ListResultDto<LabelResponseDto>> {
    const { page, size, word } = data
    const builder = this.mysql
      .createQueryBuilder(LabelOrmEntity, 'label')
      .andWhere('label.tenantId = :tenantId', { tenantId })
      .orderBy('label.updatedAt', 'DESC')
      .skip((page - 1) * size)
      .take(size)

    if (word) {
      builder.andWhere('label.name like :word', { word: `%${word}%` })
    }

    const [items, total] = await builder.getManyAndCount();

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
    const existingLabel = await this.mysql
      .createQueryBuilder(LabelOrmEntity, 'label')
      .where('label.name = :name', { name: data.name })
      .andWhere('label.tenantId = :tenantId', { tenantId })
      .getOne();

    if (existingLabel) {
      throw new BaseException(400, "标签已经存在");
    }

    const record = new LabelOrmEntity()
    record.name = data.name
    if (data.description) {
      record.description = data.description
    }
    const label = await this.mysql.save(record)
    return label;
  }

  @Transactional()
  async delete(tenantId: number, data: LabelDeleteDto): Promise<boolean> {
    // const ids = _.union(data.ids).map((id) => BigInt(id))
    const ids = data.ids;
    await this.mysql.softDelete(LabelOrmEntity, { tenantId, id: In(ids) });
    return true
  }
}