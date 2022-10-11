import {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import {AsyncThunk, Dispatch} from '@reduxjs/toolkit';
import {NormalizedSchema} from 'normalizr';

export interface Callbacks<ResponseBody, Return, Params> {}

export interface SourceReducerState {
  allIds?: any[];
  paginator?: Paginator;

  [key: string]: any;
}

export interface BaseReducerState {
  [key: string]: any;
}

export interface ReducerState extends BaseReducerState {
  allIds?: any[];
  paginator?: Paginator;
  sources: Record<string, SourceReducerState>;
}

export interface ActionOption {
  fullResponse?: boolean;
  requestConfig?: AxiosRequestConfig;
  isCallApiOnly?: boolean;
  withoutNormalize?: boolean;
  isSnakeCase?: boolean;
  isIgnoreError?: boolean;
  urlPlaceholders?: string[];
  includeApiResponseData?: boolean;
  restfulMethod?: 'post' | 'put' | 'delete' | 'get';
  dummyData?: boolean;
  fixedParams?: Record<string, any>;
  fixedData?: Record<string, any>;
  service?: string;
}

export type ThunkResult<Entities, Params, D extends Dispatch = Dispatch> = AsyncThunk<
  NormalizedPayload<Entities>,
  Params,
  {dispatch: D; rejectValue: RejectErrorValue}
>;
export type ThunkRawResult<ApiResponseData, Params> = AsyncThunk<ApiResponseData, Params, {}>;
export type AxiosResult<D, Params> = (arg: Params) => Promise<ApiResponse<D>>;

export interface RejectErrorValue {
  errMsg: string;
  errCode?: string | number | undefined;
  errStatusCode?: string | number | undefined;
  contexts?: {[key: string]: any} | undefined;
  messageBag?: {[key: string]: any} | undefined;
}

export interface RequestState {
  firstPage?: boolean;
  loading?: boolean;
  error?: string | null;
  errCode?: string | number | undefined;
  contexts?: {[key: string]: any} | undefined;
}

export interface BaseRequest {
  source?: string;
  data?: any;
  isLoadMore?: boolean;
  // Do Not allow dynamic key! Don't uncomment below line
  // [key: string]: any;
}

export interface PostParams extends BaseRequest {
  data: Record<string, any> | Record<string, any>[];
}

export interface PutParams extends BaseRequest {
  id?: string | number;
  data: any;
}

export interface DeleteParams extends BaseRequest {
  id: string | number;
}

export interface FetchParams extends BaseRequest {
  cacheIn?: number;
  page?: number;
  limit?: number;
  isLoadMore?: boolean;
  urlPlaceholders?: string[];
}

export interface BasePayload {
  source?: string;
}

export interface NormalizedPayload<T, R = any | any[], ApiResponseData = any> extends BasePayload {
  response?: Record<string, any>;
  normalized: NormalizedSchema<T, R>;
  apiResponseData?: ApiResponseData;
  isLoadMore?: boolean;
  paginator?: Paginator;
  errCode?: string;
}

export interface Paginator {
  page: number; // Several BE returns page instead of current_page
  current_page: number;
  item_from: number;
  item_to: number;
  limit: number;
  next_page: number | null;
  previous_page: number | null;
  total_items: number;
  total_pages: number;
}

export interface ApiResponse<Data> extends AxiosResponse {
  data: {
    statusCode?: number;
    message: string;
    data: Data;
    paginator?: Paginator;
    status: string;
    sideData?: Record<string, any>;
  };
}

export interface ApiService {
  name: string;
  axios: AxiosInstance;
  isDefault?: boolean;
  isSnakeCase?: boolean;
}

export interface ThunkKitConfig {
  apiServices: ApiService[];
  dummyData?: Record<string, any>;
  errorHandler?: any;
}

export interface QueryOption {
  isSnakeCase?: boolean;
  isIgnoreError?: boolean;
  service?: string;
}

export interface RequestHelperConfig {
  ErrorHandler: any;
  apiServices: Record<string, ApiService>;
  defaultService: ApiService;
  dummyData: Record<string, any> | undefined;
}
