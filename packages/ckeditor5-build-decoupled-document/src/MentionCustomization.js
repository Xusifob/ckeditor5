export default function MentionCustomization( editor ) {

	editor.conversion.for( 'upcast' ).elementToAttribute( {
		view: {
			name: 'span',
			key: 'data-mention',
			classes: 'mention'
		},
		model: {
			key: 'mention',
			value: viewItem => {
				const mentionAttribute = editor.plugins.get( 'Mention' ).toMentionAttribute( viewItem, {
					// Add any other properties that you need.
					'data-mention': viewItem.getAttribute( 'data-mention' ),
					name: viewItem.getAttribute( 'name' )
				} );

				return mentionAttribute;
			}
		},
		converterPriority: 'high'
	} );

	editor.conversion.for( 'downcast' ).attributeToElement( {
		model: 'mention',
		view: ( modelAttributeValue, viewWriter ) => {

			let e = viewWriter.createAttributeElement( 'span', {
				class: 'mention',
				'data-mention': modelAttributeValue.name
			}, {
				// Make mention attribute to be wrapped by other attribute elements.
				priority: 20,
				// Prevent merging mentions together.
				id: modelAttributeValue.uid
			} );

			console.log(e);

			e.textContent = modelAttributeValue.name;
			console.log(e);

			return e;
		},
		converterPriority: 'high'
	} );
}
