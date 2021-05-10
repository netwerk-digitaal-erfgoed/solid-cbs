import { html, property, PropertyValues, internalProperty, unsafeCSS, css, TemplateResult, CSSResult } from 'lit-element';
import { ArgumentError, Collection, CollectionObject, Logger, Translator } from '@digita-ai/nde-erfgoed-core';
import { Alert } from '@digita-ai/nde-erfgoed-components';
import { map } from 'rxjs/operators';
import { from } from 'rxjs';
import { Interpreter, State } from 'xstate';
import { RxLitElement } from 'rx-lit';
import { Collection as CollectionIcon, Cross, Edit, Plus, Save, Theme, Trash } from '@digita-ai/nde-erfgoed-theme';
import { unsafeSVG } from 'lit-html/directives/unsafe-svg';
import { AppEvents } from '../../app.events';
import { CollectionContext, CollectionStates } from './collection.machine';
import { CollectionEvents } from './collection.events';

/**
 * The root page of the collections feature.
 */
export class CollectionRootComponent extends RxLitElement {

  /**
   * The component's logger.
   */
  @property({ type: Object })
  public logger: Logger;

  /**
   * The component's translator.
   */
  @property({ type: Object })
  public translator: Translator;

  /**
   * The actor controlling this component.
   */
  @property({ type: Object })
  public actor: Interpreter<CollectionContext>;

  /**
   * The component's alerts.
   */
  @property({ type: Array })
  public alerts: Alert[];

  /**
   * The state of this component.
   */
  @internalProperty()
  state?: State<CollectionContext>;

  /**
   * The collections which will be summarized by the component.
   */
  @property({ type: Object })
  collection?: Collection;

  /**
   * The list of objects in the current collection.
   */
  @internalProperty()
  objects?: CollectionObject[];

  /**
   * Hook called on at every update after connection to the DOM.
   */
  updated(changed: PropertyValues): void {

    super.updated(changed);

    if(changed && changed.has('actor') && this.actor){

      if(this.actor.parent){

        this.subscribe('alerts', from(this.actor.parent)
          .pipe(map((state) => state.context?.alerts)));

      }

      this.subscribe('state', from(this.actor));

      this.subscribe('collection', from(this.actor)
        .pipe(map((state) => state.context?.collection)));

      this.subscribe('objects', from(this.actor)
        .pipe(map((state) => state.context?.objects)));

    }

  }

  /**
   * Handles a dismiss event by sending a dismiss alert event to its parent.
   *
   * @param event Dismiss event dispatched by an alert componet.
   */
  handleDismiss(event: CustomEvent<Alert>): void {

    if (!event || !event.detail) {

      throw new ArgumentError('Argument event || event.detail should be set.', event);

    }

    if (!this.actor || !this.actor.parent) {

      throw new ArgumentError('Argument this.actor || !this.actor.parent should be set.', this.actor);

    }

    this.actor.parent.send(AppEvents.DISMISS_ALERT, { alert: event.detail });

  }

  /**
   * Renders the component as HTML.
   *
   * @returns The rendered HTML of the component.
   */
  render(): TemplateResult {

    // Create an alert components for each alert.
    const alerts = this.alerts?.map((alert) => html`<nde-alert .logger='${this.logger}' .translator='${this.translator}' .alert='${alert}' @dismiss="${this.handleDismiss}"></nde-alert>`);

    const loading = this.state||false;

    return loading ? html`
    <nde-content-header inverse>
      <div slot="icon">${ unsafeSVG(CollectionIcon) }</div>
      <div slot="title">${this.collection.name}</div>
      <div slot="subtitle">${this.collection.description}</div>

      ${ !this.state.matches(CollectionStates.EDITING) ? html`<div slot="actions"><button class="no-padding inverse edit" @click="${() => this.actor.send(CollectionEvents.CLICKED_EDIT)}">${unsafeSVG(Edit)}</button></div>` : '' }
      ${ this.state.matches(CollectionStates.EDITING) ? html`<div slot="actions"><button class="no-padding inverse save" @click="${() => this.actor.send(CollectionEvents.CLICKED_SAVE)}">${unsafeSVG(Save)}</button></div>` : '' }
      ${ this.state.matches(CollectionStates.EDITING) ? html`<div slot="actions"><button class="no-padding inverse cancel" @click="${() => this.actor.send(CollectionEvents.CANCELLED_EDIT)}">${unsafeSVG(Cross)}</button></div>` : '' }
      <div slot="actions"><button class="no-padding inverse create" @click="${() => this.actor.send(CollectionEvents.CLICKED_CREATE_OBJECT)}">${unsafeSVG(Plus)}</button></div>
      <div slot="actions"><button class="no-padding inverse delete" @click="${() => this.actor.send(CollectionEvents.CLICKED_DELETE)}">${unsafeSVG(Trash)}</button></div>
    </nde-content-header>
    <div class="content">
      ${ alerts }
      
      <div class='grid'>
        ${this.objects?.map((object) => html`<nde-object-card .translator=${this.translator} .object=${object}></nde-object-card>`)}
      </div>
    </div>
  ` : html``;

  }

  /**
   * The styles associated with the component.
   */
  static get styles(): CSSResult[] {

    return [
      unsafeCSS(Theme),
      css`
        .content {
          padding: var(--gap-large);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-gap: var(--gap-normal);
        }
        @media only screen and (max-width: 1300px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media only screen and (max-width: 1000px) {
          .grid {
            grid-template-columns: repeat(1, 1fr);
          }
        }
        nde-object-card, nde-collection-card {
          height: 227px;
        }
        button svg {
          max-width: var(--gap-normal);
          height: var(--gap-normal);
        }
      `,
    ];

  }

}
