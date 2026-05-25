// MIGLI · Catálogo de cenas Gaussian Splat
// ------------------------------------------------------------
// Registro centralizado dos splats disponíveis no app.
// No futuro, este array será substituído por uma chamada à API que
// retorna os splats publicados pela imobiliária logada.
//
// Formatos suportados pelo PlayCanvas v2:
//   .ply          — formato cru, fácil de produzir, grande (~100MB+)
//   .meta.json    — SOG (Spatially Ordered Gaussians), super comprimido
//   .lod-meta.json — SOG com LOD streaming, ideal para mobile
//
// Para converter PLY → SOG, use:
//   npx @playcanvas/splat-transform input.ply output.sog --compress

export const SPLAT_SCENES = [
  {
    id: 'demo-room',
    name: 'Sala de demonstração',
    subtitle: 'Cena arquitetônica estilizada',
    // `null` significa "use a cena geométrica embutida (sem splat real)".
    // Substitua por uma URL `.ply` / `.sog` quando tiver um splat publicado.
    splatUrl: null,
    placeholder: true,
    thumbnail: null,
    initial: {
      // Posição/alvo da câmera ao carregar — ajuste por cena.
      // Os valores são em metros, sistema de coordenadas PlayCanvas.
      position: [3.5, 1.7, 4.8],
      target: [0, 0.7, 0],
    },
  },
  // Exemplo de como uma cena real seria registrada:
  // {
  //   id: 'pinheiros-apto-01',
  //   name: 'Apartamento — Pinheiros, SP',
  //   subtitle: '3 quartos · 120 m² · R$ 1.250.000',
  //   splatUrl: '/splats/pinheiros-apto-01.sog',
  //   placeholder: false,
  //   thumbnail: '/splats/pinheiros-apto-01.jpg',
  //   initial: { position: [4, 1.6, 5], target: [0, 1, 0] },
  // },
]

// Splat público de demonstração — fica fora deste arquivo intencionalmente.
// Quando você quiser testar com um splat real do PlayCanvas, basta:
//   1. Adicionar uma entrada nova em SPLAT_SCENES acima, OU
//   2. Passar a URL diretamente para <SplatViewer scene={{ splatUrl: '...' }} />

export function getDefaultScene() {
  return SPLAT_SCENES[0]
}

export function findScene(id) {
  return SPLAT_SCENES.find((s) => s.id === id) ?? null
}
