# Fase 4 — Pipeline real Vídeo → Gaussian Splat

> **Atenção franca:** esta fase é o coração técnico da MIGLI e exige
> infraestrutura GPU. Não é um problema de frontend — é computer vision
> + custos de servidor. O que existe hoje no repo (`simulatorAdapter`)
> simula visualmente o que este pipeline faz; este documento descreve
> como substituir a simulação por reconstrução real.

## O problema

Transformar um vídeo do celular num splat 3D requer:

1. **Frame extraction** — extrair ~150–300 frames bem espaçados do vídeo
2. **Structure-from-Motion (SfM)** — estimar a pose 3D de cada frame
3. **Gaussian Splatting** — otimizar nuvem de gaussianas usando SfM como ponto de partida
4. **Compressão** — converter para `.sog` (95% menor que `.ply`)

Cada passo tem dependências GPU pesadas. **Não rode no Cloudflare Worker**;
não rode no celular do usuário; rode em um servidor GPU dedicado.

## Estimativas

| Item | Valor |
|------|-------|
| Tempo de processamento | 5–20 min por imóvel (em GPU L4/A10) |
| Tamanho do splat (.ply) | 200–800 MB |
| Tamanho do splat (.sog) | 20–60 MB |
| Custo GPU spot (estimativa) | US$ 0,30–1,00 por imóvel |

## Três caminhos para implementar

### Opção A — API gerenciada (recomendado para MVP)

Use uma API de terceiros que já roda o pipeline. Mais rápido para
validar mercado; cobre os primeiros 100–500 imóveis sem dor.

**Candidatos:**
- [Postshot](https://www.jawset.com/) (desktop app — não é API real, mas tem CLI)
- [Luma AI Genie API](https://lumalabs.ai/genie) (em beta, foco em assets gerados)
- [Polycam API](https://poly.cam/developer)
- [KIRI Engine API](https://www.kiriengine.app/api)

**Mudança necessária no Worker:** ao receber `/uploads/:id/process`,
chame a API externa com o vídeo da R2 e faça polling até retornar o
`.ply`/`.sog`. Upload o resultado para `migli-splats` e atualize
`uploads.stage='done'` + `uploads.splat_url='https://cdn.migli.app/...'`.

### Opção B — Pipeline open source self-hosted

Quando volume justificar, monte o pipeline você mesmo:

```bash
# Em uma máquina com GPU NVIDIA (L4/A10/4090):
# 1. COLMAP para SfM
sudo apt install colmap

# 2. gaussian-splatting (Inria, referência canônica)
git clone https://github.com/graphdeco-inria/gaussian-splatting --recursive
cd gaussian-splatting
pip install -e .

# 3. splat-transform para comprimir
npx -y @playcanvas/splat-transform input.ply output.sog --compress
```

**Pipeline em pseudocódigo:**

```python
def process_video(video_path: str, output_dir: str):
    # 1. Extract frames (FFmpeg) — 4-8 fps depending on video length
    frames_dir = f"{output_dir}/frames"
    os.makedirs(frames_dir, exist_ok=True)
    subprocess.run([
        "ffmpeg", "-i", video_path,
        "-vf", "fps=6,scale=1600:-1",
        f"{frames_dir}/%04d.jpg"
    ])

    # 2. SfM with COLMAP
    sparse_dir = f"{output_dir}/sparse"
    subprocess.run([
        "colmap", "automatic_reconstructor",
        "--workspace_path", output_dir,
        "--image_path", frames_dir,
        "--quality", "medium"
    ])

    # 3. Train Gaussian Splatting (~5-15 min on L4)
    subprocess.run([
        "python", "train.py",
        "-s", output_dir,
        "-m", f"{output_dir}/model",
        "--iterations", "7000"
    ])

    # 4. Convert to SOG
    ply = f"{output_dir}/model/point_cloud/iteration_7000/point_cloud.ply"
    sog = f"{output_dir}/scene.sog"
    subprocess.run(["npx", "@playcanvas/splat-transform", ply, sog, "--compress"])

    # 5. Upload .sog to R2 → return public URL
    return upload_to_r2(sog, f"splats/{scene_id}/scene.sog")
```

### Opção C — Híbrido (caminho da MIGLI)

1. **Mês 1–3**: usar Opção A (KIRI Engine API ou similar) — sem GPU própria
2. **Mês 4+**: quando volume passar de ~500 imóveis/mês, migrar para
   Opção B em RunPod/Lambda Labs com GPUs spot

## Arquitetura recomendada

```
Cloudflare Worker  →  Cloudflare Queue  →  GPU Worker (RunPod/Modal)
   (presign)            (job queue)         (COLMAP + GSplat + SOG)
       ↓                                            ↓
    R2 uploads/                              R2 splats/
                                                    ↓
                                          Supabase: properties.splat_url
                                          Supabase: properties.status='published'
```

**Modal Labs** ([modal.com](https://modal.com)) é especialmente bom para
isso — paga por segundo de GPU, escala para zero, deploy via Python decorator.

Exemplo de função Modal:

```python
import modal

app = modal.App("migli-pipeline")
image = modal.Image.debian_slim().apt_install("colmap", "ffmpeg").pip_install(
    "gaussian-splatting", "playcanvas-splat-transform"
)

@app.function(gpu="L4", image=image, timeout=2400)
def reconstruct(video_url: str, upload_id: str):
    # baixar vídeo da R2
    # rodar pipeline (frame extract → COLMAP → train GSplat → SOG)
    # upload .sog para R2 splats/
    # atualizar Supabase: stage='done', splat_url=...
    pass
```

## Status no MIGLI hoje

| Item | Status |
|------|--------|
| Upload do vídeo para R2 | ✓ Implementado (Fase 2) |
| Worker recebe `/process` | ✓ Endpoint existe |
| Job real de reconstrução | ❌ A fazer (esta fase) |
| Polling de status no client | ✓ Implementado (Fase 2) |
| Splat final aparece em `/p/:slug` | ✓ Funciona quando `splat_url` é populado |

**Próximo passo concreto:** escolher Opção A vs B vs C e implementar o
worker que consome a fila. Tudo do client até a R2 já está pronto.
