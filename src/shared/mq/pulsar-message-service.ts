import { Injectable } from "@nestjs/common";
import { Logger } from "@/common/logger/logger";
import { PulsarConsumer } from "./pulsar/decorators/pulsar-consumer";
import { Consumer } from "pulsar-client";

@Injectable()
export class PulsarMessageService {
  private readonly logger = new Logger('PulsarMsgSvc');

  constructor() { }

  @PulsarConsumer('adbnode-task-log-new', {
    batchReceive: true,
    batchSize: 20,
    isAutoAcknowledge: false,
    maxRetries: 3,
    retryDelay: 1e3,
    receiveTimeout: 10 * 1e3
  })
  async messageConsumer(topic: string, messages: any[], consumer: Consumer) {
    // FIXME: 按需
  }
}