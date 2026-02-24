import { ConfigService } from '@nestjs/config'
import COS from 'cos-nodejs-sdk-v5'
import { StorageProvider } from './storageProvider'
import fs from 'fs'
import * as stream from 'node:stream'
import axios from 'axios'
import { Stream } from 'node:stream'
import _ from 'lodash'
import { Logger } from '@/common/logger/logger'
import { streamToBuffer } from '@/common/utils/util'


export class CosProvider implements StorageProvider {
  private readonly cosClient: COS;
  private readonly logger = new Logger('cos');

  constructor(
    private configSvc: ConfigService,
  ) {
    // this.logger.info(`COS: secretId: ${this.secretId}, secretKey: ${this.secretKey}`)
    this.cosClient = new COS({
      Credentials: {
        secretId: this.secretId,
        secretKey: this.secretKey,
      },
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
  async createPutPresignedUrl(key: string, bucket: string, expiresIn: number = 3600) {
    try {
      return this.cosClient.getObjectUrl({
        Region: this.region,
        Bucket: bucket,
        Key: key,
        Method: 'PUT',
        Expires: expiresIn,
        Sign: true,
      })
    } catch (error) {
      throw new Error(`Failed to generate presigned URL: ${error.message}`)
    }
  }


  // 生成带有效期的预签名 URL
  async getDownloadUrl(key: string, bucket: string, expiresIn: number = 3600, sign: boolean = true) {
    try {
      return this.cosClient.getObjectUrl({
        Region: this.region,
        Bucket: bucket,
        Key: key,
        Expires: expiresIn,
        Sign: sign,
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
      const { Body } = await this.cosClient.getObject({
        Region: this.region,
        Bucket: bucket,
        Key: key,
      })
      // 如果 Body 是 Buffer，直接返回
      if (Buffer.isBuffer(Body)) {
        return Body;
      }
      // 如果 Body 是流，转换为 Buffer
      if (Buffer instanceof stream.Readable) {
        return await streamToBuffer(Body);
      }
    } catch (error) {
      throw new Error(`Failed to get object: ${error.message}`)
    }
  }

  async removeObject(key: string, bucket: string) {
    try {
      const result = await this.cosClient.deleteObject({
        Region: this.region,
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

  async uploadFileByBuffer(buffer: Buffer | Stream, mimetype: string, bucket: string, key: string){
    try {
      const result = await this.cosClient.putObject({
        Region: this.region,
        Bucket: bucket,
        Key: key,
        ContentType: mimetype,
        Body: buffer,
      })
      this.logger.info(JSON.stringify(result))
      return {
        location: result.Location,
        key: key
      }
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  async uploadLocalFile(filePath: string, mimetype: string = '', bucket: string, key: string, expireDate: string = '') {
    try {
      const fileStream = fs.createReadStream(filePath)
      const param = {
        Region: this.region,
        Bucket: bucket,
        Key: key,
        ContentType: mimetype,
        Body: fileStream,
      }
      if(expireDate && !_.isEmpty(expireDate)) {
        param['Expires'] = expireDate
      }
      const result: COS.PutObjectResult = await this.cosClient.putObject(param)

      this.logger.info(JSON.stringify(result))

      fs.unlinkSync(filePath)

      return {
        location: result.Location,
        key: key
      }
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  async copyFrom(bucket: string, sourceLocation: string, key: string) {
    const result: COS.PutObjectCopyResult = await this.cosClient.putObjectCopy({
      Region: this.region,
      Bucket: bucket,
      Key: key,
      CopySource: sourceLocation
    });
    return result
  }

  async uploadFileByBase64(base64: string, bucket: string, key: string, mimeType: string) {
    try {
      // 将 base64 转换为 Buffer
      const base64Data = base64.replace(/^data:\w+\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const result: COS.PutObjectResult = await this.cosClient.putObject({
        Region: this.region,
        Bucket: bucket,
        Key: key,
        ContentType: mimeType,
        Body: buffer,
      });

      this.logger.info(JSON.stringify(result));

      return key;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async uploadFromUrlAndGetUrl(downloadUrl: string, bucket:string, mimeType: string, access: string, key: string) {
    const downloadResult = await axios.get(downloadUrl,{
      method: 'GET',
      responseType: 'arraybuffer',
    })
    // 直接转流
    const uploadResult = await this.cosClient.putObject({
      Region: this.region,
      Bucket: bucket,
      Key: key,
      ContentType: 'video/mp4',
      Body: downloadResult.data,
    })
  }

  async checkExisted(key: string, bucket: string): Promise<boolean> {
    throw new Error('not implemented')
  }

}