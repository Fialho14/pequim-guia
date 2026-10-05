# Pequim · guia de um semestre

30 páginas em português sobre o cenário IST → Tsinghua, primavera de 2027. Pesquisa de 4 de outubro de 2026, fontes públicas e decisões individuais a confirmar. Publicação estática no Vercel ligada ao GitHub.

## Usar no Mac ou no telemóvel

Faz duplo clique em **Abrir no Mac.command**. Para usar no telemóvel, faz duplo clique em **Abrir no telemovel.command**: aparece uma página com QR code e ligação. Mac e telemóvel têm de estar na mesma rede Wi-Fi; mantém o Terminal aberto. Ctrl+C termina o servidor.

Se o servidor anterior estiver ativo, termina-o primeiro com Ctrl+C. Ambos usam a porta 8717 para conservar os dados do navegador no Mac. As preferências no telemóvel são independentes; usa **O meu plano → Exportar/Importar plano** para as transferir. Acesso local mobile é sempre permitido, independentemente do Vercel. Usa uma rede de confiança.

Alternativa pelo Terminal:

```sh
npm ci
npm start       # Mac
npm run mobile  # Mac + telemóvel na rede local
```

O servidor usa `local/` quando a edição pessoal está presente; num clone público usa `src/`. Nunca publica automaticamente ficheiros locais na internet.

## Permitir ou bloquear telemóvel no Vercel

- **Permitir telemovel no Vercel.command** permite acesso e envia apenas a configuração ao GitHub. O Vercel volta a publicar automaticamente.
- **Bloquear telemovel no Vercel.command** repõe a restrição e publica a alteração.

Ou usa `npm run mobile:allow` / `npm run mobile:block`, revê o diff de `access.config.json`, faz commit e push para `main`. A propriedade `desktopOnly` controla o aviso. `minimumDesktopWidth` define a largura mínima da janela na versão pública.

A publicação contém uma regra de encaminhamento por dispositivo antes dos ficheiros estáticos, e uma verificação no navegador para tablets e janelas pequenas. O aviso é independente de JavaScript e permite copiar a ligação. A identificação de dispositivo usa sinais do navegador e não é uma fronteira de segurança; todo o conteúdo do repositório público pode ser consultado diretamente no GitHub.

## Estrutura e privacidade

- `src/`: 30 páginas públicas, página de aviso, imagens com licenças, pesquisa e ferramentas.
- `content/`: conteúdo anonimizado e fontes institucionais para gerar as páginas.
- `scripts/`: geração, validação, build, servidor local e configuração de acesso.
- `local/`: edição pessoal e materiais originais; ignorada pelo Git e pelo deploy.
- `.vercel/output/`: artefacto gerado exclusivamente de `src/`, nunca de `local/`.

Conversas, estado individual da candidatura, documentos pessoais, imagens de licença desconhecida, capturas de ecrã e relatórios privados estão excluídos da versão pública. Planos, notas, favoritos e tarefas são guardados apenas no navegador. Não há contas nem envio desses dados a um servidor.

## Editar e publicar

Para alterar o conteúdo, edita `content/*.json` e executa:

```sh
npm run content  # requer Python 3 local
npm run check
npm run build
```

Depois faz commit dos ficheiros públicos e push para `main`. O Vercel instala as dependências com `npm ci`, executa `npm run build` e usa a Build Output API. Não precisa de Python no build remoto. Para testar a versão publicada localmente: `npm run build` e `npm run preview`; não uses esse modo para acesso pessoal no telemóvel.

A validação confere 30 páginas, ligações, âncoras, pesquisa e padrões de dados privados. Revê sempre o diff antes de publicar novas alterações. Não adicionas ficheiros pessoais a `src/` ou `content/`.

## Fontes e créditos

A página Fontes reúne 168 fontes públicas. Condições de 2027 devem ser reconfirmadas. Fotografias Wikimedia Commons de Daniel Case (CC BY-SA 3.0), Soramimi e BIJAY BHANDARI (CC BY-SA 4.0), com atribuição e ligações na página Fontes. Imagens redimensionadas e recortadas no layout, mantendo as licenças. Os documentos institucionais são consultados nos portais de origem.
