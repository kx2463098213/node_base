import _ from "lodash";
import crypto from 'crypto';
import stream from 'stream'

export function getErrMsg(e: Error): string {
  return e?.message || JSON.stringify(e);
}

export async function Sleep(seconds: number): Promise<void> {
  await new Promise((ok) => {
    setTimeout(ok, seconds * 1e3);
  });
}

export async function SleepMS(ms: number): Promise<void> {
  await new Promise((ok) => {
    setTimeout(ok, ms);
  });
}

export async function DestructureAllSettled(
  promises: Array<Promise<any>>,
  limit = 20
) {
  const result: { fulfilled: any[]; rejected: any[] } = {
    fulfilled: [],
    rejected: [],
  };
  if (!promises.length) {
    return result;
  }

  const promisesCopy = promises.slice(0);
  do {
    const stepItems = promisesCopy.splice(0, limit);
    const res = await Promise.allSettled(stepItems);
    result.fulfilled.push(
      ..._.flatten(
        res
          .filter((result) => result.status === "fulfilled")
          .map((result: any) => result.value)
      )
    );
    result.rejected.push(
      ..._.flatten(
        res
          .filter((result) => result.status === "rejected")
          .map((result: any) => result.reason)
      )
    );
    await SleepMS(100);
  } while (promisesCopy.length);

  return result;
}

export function isAvailableData(data: any): boolean {
  return !_.isNil(data) && data !== ''
}

type CheckItem = RegExp | string
export function checkIs<T extends CheckItem>(checkList: T[] = [], str: string = ''): boolean {
  return checkList.some((item) => {
    if (typeof item === 'string') {
      return item === str
    }
    if (item instanceof RegExp) {
      return item.test(str)
    }
    return false
  })
}

export function Md5(str: string | Buffer, key?: string): string {
  if (typeof str === "string") {
    str = Buffer.from(str);
  }

  let enc: crypto.Hmac | crypto.Hash;
  if (key) {
    enc = crypto.createHmac("md5", key);
  } else {
    enc = crypto.createHash("md5");
  }

  enc.update(str);
  return enc.digest("hex") as string;
}

/**
 * 安全的模板字符串替换函数
 * 用于替换字符串中的变量占位符，如 @var:userId -> args[0]
 *
 * @param context - 上下文对象，包含 args 等属性
 * @param expression - 表达式字符串，如 "@var:args[0]" 或 "user-@var:args[0]"
 * @param value - 默认值
 * @returns 替换后的字符串
 *
 * @example
 * SafeEval({ args: [123, 'test'] }, '@var:args[0]') // 返回 '123'
 * SafeEval({ args: [123] }, 'user-@var:args[0]') // 返回 'user-123'
 */
export function SafeEval(context: any, expression: string, value?: string): string {
  if (!expression) return value || '';

  try {
    // 只支持安全的变量替换模式：@var:args[index]
    const result = expression.replace(/@var:args\[(\d+)\]/g, (match, index) => {
      const idx = parseInt(index, 10);
      if (context?.args && idx >= 0 && idx < context.args.length) {
        return String(context.args[idx]);
      }
      return match; // 如果找不到，保持原样
    });

    return result || value || '';
  } catch (e) {
    return value || '';
  }
}

/**
 * @deprecated 此函数已被禁用，请使用 SafeEval 替代
 * 原实现使用 new Function() 存在安全风险
 */
export function Eval(context: any, expression: string, value?: string) {
  console.warn('Eval function is deprecated and disabled. Use SafeEval instead.');
  return SafeEval(context, expression, value);
}

export function getRandomStr(size: number): string {
  let str = '';
  if (size > 100) {
    return str;
  }
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < size; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    str += charset[randomIndex];
  }
  return str;
}

export async function streamToBuffer(stream: stream.Readable): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk); 
  }
  return Buffer.concat(chunks);
}