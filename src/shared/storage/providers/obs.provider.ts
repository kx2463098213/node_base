import { ConfigService } from '@nestjs/config'
import { StorageProvider } from './storageProvider'
import _ from 'lodash'
import ObsClient from 'esdk-obs-nodejs'
import { Readable } from 'stream'
import { Logger } from '@/common/logger/logger'
import { streamToBuffer } from '@/common/utils/util'

export class ObsProvider implements StorageProvider {
  private readonly client: ObsClient;
  private readonly logger = new Logger('Obs');

  constructor(
    private configSvc: ConfigService,
  ) {
    this.client = new ObsClient({
      access_key_id: this.secretId,
      secret_access_key: this.secretKey,
      server: this.endpoint,
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
  async createPutPresignedUrl(key: string, bucket: string, expiresIn: number = 3600, contentType: string = '') {
    try {
      const params = {
        Method: 'PUT',
        Bucket: bucket,
        Key: key,
        Expires: expiresIn,
      }
      if (contentType) {
        params['ContentType'] = contentType
      }
      const res = this.client.createSignedUrlSync(params)
      return res.SignedUrl
    } catch (error) {
      throw new Error(`Failed to generate presigned URL: ${error.message}`)
    }
  }


  // 生成带有效期的预签名 URL
  async getDownloadUrl(key: string, bucket: string, expiresIn: number = 3600, sign: boolean = true) {
    try {
      const params = {
        Bucket: bucket,
        Key: key,
        Method: 'GET',
        Expires: expiresIn,
        // 指定请求中携带的头域getDownloadUrl
        Headers: {},
      }
      const res = this.client.createSignedUrlSync(params)
      return res.SignedUrl
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
      const result = await this.client.getObject({
        Bucket: bucket,
        Key: key,
        SaveAsStream: true,
      })

      if (result.CommonMsg.Status <= 300) {
        return await streamToBuffer(result.InterfaceResult.Content);
      }
      return null
    } catch (error) {
      throw new Error(`Failed to get object: ${error.message}`)
    }
  }

  async getObjectToFile(key: string, bucket: string) {
    try {
      const result = await this.client.getObject({
        Bucket: bucket,
        Key: key,
        SaveAsFile: true,
      })

      if (result.CommonMsg.Status <= 300) {
        return result
      }
      return null
    } catch (error) {
      throw new Error(`Failed to get object: ${error.message}`)
    }
  }

  async removeObject(key: string, bucket: string) {
    try {
      const result = await this.client.deleteObject({
        Bucket: bucket,
        Key: key,
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
      const result = await this.client.putObject({
        Bucket: bucket,
        Key: key,
        ContentType: mimetype,
        Body: buffer,
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

      const param = {
        Bucket: bucket,
        Key: key,
        ContentType: mimetype,
        UploadFile: filePath,
      }
      if (expireDate && !_.isEmpty(expireDate)) {
        param['expires'] = new Date(expireDate)
      }
      const result = await this.client.uploadFile(param)
      return {
        location: bucket == this.bucket ? '' : await this.getLongTermDownloadUrl(key),
        key: key,
      }
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  async copyFrom(bucket: string, sourceLocation: string, key: string) {
    const result = await this.client.fetchObject({
      Bucket: bucket,
      Key: key,
      Url: sourceLocation,
    })
    return result
  }

  async uploadFileByBase64(base64: string, bucket: string, key: string, mimeType: string) {
    let stream;
    try {
      // 将 base64 转换为 Buffer
      const base64Data = base64.replace(/^data:\w+\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      
      stream = new Readable()
      stream.push(buffer)
      stream.push(null)

      await this.client.putObject({
        Bucket: bucket,
        Key: key,
        ContentType: mimeType,
        Body: stream,
      })

      return key
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    } finally {
      if (stream) {
        stream.destroy()
      }
    }
  }

  async checkExisted(key: string, bucket: string): Promise<boolean> {
    this.logger.info(`checkExisted: ${key} ${bucket}`)
    try {
      const result = await this.client.getObjectMetadata({
        Bucket: bucket,
        Key: key,
      });
      const status = result.CommonMsg?.Status;
      if (status === 404 || status > 300) {
        // 对象不存在
        return false;
      }
      return true;
    } catch (error) {
      throw new Error(`Failed to check existed: ${error.message || JSON.stringify(error)}`);
    }
  }
}