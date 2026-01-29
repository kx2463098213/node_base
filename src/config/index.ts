import _ from 'lodash'
import dotenv from 'dotenv'
import path from 'node:path'

export function config() {
  dotenv.config({path: path.resolve(process.cwd(), getEnvFile())})
  return {
    port: process.env.PORT || 9421,
    uc: {
      endpoint: process.env.UC_ENDPOINT || 'https://api.sf.lightai.cn/uc',
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://nondeprod-reids1.redis.ivolces.com:6379',
      password: process.env.REDIS_PWD || 'wvMn4OBlhXuCJ68VK',
      db: _.toNumber(process.env.REDIS_DB) || 150,
    },
    mysqlUrl: process.env.MYSQL_URL || "mysql://socialflow_ry:Drc7sUjPMJR14kOfV@noneprod-mysql1.rds.ivolces.com:3306/socialflow_main_ry",
    mongodbUrl: process.env.MONGO_URL || "mongodb://socialflow_ry:m3XlNDht_qOuSF56ZwUz@noneprod-mongo1-0.mongodb.cn-guangzhou.ivolces.com:3717,noneprod-mongo1-1.mongodb.cn-guangzhou.ivolces.com:3717/socialflow_eventlog_ry?authSource=admin&replicaSet=rs-mongo-replica-59e61d5cdca3&retryWrites=true",
    pulsar: {
      serviceUrl: process.env.PULSAR_SERVICE_URL || 'http://172.21.2.73:8080',
      token: process.env.PULSAR_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzZi1xYSJ9.Ud6LiHidB2Rm93DCVWtGQFIkhN1yCzqbHVodkPDOVow',
      operationTimeoutSeconds: process.env.PULSAR_OPERATION_TIMEOUT_SECONDS || 30,
      defaultConsumerSubscription: process.env.DEFAULT_CONSUMER_SUBSCRIPTION || 'socialflow-main',
      namespace: process.env.PULSAR_NAMESPACE || 'sf-qa',
      cluster: process.env.PULSAR_CLUSTER || 'socialflow',
      subscriptionInitialPosition: process.env.SUBSCRIPTION_INIT_POSITION || 'Earliest'
    },
    storage: {
      bucket_endpoint: process.env.STORAGE_BUCKET_ENDPOINT || 'http://localhost:9000',
      public_bucket_endpoint: process.env.STORAGE_PUBLIC_BUCKET_ENDPOINT || 'https://apexiumuatpub-1328678707.cos.na-siliconvalley.myqcloud.com',
      public_bucket_host: process.env.STORAGE_PUBLIC_BUCKET_HOST || 'https://apexiumuatpub-1328678707.cos.na-siliconvalley.myqcloud.com',
      region: process.env.STORAGE_REGION || 'na-siliconvalley',
      bucket: process.env.STORAGE_BUCKET || 'rihel-ai',
      public_bucket: process.env.STORAGE_PUBLIC_BUCKET || 'rihel-ai',
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || 'minioadmin',
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || 'minioadmin',
      provider: process.env.STORAGE_PROVIDER || 's3',
    },
    trace: {
      endpoint: process.env.TRACE_GRPC_ENDPOINT || '',
      isTraceOn: process.env.IS_TRACE_ON || "1",
      withConsoleExporter: false,
      metadata: {
        "X-ByteAPM-AppKey": process.env.TRACE_APP_KEY || '76d5850a45785d3ed333ea7a518fb6ed',
      },
      serviceName: process.env.TRACE_SERVICE_NAME || 'social_x_main_dev'
    },
    disableMqConsumer: process.env.DISABLE_MQ_CONSUMER || '1',
  }
}

export const deployEnv = process.env.DEPLOY_ENV || 'local'
export const isLocal = deployEnv === 'local'
export const isProd = deployEnv === 'prod'
export const logLevel = process.env.LOG_LEVEL || ''
export type AppConfig = Partial<ReturnType<typeof config>>

export const getEnvFile = () => {
  const envName = process.env.ENV;
  return envName ? `.env.${envName}` : '.env';
};