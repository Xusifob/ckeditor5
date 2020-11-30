import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Command from '@ckeditor/ckeditor5-core/src/command';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import pageBreakIcon from '../theme/icons/pagebreak.svg';

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
				label: t( 'Ajouter une page (Ctrl + Enter)' ),
				icon: pageBreakIcon,
				withText: false,
				tooltip: true
			} );

			// Bind the state of the button to the command.
			buttonView.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

			// Execute the command when the button is clicked (executed).
			this.listenTo( buttonView, 'execute', () => editor.execute( 'insertPageBox', { force: true } ) );

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

		// Set the Ctrl+B keystroke.
		this.editor.keystrokes.set( 'Ctrl+Enter', () => this.editor.execute( 'insertPageBox', { force: true } ) );
	}

	_defineSchema() {
		const schema = this.editor.model.schema;

		schema.register( 'pageBox', {
			isLimit: false,
			isObject: false,
			isBlock: true,

			// Allow in places where other blocks are allowed (e.g. directly in the root).
			allowWhere: '$block',

			allowAttributes: [ 'force' ],

			allowContentOf: '$root'
		} );
	}

	_defineConverters() {
		const conversion = this.editor.conversion;

		// <pageBox> converters
		conversion.for( 'upcast' ).elementToElement( {
			view: {
				name: 'div',
				classes: 'page-box'
			},
			model: ( viewElement, modelWriter ) => {
				return modelWriter.createElement( 'pageBox', {
					force: viewElement.getAttribute( 'force' ),
				} );
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

				const force = modelElement.hasAttribute( 'force' ) ? modelElement.getAttribute( 'force' ) : false;

				const div = viewWriter.createContainerElement( 'div', { class: 'page-box', force: force } );

				return toWidgetEditable( div, viewWriter );
			}
		} );
	}
}

class InsertPageBoxCommand extends Command {
	execute( options ) {
		const force = options && options.force ? options.force : false;

		this.editor.model.change( writer => {
			const box = writer.createElement( 'pageBox', { force } );

			let position;

			const currentPage = this.getCurrentParent( 'pageBox' );

			if ( currentPage && currentPage.name ) {
				position = writer.createPositionAt( currentPage, 'after' );
			} else {
				const root = this.editor.model.document.getRoot();
				position = writer.createPositionAt( root, root.childCount );
			}

			// Insert the box paragraph after the current page
			this.editor.model.insertContent( box, position );

			const cursor = this.getCurrentParent( [ 'image', 'paragraph', 'table' ] );

			// If the cursor is defined or it's in the root element
			if ( cursor && cursor.name && cursor.name !== '$root' ) {
				// Create positions
				const before = writer.createPositionBefore( cursor );
				const after = writer.createPositionAt( currentPage, currentPage.childCount );

				// Create range linked to the position
				const range = writer.createRange( before, after );

				writer.move( range, box, box.childCount );
			} else {
				// There must be at least one paragraph for the box to be editable.
				// See https://github.com/ckeditor/ckeditor5/issues/1464.
				writer.appendElement( 'paragraph', box );
			}

			if ( currentPage.childCount === 0 ) {
				writer.appendElement( 'paragraph', currentPage );
			}

			// Move the document selection to the inserted paragraph.
			writer.setSelection( box.getChild( 0 ), 'before' );
		} );
	}

	/**
	 * Returs the current parent
	 *
	 * @param parent string|array
	 * @param node
	 * @return {module:engine/view/position~Position|null}
	 */
	getCurrentParent( parent, node )
	{
		if ( typeof parent === 'string' ) {
			parent = [ parent ];
		}

		if ( !node ) {
			node = this.editor.model.document.selection.getFirstPosition();
		}

		if ( parent.indexOf( node.name ) !== -1 ) {
			return node;
		}

		if ( !node.parent ) {
			return node;
		}

		// Recursive
		return this.getCurrentParent( parent, node.parent );
	}

	refresh() {
		this.isEnabled = true;

		const model = this.editor.model;
		const selection = model.document.selection;
		const allowedIn = model.schema.findAllowedParent( selection.getFirstPosition(), 'pageBox' );

		this.isEnabled = allowedIn !== null;
	}
}
