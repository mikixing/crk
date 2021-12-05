export default function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((r, j) => {
    const img = new Image()

    img.onload = () => r(img)
    img.onerror = () => j(new Error(`load ${url} with error!`))

    img.src = url
  })
}
