import {createAsyncThunk} from '@reduxjs/toolkit';
import {normalize, Schema} from 'normalizr';
import {isArray, isBoolean, isEmpty, omit} from 'lodash';
import {parseFormDataToObj, requestDummyData, serializeQueryString, snakeCaseObj} from './helpers';
import {
  ActionOption,
  ApiResponse,
  ApiService,
  AxiosResult,
  BaseRequest,
  Callbacks,
  DeleteParams,
  FetchParams,
  NormalizedPayload,
  PostParams,
  PutParams,
  QueryOption,
  RejectErrorValue,
  RequestHelperConfig,
  ThunkKitConfig,
  ThunkRawResult,
  ThunkResult,
} from './type';
import {AsyncThunk} from '@reduxjs/toolkit/src/createAsyncThunk';

export class ThunkKit {
  apiServices: Record<string, ApiService> = {};
  defaultService: ApiService = {} as ApiService;
  dummyData?: Record<string, any>;
  ErrorHandler?: any;

  constructor(config: ThunkKitConfig) {
    this.setDummyData(config);
    this.setErrorHandler(config);
    this.setApiServices(config);
  }

  query<ApiItem = undefined, NormalizedResult = undefined>(
    namespace: string,
    entitySchema: Schema | undefined = undefined,
    option: QueryOption = {},
  ) {
    const config = {
      apiServices: this.apiServices,
      defaultService: this.defaultService,
      dummyData: this.dummyData,
      ErrorHandler: this.ErrorHandler,
    };
    return new QueryHelper<ApiItem, NormalizedResult>(namespace, entitySchema, option, config);
  }

  setDummyData(config: ThunkKitConfig) {
    this.dummyData = config.dummyData || {};
  }

  setErrorHandler(config: ThunkKitConfig) {
    this.ErrorHandler = config.errorHandler;
  }

  setApiServices(config: ThunkKitConfig) {
    let hasDefaultService = false;
    const thunkServices = [...config.apiServices];
    if (thunkServices.length === 1) {
      thunkServices[0].isDefault = true;
    }
    thunkServices.forEach((as: ApiService) => {
      this.apiServices[as.name] = as;
      if (as.isDefault) {
        this.defaultService = as;
        hasDefaultService = true;
      }
    });
    if (!hasDefaultService) {
      throw new Error('You need to have at least 1 default API Service');
    }
  }
}

class QueryHelper<ApiItem = undefined, NormalizedResult = undefined> {
  namespace: string;

  entitySchema?: Schema;

  queryOption: QueryOption;

  config: RequestHelperConfig = {} as RequestHelperConfig;

  constructor(
    namespace: string,
    entitySchema: Schema | undefined = undefined,
    option: QueryOption = {},
    config: RequestHelperConfig = {} as RequestHelperConfig,
  ) {
    this.namespace = namespace;
    this.entitySchema = entitySchema;

    this.queryOption = {...option};
    this.config = config;
  }

  fetchOne<Params extends FetchParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix: string,
    options: ActionOption & {withoutNormalize: true},
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): ThunkRawResult<ApiResponseData, Params>;
  fetchOne<Params extends FetchParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix: string,
    options: ActionOption & {isCallApiOnly: true},
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): AxiosResult<ApiResponseData, Params>;
  fetchOne<Params extends FetchParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix: string,
    options: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): ThunkResult<NormalizedResult, Params>;
  fetchOne<Params extends FetchParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix?: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): ThunkResult<NormalizedResult, Params>;
  fetchOne<Params extends FetchParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix?: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ) {
    return this.fetchRequest<Params, ApiResponseData>(
      endpoint,
      prefix ? `${prefix}/fetchOne` : 'fetchOne',
      options,
      callbacks,
    );
  }

  fetch<Params extends FetchParams, ApiResponseData = ApiItem[]>(
    endpoint: string,
    prefix: string,
    options: ActionOption & {withoutNormalize: true},
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): ThunkRawResult<ApiResponseData, Params>;
  fetch<Params extends FetchParams, ApiResponseData = ApiItem[]>(
    endpoint: string,
    prefix: string,
    options: ActionOption & {isCallApiOnly: true},
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): AxiosResult<ApiResponseData, Params>;
  fetch<Params extends FetchParams, ApiResponseData = ApiItem[]>(
    endpoint: string,
    prefix: string,
    options: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): ThunkResult<NormalizedResult, Params>;
  fetch<Params extends FetchParams, ApiResponseData = ApiItem[]>(
    endpoint: string,
    prefix?: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): ThunkResult<NormalizedResult, Params>;
  fetch<Params extends FetchParams, ApiResponseData = ApiItem[]>(
    endpoint: string,
    prefix?: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ) {
    return this.fetchRequest<Params, ApiResponseData>(
      endpoint,
      prefix ? `${prefix}/fetchMany` : 'fetchMany',
      options,
      callbacks,
    );
  }

  post<Params extends PostParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix: string,
    options: ActionOption & {withoutNormalize: true},
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): ThunkRawResult<ApiResponseData, Params>;
  post<Params extends PostParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix: string,
    options: ActionOption & {isCallApiOnly: true},
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): AxiosResult<ApiResponseData, Params>;
  post<Params extends PostParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): ThunkResult<NormalizedResult, Params>;
  post<Params extends PostParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix?: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): ThunkResult<NormalizedResult, Params>;
  post<Params extends PostParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix?: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ) {
    return this.postRequest<Params, ApiResponseData>(
      endpoint,
      prefix ? `${prefix}/post` : 'post',
      {...options, restfulMethod: 'post'},
      callbacks,
    );
  }

  put<Params extends PutParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix: string,
    options: ActionOption & {withoutNormalize: true},
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): ThunkRawResult<ApiResponseData, Params>;
  put<Params extends PutParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix: string,
    options: ActionOption & {isCallApiOnly: true},
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): AxiosResult<ApiResponseData, Params>;
  put<Params extends PutParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): ThunkResult<NormalizedResult, Params>;
  put<Params extends PutParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix?: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): ThunkResult<NormalizedResult, Params>;
  put<Params extends PutParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix?: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ):
    | ThunkResult<NormalizedResult, Params>
    | AxiosResult<ApiResponseData, Params>
    | ThunkRawResult<ApiResponseData, Params> {
    return this.postRequest<Params, ApiResponseData>(
      endpoint,
      prefix ? `${prefix}/put` : 'put',
      {...options, restfulMethod: 'put'},
      callbacks,
    );
  }

  delete<Params extends DeleteParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix: string,
    options: ActionOption & {withoutNormalize: true},
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): ThunkRawResult<ApiResponseData, Params>;
  delete<Params extends DeleteParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix: string,
    options: ActionOption & {isCallApiOnly: true},
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): AxiosResult<ApiResponseData, Params>;
  delete<Params extends DeleteParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix: string,
    options: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): ThunkResult<NormalizedResult, Params>;
  delete<Params extends DeleteParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix?: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ): ThunkResult<NormalizedResult, Params>;
  delete<Params extends DeleteParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix?: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ) {
    const deletePrefix = prefix ? `${this.namespace}/${prefix}/delete` : `${this.namespace}/delete`;
    if (options?.isCallApiOnly === true) {
      return this.createApiRequestThunk<ApiResponseData, Params>(
        endpoint,
        {...options, restfulMethod: 'delete'},
        callbacks,
      );
    }

    if (options?.withoutNormalize === true) {
      return this.createAsyncThunkWithoutNormalize<ApiResponseData, Params>(
        deletePrefix,
        endpoint,
        {...options, restfulMethod: 'delete'},
        callbacks,
      );
    }
    return this.createAsyncThunkAndNormalize<ApiResponseData, Params>(
      deletePrefix,
      endpoint,
      {...options, restfulMethod: 'delete'},
      callbacks,
    );
  }

  postFormData = <Params extends PostParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix?: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ) =>
    this.post(
      endpoint,
      prefix,
      {requestConfig: {headers: {'content-type': 'multipart/form-data'}}, ...options, restfulMethod: 'post'},
      callbacks,
    );

  putFormData = <Params extends PutParams, ApiResponseData = ApiItem>(
    endpoint: string,
    prefix?: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ) =>
    this.put(
      endpoint,
      prefix,
      {requestConfig: {headers: {'content-type': 'multipart/form-data'}}, ...options, restfulMethod: 'put'},
      callbacks,
    );

  wrapper = <P, Return = any>(
    prefix: string,
    cb: (p: P, thunkAPI: {dispatch: any; getState: any; requestId: string; rejectWithValue: any}) => any,
    options?: ActionOption,
  ): AsyncThunk<Return, P, {}> =>
    createAsyncThunk<Return, P>(`${this.namespace}/WRAP/${prefix}`, async (params, thunkAPI) => {
      const onError = (error?: typeof this.config.ErrorHandler | any) => {
        if (!error) {
          return thunkAPI.rejectWithValue({});
        }
        if (!(error instanceof this.config.ErrorHandler)) {
          error = new this.config.ErrorHandler(error);
        }
        return thunkAPI.rejectWithValue({
          errCode: error.customErrCode,
          errStatusCode: error.statusCode,
          messageBag: error.messageBag,
          contexts: error.contexts,
          errMsg: error.userMsg,
        } as RejectErrorValue);
      };
      try {
        return await cb(params, {...thunkAPI});
      } catch (e) {
        return onError(e);
      }
    });

  private fetchRequest<Params extends FetchParams, ApiResponseData>(
    endpoint: string,
    prefix: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ):
    | ThunkResult<NormalizedResult, Params>
    | AxiosResult<ApiResponseData, Params>
    | ThunkRawResult<ApiResponseData, Params> {
    if (options?.isCallApiOnly === true) {
      return this.createApiRequestThunk<ApiResponseData, Params>(endpoint, options, callbacks);
    }

    if (options?.withoutNormalize === true) {
      return this.createAsyncThunkWithoutNormalize<ApiResponseData, Params>(prefix, endpoint, options, callbacks);
    }

    return this.createAsyncThunkAndNormalize<ApiResponseData, Params>(prefix, endpoint, options, callbacks);
  }

  private postRequest<Params, ApiResponseData>(
    endpoint: string,
    prefix: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ):
    | ThunkResult<NormalizedResult, Params>
    | AxiosResult<ApiResponseData, Params>
    | ThunkRawResult<ApiResponseData, Params> {
    if (options?.isCallApiOnly === true) {
      return this.createApiRequestThunk<ApiResponseData, Params>(endpoint, options, callbacks);
    }

    if (options?.withoutNormalize === true) {
      return this.createAsyncThunkWithoutNormalize<ApiResponseData, Params>(prefix, endpoint, options, callbacks);
    }

    return this.createAsyncThunkAndNormalize<ApiResponseData, Params>(prefix, endpoint, options, callbacks);
  }

  private createAsyncThunkAndNormalize<ApiResponseData, Params extends BaseRequest>(
    prefix: string,
    endpoint: string,
    options?: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ) {
    if (this.entitySchema === undefined) {
      throw new Error('Normalize Error: Missing schemaEntity declaration. Locate at class constructor');
    }
    return createAsyncThunk<
      NormalizedPayload<NormalizedResult>,
      Params,
      {rejectValue: RejectErrorValue; dispatch: any}
    >(`${this.namespace}/${prefix}`, async (params: Params, {rejectWithValue, getState}) => {
      const {source, data: requestData} = params;
      try {
        const responseBody = await this.makeRequest<Params, ApiResponseData>(endpoint, params, options);
        const apiResponseData = (responseBody?.data?.data || []) as ApiResponseData;
        const normalized = normalize<any, NormalizedResult>(
          apiResponseData,
          isArray(apiResponseData) ? [this.entitySchema!] : this.entitySchema!,
        );
        if (requestData instanceof FormData) {
          // @ts-ignore
          params.data = parseFormDataToObj(requestData);
        }
        const payload: NormalizedPayload<NormalizedResult, any, ApiResponseData> = {
          normalized,
          source: source || options?.fixedParams?.source,
          paginator: responseBody?.data?.paginator,
          isLoadMore: params?.isLoadMore,
          apiResponseData: undefined,
        };
        if (options?.includeApiResponseData) {
          payload.apiResponseData = apiResponseData;
        }
        if (options?.fullResponse) {
          payload.response = omit(responseBody?.data, 'data');
        }

        return payload;
      } catch (e) {
        const appErr = new this.config.ErrorHandler(e);
        return rejectWithValue({
          errCode: appErr.customErrCode,
          errStatusCode: appErr.statusCode,
          contexts: appErr.contexts,
          messageBag: appErr.messageBag,
          errMsg: appErr.userMsg,
        } as RejectErrorValue);
      }
    });
  }

  private createAsyncThunkWithoutNormalize<ApiResponseData, Params>(
    prefix: string,
    endpoint: string,
    options: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ) {
    return createAsyncThunk<ApiResponseData | any, Params, {}>(
      `${this.namespace}/withoutNormalize/${prefix}`,
      async (params, {rejectWithValue}) => {
        try {
          const responseBody = await this.makeRequest<Params, ApiResponseData>(endpoint, params, options);
          const apiResponseData = (responseBody?.data?.data || {}) as ApiResponseData;

          if (options?.fullResponse) {
            return responseBody?.data;
          }
          return apiResponseData;
        } catch (e) {
          const appErr = new this.config.ErrorHandler(e);
          return rejectWithValue({
            errCode: appErr.customErrCode,
            errStatusCode: appErr.statusCode,
            messageBag: appErr.messageBag,
            contexts: appErr.contexts,
            errMsg: appErr.userMsg,
          } as RejectErrorValue);
        }
      },
    );
  }

  private createApiRequestThunk<ApiResponseData, Params>(
    endpoint: string,
    options: ActionOption,
    callbacks?: Callbacks<ApiResponse<ApiResponseData>, NormalizedPayload<NormalizedResult>, Params>,
  ) {
    return async (params: Params) => {
      return await this.makeRequest<Params, ApiResponseData>(endpoint, params, options);
    };
  }

  private async makeRequest<Params extends BaseRequest, ApiResponseData>(
    endpoint: string,
    params: Params,
    options?: ActionOption,
  ) {
    // Cheating way to differentiate post params and  url params. I think we should depend on the object type later
    const {data: dataParam, ...urlParams} = params;
    let data = {...dataParam, ...options?.fixedData};

    let apiService = this.config.defaultService;
    if (options?.service) {
      apiService = this.config.apiServices[options.service];
    } else if (this.queryOption.service) {
      apiService = this.config.apiServices[this.queryOption.service];
    }
    const request = apiService.axios;
    let shouldUseSnakeCase = apiService.isSnakeCase;
    if (isBoolean(options?.isSnakeCase)) {
      shouldUseSnakeCase = options?.isSnakeCase;
    } else if (isBoolean(this.queryOption.isSnakeCase)) {
      shouldUseSnakeCase = this.queryOption.isSnakeCase;
    }

    if (!isEmpty(data)) {
      if (!(data instanceof FormData)) {
        if (shouldUseSnakeCase) {
          data = snakeCaseObj(data);
        }
      }
    }
    const url = getFullUrl(endpoint, {...urlParams, ...options?.fixedParams}, shouldUseSnakeCase);
    if (options?.dummyData) {
      return (await requestDummyData(
        options?.restfulMethod || 'get',
        url,
        this.config.dummyData,
      )) as ApiResponse<ApiResponseData>;
    }
    if (options?.restfulMethod === 'put' || options?.restfulMethod === 'post') {
      const requestApi = options?.restfulMethod === 'put' ? request.put : request.post;
      return (await requestApi(url, data, options?.requestConfig)) as ApiResponse<ApiResponseData>;
    }
    if (options?.restfulMethod === 'delete') {
      return (await request.delete(url, {
        ...options?.requestConfig,
        data,
      })) as ApiResponse<ApiResponseData>;
    }

    return (await request.get(url, options?.requestConfig)) as ApiResponse<ApiResponseData>;
  }
}

const getUrlParamKeys = (url: string): string[] => {
  const urlParamRgx = /:([a-zA-Z0-9]+)/g;
  const urlParamKeys = [];
  let matches;
  // eslint-disable-next-line no-cond-assign
  while ((matches = urlParamRgx.exec(url)) !== null) {
    urlParamKeys.push(matches[1]);
  }

  return urlParamKeys;
};

const getFullUrl = (endpoint: string, params: FetchParams, isUseSnakeCase?: boolean) => {
  const {source, ...rest} = params;
  let url = endpoint;
  getUrlParamKeys(url).forEach(urlParamKey => {
    url = url.replace(`:${urlParamKey}`, params[urlParamKey]);
  });

  url += serializeQueryString({...rest}, {snakeKey: isUseSnakeCase});
  return url;
};
