import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import {toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Command from '@ckeditor/ckeditor5-core/src/command';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

export default class PageBox extends Plugin {
	static get requires() {
		return [ PageBoxEditing, PageBoxUI ];
	}
}

class PageBoxUI extends Plugin {
	init() {
		const editor = this.editor;
		const t = editor.t;

		// The "pageBox" button must be registered among the UI components of the editor
		// to be displayed in the toolbar.
		editor.ui.componentFactory.add( 'pageBox', locale => {
			// The state of the button will be bound to the widget command.
			const command = editor.commands.get( 'insertPageBox' );

			// The button will be an instance of ButtonView.
			const buttonView = new ButtonView( locale );

			buttonView.set( {
				// The t() function helps localize the editor. All strings enclosed in t() can be
				// translated and change when the language of the editor changes.
				label: t( 'Ajouter une page' ),
				withText: true,
				tooltip: true
			} );

			// Bind the state of the button to the command.
			buttonView.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

			// Execute the command when the button is clicked (executed).
			this.listenTo( buttonView, 'execute', () => editor.execute( 'insertPageBox' ) );

			return buttonView;
		} );
	}
}

class PageBoxEditing extends Plugin {
	static get requires() {
		return [ Widget ];
	}

	init() {
		this._defineSchema();
		this._defineConverters();

		this.editor.commands.add( 'insertPageBox', new InsertPageBoxCommand( this.editor ) );
	}

	_defineSchema() {
		const schema = this.editor.model.schema;

		schema.register( 'pageBox', {
			// Behaves like a self-contained object (e.g. an image).
			isLimit: true,

			// Allow in places where other blocks are allowed (e.g. directly in the root).
			allowWhere: '$block',

			allowContentOf: '$root'
		} );
	}

	_defineConverters() {
		const conversion = this.editor.conversion;

		// <pageBox> converters
		conversion.for( 'upcast' ).elementToElement( {
			model: 'pageBox',
			view: {
				name: 'div',
				classes: 'page-box'
			}
		} );
		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'pageBox',
			view: {
				name: 'div',
				classes: 'page-box'
			}
		} );
		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'pageBox',
			view: ( modelElement, viewWriter ) => {
				const div = viewWriter.createContainerElement( 'div', { class: 'page-box' } );

				return toWidgetEditable( div, viewWriter);
			}
		} );
	}
}

class InsertPageBoxCommand extends Command {
	execute() {
		this.editor.model.change( writer => {

			const root = this.editor.model.document.getRoot();

			const box = createPageBox( writer );

			// Insert the box paragraph at the end of the root
			this.editor.model.insertContent( box, writer.createPositionAt( root, root.childCount ) );

			// Move the document selection to the inserted paragraph.
			writer.setSelection( box, 'in' );

		} );
	}

	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const allowedIn = model.schema.findAllowedParent( selection.getFirstPosition(), 'pageBox' );

		this.isEnabled = allowedIn !== null;
	}
}

function createPageBox( writer ) {
	const pageBox = writer.createElement( 'pageBox' );

	// There must be at least one paragraph for the box to be editable.
	// See https://github.com/ckeditor/ckeditor5/issues/1464.
	writer.appendElement( 'paragraph', pageBox );

	return pageBox;


}
