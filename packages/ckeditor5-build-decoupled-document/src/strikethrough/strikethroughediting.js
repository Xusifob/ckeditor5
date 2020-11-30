/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module basic-styles/strikethrough/strikethroughediting
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AttributeCommand from '../attributecommand';

const STRIKETHROUGH = 'strikethrough';
const W_STRIKETHROUGH = 'w-strikethrough';

/**
 * The strikethrough editing feature.
 *
 * It registers the `'strikethrough'` command, the <kbd>Ctrl+Shift+X</kbd> keystroke and introduces the
 * `strikethroughsthrough` attribute in the model which renders to the view
 * as a `<s>` element.
 *
 * @extends module:core/plugin~Plugin
 */
export default class StrikethroughEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'StrikethroughEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		// Allow strikethrough attribute on text nodes.
		editor.model.schema.extend( '$text', { allowAttributes: STRIKETHROUGH } );
		editor.model.schema.extend( 'placeholder', { allowAttributes: W_STRIKETHROUGH } );
		editor.model.schema.extend( 'structuredData', { allowAttributes: W_STRIKETHROUGH } );
		editor.model.schema.setAttributeProperties( STRIKETHROUGH, {
			isFormatting: true,
			copyOnEnter: true
		} );
		editor.model.schema.setAttributeProperties( W_STRIKETHROUGH, {
			isFormatting: true,
			copyOnEnter: true
		} );

		editor.conversion.attributeToElement( {
			model: STRIKETHROUGH,
			view: 's',
			upcastAlso: [
				'del',
				'strike',
				{
					styles: {
						'text-decoration': 'line-through'
					}
				}
			]
		} );


		editor.conversion.attributeToAttribute( {
			model: {
				key: W_STRIKETHROUGH,
				values: [ 'true', 'false' ]

			},
			view: {
				'true': {
					key: STRIKETHROUGH,
					value: 'true'
				},
				'false': {
					key: STRIKETHROUGH,
					value: 'false'
				}
			}
		} );

		// Create strikethrough command.
		editor.commands.add( STRIKETHROUGH, new AttributeCommand( editor, STRIKETHROUGH ) );
		editor.commands.add( W_STRIKETHROUGH, new AttributeCommand( editor, W_STRIKETHROUGH ) );

		// Set the Ctrl+Shift+X keystroke.
		editor.keystrokes.set( 'CTRL+SHIFT+X', STRIKETHROUGH );
		editor.keystrokes.set( 'CTRL+SHIFT+X', W_STRIKETHROUGH );
	}
}