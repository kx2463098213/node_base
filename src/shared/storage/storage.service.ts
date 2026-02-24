import { ConfigService } from '@nestjs/config'
import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common'
import dayjs from 'dayjs'
import { BucketAccess, StorageProviderType } from './storage.enum'
import { StorageProvider } from './providers/storageProvider'
import { CosProvider } from './providers/cos.provider'
import { S3Provider } from './providers/s3.provider'
import path from 'path'
import { Stream } from 'node:stream'
import { TosProvider } from './providers/tos.provider'
import { ObsProvider } from './providers/obs.provider'
import { nanoid } from 'nanoid'
import { Logger } from '@/common/logger/logger'
import { scopeUtils } from '@/common/scope-utils'

@Injectable()
export class StorageService implements OnModuleInit {
  private storageProvider: StorageProvider
  private readonly logger = new Logger('storageSvc');

  constructor(
    private readonly configSvc: ConfigService,
  ) { }

  get publicBucketHost() {
    return this.configSvc.get('storage.public_bucket_host')
  }

  get region() {
    return this.configSvc.get('storage.region')
  }

  get accessKeyId() {
    return this.configSvc.get('storage.accessKeyId')
  }

  get secretAccessKey() {
    return this.configSvc.get('storage.secretAccessKey')
  }

  get bucket() {
    return this.configSvc.get('storage.bucket')
  }

  get publicBucket() {
    return this.configSvc.get('storage.public_bucket')
  }

  async onModuleInit() {
    const serviceProvider = this.configSvc.get('storage.provider')
    if (serviceProvider == StorageProviderType.COS) {
      this.storageProvider = new CosProvider(this.configSvc)
    } else if (serviceProvider == StorageProviderType.S3) {
      this.storageProvider = new S3Provider(this.configSvc)
    } else if (serviceProvider == StorageProviderType.TOS) {
      this.storageProvider = new TosProvider(this.configSvc)
    } else if (serviceProvider == StorageProviderType.OBS) {
      this.storageProvider = new ObsProvider(this.configSvc)
    } else {
      throw new Error('Unsupported service provider')
    }
    this.logger.info('初始化存储服务')
  }

  async getTemporaryCredentials(roleSessionName: string = '') {
    try {
      roleSessionName = roleSessionName || scopeUtils.getUserId()?.toString() || '';
      return await this.storageProvider.getTemporaryCredentials(roleSessionName)
    } catch (err) {
      this.logger.error(`获取临时凭证失败: ${err.message}`)
      this.logger.error(err.stack)
      throw new BadRequestException(`获取临时凭证失败: ${err.message}`)
    }
  }

  async removeObject(key: string, access: BucketAccess = BucketAccess.PRIVATE) {
    const bucket = access == BucketAccess.PUBLIC ? this.publicBucket : this.bucket
    return await this.storageProvider.removeObject(key, bucket)
  }


  /**
   * 上传文件
   * @param file
   * @param access
   * @param key
   * @returns 文件key
   */
  async uploadFile(file: Express.Multer.File, access: string = BucketAccess.PRIVATE, key: string = '') {
    const uniqueFileName = `uploads/${dayjs().unix()}_${file.originalname}`
    key = key || uniqueFileName
    const bucket = access == BucketAccess.PUBLIC ? this.publicBucket : this.bucket
    const data = await this.storageProvider.uploadFile(file, bucket, key)
    data['url'] = access == BucketAccess.PUBLIC ? data.location : await this.getPresignedUrl(key)
    return data

  }

  /**
   * 上传本地文件
   * @param filePath
   * @param mimeType
   * @param access
   * @param key
   * @param expireDate
   * @returns 文件key
   */
  async uploadLocalFile(
    filePath: string,
    mimeType: string = '',
    access: string = BucketAccess.PRIVATE,
    key: string = '',
    expireDate: string = '') {
    const fileName = path.basename(filePath)
    const uniqueFileName = `uploads/${dayjs().unix()}_${fileName}`
    key = key || uniqueFileName
    const bucket = access === BucketAccess.PUBLIC ? this.publicBucket : this.bucket
    return await this.storageProvider.uploadLocalFile(filePath, mimeType, bucket, key, expireDate)
  }

  /**
   * 使用buffer上传文件
   * @param buffer
   * @param fileName
   * @param mimeType
   * @param access
   * @param key
   * @returns 文件key
   */
  async uploadFileByBuffer(
    buffer: Buffer | Stream,
    fileName: string,
    mimeType: string = '',
    access: string = BucketAccess.PRIVATE,
    key: string = '') {
    const uniqueFileName = `uploads/${dayjs().unix()}_${fileName}`
    key = key || uniqueFileName
    const bucket = access == BucketAccess.PUBLIC ? this.publicBucket : this.bucket
    return await this.storageProvider.uploadFileByBuffer(buffer, mimeType, bucket, key)
  }

  /**
   * 根据base64上传文件
   * @param base64
   * @param access
   * @param mimeType
   * @param key
   */
  async uploadFileByBase64(base64: string, mimeType: string, access: string = BucketAccess.PRIVATE, key: string = '') {
    const uniqueFileName = `base64Uploads/${dayjs().toDate().getTime()}-${nanoid(6)}`
    key = key || uniqueFileName
    const bucket = access == BucketAccess.PUBLIC ? this.publicBucket : this.bucket
    return await this.storageProvider.uploadFileByBase64(base64, bucket, key, mimeType)
  }

  /**
   * 上传文件并获取url
   * @param base64
   * @param access
   * @param mimeType
   * @param key
   */
  async uploadAndGetUrl(base64: string, mimeType: string, access: string = BucketAccess.PRIVATE, key: string = '') {
    const result = await this.uploadFileByBase64(base64, mimeType, access, key)
    if (result) {
      const bucket = access == BucketAccess.PUBLIC ? this.publicBucket : this.bucket
      return await this.storageProvider.getLongTermDownloadUrl(result)
    }
  }

  async getLongTermUrl(key: string, access: string = BucketAccess.PRIVATE) {
    if (access == BucketAccess.PUBLIC) {
      return await this.storageProvider.getLongTermDownloadUrl(key)
    }
    return await this.getPresignedUrl(key, BucketAccess.PRIVATE, 86400 * 365) // 私有空间，默认链接有效期365天
  }

  // 生成带有效期的预签名 URL
  async getPresignedUrl(key: string, access: string = BucketAccess.PRIVATE, expiresIn: number = 3600) {
    const bucket = access == BucketAccess.PUBLIC ? this.publicBucket : this.bucket
    return await this.storageProvider.getDownloadUrl(key, bucket, expiresIn, access != BucketAccess.PUBLIC)
  }

  async copyFrom(sourceLocation: string, key: string, access: string = BucketAccess.PRIVATE) {
    const bucket = access == BucketAccess.PUBLIC ? this.publicBucket : this.bucket
    return await this.storageProvider.copyFrom(bucket, sourceLocation, key)
  }

  /**
   *
   * @param key 文件存储路径
   * @param access
   * @param expiresIn
   * @param contentType
   */
  async createPutPresignedUrl(key: string, access: string = BucketAccess.PRIVATE, expiresIn: number = 3600, contentType: string = '') {
    const bucket = access == BucketAccess.PUBLIC ? this.publicBucket : this.bucket
    return await this.storageProvider.createPutPresignedUrl(key, bucket, expiresIn, contentType)
  };

  /**
   * 根据key获取对象，返回文件buffer
   * @param key
   * @param access
   * @returns
   */
  async getObject(key: string, access: string = BucketAccess.PRIVATE): Promise<Buffer> {
    const bucket = access == BucketAccess.PUBLIC ? this.publicBucket : this.bucket
    return await this.storageProvider.getObject(key, bucket)
  }

  generateKey(key: string = '', prefix: string = '', ext: string = '') {
    key = key ? `${dayjs().unix()}_${key}` : `${dayjs().unix()}_${nanoid(6)}`
    if (prefix == '') {
      key = `${prefix}/${key}`
    }
    if (ext) {
      key = `${key}.${ext}`
    }
    return key
  }

  generateKeyByMd5(tenantId: string, md5: string, ext: string = '', needCheckMd5: boolean = true) {
    if (!ext.startsWith('.')) {
      ext = `.${ext}`
    }
    let isAPK = false;
    if (ext.endsWith('.apk')) { // apk需要修改扩展名，不然下载会被静态存储拦截
      ext = `${ext}.1`
      isAPK = true;
    }
    let key = `${tenantId}/`;
    if (isAPK) {
      key += `apk/`
    } else {
      key += `media/`
    }
    key += `${md5.substring(0,3)}/${md5.substring(3,6)}/${md5}`;
    if (!needCheckMd5) {
      key += `_${nanoid(6)}`;
    }
    key += `${ext}`;
    return key;
  }

  async checkExisted(key: string, access: string): Promise<boolean> {
    const bucket = access == BucketAccess.PUBLIC ? this.publicBucket : this.bucket;
    return await this.storageProvider.checkExisted(key, bucket)
  }
}

