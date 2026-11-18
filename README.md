# Órbita — Explorador do Sistema Solar

Aplicação web em React e TypeScript para explorar corpos celestes da API Le Système Solaire e manter um caderno pessoal de observações persistido no Firestore.

## Firebase dedicado

O projeto Firebase `orbita-integrador` foi criado no plano Spark, sem vincular faturamento, ativar Google Analytics ou Gemini. O projeto Firebase anterior fornecido pelo usuário não foi alterado. O app Web `orbita-web` conecta a interface ao Firestore; Firebase Hosting não foi habilitado porque a publicação solicitada é na Vercel.

O app usa login anônimo do Firebase Authentication e grava em `users/{uid}/observations`. O provedor anônimo está ativado e as regras de segurança correspondentes ficam em [`firestore.rules`](./firestore.rules). Elas permitem a cada sessão anônima acessar somente seu próprio caderno e validam campos, limites de tamanho e timestamps.

A configuração Web pública do Firebase dedicado está definida como fallback em `src/firebaseConfig.ts`. Se necessário, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` e `VITE_FIREBASE_APP_ID` podem sobrescrever esses valores. A chave Web é pública por definição; as regras do Firestore e a autenticação, não a ocultação da chave, protegem os dados.

O banco Cloud Firestore usa a região regional `us-central1` (Iowa). A localização é imutável após a criação.

## API pública

A interface consulta `/api/bodies`. O endpoint server-side usa o token Bearer UUID gratuito exigido pela API Le Système Solaire; essa credencial nunca é enviada ao navegador nem incorporada ao bundle. Em produção, configure `SOLAR_API_TOKEN` como variável de ambiente da função. Para desenvolvimento local, use `.env.local`.

## Desenvolvimento

```bash
cp .env.example .env.local
# Preencha SOLAR_API_TOKEN. VITE_FIREBASE_* são opcionais, pois há configuração pública padrão.
pnpm install
pnpm dev
```

O Vite encaminha `/api/bodies` ao proxy local em desenvolvimento. No deploy Vercel, `api/bodies.ts` é a função serverless correspondente.

## Publicação na Vercel

O projeto pode ser enviado como pasta ou ZIP pelo fluxo [Vercel Drop](https://vercel.com/new) sem Git ou CLI. A Vercel detecta e compila projetos de framework como Vite quando você está autenticado. Depois do primeiro deploy, cadastre `SOLAR_API_TOKEN` nas variáveis de ambiente **Production** do projeto e gere uma nova implantação pelo painel para carregar o segredo na função. Não inclua `.env.local` no ZIP.

O arquivo `vercel.json` configura o build, a SPA e a função `/api/bodies`. O Drop cria um projeto sem conexão Git; uma nova implantação desse mesmo projeto pode ser feita enviando a pasta/ZIP ao projeto no painel.

## Referências técnicas

A [documentação oficial da API Le Système Solaire](https://api.le-systeme-solaire.net/en/) informa que as chamadas a `/rest/bodies/` exigem um Bearer UUID gratuito. A chave é solicitada em [Get API key](https://api.le-systeme-solaire.net/generatekey.html).

A [documentação Vercel Drop](https://vercel.com/docs/drop) confirma o envio de pasta ou ZIP, detecção de frameworks e publicação sem Git ou CLI. A [documentação de implantações Vercel](https://vercel.com/docs/deployments) descreve o Drop como uma das opções oficiais de deploy.
