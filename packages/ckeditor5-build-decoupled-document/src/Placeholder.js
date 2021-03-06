import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, viewToModelPositionOutsideModelElement } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Command from '@ckeditor/ckeditor5-core/src/command';

import {addListToDropdown, addToolbarToDropdown, createDropdown} from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import Model from '@ckeditor/ckeditor5-ui/src/model';

export default class Placeholder extends Plugin {
	static get requires() {
		return [ PlaceholderEditing, PlaceholderUI ];
	}
}

class PlaceholderCommand extends Command {
	execute( { key, value } ) {
		const editor = this.editor;

		const v = this.getConfigObject( key, value );

		editor.model.change( writer => {
			// Create a <placeholder> elment with the "name" attribute...
			const placeholder = writer.createElement( 'placeholder', { name: v.name, id: v.id } );

			// ... and insert it into the document.
			editor.model.insertContent( placeholder );

			// Put the selection on the inserted element.
			writer.setSelection( placeholder, 'on' );
		} );
	}

	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;

		const isAllowed = model.schema.checkChild( selection.focus.parent, 'placeholder' );

		this.isEnabled = isAllowed;
	}


	/**
	 *
	 * @param key
	 * @param name
	 * @return {*}
	 */
	getConfigObject( key, name ) {

		const config = this.editor.config.get( 'placeholderConfig' );
		let e;

		config.types[ key ].forEach( ( el ) => {
			if ( el.name === name ) {
				e = el;
			}
		} );

		return e;
	}
}

class PlaceholderUI extends Plugin {
	init() {
		const editor = this.editor;
		const t = editor.t;
		const placeholderNames = editor.config.get( 'placeholderConfig.types' );

		// The "placeholder" dropdown must be registered among the UI components of the editor
		// to be displayed in the toolbar.
		editor.ui.componentFactory.add( 'placeholder', locale => {

			const mainDropdown = createDropdown( locale );

			mainDropdown.buttonView.set( {
				// The t() function helps localize the editor. All strings enclosed in t() can be
				// translated and change when the language of the editor changes.
				label: t( 'Variables' ),
				tooltip: true,
				withText: true
			} );

			const toolbar = [];


			Object.keys( placeholderNames ).map( ( key ) => {

				const list = placeholderNames[ key ];

				const dropdownView = createDropdown( locale );

				// Populate the list in the dropdown with items.
				addListToDropdown( dropdownView, getDropdownItemsDefinitions( list ) );

				dropdownView.buttonView.set( {
					// The t() function helps localize the editor. All strings enclosed in t() can be
					// translated and change when the language of the editor changes.
					label: t( key ),
					tooltip: true,
					withText: true
				} );

				// Disable the placeholder button when the command is disabled.
				const command = editor.commands.get( 'placeholder' );
				dropdownView.bind( 'isEnabled' ).to( command );

				// Execute the command when the dropdown item is clicked (executed).
				this.listenTo( dropdownView, 'execute', evt => {
					editor.execute( 'placeholder', { key : key, value: evt.source.commandParam } );
					editor.editing.view.focus();
				} );

				toolbar.push( dropdownView );
			} );

			addToolbarToDropdown( mainDropdown, toolbar );

			return mainDropdown;

		} );
	}
}


/**
 *
 * @param placeholderNames
 * @return {Collection}
 */
function getDropdownItemsDefinitions( placeholderNames ) {
	const itemDefinitions = new Collection();

	for ( const elem of placeholderNames ) {
		const definition = {
			type: 'button',
			model: new Model( {
				commandParam: elem.name,
				label: elem.name,
				value: elem.id,
				withText: true
			} )
		};

		// Add the item definition to the collection.
		itemDefinitions.add( definition );
	}

	return itemDefinitions;
}

class PlaceholderEditing extends Plugin {
	static get requires() {
		return [ Widget ];
	}

	init() {
		this._defineSchema();
		this._defineConverters();

		this.editor.commands.add( 'placeholder', new PlaceholderCommand( this.editor ) );

		this.editor.editing.mapper.on(
			'viewToModelPosition',
			viewToModelPositionOutsideModelElement( this.editor.model, viewElement => viewElement.hasClass( 'mention' ) )
		);
	}

	_defineSchema() {
		const schema = this.editor.model.schema;

		schema.register( 'placeholder', {
			// Allow wherever text is allowed:
			allowWhere: '$text',

			// The placeholder will act as an inline node:
			isInline: true,

			// The inline widget is self-contained so it cannot be split by the caret and it can be selected:
			isObject: true,

			// The placeholder can have many types, like date, name, surname, etc:
			allowAttributes: [ 'name', 'id' ]
		} );
	}

	_defineConverters() {
		const conversion = this.editor.conversion;

		conversion.for( 'upcast' ).elementToElement( {
			view: {
				name: 'span',

				classes: [ 'mention' ]
			},
			model: ( viewElement, modelWriter ) => {
				const name = viewElement.getChild( 0 ).data;

				return modelWriter.createElement( 'placeholder', {
					name: name,
					id : viewElement.getAttribute( 'data-mention' )
				});
			}
		} );

		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'placeholder',
			view: ( modelItem, viewWriter ) => {

				const widgetElement = createPlaceholderView( modelItem, viewWriter );

				// Enable widget handling on a placeholder element inside the editing view.
				return toWidget( widgetElement, viewWriter );
			}
		} );

		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'placeholder',
			view: createPlaceholderView
		} );

		// Helper method for both downcast converters.
		function createPlaceholderView( modelItem, viewWriter ) {
			const name = modelItem.getAttribute( 'name' );
			const id = modelItem.getAttribute( 'id' );

			const placeholderView = viewWriter.createContainerElement( 'span', {
				class: 'mention',
				'data-mention': id
			} );

			// Insert the placeholder name (as a text).// Change here to name
			const innerText = viewWriter.createText( name );
			viewWriter.insert( viewWriter.createPositionAt( placeholderView, 0 ), innerText );

			return placeholderView;
		}
	}
}
