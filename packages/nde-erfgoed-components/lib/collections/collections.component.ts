import { css, html, property } from 'lit-element';
import type { Component } from '@digita-ai/semcom-core';
import { Collection, Logger, Translator } from '@digita-ai/nde-erfgoed-core';
import { RxLitElement } from 'rx-lit';

/**
 * A component which shows an summary of multiple collections.
 */
export class CollectionsComponent extends RxLitElement implements Component {

  /**
   * The component's logger.
   */
  @property({type: Logger})
  public logger: Logger;

  /**
   * The component's translator.
   */
  @property({type: Translator})
  public translator: Translator;

  /**
   * The collections which will be summarized by the component.
   */
  @property({type: Array})
  private collections: Collection[] = null;

  /**
   * The styles associated with the component.
   */
  static get styles() {
    return [
      css`
        .collection { }
      `,
    ];
  }

  /**
   * Loads data associated with the component.
   *
   * @param entry The resource which will be loaded by the component.
   * @param customFetch A custom fetch function provided by the host application.
   * @returns A promise when the data has been loaded.
   */
  data (entry: string, customFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>): Promise<void> {
    const myFetch = customFetch ? customFetch : fetch;

    return myFetch(entry)
      .then((response) => response.text())
      .then(() => {
        this.collections = [];
      });

  }

  /**
   * Renders the component as HTML.
   *
   * @returns The rendered HTML of the component.
   */
  render() {
    return html`
    <link href="./dist/bundles/styles.css" rel="stylesheet">
    <div class="collections">
    ${this.collections?.map((collection) => html`<nde-collection .collection='${collection}' .logger='${this.logger}' .translator='${this.translator}'></nde-collection>`)}
    </div>
  `;
  }
}

export default CollectionsComponent;
