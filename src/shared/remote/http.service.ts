import { HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { Logger } from "@/common/logger/logger";
import { getErrMsg } from "@/common/utils/util";
import _ from "lodash";
import { scopeUtils } from "@/common/utils/scope-utils";

export class ResultDto<T> {
	code: number = 0;
	message?: string;
	data: T;
}

export interface ListResultDto<T> {
  list: T[];
  total: number;
}

@Injectable()
export class HttpService {
	private readonly logger = new Logger(HttpService.name);
	private readonly axiosInstance: AxiosInstance;

	constructor() {
		this.axiosInstance = axios.create();
		this.axiosInstance.interceptors.request.use(
			(config) => {
				const url = config.url;
				const params = config.params || config.data;
				const headers = config.headers;
				if (_.isEmpty(headers['x-request-id'])) {
					headers['x-request-id'] = scopeUtils.getRequestId();
				}
				const msg = `Remote request Url: ${url}, params:${JSON.stringify(params)}, headers: ${JSON.stringify(headers)}`;
				this.logger.debug(msg);
				return config;
			},
			(error) => {
				return Promise.reject(error);
			}
		);

		this.axiosInstance.interceptors.response.use(
			(response) => {
				if (response.config.responseType === "stream") {
					return response.data;
				}
				const data = response.data;
				const msg = `Remote response Status: ${response.status}, Body: ${JSON.stringify(data)}`;
				this.logger.debug(msg);
				return data;
			},
			(error) => {
				const url = error.config?.url;
				const status = error.response?.status;
				this.logger.error(`Remote request error Url: ${url} : ${getErrMsg(error)}`);
				if (status === HttpStatus.UNAUTHORIZED) {
					throw new UnauthorizedException('认证失败，请重新登录');
				}
				return Promise.reject(error);
			}
		);
	}
	
	async post<D, T>(url: string, data: D, config?: AxiosRequestConfig): Promise<ResultDto<T>> {
		return this.axiosInstance.post(url, data, config);
	}

	async get<T>(url: string, config: AxiosRequestConfig): Promise<ResultDto<T>> {
		return this.axiosInstance.get(url, config);
	}
}