import { CollectionComponent } from '../lib/collections/collection.component';
import { CollectionsComponent } from '../lib/collections/collections.component';
import { AlertComponent } from '../lib/alerts/alert.component';
import { FormElementComponent } from '../lib/forms/form-element.component';
import { ContentHeaderComponent } from '../lib/header/content-header.component';
import { NDECard } from '../lib/collections/nde-card.component';
import { CollectionCardComponent } from '../lib/collections/collection-card.component';
import { CollectionObjectCardComponent } from '../lib/collections/collection-object-card.component';

/**
 * Register tags for components.
 */
customElements.define('nde-collection', CollectionComponent);
customElements.define('nde-collections', CollectionsComponent);
customElements.define('nde-alert', AlertComponent);
customElements.define('nde-form-element', FormElementComponent);
customElements.define('nde-content-header', ContentHeaderComponent);
customElements.define('nde-collection-object-card', CollectionObjectCardComponent);
customElements.define('nde-collection-card', CollectionCardComponent);
customElements.define('nde-card', NDECard);
