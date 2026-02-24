import { Injectable } from "@nestjs/common";
import { I18nContext, I18nService } from "nestjs-i18n";
import { Logger } from "@/common/logger/logger";

@Injectable()
export class MyI18nService {
  logger = new Logger(MyI18nService.name);

  constructor(
    private readonly i18n: I18nService,
  ) { }

  getMessage(key: string, args?: any): string {
    key = "message." + key;
    return this.i18n.t(key, { lang: I18nContext.current()?.lang, args });
  }

  getValidateMessage(key: string, args?: any, defaultValue?: string): string {
    key = "validation." + key;
    return this.i18n.t(key, { lang: I18nContext.current()?.lang, args, defaultValue });
  }

  getSwaggerTranslation(key: string, lang: string): string {
    const prefix = "swagger.";
    const finalKey = prefix + key;
    const value = this.i18n.t(finalKey, { lang }) as string;
    if (value.startsWith(prefix)) {
      return key;
    }
    return value;
  }

  // swagger 文档的 i18n 转换
  translateSwaggerDocument(doc: Record<string, any>, lang: string): Record<string, any> {
    const newDoc = JSON.parse(JSON.stringify(doc));
    const skipKeys = new Set(['$ref', 'type', 'format', 'pattern', 'example', 'default', 'enum', 'required']);

    const traverse = (obj: any, visited = new WeakSet()) => {
      if (!obj || typeof obj !== 'object' || visited.has(obj)) return;
      visited.add(obj);

      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          const value = obj[i];
          if (typeof value === 'string') {
            const translated = this.getSwaggerTranslation(value, lang);
            if (translated !== value) {
              obj[i] = translated;
            }
          } else if (typeof value === 'object' && value !== null) {
            traverse(value, visited);
          }
        }
      } else {
        for (const key in obj) {
          if (skipKeys.has(key)) continue;
          const value = obj[key];
          if (typeof value === 'string') {
            const translated = this.getSwaggerTranslation(value, lang);
            if (translated !== value) {
              obj[key] = translated;
            }
          } else if (typeof value === 'object' && value !== null) {
            traverse(value, visited);
          }
        }
      }
    };

    traverse(newDoc);
    return newDoc;
  }
}