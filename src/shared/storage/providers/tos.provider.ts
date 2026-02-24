import { ConfigService } from '@nestjs/config'
import { StorageProvider } from './storageProvider'
import axios from 'axios'
import _ from 'lodash'
import { TosClient, TosServerError } from '@volcengine/tos-sdk'
import path from 'node:path'
import { Logger } from '@/common/logger/logger'

export class TosProvider implements StorageProvider {
  private readonly privateClient: TosClient;
  private readonly publicClient: TosClient;
  private readonly logger = new Logger('tos');

  constructor(
    private readonly configSvc: ConfigService,
  ) {
    this.privateClient = new TosClient({
      accessKeyId: this.secretId,
      accessKeySecret: this.secretKey,
      region: this.region,
      endpoint: this.endpoint,
    })

    this.publicClient = new TosClient({
      accessKeyId: this.secretId,
      accessKeySecret: this.secretKey,
      region: this.region,
      endpoint: this.publicBucketEndpoint,
    })
  }

  get region() {
    return this.configSvc.get('storage.region')
  }

  get endpoint() {
    return this.configSvc.get('storage.bucket_endpoint')
  }

  get publicBucketEndpoint() {
    return this.configSvc.get('storage.public_bucket_endpoint')
  }

  get publicBucketEndpointHost() {
    return this.configSvc.get('storage.public_bucket_host')
  }

  get secretId() {
    return this.configSvc.get('storage.accessKeyId')
  }

  get secretKey() {
    return this.configSvc.get('storage.secretAccessKey')
  }

  get bucket() {
    return this.configSvc.get('storage.bucket')
  }

  get publicBucket() {
    return this.configSvc.get('storage.public_bucket')
  }

  private getClient(bucket: string = '') {
    if (bucket == this.publicBucket) {
      return this.publicClient
    }
    return this.privateClient
  }

  async getTemporaryCredentials(roleSessionName: string) {
    throw new Error('cos provider not supported')
  }


  /**
   *
   * @param key 文件存储路径
   * @param bucket
   * @param expiresIn
   * @param contentType
   */
  async createPutPresignedUrl(key: string, bucket: string, expiresIn: number = 3600) {
    try {
      return this.getClient(bucket).getPreSignedUrl({
        bucket: bucket,
        key: key,
        method: 'PUT',
        expires: expiresIn,
      })
    } catch (error) {
      throw new Error(`Failed to generate presigned URL: ${error.message}`)
    }
  }


  // 生成带有效期的预签名 URL
  async getDownloadUrl(key: string, bucket: string, expiresIn: number = 3600, sign: boolean = true) {
    try {
      return this.getClient(bucket).getPreSignedUrl({
        method: 'GET',
        bucket: bucket,
        key: key,
        expires: expiresIn,
      })
    } catch (error) {
      throw new Error(`Failed to get presigned download URL: ${error.message}`)
    }
  }

  /**
   * 生成长期有效的 URL
   * @param key
   */
  async getLongTermDownloadUrl(key: string) {
    return this.publicBucketEndpointHost + `/${key}`
  }

  async getObject(key: string, bucket: string) {
    try {
      const { data: { content } } = await this.getClient(bucket).getObjectV2({
        bucket: bucket,
        key: key,
      });

      const chunks: Uint8Array[] = []
      for await (const chunk of content) {
        if (chunk instanceof Uint8Array) {
          chunks.push(chunk);
        } else {
          throw new Error("Received a non-Uint8Array chunk");
        }
      }
      return Buffer.concat(chunks)
    } catch (error) {
      throw new Error(`Failed to get object: ${error.message}`)
    }
  }

  async removeObject(key: string, bucket: string) {
    try {
      const result = await this.getClient(bucket).deleteObject({
        bucket: bucket,
        key: key,
      })
    } catch (error) {
      throw new Error(`Failed to remove object: ${error.message}`)
    }
  }

  async uploadFile(file: Express.Multer.File, bucket: string, key: string) {
    const filePath = file.path
    return await this.uploadLocalFile(filePath, file.mimetype, bucket, key)
  }

  async uploadFileByBuffer(buffer: Buffer, mimetype: string, bucket: string, key: string) {
    try {
      const result = await this.getClient(bucket).putObject({
        bucket: bucket,
        key: key,
        contentType: mimetype,
        body: buffer,
      })
      this.logger.info(JSON.stringify(result))
      return {
        location: result.data,
        key: key,
      }
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  async uploadLocalFile(filePath: string, mimetype: string = '', bucket: string, key: string, expireDate: string = '') {
    try {
      if (!mimetype) {
        // tos必须要传这个值，不然报错
        mimetype = path.extname(filePath);
      }
      const param = {
        bucket: bucket,
        key: key,
        contentType: mimetype,
        file: filePath,
      }
      if (expireDate && !_.isEmpty(expireDate)) {
        param['expires'] = new Date(expireDate)
      }
      const result = await this.getClient(bucket).uploadFile(param)
      return {
        location: result.data.Location,
        key: key,
      }
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  async copyFrom(bucket: string, sourceLocation: string, key: string) {
    const result = await this.getClient(bucket).fetchObject({
      bucket: bucket,
      key: key,
      url: sourceLocation,
    })
    return result
  }

  async uploadFileByBase64(base64: string, bucket: string, key: string, mimeType: string) {
    try {
      // 将 base64 转换为 Buffer
      const base64Data = base64.replace(/^data:\w+\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      await this.getClient(bucket).putObject({
        bucket: bucket,
        key: key,
        contentType: mimeType,
        body: buffer,
      })

      return key
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  async uploadFromUrlAndGetUrl(downloadUrl: string, bucket: string, mimeType: string, access: string, key: string) {
    const downloadResult = await axios.get(downloadUrl, {
      method: 'GET',
      responseType: 'arraybuffer',
    })
    // 直接转流
    const uploadResult = await this.getClient(bucket).putObject({
      bucket: bucket,
      key: key,
      contentType: 'video/mp4',
      body: downloadResult.data,
    })
  }

  async checkExisted(key: string, bucket: string): Promise<boolean> {
    this.logger.info(`checkExisted: ${key} ${bucket}`)
    try {
      await this.getClient(bucket).headObject({
        bucket,
        key,
      });
    } catch (error) {
      if (error instanceof TosServerError && error.statusCode === 404) {
        // 对象不存在
        return false;
      } else {
        throw new Error(`Failed to check existed: ${error.message || JSON.stringify(error)}`);
      }
    }
    return true;
  }
}