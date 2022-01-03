function _loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((r, j) => {
    const img = new Image()

    img.onload = () => r(img)
    img.onerror = () => j(new Error(`load ${url} with error!`))

    img.src = url
  })
}

export default function loadImage(list: string[]) {
  return Promise.all(list.map(_loadImage))
}
