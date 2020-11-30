/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module basic-styles/italic/italicediting
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AttributeCommand from '../attributecommand';

const ITALIC = 'italic';

const W_ITALIC = 'w-italic';

/**
 * The italic editing feature.
 *
 * It registers the `'italic'` command, the <kbd>Ctrl+I</kbd> keystroke and introduces the `italic` attribute in the model
 * which renders to the view as an `<i>` element.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ItalicEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ItalicEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		// Allow italic attribute on text nodes.
		editor.model.schema.extend( '$text', { allowAttributes: ITALIC } );
		editor.model.schema.extend( 'placeholder', { allowAttributes: W_ITALIC } );
		editor.model.schema.extend( 'structuredData', { allowAttributes: W_ITALIC } );

		editor.model.schema.setAttributeProperties( ITALIC, {
			isFormatting: true,
			copyOnEnter: true
		} );

		editor.model.schema.setAttributeProperties( W_ITALIC, {
			isFormatting: true,
			copyOnEnter: true
		} );

		editor.conversion.attributeToElement( {
			model: ITALIC,
			view: 'i',
			upcastAlso: [
				'em',
				{
					styles: {
						'font-style': 'italic'
					}
				}
			]
		} );

		editor.conversion.attributeToAttribute( {
			model: {
				key: W_ITALIC,
				values: [ 'true', 'false' ]

			},
			view: {
				'true': {
					key: ITALIC,
					value: 'true'
				},
				'false': {
					key: ITALIC,
					value: 'false'
				}
			}
		} );

		// Create italic command.
		editor.commands.add( ITALIC, new AttributeCommand( editor, ITALIC ) );
		editor.commands.add( W_ITALIC, new AttributeCommand( editor, W_ITALIC ) );

		// Set the Ctrl+I keystroke.
		editor.keystrokes.set( 'CTRL+I', ITALIC );
		editor.keystrokes.set( 'CTRL+I', W_ITALIC );
	}
}
