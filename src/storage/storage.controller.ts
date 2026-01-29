import { Bind, Body, Controller, Post } from '@nestjs/common'
import { StorageService } from './storage.service'
import { StorageRequestDTO, DownloadUrlDTO } from './storage.dtos'
import { scopeUtils } from '@/scope-store/index'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

@Controller('storage')
export class StorageController {
  constructor(
    private readonly storageSvc: StorageService,
  ) { }

  // @Post('get-temporary-credentials')
  // async getTemporaryCredentials() {
  //   return await this.storageSvc.getTemporaryCredentials()
  // }

  /**
   * 上传文件后，返回文件访问key
   * @param req
   * @param file
   * @returns
   */
  // @Post('/upload')
  // @UseInterceptors(FileInterceptor('file'))
  // async uploadFile(@Body() req: StorageRequestDTO, @UploadedFile() file: Express.Multer.File) {
  //   const tenantId = scopeUtils.getTenantId()
  //   // let key = req.key || `${dayjs().unix()}_${file.originalname}`
  //   // key = key.startsWith('/') ? `${tenantId}${key}` : `${tenantId}/${key}`
  //   let key = this.storageSvc.generateKeyByMd5(tenantId?.toString() || '', req.md5, req.ext);
  //   key = await this.storageSvc.uploadFile(file, req.access, key)
  //   return { key: key }
  // }

  @Post('/get-download-url')
  @ApiOperation({ summary: '获取下载链接' })
  @ApiResponse({ status: 201, description: '获取云存储访问链接' })
  @Bind(Body())
  async getDownloadUrl(req: DownloadUrlDTO) {
    const { key, keys } = req;
    if (key) {
      const signedUrl = await this.storageSvc.getPresignedUrl(key, req.access, 3600)
      return { url: signedUrl }
    }

    if (keys?.length) {
      const urls: string[] = []
      for (const key of keys) {
        const signedUrl = await this.storageSvc.getPresignedUrl(key, req.access, 3600)
        urls.push(signedUrl)
      }
      return { urls: urls }
    }

    return {}
  }


  @ApiOperation({ summary: '创建临时链接' })
  @ApiResponse({ status: 201, description: '创建临时链接' })
  @Post('/create-presigned-url')
  async createPutPresignedUrl(@Body() data: StorageRequestDTO) {
    // 只需要判断数据库是否存在，如果数据库存在就抛错，云端存在的情况还是返回链接，让覆盖上传
    const tenantId = scopeUtils.getTenantId();
    const { md5, ext, access, checkMd5 = true } = data;
    // if (checkMd5) {
    //   const material = await this.materialSvc.getExistedMaterials(tenantId, [md5], ['id']);
    //   if (material?.length) {
    //     throw new BaseException(400, `当前文件已经上传过: md5: ${md5}`);
    //   }
    // }
    const key = this.storageSvc.generateKeyByMd5(tenantId?.toString() || '', md5, ext, checkMd5);
    const url = await this.storageSvc.createPutPresignedUrl(key, access, 3600, data.contentType);
    const downloadUrl = await this.storageSvc.getPresignedUrl(key, access, 3600);
    return { url, key, downloadUrl };
  }

  // @Post('/get-long-term-url')
  // async getLongTermUrl(@Body('key') key: string, @Body('access') access: string) {
  //   const url = await this.storageSvc.getLongTermUrl(key, access)
  //   return { url: url, key: key }
  // }

  @ApiOperation({ summary: '获取下载流' })
  @ApiResponse({ status: 201, description: '获取成功' })
  @Post('/download/stream')
  async downloadAsStream(@Body('key') key: string, @Body('access') access: string) {
    return await this.storageSvc.getObject(key, access)
  }

}
