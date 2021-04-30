import { Alert, State } from '@digita-ai/nde-erfgoed-components';
import { SolidService, SolidSession } from '@digita-ai/nde-erfgoed-core';
import { createMachine } from 'xstate';
import { assign, log, send } from 'xstate/lib/actions';
import { addAlert, AppEvent, AppEvents, dismissAlert } from './app.events';
import { authenticateMachine } from './features/authenticate/authenticate.machine';
import { collectionsMachine } from './features/collections/collections.machine';

/**
 * The root context of the application.
 */
export interface AppContext {
  /**
   * App-wide alerts.
   */
  alerts: Alert[];

  /**
   * The session of the current user.
   */
  session?: SolidSession;
}

/**
 * Actor references for this machine config.
 */
export enum AppActors {
  APP_MACHINE = 'AppMachine',
  COLLECTIONS_MACHINE = 'CollectionMachine',
  AUTHENTICATE_MACHINE = 'AuthenticateMachine',
}

/**
 * State references for the application root, with readable log format.
 */
export enum AppRootStates {
  AUTHENTICATE = '[AppState: Authenticate]',
  FEATURE  = '[AppState: Features]',
}

/**
 * State references for the application's features, with readable log format.
 */
export enum AppFeatureStates {
  AUTHENTICATE = '[AppFeatureState: Authenticate]',
  COLLECTIONS  = '[AppFeatureState: Collections]',
}

/**
 * State references for the application's features, with readable log format.
 */
export enum AppAuthenticateStates {
  AUTHENTICATED = '[AppAuthenticateState: Authenticated]',
  UNAUTHENTICATED  = '[AppAuthenticateState: Unauthenticated]',
}

/**
 * Union type of all app events.
 */
export type AppStates = AppRootStates | AppFeatureStates | AppAuthenticateStates;

/**
 * The application root machine and its configuration.
 */
export const appMachine = (solid: SolidService) => createMachine<AppContext, AppEvent, State<AppStates, AppContext>>({
  id: AppActors.APP_MACHINE,
  type: 'parallel',
  states: {
    /**
     * Determines which feature is currently active.
     */
    [AppRootStates.FEATURE]: {
      initial: AppFeatureStates.AUTHENTICATE,
      on: {
        [AppEvents.DISMISS_ALERT]: {
          actions: dismissAlert,
        },
        [AppEvents.ADD_ALERT]: {
          actions: addAlert,
        },
        [AppEvents.ERROR]: {
          actions: [
            log(() => 'An error occurred'),
            send(() => ({
              type: AppEvents.ADD_ALERT,
              alert: { type: 'danger', message: 'nde.root.alerts.error' },
            })),
          ],
        },
        [AppEvents.LOGGED_IN]: {
          target: [
            `${AppRootStates.FEATURE}.${AppFeatureStates.COLLECTIONS}`,
            `${AppRootStates.AUTHENTICATE}.${AppAuthenticateStates.AUTHENTICATED}`,
          ],
          actions: assign({session: (context, event) => event.session}),
        },
        [AppEvents.LOGGED_OUT]: {
          target: [
            `${AppRootStates.FEATURE}.${AppFeatureStates.AUTHENTICATE}`,
            `${AppRootStates.AUTHENTICATE}.${AppAuthenticateStates.UNAUTHENTICATED}`,
          ],
        },
      },
      states: {
        /**
         * The collection feature is shown.
         */
        [AppFeatureStates.COLLECTIONS]: {
          invoke: {
            id: AppActors.COLLECTIONS_MACHINE,
            src: collectionsMachine.withContext({}),
            onDone: AppFeatureStates.AUTHENTICATE,
            onError: {
              actions: send({ type: AppEvents.ERROR }),
            },
          },
        },
        /**
         * The authenticate feature is active.
         */
        [AppFeatureStates.AUTHENTICATE]: {
          invoke: {
            id: AppActors.AUTHENTICATE_MACHINE,
            src: authenticateMachine(solid).withContext({ }),
            onDone: {
              actions: send((_, event) => ({type: AppEvents.LOGGED_IN, session: event.data })),
            },
            onError: {
              actions: send({ type: AppEvents.ERROR }),
            },
          },
        },
      },
    },
    /**
     * Determines if the current user is authenticated or not.
     */
    [AppRootStates.AUTHENTICATE]: {
      initial: AppAuthenticateStates.UNAUTHENTICATED,
      states: {
        /**
         * The user is authenticated.
         */
        [AppAuthenticateStates.AUTHENTICATED]: {

        },

        /**
         * The user has not been authenticated.
         */
        [AppAuthenticateStates.UNAUTHENTICATED]: {
          invoke: {
            src: () => solid.logout(),
          },
        },
      },
    },
  },
});
