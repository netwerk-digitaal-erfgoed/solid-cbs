import { html, property, PropertyValues, internalProperty, unsafeCSS, css, TemplateResult, CSSResult, query } from 'lit-element';
import { ArgumentError, Collection, CollectionObject, Logger, Translator } from '@netwerk-digitaal-erfgoed/solid-crs-core';
import { FormEvent, FormActors, FormSubmissionStates, Alert, FormRootStates, FormCleanlinessStates, FormValidationStates, FormUpdatedEvent, PopupComponent } from '@netwerk-digitaal-erfgoed/solid-crs-components';
import { map } from 'rxjs/operators';
import { from } from 'rxjs';
import { ActorRef, Interpreter, State } from 'xstate';
import { RxLitElement } from 'rx-lit';
import { Connect, Identity, Image, Object as ObjectIcon, Theme } from '@netwerk-digitaal-erfgoed/solid-crs-theme';
import { ComponentMetadata } from '@digita-ai/semcom-core';
import { unsafeSVG } from 'lit-html/directives/unsafe-svg';
import { DismissAlertEvent } from '../../app.events';
import { SemComService } from '../../common/semcom/semcom.service';
import { SelectedCollectionEvent } from '../collection/collection.events';
import { ObjectContext } from './object.machine';

/**
 * The root page of the object feature.
 */
export class ObjectRootComponent extends RxLitElement {

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
  public actor: Interpreter<ObjectContext>;

  /**
   * The component's alerts.
   */
  @property({ type: Array })
  public alerts: Alert[];

  /**
   * The state of this component.
   */
  @internalProperty()
  state?: State<ObjectContext>;

  /**
   * A list of all collections.
   */
  @internalProperty()
  collections?: Collection[];

  /**
   * The object to be displayed and/or edited.
   */
  @property({ type: Object })
  object?: CollectionObject;

  /**
   * The actor responsible for form validation in this component.
   */
  @internalProperty()
  formActor: ActorRef<FormEvent>;

  /**
   * Indicates if the form is being submitted.
   */
  @internalProperty()
  isSubmitting? = false;

  /**
   * Indicates if if the form validation passed.
   */
  @internalProperty()
  isValid? = false;

  /**
   * Indicates if one the form fields has changed.
   */
  @internalProperty()
  isDirty? = false;

  /**
   * Indicates whether the user is editing a field containing a Term.
   */
  @internalProperty()
  isEditingTermField? = false;

  /**
   * The semcom service to use in this component
   */
  @internalProperty()
  semComService? = new SemComService();

  /**
   * The content element to append SemComs to
   */
  @query('.content')
  contentElement: HTMLDivElement;
  /**
   * The content element to append SemComs to
   */
  @query('nde-popup')
  imagePopup: PopupComponent;

  /**
   * The ComponentMetadata of the SemComs
   */
  @internalProperty()
  components: ComponentMetadata[];

  /**
   * Hook called on first update after connection to the DOM.
   */
  async firstUpdated(changed: PropertyValues): Promise<void> {

    super.firstUpdated(changed);

    this.subscribe('components', from(this.semComService.queryComponents({ latest: true })));

  }

  /**
   * Hook called on at every update after connection to the DOM.
   */
  async updated(changed: PropertyValues): Promise<void> {

    super.updated(changed);

    if(changed && changed.has('actor') && this.actor){

      if(this.actor.parent){

        this.subscribe('alerts', from(this.actor.parent)
          .pipe(map((state) => state.context?.alerts)));

      }

      this.subscribe('formActor', from(this.actor).pipe(
        map((state) => state.children[FormActors.FORM_MACHINE]),
      ));

      this.subscribe('state', from(this.actor));

      this.subscribe('collections', from(this.actor).pipe(
        map((state) => state.context.collections),
      ));

      this.subscribe('object', from(this.actor).pipe(
        map((state) => state.context?.object),
      ));

    }

    if(changed?.has('formActor') && this.formActor){

      // this validates the form when form machine is started
      // needed for validation when coming back from the term machine
      // otherwise, form machine state is not_validated and the user can't save
      this.formActor.send(new FormUpdatedEvent('name', this.object?.name));

      this.subscribe('isSubmitting', from(this.formActor).pipe(
        map((state) => state.matches(FormSubmissionStates.SUBMITTING)),
      ));

      this.subscribe('isValid', from(this.formActor).pipe(
        map((state) => !state.matches({
          [FormSubmissionStates.NOT_SUBMITTED]:{
            [FormRootStates.VALIDATION]: FormValidationStates.INVALID,
          },
        })),
      ));

      this.subscribe('isDirty', from(this.formActor).pipe(
        map((state) => state.matches({
          [FormSubmissionStates.NOT_SUBMITTED]:{
            [FormRootStates.CLEANLINESS]: FormCleanlinessStates.DIRTY,
          },
        })),
      ));

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

    this.actor.parent.send(new DismissAlertEvent(event.detail));

  }

  /**
   * Renders the component as HTML.
   *
   * @returns The rendered HTML of the component.
   */
  render(): TemplateResult {

    // Create an alert components for each alert.
    const alerts = this.alerts?.map((alert) => html`<nde-alert .logger='${this.logger}' .translator='${this.translator}' .alert='${alert}' @dismiss="${this.handleDismiss}"></nde-alert>`);
    const collection = this.collections?.find((coll) => coll.uri === this.object?.collection);

    const toggleImage =  () => { this.imagePopup.hidden = !this.imagePopup?.hidden; };

    return this.object ? html`

    <nde-content-header inverse>
      <div slot="icon">${ unsafeSVG(ObjectIcon) }</div>
      <div slot="title" class="title">
        ${ this.object.name}
      </div>
      <div slot="subtitle" class="subtitle">
        ${ this.object.description }
      </div>
    </nde-content-header>

    <div class="content">
      <nde-large-card
      .showImage="${false}">
        <div slot="icon">${ unsafeSVG(Image) }</div>
        <div slot="title" class="title">
          Beeldmateriaal
        </div>
        <div slot="subtitle" class="subtitle">
          Dit is een ondertitel
        </div>
        <div slot="content">
          <img src="${this.object.image}" @click="${ () => toggleImage() }"/>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.license') } </div>
            <div> <a target="_blank" href="${this.object.license}">${ this.translator.translate(`nde.features.object.card.image.field.license.${this.object.license}`) }</a> </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.download') } </div>
            <div> <a href="${this.object.image}" download> click </a> </div>
          </div>
          <nde-popup dark>
            <img slot="content" src="${ this.object.image }"/>
          </nde-popup>
        </div>
      </nde-large-card>

      <nde-large-card
      .showImage="${false}">
        <div slot="icon">${ unsafeSVG(Identity) }</div>
        <div slot="title" class="title">
          Identificatie
        </div>
        <div slot="subtitle" class="subtitle">
          Dit is een ondertitel
        </div>
        <div slot="content">
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.identifier') } </div>
            <div> ${ this.object.identifier } </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.type') } </div>
            <div> ${ this.object.type } </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.additionalType') } </div>
            <div> ${ this.object.additionalType.map((term) => html`<div>${term.name}</div>`) } </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.name') } </div>
            <div> ${ this.object.name } </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.description') } </div>
            <div> ${ this.object.description } </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.collection') } </div>
            <div> <a @click="${ () => this.actor.parent.send(new SelectedCollectionEvent(collection)) }">${ collection.name }</a>  </div>
          </div>
        </div>
      </nde-large-card>

      <nde-large-card
      .showImage="${false}">
        <div slot="icon">${ unsafeSVG(ObjectIcon) }</div>
        <div slot="title" class="title">
          Vervaardiging
        </div>
        <div slot="subtitle" class="subtitle">
          Dit is een ondertitel
        </div>
        <div slot="content">
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.creator') } </div>
            <div> ${ this.object.creator.map((term) => html`<div>${term.name}</div>`) } </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.locationCreated') } </div>
            <div> ${ this.object.locationCreated.map((term) => html`<div>${term.name}</div>`) } </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.material') } </div>
            <div> ${ this.object.material.map((term) => html`<div>${term.name}</div>`) } </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.dateCreated') } </div>
            <div> ${ this.object.dateCreated } </div>
          </div>
        </div>
      </nde-large-card>

      <nde-large-card
      .showImage="${false}">
        <div slot="icon">${ unsafeSVG(ObjectIcon) }</div>
        <div slot="title" class="title">
          Voorstelling
        </div>
        <div slot="subtitle" class="subtitle">
          Dit is een ondertitel
        </div>
        <div slot="content">
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.subject') } </div>
            <div> ${ this.object.subject.map((term) => html`<div>${term.name}</div>`) } </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.location') } </div>
            <div> ${ this.object.location.map((term) => html`<div>${term.name}</div>`) } </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.person') } </div>
            <div> ${ this.object.person.map((term) => html`<div>${term.name}</div>`) } </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.organization') } </div>
            <div> ${ this.object.organization.map((term) => html`<div>${term.name}</div>`) } </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.event') } </div>
            <div> ${ this.object.event.map((term) => html`<div>${term.name}</div>`) } </div>
          </div>
        </div>
      </nde-large-card>

      <nde-large-card
      .showImage="${false}">
        <div slot="icon">${ unsafeSVG(Connect) }</div>
        <div slot="title" class="title">
          Afmetingen
        </div>
        <div slot="subtitle" class="subtitle">
          Dit is een ondertitel
        </div>
        <div slot="content">
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.height') } </div>
            <div> ${ this.object.height } ${ this.object.heightUnit } </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.width') } </div>
            <div> ${ this.object.width } ${ this.object.widthUnit } </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.depth') } </div>
            <div> ${ this.object.depth } ${ this.object.depthUnit } </div>
          </div>
          <div class="object-property">
            <div> ${ this.translator.translate('nde.features.object.card.field.weight') } </div>
            <div> ${ this.object.weight } ${ this.object.weightUnit } </div>
          </div>
        </div>
      </nde-large-card>
    </div>
    ` : html`<nde-progress-bar></nde-progress-bar>`;

  }

  static get styles(): CSSResult[] {

    return [
      unsafeCSS(Theme),
      css`
        *::-webkit-scrollbar-thumb {
          background-color: var(--colors-foreground-light);
          border: 3px solid var(--colors-background-normal);
        }
        *::-webkit-scrollbar-track {
          background: var(--colors-background-normal);
        }
        :host {
          scrollbar-color: var(--colors-foreground-light) var(--colors-background-normal);
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }
        .content {
          margin-top: 1px;
          padding: var(--gap-large);
          overflow-y: auto;
          overflow-x: clip;
          display: flex;
          flex-direction: column;
        }
        .content div[slot="content"] {
          margin: 0 45px; /* gap-large + gap-small */
        }
        div[slot="content"] > img {
          height: 200px;
          width: 100%;
          object-fit: cover;
          margin-bottom: var(--gap-normal);
        }
        a {
          cursor: pointer;
          text-decoration: underline;
          color: var(--colors-primary-light);
        }
        .object-property {
          margin-bottom: var(--gap-small);
          width: 100%;
          display: flex;
        }
        .object-property * {
          overflow: hidden;
          font-size: var(--font-size-small);
          line-height: 21px;
        }
        .object-property > div:first-child {
          font-weight: var(--font-weight-bold);
          width: 33%;
          max-width: 33%;
        }
        .object-property > div:last-child {
          display: inline-flex;
          flex-direction: column;
        }
        [hidden] {
          display: none;
        }
      `,
    ];

  }

}
