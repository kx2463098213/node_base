import { Injectable } from "@nestjs/common";
import { Logger } from "@/common/logger/logger";
import { PulsarConsumer } from "./pulsar/decorators/pulsar-consumer";
import { Consumer } from "pulsar-client";

@Injectable()
export class PulsarMessageService {
  private readonly logger = new Logger('PulsarMsgSvc');

  constructor() { }

  /**
   * Pulsar 消息消费者示例
   *
   * 当前为空实现，需要根据业务需求实现具体的消息处理逻辑。
   *
   * @param topic - 消息主题
   * @param messages - 接收到的消息批次
   * @param consumer - Pulsar 消费者实例
   *
   * TODO: 实现具体的消息处理逻辑
   */
  @PulsarConsumer('adbnode-task-log-new', {
    batchReceive: true,
    batchSize: 20,
    isAutoAcknowledge: false,
    maxRetries: 3,
    retryDelay: 1e3,
    receiveTimeout: 10 * 1e3
  })
  async messageConsumer(topic: string, messages: any[], consumer: Consumer) {
    this.logger.debug(`Received ${messages.length} messages from topic: ${topic}`);

    // TODO: 根据业务需求实现消息处理逻辑
    // 示例：
    // for (const message of messages) {
    //   try {
    //     await this.processMessage(message);
    //     await consumer.acknowledge(message);
    //   } catch (error) {
    //     this.logger.error(`Failed to process message: ${error.message}`);
    //     await consumer.negativeAcknowledge(message);
    //   }
    // }
  }
}