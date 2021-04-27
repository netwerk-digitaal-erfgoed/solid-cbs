import { createMachine, MachineConfig, sendParent } from 'xstate';
import { AppEvents } from '../../app.events';
import { CollectionsContext } from './collections.context';
import { CollectionsEvent, CollectionsEvents } from './collections.events';
import { CollectionsState, CollectionsSchema, CollectionsStates } from './collections.states';
import { addCollections, addTestCollection, replaceCollections, addAlert } from './collections.actions';
import { loadCollectionsService } from './collections.services';

/**
 * Actor references for this machine config.
 */
export enum CollectionsActors {
  COLLECTIONS_MACHINE = 'CollectionMachine',
}

/**
 * The machine config for the collection component machine.
 */
const collectionsConfig: MachineConfig<CollectionsContext, CollectionsSchema, CollectionsEvent> = {
  id: CollectionsActors.COLLECTIONS_MACHINE,
  initial: CollectionsStates.IDLE,
  on: {
    [CollectionsEvents.LOADED_COLLECTIONS]: {
      actions: replaceCollections,
    },
    [CollectionsEvents.CREATED_TEST_COLLECTION]: {
      actions: addCollections,
    },
    [CollectionsEvents.CLICKED_ADD]: {
      actions: [
        addTestCollection,
        sendParent({ type: AppEvents.ADD_ALERT, alert: { type: 'success', message: 'nde.collections.alerts.created-collection' } }),
      ],
    },
    [CollectionsEvents.CLICKED_LOGOUT]: {
      target: CollectionsStates.LOGOUT,
    },
  },
  states: {
    [CollectionsStates.IDLE]: {
      on: {
        [CollectionsEvents.CLICKED_LOAD]: CollectionsStates.LOADING,
      },
    },
    [CollectionsStates.LOADING]: {
      invoke: {
        src: loadCollectionsService,
        onDone: CollectionsStates.IDLE,
      },
    },
    [CollectionsStates.LOGOUT]: {
      type: 'final',
    },
  },
};

/**
 * The collection component machine.
 */
export const collectionsMachine = createMachine<CollectionsContext, CollectionsEvent, CollectionsState>(collectionsConfig);
