/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module basic-styles/bold/boldediting
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AttributeCommand from '../attributecommand';

const REQUIRED = 'required';

/**
 * The bold editing feature.
 *
 * It registers the `'bold'` command and introduces the `bold` attribute in the model which renders to the view
 * as a `<strong>` element.
 *
 * @extends module:core/plugin~Plugin
 */
export default class RequiredEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'RequiredEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		// Allow bold attribute on text nodes.
		editor.model.schema.extend( 'structuredData', { allowAttributes: REQUIRED } );

		editor.model.schema.setAttributeProperties( REQUIRED, {
			isFormatting: true,
			copyOnEnter: true
		} );

		editor.conversion.attributeToAttribute( {
			model: {
				key: REQUIRED,
				values: [ 'true', 'false' ]

			},
			view: {
				'true': {
					key: REQUIRED,
					value: 'true'
				},
				'false': {
					key: REQUIRED,
					value: 'false'
				}
			}
		} );

		// Create bold command.
		editor.commands.add( REQUIRED, new AttributeCommand( editor, REQUIRED ) );

		// Set the Ctrl+B keystroke.
		editor.keystrokes.set( 'CTRL+SHIFT+R', REQUIRED );
	}
}
