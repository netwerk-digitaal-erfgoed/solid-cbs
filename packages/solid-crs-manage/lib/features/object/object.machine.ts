import { formMachine,
  FormActors,
  FormValidatorResult,
  FormContext,
  FormEvents, State } from '@netwerk-digitaal-erfgoed/solid-crs-components';
import { assign, createMachine, sendParent } from 'xstate';
import { CollectionObject, CollectionObjectStore } from '@netwerk-digitaal-erfgoed/solid-crs-core';
import { Observable, of } from 'rxjs';
import { AppEvents } from '../../app.events';
import { ObjectEvent, ObjectEvents } from './object.events';

/**
 * The context of the object feature.
 */
export interface ObjectContext {
  /**
   * The currently selected object.
   */
  object?: CollectionObject;
}

/**
 * Actor references for this machine config.
 */
export enum ObjectActors {
  OBJECT_MACHINE = 'ObjectMachine',
}

/**
 * State references for the object machine, with readable log format.
 */
export enum ObjectStates {
  IDLE      = '[ObjectsState: Idle]',
  SAVING    = '[ObjectsState: Saving]',
  EDITING   = '[ObjectsState: Editing]',
  DELETING  = '[ObjectsState: Deleting]',
}

/**
 * Validate the values of a collection object
 *
 * @param context the context of the object to be validated
 * @returns a list of validator results
 */
const validateObjectForm = (context: FormContext<CollectionObject>): Observable<FormValidatorResult[]> => {

  const res = [];

  // the description of an object can not be longer than 10.000 characters
  if (context.data.description && context.data.description.length > 10000) {

    res.push({
      field: 'description',
      message: 'nde.features.object.card.identification.field.description.validation.max-characters',
    });

  }

  // the name/title of an object can not be empty
  if (!context.data.name) {

    res.push({
      field: 'name',
      message: 'nde.features.object.card.identification.field.title.validation.empty',
    });

  }

  // the name/title of an object can not be longer than 100 characters
  if (context.data.name && context.data.name.length > 100) {

    res.push({
      field: 'name',
      message: 'nde.features.object.card.identification.field.title.validation.max-characters',
    });

  }

  return of(res);

};

/**
 * The object machine.
 */
export const objectMachine = (objectStore: CollectionObjectStore) =>
  createMachine<ObjectContext, ObjectEvent, State<ObjectStates, ObjectContext>>({
    id: ObjectActors.OBJECT_MACHINE,
    context: { },
    initial: ObjectStates.IDLE,
    on: {
      [ObjectEvents.SELECTED_OBJECT]: {
        actions: assign({
          object: (context, event) => event.object,
        }),
        target: ObjectStates.IDLE,
      },
    },
    states: {
      [ObjectStates.IDLE]: {
        on: {
          [ObjectEvents.CLICKED_EDIT]: ObjectStates.EDITING,
          [ObjectEvents.CLICKED_DELETE]: ObjectStates.DELETING,
        },
      },
      [ObjectStates.SAVING]: {
        invoke: {
          src: (context, event) => objectStore.save(context.object),
          onDone: ObjectStates.IDLE,
          onError: {
            actions: sendParent(AppEvents.ERROR),
          },
        },
      },
      [ObjectStates.EDITING]: {
        on: {
          [ObjectEvents.CLICKED_SAVE]: ObjectStates.SAVING,
          [ObjectEvents.CANCELLED_EDIT]: ObjectStates.IDLE,
          [FormEvents.FORM_SUBMITTED]: ObjectStates.SAVING,
        },
        invoke: [
          {
            id: FormActors.FORM_MACHINE,
            src: formMachine<CollectionObject>(
              (context) => validateObjectForm(context),
              async (c: FormContext<CollectionObject>) => c.data
            ),
            data: (context) => ({
              data: { ...context.object },
              original: { ...context.object },
            }),
            onDone: {
              target: ObjectStates.SAVING,
              actions: [
                assign((context, event) => ({
                  object: { ...event.data.data },
                })),
              ],
            },
            onError: {
              target: ObjectStates.IDLE,
            },
          },
        ],
      },
      [ObjectStates.DELETING]: {
        invoke: {
          src: (context) => objectStore.delete(context.object),
          onDone: {
            target: ObjectStates.IDLE,
            actions: [
              sendParent((context) => ({ type: ObjectEvents.CLICKED_DELETE, object: context.object })),
            ],
          },
          onError: {
            actions: sendParent(AppEvents.ERROR),
          },
        },
      },
    },
  });
