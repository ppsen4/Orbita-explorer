# TODO — Órbita: Explorador do Sistema Solar

## Exploração da API pública
- [x] O sistema deverá consumir dados de uma API pública e gratuita, relacionada ao tema escolhido, e exibir essas informações na interface da aplicação.
- [x] A interface deve tratar visualmente carregamento, ausência de dados e erros da API pública.

## CRUD de registros pessoais no Firebase/Firestore
- [x] C — Cadastrar: formulário para inserir novos registros pessoais relacionados a corpos celestes obtidos pela API.
- [x] R — Consultar: listagem dos dados salvos no Firestore, incluindo os detalhes e o corpo celeste associado.
- [x] U — Atualizar: opção para editar registros existentes por formulário preenchido com os dados atuais.
- [x] D — Excluir: opção para remover registros do banco, com confirmação para evitar remoções acidentais.
- [x] Todos os registros do CRUD persistem no Firebase/Firestore, isolados por sessão anônima autenticada.
- [x] A interface deve tratar visualmente carregamento, ausência de dados e erros do Firestore.

## Interface responsiva e publicação
- [x] A interface web deve ser responsiva para uso em computadores e dispositivos móveis.
- [ ] A aplicação final deverá estar publicada e acessível pela internet, com endereço terminado em `.vercel.app`.

## Publicação solicitada pelo usuário
- [ ] Enviar o código do projeto ao perfil GitHub `https://github.com/ppsen4` e publicar a aplicação no workspace Vercel `https://vercel.com/sla-d3e4`.

> O CRUD está implementado e conectado ao projeto Firebase dedicado; não foram feitos cadastros de teste para evitar gravações artificiais no banco. As publicações externas permanecem pendentes até existir evidência confirmada de repositório/URL de produção.
