import NextImage, { type ImageProps } from 'next/image'

const basePath = process.env.BASE_PATH

const Image = ({ src, quality = 100, ...rest }: ImageProps) => (
  <NextImage src={`${basePath || ''}${src}`} quality={quality} {...rest} />
)

export default Image
