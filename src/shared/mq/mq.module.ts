import { Module } from "@nestjs/common";
import { PulsarSettingsProvider } from "./pulsar/provider/pulsar-settings.provider";
import { PulsarService } from "./pulsar/pulsar.service";
import { PulsarMessageService } from "./pulsar-message-service";

@Module({
  imports: [],
  providers: [
    // PulsarSettingsProvider,
    // PulsarService,
    // PulsarMessageService
  ],
  exports: [
    // PulsarSettingsProvider
  ]
})
export class MQModule{}