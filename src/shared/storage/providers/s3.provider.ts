import { ConfigService } from '@nestjs/config'
import {
  CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand,
  PutObjectCommand, S3Client, S3ClientConfig,
} from '@aws-sdk/client-s3'
import fs from 'fs'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Readable } from 'node:stream'
import { StorageProvider } from './storageProvider'
import stream from 'node:stream'
import { Logger } from '@/common/logger/logger'
import { getErrMsg, streamToBuffer } from '@/common/utils/util'

export class S3Provider implements StorageProvider {
  private storageClient: S3Client
  private readonly logger = new Logger('aws');

  constructor(
    private configSvc: ConfigService,
  ) {
    const options: S3ClientConfig = {
      ...this.commonOptions,
      requestHandler: {
        connectionTimeout: 300 * 1000,
        requestTimeout: 300 * 1000,
      }
      // endpoint: this.endpoint,
      // forcePathStyle: true,
    }
    this.storageClient = new S3Client(options)
    this.logger.info('初始化存储服务')
  }

  get publicBucketEndpointHost() {
    return this.configSvc.get('storage.public_bucket_host')
  }

  get region() {
    return this.configSvc.get('storage.region')
  }

  get endpoint() {
    return this.configSvc.get('storage.bucket_endpoint')
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

  get commonOptions() {
    return {
      region: this.region,
      // endpoint: this.endpoint,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    }
  }

  // 现在都是先生成临时链接再去上传，所以没有根据角色去做授权，所以调用这个方法会报错
  // 后期如果需要这种方式，去 aws 上配置后在测试这个方法
  async getTemporaryCredentials(roleSessionName: string) {
    throw new Error('s3 getTemporaryCredentials Method not implemented.')
  }

  async removeObject(key: string, bucket: string) {
    return await this.storageClient.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    )
  }

  /**
   * 上传文件
   * @param file
   * @param bucket
   * @param key
   * @returns 文件key
   */
  async uploadFile(file: Express.Multer.File, bucket: string, key: string) {
    const filePath = file.path
    return await this.uploadLocalFile(filePath, file.mimetype, bucket, key)
  }

  async uploadLocalFile(filePath: string, mimetype: string, bucket: string, key: string) {
    try {
      const fileStream = fs.createReadStream(filePath)
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileStream,
        ContentType: mimetype,
      })

      await this.storageClient.send(command)
      fs.unlinkSync(filePath) // 上传后删除临时文件

      return {
        location: bucket == this.bucket ? '' : await this.getLongTermDownloadUrl(key),
        key: key
      }
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  async uploadFileByBuffer(buffer: Buffer, mimetype: string, bucket: string, key: string) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,

      })

      await this.storageClient.send(command)

      return {
        location: '',
        key: key
      }
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  async uploadFileByBase64(base64: string, bucket: string, key: string, mimeType: string) {
    try {
      // 将 base64 转换为 Buffer
      const base64Data = base64.replace(/^data:\w+\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      await this.uploadFileByBuffer(buffer, mimeType, bucket, key);
      return key
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async copyFrom(bucket: string, sourceLocation: string, key: string) {
    const command = new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${sourceLocation}`,
      Key: key,
    });
    await this.storageClient.send(command)
  }

  // 生成带有效期的预签名 URL
  async getDownloadUrl(key: string, bucket: string, expiresIn: number = 3600) {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key })
    try {
      return await getSignedUrl(this.storageClient, command, { expiresIn })
    } catch (error) {
      throw new Error(`Failed to generate presigned URL: ${error.message}`)
    }
  }

  /**
   * 长期有效的
   * @param key
   */
  async getLongTermDownloadUrl(key: string) {
    return this.publicBucketEndpointHost + `/${key}`
  }

  /**
   *
   * @param key 文件存储路径
   * @param bucket
   * @param expiresIn
   * @param contentType
   */
  async createPutPresignedUrl(key: string, bucket: string, expiresIn: number = 3600, contentType: string = '') {
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType })
    return await getSignedUrl(this.storageClient, command, { expiresIn: expiresIn })
  };

  /**
   * 根据key获取对象，返回文件buffer
   * @param key
   * @param bucket
   * @returns
   */
  async getObject(key: string, bucket: string) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    try {
      const { Body } = await this.storageClient.send(command)
      // 如果 Body 是 Buffer，直接返回
      if (Buffer.isBuffer(Body)) {
        return Body;
      }
      // 如果 Body 是流，转换为 Buffer
      if (Buffer instanceof stream.Readable) {
        return await streamToBuffer(Body as Readable);
      }

      if (typeof Body === 'object' && 'pipe' in Body) {
        return await streamToBuffer(Body as Readable);
      }
    } catch (error) {
      throw new Error(`get object error: ${error.message}`)
    }
  }

  async checkExisted(key: string, bucket: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
      await this.storageClient.send(command);
      return true;
    } catch (e) {
      const code = e.$metadata?.httpStatusCode;
      const message = getErrMsg(e);
      this.logger.warn(`checkExisted bucket: ${bucket} key: ${key} error: code: ${code}, message: ${message}`);
      return false;
    }
  }
}