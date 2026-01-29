# Vasto-Lord

Módulo de performance e eficiência para POCO X6 Pro (KernelSU normal e KernelSU Next).  
Criador: **@astrasy**  
Descrição do módulo: **POCO X6 PRO 2026 Performance Module**.

## Compatibilidade
- ✅ KernelSU
- ✅ KernelSU Next

## Perfis principais
1. **Performance**: prioriza FPS, estabilidade em jogos e resposta rápida.
2. **Eficiência**: uso diário com melhor autonomia de bateria e temperatura.

## Web UI (Webroot)
Interface completa para alternar os modos, aplicar ajustes avançados e acompanhar uso de CPU/RAM.  
Inclui perfil do dispositivo e controle de:
- Motor de renderização (SkiaGL/SkiaVK)
- Tipo de composição (GPU/CPU/MDP/C2D/DYN)
- Taxa de atualização
- Fator de memória
- Serviço térmico
- Driver para jogos

## Especificações do dispositivo (POCO X6 Pro)
> Baseadas nas configurações comerciais mais comuns do modelo.

- **SoC**: MediaTek Dimensity 8300-Ultra (4 nm)
- **CPU**: 1× Cortex-A715 3.35 GHz + 3× Cortex-A715 3.2 GHz + 4× Cortex-A510 2.2 GHz
- **GPU**: Mali-G615 MC6
- **Memória**: LPDDR5X 8/12 GB
- **Armazenamento**: UFS 4.0 (256/512 GB)
- **Tela**: 6,67" AMOLED 1.5K (2712×1220) 120 Hz
- **Bateria**: 5000 mAh com carregamento rápido 67 W

## Observações
- Ajustes foram preparados para manter desempenho alto com estabilidade térmica.
- Perfis e toggles podem ser usados em qualquer ROM baseada em Android 12+.

## Gerar o ZIP do módulo
Este repositório não inclui arquivos binários (logo/banner) para facilitar o envio ao GitHub.  
Use o script abaixo para gerar o ZIP com todos os assets e o módulo pronto:

```bash
scripts/build_module.sh
```

O arquivo será criado em `dist/` com o nome `Vasto-Lord-<versão>.zip`.
