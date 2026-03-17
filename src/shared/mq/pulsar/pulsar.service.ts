import { Inject, Injectable, OnApplicationShutdown } from "@nestjs/common";
import { Logger } from "@/common/logger/logger";
import { AuthenticationToken, Client, Consumer, Producer, ProducerMessage } from "pulsar-client";
import { PULSAR_OPTIONS } from "./provider/pulsar-settings.provider";
import { PulsarMessage, PulsarSettings } from "./struct/pulsar.struct";
import { getErrMsg } from "@/common/utils/util";

@Injectable()
export class PulsarService implements OnApplicationShutdown {
  private readonly logger = new Logger('PulsarSvc');
  private readonly client: Client;
  private producerMap = new Map<string, Producer>();
  private consumerMap = new Map<string, Consumer>();
  private consumerPromises = new Map<string, Promise<Consumer>>();
  private producerPromises = new Map<string, Promise<Producer>>();
  public defaultConsumerSubscription: string;

  constructor(
    @Inject(PULSAR_OPTIONS) private readonly settings: PulsarSettings,
  ) {
    this.logger.debug('pulsar settings: %j', settings);
    this.client = new Client({
      serviceUrl: settings.serviceUrl,
      authentication: new AuthenticationToken({ token: settings.token }),
      operationTimeoutSeconds: Number(settings.operationTimeoutSeconds),
    });
    this.defaultConsumerSubscription = settings.defaultConsumerSubscription;
  }

  async getProducer(topic: string): Promise<Producer> {
    const topicName = this.getFullTopic(topic);
    let producer = this.producerMap.get(topicName);
    if (producer) return producer;

    // 检查是否有正在创建的 Promise
    let promise = this.producerPromises.get(topicName);
    if (!promise) {
      promise = this._createProducer(topicName);
      this.producerPromises.set(topicName, promise);
    }

    try {
      producer = await promise;
      return producer;
    } finally {
      this.producerPromises.delete(topicName);
    }
  }

  private async _createProducer(topicName: string): Promise<Producer> {
    try {
      const producer = await this.client.createProducer({ topic: topicName });
      this.producerMap.set(topicName, producer);
      this.logger.info(`Created new Pulsar producer for topic: ${topicName}`);
      return producer;
    } catch (e) {
      this.logger.error(`Failed to create Pulsar producer for topic: ${topicName}, msg: ${getErrMsg(e)}`);
      throw new Error(`Failed to create Pulsar producer for topic ${topicName}: ${getErrMsg(e)}`);
    }
  }

  async getConsumer(topic: string, subscription: string, batchSize?: number, receiveTimeout?: number): Promise<Consumer> {
    const key = `${topic}-${subscription}`;
    let consumer = this.consumerMap.get(key);
    if (consumer) return consumer;

    // 检查是否有正在创建的 Promise
    let promise = this.consumerPromises.get(key);
    if (!promise) {
      promise = this._createConsumer(topic, subscription, batchSize, receiveTimeout);
      this.consumerPromises.set(key, promise);
    }

    try {
      consumer = await promise;
      return consumer;
    } finally {
      this.consumerPromises.delete(key);
    }
  }

  private async _createConsumer(topic: string, subscription: string, batchSize?: number, receiveTimeout?: number): Promise<Consumer> {
    const key = `${topic}-${subscription}`;
    const topicName = this.getFullTopic(topic);
    try {
      const consumer = await this.client.subscribe({
        topic: topicName,
        subscription,
        subscriptionType: 'Shared',
        batchReceivePolicy: batchSize ? {
          maxNumMessages: batchSize,
          maxNumBytes: 2 * 1024 * 1024,
          timeoutMs: receiveTimeout || 10 * 1e3,
        } : undefined,
      });
      this.consumerMap.set(key, consumer);
      this.logger.info(`Created new Pulsar consumer for topic: ${topic}, subscription: ${subscription}, batchSize: ${batchSize || 'default'}`);
      return consumer;
    } catch (e) {
      this.logger.error(`Get Pulsar consumer for topic: ${topic}, subscription: ${subscription} error, msg: ${getErrMsg(e)}`);
      throw e;
    }
  }

  async send(msg: PulsarMessage, topic: string): Promise<void> {
    try {
      const msgStr = msg.message as string;
      this.logger.debug(`Sending message to Pulsar topic: ${topic}, msg: ${msgStr}`)
      const producer = await this.getProducer(topic);
      const message: ProducerMessage = {
        data: Buffer.from(msgStr),
        properties: msg.properties,
        eventTimestamp: msg.eventTimestamp,
        partitionKey: msg.partitionKey,
        orderingKey: msg.orderingKey,
        replicationClusters: msg.replicationClusters,
        deliverAt: msg.deliverAt,
        deliverAfter: msg.deliverAfter,
        disableReplication: msg.disableReplication,
      }
      await producer.send(message);
    } catch (e) {
      this.logger.error(`Failed to send message to Pulsar topic ${topic}: ${getErrMsg(e)}`);
      throw e;
    }
  }

  async close(): Promise<void> {
    this.logger.debug('onApplication shutdown, close pulsar client.');
    await this.client?.close();
  }

  private getFullTopic(topic: string) {
    return `persistent://${this.settings.cluster}/${this.settings.namespace}/${topic}`;
  }

  onApplicationShutdown() {
    this.close();
  }

}