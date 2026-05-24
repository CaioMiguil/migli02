# Cenas Gaussian Splat (`/public/splats/`)

Coloque aqui os arquivos de splat (`.ply`, `.sog`, `.meta.json`, `.lod-meta.json`).
São servidos como assets estáticos em `/splats/<arquivo>`.

## Formatos suportados

| Formato | Tamanho típico | Uso recomendado |
|--------|---------------|-----------------|
| `.ply` | ~100 MB+ | Desenvolvimento / debug |
| `.sog` (`.meta.json` + `.webp`s) | ~10–50 MB | **Produção** (recomendado) |
| `.lod-meta.json` | streaming | **Mobile** (streaming LOD) |

O formato **SOG** (Spatially Ordered Gaussians) é exclusivo do PlayCanvas e reduz o tamanho do splat em até **95%** sem perda visual significativa.

## Como obter um Gaussian Splat

Três caminhos:

1. **Capturar você mesmo** — use [Polycam](https://poly.cam), [Postshot](https://www.jawset.com/), ou [Luma AI](https://lumalabs.ai) com um vídeo do imóvel.
2. **Treinar localmente** — use [gaussian-splatting (Inria)](https://github.com/graphdeco-inria/gaussian-splatting) ou [nerfstudio](https://docs.nerf.studio/).
3. **Testar com um splat público** — baixe um exemplo de [PlayCanvas SuperSplat Gallery](https://superspl.at/).

## Comprimir um `.ply` para `.sog`

```bash
npx @playcanvas/splat-transform input.ply output.sog --compress
```

Para gerar uma versão com LOD streaming (ideal para celular):

```bash
npx @playcanvas/splat-transform input.ply output --lod
```

## Como usar no MIGLI

Depois de colocar o arquivo aqui, registre a cena em `src/lib/splatCatalog.js`:

```js
export const SPLAT_SCENES = [
  {
    id: 'pinheiros-apto-01',
    name: 'Apartamento — Pinheiros, SP',
    subtitle: '3 quartos · 120 m² · R$ 1.250.000',
    splatUrl: '/splats/pinheiros-apto-01.sog',
    placeholder: false,
    initial: {
      position: [4, 1.6, 5],
      target: [0, 1, 0],
    },
  },
]
```

E pronto. O viewer carrega automaticamente com barra de progresso, fallback elegante para a cena demo se houver erro, e câmera no ponto inicial que você definiu.

## Referências técnicas

- [PlayCanvas Gaussian Splatting docs](https://developer.playcanvas.com/user-manual/gaussian-splatting/)
- [GSplatComponent API](https://api.playcanvas.com/engine/classes/GSplatComponent.html)
- [SuperSplat editor](https://github.com/playcanvas/supersplat)
- [splat-transform CLI](https://github.com/playcanvas/splat-transform)
