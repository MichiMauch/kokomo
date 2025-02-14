import { visit } from 'unist-util-visit';

export default function remarkImagePath() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      if (node.url) {
        node.url = node.url
          .replace(/%7B/g, '{')
          .replace(/%7D/g, '}')
          .replace('{IMAGE_PATH}', process.env.NEXT_PUBLIC_CLOUDFLARE_R2_URL || '');
      }
    });
  };
}
