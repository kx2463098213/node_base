import { Injectable } from "@nestjs/common";
import { I18nContext, I18nService } from "nestjs-i18n";
import { Logger } from "@/common/logger/logger";

@Injectable()
export class MyI18nService {

  private readonly logger = new Logger(MyI18nService.name);
  private readonly swaggerCache = new Map<string, any>();
  private static readonly PREFIX = {
    MESSAGE: 'message.',
    VALIDATION: 'validation.',
    SWAGGER: 'swagger.',
  };
  // 翻译黑名单
  private readonly SWAGGER_SKIP_KEYS = new Set(['$ref', 'type', 'format', 'pattern', 'example', 'default', 'enum', 'required']);

  constructor(
    private readonly i18n: I18nService,
  ) { }

  private translate(key: string, options: { lang?: string; args?: object; defaultValue?: string }) {
    const lang = options.lang || I18nContext.current()?.lang;
    return this.i18n.t(key, { ...options, lang });
  }

  getMessage(key: string, args?: object): string {
    return this.translate(`${MyI18nService.PREFIX.MESSAGE}${key}`, { args }) as string;
  }

  getValidateMessage(key: string, args?: object, defaultValue?: string): string {
    return this.translate(`${MyI18nService.PREFIX.VALIDATION}${key}`, { args, defaultValue }) as string;
  }

  getSwaggerTranslation(key: string, lang: string): string {
    const finalKey = `${MyI18nService.PREFIX.SWAGGER}${key}`;
    const translated = this.i18n.t(finalKey, { lang }) as string;

    // 如果翻译后的值等于 key 本身或包含前缀（取决于 i18n 配置），说明没找到翻译
    return translated === finalKey ? key : translated;
  }

  /**
   * Swagger 文档递归翻译
   */
  translateSwaggerDocument(doc: Record<string, any>, lang: string): Record<string, any> {
    // 如果缓存中有该语言的版本，直接返回
    if (this.swaggerCache.has(lang)) {
      return this.swaggerCache.get(lang);
    }
    // 使用递归时直接修改新对象，或者在必要时才拷贝
    // 如果不希望修改原 doc，建议在传入前 clone，或者使用更高效的深拷贝库
    const newDoc = JSON.parse(JSON.stringify(doc));

    const traverse = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      // 处理数组和对象的统一逻辑
      const entries = Array.isArray(obj) ? obj.entries() : Object.entries(obj);

      for (const [key, value] of entries) {
        // 过滤不需要翻译的键
        if (typeof key === 'string' && this.SWAGGER_SKIP_KEYS.has(key)) continue;

        if (typeof value === 'string') {
          const translated = this.getSwaggerTranslation(value, lang);
          if (translated !== value) {
            obj[key] = translated;
          }
        } else if (typeof value === 'object') {
          traverse(value);
        }
      }
    };

    traverse(newDoc);
    this.swaggerCache.set(lang, newDoc);
    return newDoc;
  }
}