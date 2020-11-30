/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module basic-styles/bold
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import RequiredEditing from './required/requiredediting';
import RequiredUI from './required/requiredui';

/**
 * The Required feature.
 *
 * @extends module:core/plugin~Plugin
 */
export default class Required extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ RequiredEditing, RequiredUI ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'Required';
	}
}
