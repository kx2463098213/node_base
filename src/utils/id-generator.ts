import { Snowflake } from '@sapphire/snowflake'
import { Logger } from '@/logger/logger';
import { getErrMsg } from './util';

const epoch = new Date('2025-09-28T00:00:00.000Z');
const snowflake = new Snowflake(epoch);

const logger = new Logger('SnowflakeGenerate');
export const GetSnowflakeId = (): bigint => {
  try {
    return snowflake.generate();
  } catch (error) {
    logger.error('Failed to generate Snowflake ID. Message: %s', getErrMsg(error));
    throw error;
  }
};