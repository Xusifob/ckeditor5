import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Command from '@ckeditor/ckeditor5-core/src/command';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

export default class StructuredData extends Plugin {
	static get requires() {
		return [ StructuredDataEditing, StructuredDataUI ];
	}
}

class StructuredDataEditing extends Plugin {
	static get requires() {
		return [ Widget ];
	}

	init() {
		this._defineSchema();
		this._defineConverters();

		this.editor.commands.add( 'insertStructuredData', new InsertStructuredDataCommand( this.editor ) );
	}

	_defineSchema() {
		const schema = this.editor.model.schema;

		schema.register( 'structuredData', {
			// Behaves like a self-contained object (e.g. an image).
			isLimit: false,
			isObject: true,
			isBlock: true,

			allowContentOf: [ '$root' ],

			allowIn: [ 'pageBox' ],

			allowAttributes: [ 'title', 'bold', 'italic', 'underline', 'strikethrough', 'fontsize', 'alignment' ]

		} );
	}

	_defineConverters() {
		const conversion = this.editor.conversion;

		// <structuredData> converters
		conversion.for( 'upcast' ).elementToElement( {
			view: {
				name: 'section',
				classes: [ 'structured-data' ]
			},
			model: ( viewElement, modelWriter ) => {
				return modelWriter.createElement( 'structuredData', {
					title: viewElement.getAttribute( 'title' )
				} );
			}
		} );

		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'structuredData',
			view: ( modelItem, viewWriter ) => {
				const widgetElement = createStructuredDataView( modelItem, viewWriter );

				return toWidget( widgetElement, viewWriter );

			}
		} );

		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'structuredData',
			view: ( modelItem, viewWriter ) => {
				return createStructuredDataView( modelItem, viewWriter );
			}
		} );
	}
}

/**
 *
 */
class InsertStructuredDataCommand extends Command {
	execute( options ) {
		this.editor.model.change( writer => {
			const box = writer.createElement( 'structuredData', options );

			// Insert the box paragraph at the end of the root
			this.editor.model.insertContent( box );

			// There must be at least one paragraph for the box to be editable.
			// See https://github.com/ckeditor/ckeditor5/issues/1464.
			writer.appendElement( 'paragraph', box );

			// Move the document selection to the inserted paragraph.
			writer.setSelection( box, 'in' );
		} );
	}

	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const allowedIn = model.schema.findAllowedParent( selection.getFirstPosition(), 'structuredData' );

		this.isEnabled = allowedIn !== null;
	}
}

class StructuredDataUI extends Plugin {
	init() {
		const editor = this.editor;
		const t = editor.t;

		// The "structuredData" button must be registered among the UI components of the editor
		// to be displayed in the toolbar.
		editor.ui.componentFactory.add( 'structuredData', locale => {
			// The state of the button will be bound to the widget command.
			const command = editor.commands.get( 'insertStructuredData' );

			// The button will be an instance of ButtonView.
			const buttonView = new ButtonView( locale );

			buttonView.set( {
				// The t() function helps localize the editor. All strings enclosed in t() can be
				// translated and change when the language of the editor changes.
				label: t( 'Données structurées' ),
				withText: true,
				tooltip: true
			} );

			// Bind the state of the button to the command.
			buttonView.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

			// Execute the command when the button is clicked (executed).
			this.listenTo( buttonView, 'execute', () => {
				const title = prompt( 'Nom de la donnée structurée' );

				if ( title ) {
					editor.execute( 'insertStructuredData', { title } );
				}
			} );

			return buttonView;
		} );
	}
}

/**
 *
 * @param modelItem
 * @param viewWriter
 * @return {module:engine/view/containerelement~ContainerElement}
 */
function createStructuredDataView( modelItem, viewWriter ) {
	const title = modelItem.getAttribute( 'title' );

	return viewWriter.createContainerElement( 'section', {
		class: 'structured-data',
		title
	} );
}
