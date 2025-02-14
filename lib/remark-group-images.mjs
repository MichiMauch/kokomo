import { visit } from 'unist-util-visit';

export default function remarkGroupImages() {
  return (tree) => {
    console.log('📌 AST vor der Umwandlung:', JSON.stringify(tree, null, 2));

    const newChildren = [];
    let group = [];

    const processNode = (node) => {
      // Prüfe, ob es sich um ein Bild handelt
      if (
        (node.type === 'paragraph' &&
          node.children?.length === 1 &&
          node.children[0].type === 'image') ||
        node.type === 'image'
      ) {
        const imageNode = node.type === 'image' ? node : node.children[0];
        group.push(imageNode);
        return true;
      }
      return false;
    };

    for (const node of tree.children) {
      if (!processNode(node)) {
        if (group.length > 1) {
          // Erstelle einen Galerie-Knoten
          const galleryNode = {
            type: 'mdxJsxFlowElement',
            name: 'Galerie',
            attributes: [
              {
                type: 'mdxJsxAttribute',
                name: 'images',
                value: {
                  type: 'mdxJsxAttributeValueExpression',
                  value: `[${group
                    .map(
                      (img) =>
                        `{ src: "${img.url}", alt: "${img.alt || ''}" }`
                    )
                    .join(', ')}]`,
                  data: {
                    estree: {
                      type: 'Program',
                      body: [
                        {
                          type: 'ExpressionStatement',
                          expression: {
                            type: 'ArrayExpression',
                            elements: group.map((img) => ({
                              type: 'ObjectExpression',
                              properties: [
                                {
                                  type: 'Property',
                                  key: { type: 'Identifier', name: 'src' },
                                  value: {
                                    type: 'Literal',
                                    value: img.url,
                                  },
                                  kind: 'init',
                                  computed: false,
                                  method: false,
                                  shorthand: false,
                                },
                                {
                                  type: 'Property',
                                  key: { type: 'Identifier', name: 'alt' },
                                  value: {
                                    type: 'Literal',
                                    value: img.alt || '',
                                  },
                                  kind: 'init',
                                  computed: false,
                                  method: false,
                                  shorthand: false,
                                },
                              ],
                            })),
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
            children: [],
          };
          newChildren.push(galleryNode);
          console.log('🖼️ Gallery-Knoten erstellt:', JSON.stringify(galleryNode, null, 2));
        } else if (group.length === 1) {
          newChildren.push({
            type: 'paragraph',
            children: [group[0]],
          });
        }
        group = [];
        newChildren.push(node);
      }
    }

    // Verarbeite die letzte Gruppe
    if (group.length > 1) {
      const galleryNode = {
        type: 'mdxJsxFlowElement',
        name: 'Galerie',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'images',
            value: {
              type: 'mdxJsxAttributeValueExpression',
              value: `[${group
                .map(
                  (img) =>
                    `{ src: "${img.url}", alt: "${img.alt || ''}" }`
                )
                .join(', ')}]`,
              data: {
                estree: {
                  type: 'Program',
                  body: [
                    {
                      type: 'ExpressionStatement',
                      expression: {
                        type: 'ArrayExpression',
                        elements: group.map((img) => ({
                          type: 'ObjectExpression',
                          properties: [
                            {
                              type: 'Property',
                              key: { type: 'Identifier', name: 'src' },
                              value: {
                                type: 'Literal',
                                value: img.url,
                              },
                              kind: 'init',
                              computed: false,
                              method: false,
                              shorthand: false,
                            },
                            {
                              type: 'Property',
                              key: { type: 'Identifier', name: 'alt' },
                              value: {
                                type: 'Literal',
                                value: img.alt || '',
                              },
                              kind: 'init',
                              computed: false,
                              method: false,
                              shorthand: false,
                            },
                          ],
                        })),
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
        children: [],
      };
      newChildren.push(galleryNode);
    } else if (group.length === 1) {
      newChildren.push({
        type: 'paragraph',
        children: [group[0]],
      });
    }

    tree.children = newChildren;
    console.log('📌 AST nach der Umwandlung:', JSON.stringify(tree, null, 2));
  };
}

