export enum BucketAccess {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

export enum StorageProviderType {
  S3 = 's3', // aws
  COS = 'cos', // 腾讯云
  TOS = 'tos', // 火山引擎
  OBS = 'obs' // 华为云
}