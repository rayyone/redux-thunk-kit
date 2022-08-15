import {createSelector, Dictionary, EntityAdapter} from '@reduxjs/toolkit';
import isArray from 'lodash/isArray'
import isEqual from 'lodash/isEqual'
import isPlainObject from 'lodash/isPlainObject'
import without from 'lodash/without'
import {NormalizedPayload, ReducerState, SourceReducerState} from './type';
import {DEFAULT_SOURCE_REDUCER_STATE} from './constants';
import {ensureSafeChaining, getObjNthItem} from './helpers';

const fetchSuccess = (
  state: ReducerState,
  payload: NormalizedPayload<any>,
  options?: {
    entityName: string;
    sortComparer: (a: any, b: any) => number;
  },
) => {
  const {source, normalized, paginator, isLoadMore, ...rest} = payload;
  if (!source) {
    return;
  }

  let allIds = normalized.result;
  if (options?.sortComparer && normalized.entities[options.entityName]) {
    allIds = Object.values(normalized.entities[options.entityName])
      .sort(options.sortComparer)
      .map((item: any) => item.id);
  }

  ensureSafeChaining(state, ['sources', source], DEFAULT_SOURCE_REDUCER_STATE);
  state.sources[source] = {
    ...state.sources[source],
    paginator,
    allIds: isLoadMore ? [...new Set([...(state.sources[source].allIds || []), ...allIds])] : allIds,
    lastRequestAt: Date.now() / 1000,
    ...rest,
  };
};

const deleteSuccess = (state: ReducerState, id: any) => {
  Object.keys(state.sources).forEach(stateKey => {
    ensureSafeChaining(state, ['sources', stateKey, 'allIds'], []);
    state.sources[stateKey].allIds = without(state.sources[stateKey].allIds, id);
  });
};

const addIdsToSources = (state: ReducerState, ids: any[] | number | string, sources: string[], append = false) => {
  const add = (source: string, id: number | string) => {
    if (state.sources[source].allIds?.indexOf(id) === -1) {
      if (append) {
        state.sources[source].allIds!.push(id);
      } else {
        state.sources[source].allIds!.unshift(id);
      }
    }
  };

  sources.forEach(source => {
    if (ids) {
      ensureSafeChaining(state, ['sources', source, 'allIds'], []);
      if (isArray(ids)) {
        ids.forEach(id => add(source, id));
      } else {
        add(source, ids);
      }
    }
  });
};

const removeIdsFromSources = (state: ReducerState, ids: any[] | number | string, sources: string[]) => {
  sources.forEach(source => {
    if (ids) {
      ensureSafeChaining(state, ['sources', source, 'allIds'], []);
      if (isArray(ids)) {
        state.sources[source].allIds = state.sources[source].allIds?.filter(i => ids.indexOf(i) === -1);
      } else {
        state.sources[source].allIds = state.sources[source].allIds?.filter(i => i !== ids);
      }
    }
  });
};

const requestOK = (result: any, action: any) => action.fulfilled.match(result);
const allRequestsOK = (...resultActionPair: [any, any][]) =>
  resultActionPair.every(([result, action]) => {
    const isOk = requestOK(result, action);
    if (!isOk) {
      // eslint-disable-next-line no-console
      console.error('Check carefully your result and action pair!!');
    }
    return isOk;
  });
const requestFailed = (result: any, action: any) => action.rejected.match(result);

const createSelectAllBySource = <E, S extends Record<string, any>>(
  subStateName: keyof S,
  selectEntities: (state: any) => Dictionary<E>,
  sources: string[],
) =>
  sources.map(source =>
    createSelector(
      [selectEntities, (state: S) => state[subStateName]?.sources[source] || DEFAULT_SOURCE_REDUCER_STATE],
      (entities: Dictionary<E>, {allIds = [], ...rest}: SourceReducerState) => ({
        data: allIds.map((id: string | number) => entities[id]).filter(i => i !== undefined) as E[],
        ...rest,
      }),
    ),
  );

// Upsert ignoring nested object!
const upsertMany = <T>(adapter: EntityAdapter<T>, state: any, entities: Record<string | number, any> = {}) => {
  const addedEntities = {} as Record<string | number, any>;
  Object.keys(entities).forEach(entityId => {
    const entity = entities[entityId];
    if (!state.entities[entityId]) {
      addedEntities[entityId] = entity;
    } else {
      const existedEntity = state.entities[entityId];
      let shouldUpdate = true;
      if (isPlainObject(entity)) {
        shouldUpdate = false;
        Object.keys(entity).forEach(prop => {
          const value = entity[prop];
          if (!isPlainObject(value) && value !== existedEntity[prop]) {
            shouldUpdate = true;
          }
        });
      }
      if (shouldUpdate) {
        adapter.updateOne(state, entity);
      }
    }
  });
  adapter.addMany(state, addedEntities);
};

// Upsert mutate means always replace existing object! Always trigger re-render
// Try to avoid using it
const upsertManyMutably = <T>(adapter: EntityAdapter<T>, state: any, entities: Record<string | number, any> = {}) => {
  adapter.upsertMany(state, entities);
};
const upsertOneMutably = <T>(adapter: EntityAdapter<T>, state: any, entities: Record<string | number, any> = {}) => {
  const entity = getObjNthItem(entities, 1);
  if (entity) {
    const existedEntity = state.entities[entity.id];
    if (!isEqual(entity, existedEntity)) {
      adapter.upsertOne(state, entity);
    }
  }
};

export {
  fetchSuccess,
  deleteSuccess,
  addIdsToSources,
  removeIdsFromSources,
  requestOK,
  requestFailed,
  createSelectAllBySource,
  upsertMany,
  upsertOneMutably,
  upsertManyMutably,
  allRequestsOK,
};
