import { getUrl, getSolidDataset, getThing, getStringWithLocale, getThingAll, asUrl, ThingPersisted } from '@digita-ai/nde-erfgoed-client';

import { CollectionObject, CollectionObjectStore, Collection, ArgumentError } from '@digita-ai/nde-erfgoed-core';
import { asapScheduler } from 'rxjs';

export class CollectionObjectSolidStore implements CollectionObjectStore {

  /**
   * Retrieves all objects for a specific collection.
   *
   * @param collection The collection for which to retrieve objects.
   */
  async getObjectsForCollection(collection: Collection): Promise<CollectionObject[]> {

    if (!collection) {

      throw new ArgumentError('Argument collection should be set', collection);

    }

    const dataset = await getSolidDataset(collection.objectsUri);

    if (!dataset) {

      return [];

    }

    const objectThings = getThingAll(dataset); // a list of CollectionObject Things

    if (!objectThings) {

      return [];

    }

    const objects = objectThings.map((objectThing: ThingPersisted) => ({
      uri: asUrl(objectThing),
      collection: collection.uri,
      name: getStringWithLocale(objectThing, 'http://schema.org/name', 'nl'),
      description: getStringWithLocale(objectThing, 'http://schema.org/description', 'nl'),
      type: undefined,
      subject: undefined,
      image: undefined,
      updated: undefined,
    } as CollectionObject));

    return objects.filter((object: CollectionObject) => object.collection === collection.uri);

  }

  /**
   * Retrieves a single Collection
   *
   * @param uri The URI of the Collection
   */
  async getObject(uri: string): Promise<CollectionObject> {

    if (!uri) {

      throw new ArgumentError('Argument uri should be set', uri);

    }

    const dataset = await getSolidDataset(uri);

    const collectionThing = getThing(dataset, uri);

    return {
      uri,
      collection: getUrl(collectionThing, 'http://schema.org/isPartOf'),
      name: getStringWithLocale(collectionThing, 'http://schema.org/name', 'nl'),
      description: getStringWithLocale(collectionThing, 'http://schema.org/description', 'nl'),
      type: undefined,
      subject: undefined,
      image: undefined,
      updated: undefined,
    } as CollectionObject;

  }

  /**
   * Retrieves a list of collections for the current WebID
   *
   */
  async all(): Promise<CollectionObject[]> {

    throw new Error('Method not implemented.');

  }

  /**
   * Deletes a single Collection from a pod
   *
   * @param resource The Collection to delete
   */
  async delete(resource: CollectionObject): Promise<CollectionObject> {

    throw new Error('Method not implemented.');

  }

  /**
   * Stores a single Collection to a pod
   *
   * @param resource The Collection to save
   */
  async save(resource: CollectionObject): Promise<CollectionObject> {

    throw new Error('Method not implemented.');

  }

}
