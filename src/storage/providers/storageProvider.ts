import { Stream } from 'node:stream'

export interface StorageProvider {
  createPutPresignedUrl(key: string, bucket: string, expiresIn: number, contentType: string)

  getDownloadUrl(key: string, bucket: string, expiresIn: number, sign: boolean)

  /**
   * 长期有效的
   * @param key
   */
  getLongTermDownloadUrl(key: string)

  getObject(key: string, bucket: string)

  removeObject(key: string, bucket: string)

  uploadFile(file: Express.Multer.File, bucket: string, key: string)

  uploadLocalFile(filePath: string, mimetype: string, bucket: string, key: string, expireDate: string)

  uploadFileByBuffer(buffer: Buffer | Stream, mimetype: string, bucket: string, key: string)

  uploadFileByBase64(base64: string, bucket: string, key: string, mimeType: string)

  getTemporaryCredentials(roleSessionName: string)

  copyFrom(bucket: string, sourceLocation: string, key: string)

  checkExisted(key: string, bucket: string): Promise<boolean>
}