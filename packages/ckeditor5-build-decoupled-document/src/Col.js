import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Command from '@ckeditor/ckeditor5-core/src/command';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

export default class Col extends Plugin {
	static get requires() {
		return [ ColEditing, ColUI ];
	}
}

class ColUI extends Plugin {
	init() {
		const editor = this.editor;
		const t = editor.t;

		// The "col" button must be registered among the UI components of the editor
		// to be displayed in the toolbar.
		editor.ui.componentFactory.add( 'col', locale => {
			// The state of the button will be bound to the widget command.
			const command = editor.commands.get( 'insertCol' );

			// The button will be an instance of ButtonView.
			const buttonView = new ButtonView( locale );

			buttonView.set( {
				// The t() function helps localize the editor. All strings enclosed in t() can be
				// translated and change when the language of the editor changes.
				label: t( '50%' ),
				withText: true,
				tooltip: true
			} );

			// Bind the state of the button to the command.
			buttonView.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

			// Execute the command when the button is clicked (executed).
			this.listenTo( buttonView, 'execute', () => editor.execute( 'insertCol' ) );

			return buttonView;
		} );
	}
}

class ColEditing extends Plugin {
	static get requires() {
		return [ Widget ];
	}

	init() {
		this._defineSchema();
		this._defineConverters();

		this.editor.commands.add( 'insertCol', new InsertColCommand( this.editor ) );
	}

	_defineSchema() {
		const schema = this.editor.model.schema;

		schema.register( 'col', {
			isLimit: false,
			isBlock: true,
			// Allow in places where other blocks are allowed (e.g. directly in the root).
			allowIn: [ '$block', '$root', 'pageBox' ],

			allowContentOf: '$block'
		} );
	}

	_defineConverters() {
		const conversion = this.editor.conversion;

		// <col> converters
		conversion.for( 'upcast' ).elementToElement( {
			model: 'col',
			view: {
				name: 'section',
				classes: 'col'
			}
		} );
		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'col',
			view: {
				name: 'section',
				classes: 'col'
			}
		} );
		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'col',
			view: ( modelElement, viewWriter ) => {
				const div = viewWriter.createContainerElement( 'section', { class: 'col' } );

				return toWidgetEditable( div, viewWriter );
			}
		} );
	}
}

class InsertColCommand extends Command {
	execute() {
		this.editor.model.change( writer => {
			const box1 = createCol( writer );
			const box2 = createCol( writer );

			// Insert the box paragraph at the end of the root
			this.editor.model.insertContent( box1 );
			this.editor.model.insertContent( box2 );

			// Move the document selection to the inserted paragraph.
			writer.setSelection( box1, 'in' );
		} );
	}

	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const allowedIn = model.schema.findAllowedParent( selection.getFirstPosition(), 'col' );

		this.isEnabled = allowedIn !== null;
	}
}

function createCol( writer ) {
	const col = writer.createElement( 'col' );

	// There must be at least one paragraph for the box to be editable.
	// See https://github.com/ckeditor/ckeditor5/issues/1464.
	writer.appendElement( 'paragraph', col );

	return col;
}
