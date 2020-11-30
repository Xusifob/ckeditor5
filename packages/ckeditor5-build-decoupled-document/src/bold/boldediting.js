/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module basic-styles/bold/boldediting
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AttributeCommand from '../attributecommand';

const BOLD = 'bold';
// Widget Bold
const W_BOLD = 'w-bold';

/**
 * The bold editing feature.
 *
 * It registers the `'bold'` command and introduces the `bold` attribute in the model which renders to the view
 * as a `<strong>` element.
 *
 * @extends module:core/plugin~Plugin
 */
export default class BoldEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'BoldEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		// Allow bold attribute on text nodes.
		editor.model.schema.extend( '$text', { allowAttributes: BOLD } );
		editor.model.schema.extend( 'placeholder', { allowAttributes: W_BOLD } );
		editor.model.schema.extend( 'structuredData', { allowAttributes: W_BOLD } );

		editor.model.schema.setAttributeProperties( BOLD, {
			isFormatting: true,
			copyOnEnter: true
		} );

		editor.model.schema.setAttributeProperties( W_BOLD, {
			isFormatting: true,
			copyOnEnter: true
		} );

		// Build converter from model to view for data and editing pipelines.
		editor.conversion.attributeToElement( {
			model: BOLD,
			view: 'strong',
			upcastAlso: [
				'b',
				viewElement => {
					const fontWeight = viewElement.getStyle( 'font-weight' );

					if ( !fontWeight ) {
						return null;
					}

					// Value of the `font-weight` attribute can be defined as a string or a number.
					if ( fontWeight == 'bold' || Number( fontWeight ) >= 600 ) {
						return {
							name: true,
							styles: [ 'font-weight' ]
						};
					}
				}
			]
		} );

		editor.conversion.attributeToAttribute( {
			model: {
				key: W_BOLD,
				values: [ 'true', 'false' ]

			},
			view: {
				'true': {
					key: BOLD,
					value: 'true'
				},
				'false': {
					key: BOLD,
					value: 'false'
				}
			}
		} );

		// Create bold command.
		editor.commands.add( BOLD, new AttributeCommand( editor, BOLD ) );
		editor.commands.add( W_BOLD, new AttributeCommand( editor, W_BOLD ) );

		// Set the Ctrl+B keystroke.
		editor.keystrokes.set( 'CTRL+B', BOLD );
		editor.keystrokes.set( 'CTRL+B', W_BOLD );
	}
}
