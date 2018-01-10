/**
 * @namespace selector
 */

import { createSelector } from 'reselect'
import { denormalize } from './helper'
import {
  ACTIONS_REDUCER_NAME,
  ENTITIES_REDUCER_NAME,
  IS_TEST_ENVIRONMENT
} from './config'

const defaultActionDataOutput = {
  status: '',
  time: '',
  hasError: '',
  errorText: '',
  isFetching: false
}

const _makeGetActionData = (
  action,
  actionId,
  entityName,
  actionEntitySchema
) => {
  return createSelector(
    [
      state => state[ACTIONS_REDUCER_NAME].get(actionId),
      state => state[ENTITIES_REDUCER_NAME].get(entityName),
      state => state[ENTITIES_REDUCER_NAME]
    ],
    (actionState, entityState, entities) => {
      let output = Object.assign({}, defaultActionDataOutput)

      if (!actionState) {
        return output
      }

      output = Object.assign(output, {
        actionId,
        sourceResult: actionState.get('sourceResult'),
        status: actionState.get('status'),
        time: actionState.get('time'),
        hasError: actionState.get('hasError'),
        errorText: actionState.get('errorText'),
        isFetching: actionState.get('isFetching')
      })

      const actionPayloadIsArray = actionState.get('isArrayData')
      const actionDataKey = actionState.get('actionDataKey')

      const actionPayloadIds = !actionDataKey
        ? undefined
        : actionPayloadIsArray
          ? actionState.get(actionDataKey)
          : [actionState.get(actionDataKey)]
      const actionPrevPayloadIds = !actionDataKey
        ? undefined
        : actionPayloadIsArray
          ? actionState.get(`prev${actionDataKey}`)
          : [actionState.get(`prev${actionDataKey}`)]

      if (actionDataKey) {
        output = Object.assign(output, {
          payload: actionPayloadIsArray ? [] : '',
          prevPayload: actionPayloadIsArray ? [] : ''
        })
      }

      if (
        actionDataKey &&
        entityState &&
        (actionPrevPayloadIds || actionPayloadIds)
      ) {
        let prevData = !actionPrevPayloadIds
          ? []
          : denormalize(actionPrevPayloadIds, [actionEntitySchema], entities)
        let currentData = !actionPayloadIds
          ? []
          : denormalize(actionPayloadIds, [actionEntitySchema], entities)

        prevData = prevData.filter(v => v) // todo remove undefined values
        currentData = currentData.filter(v => v) // todo remove undefined values

        prevData = prevData.map(item => item.toJS())
        currentData = currentData.map(item => item.toJS())

        output = Object.assign(output, {
          payload: actionPayloadIsArray ? currentData : currentData[0],
          prevPayload: actionPayloadIsArray ? prevData : prevData[0]
        })
      }

      return output
    }
  )
}

export const getActionData = action => {
  const actionId = action.actionId()
  const entityName = action.getEntityName()
  const actionEntitySchema = action.getSchema()

  return (state, props) => {
    const selectorGetActionData = _makeGetActionData(
      action,
      actionId,
      entityName,
      actionEntitySchema
    )
    return selectorGetActionData(state, props)
  }
}

export const getActionsReducer = state => state[ACTIONS_REDUCER_NAME]

export const getEntityReducer = state => state[ENTITIES_REDUCER_NAME]

export const getEntityItemsBySchema = entitySchema => {
  return createSelector([getEntityReducer], entities => {
    return entities.get(entitySchema.key)
  })
}

export const getEntityItemsByAction = action => {
  return createSelector([getEntityReducer], entities => {
    return entities.get(action.getEntityName())
  })
}

export const getEntityItemsByEntityName = name => {
  return createSelector([getEntityReducer], entities => {
    return entities.get(name)
  })
}

export const denomalizeEntityItemById = (id, schema, entities) => {
  return denormalize(id, schema, entities)
}

if (IS_TEST_ENVIRONMENT) {
  module.exports.defaultActionDataOutput = defaultActionDataOutput
  module.exports._makeGetActionData = _makeGetActionData
}
