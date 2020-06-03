/**
 * Plugin that converts custom attributes for elements that are wrapped in <figure> in the view.
 */
export default class CustomFigureAttributes {
	/**
	 * Plugin's constructor - receives editor instance on creation.
	 */
	constructor( editor ) {
		// Save reference to the editor.
		this.editor = editor;
	}

	/**
	 * Setups conversion and extends table & image features schema.
	 *
	 * Schema extending must be done in the “afterInit()” call because plugins define their schema in “init()“.
	 */
	afterInit() {
		const editor = this.editor;

		editor.conversion.for( 'upcast' ).add( upcastCustomClasses( 'figure' ), { priority: 'low' } );

		// Define custom attributes that should be preserved.
		setupCustomAttributeConversion( 'img', 'image', 'data-url', editor );
	}
}

/**
 * Sets up a conversion for a custom attribute on view elements contained inside a <figure>.
 *
 * This method:
 * - Adds proper schema rules.
 * - Adds an upcast converter.
 * - Adds a downcast converter.
 */
function setupCustomAttributeConversion( viewElementName, modelElementName, viewAttribute, editor ) {
	// Extend the schema to store an attribute in the model.
	const modelAttribute = `custom${ viewAttribute }`;

	editor.model.schema.extend( modelElementName, { allowAttributes: [ modelAttribute ] } );

	editor.conversion.for( 'upcast' ).add( upcastAttribute( viewElementName, viewAttribute, modelAttribute ) );
	editor.conversion.for( 'downcast' ).add( downcastAttribute( modelElementName, viewElementName, viewAttribute, modelAttribute ) );
}

/**
 * Creates an upcast converter that will pass all classes from the view element to the model element.
 */
function upcastCustomClasses( elementName ) {
	return dispatcher => dispatcher.on( `element:${ elementName }`, ( evt, data, conversionApi ) => {
		const viewItem = data.viewItem;
		const modelRange = data.modelRange;

		const modelElement = modelRange && modelRange.start.nodeAfter;

		if ( !modelElement ) {
			return;
		}

		// The upcast conversion picks up classes from the base element and from the <figure> element so it should be extensible.
		const currentAttributeValue = modelElement.getAttribute( 'customClass' ) || [];

		currentAttributeValue.push( ...viewItem.getClassNames() );

		conversionApi.writer.setAttribute( 'customClass', currentAttributeValue, modelElement );
	} );
}


/**
 * Helper method that searches for a given view element in all children of the model element.
 *
 * @param {module:engine/view/item~Item} viewElement
 * @param {String} viewElementName
 * @param {module:engine/conversion/downcastdispatcher~DowncastConversionApi} conversionApi
 * @return {module:engine/view/item~Item}
 */
function findViewChild( viewElement, viewElementName, conversionApi ) {
	const viewChildren = Array.from( conversionApi.writer.createRangeIn( viewElement ).getItems() );

	return viewChildren.find( item => item.is( viewElementName ) );
}

/**
 * Returns the custom attribute upcast converter.
 */
function upcastAttribute( viewElementName, viewAttribute, modelAttribute ) {
	return dispatcher => dispatcher.on( `element:${ viewElementName }`, ( evt, data, conversionApi ) => {
		const viewItem = data.viewItem;
		const modelRange = data.modelRange;

		const modelElement = modelRange && modelRange.start.nodeAfter;

		if ( !modelElement ) {
			return;
		}

		conversionApi.writer.setAttribute( modelAttribute, viewItem.getAttribute( viewAttribute ), modelElement );
	} );
}

/**
 * Returns the custom attribute downcast converter.
 */
function downcastAttribute( modelElementName, viewElementName, viewAttribute, modelAttribute ) {
	return dispatcher => dispatcher.on( `insert:${ modelElementName }`, ( evt, data, conversionApi ) => {
		const modelElement = data.item;

		const viewFigure = conversionApi.mapper.toViewElement( modelElement );
		const viewElement = findViewChild( viewFigure, viewElementName, conversionApi );

		if ( !viewElement ) {
			return;
		}

		conversionApi.writer.setAttribute( viewAttribute, modelElement.getAttribute( modelAttribute ), viewElement );
	} );
}
