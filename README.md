# ZaptOS

Agenda e ordem de serviço pelo WhatsApp. Cada login enxerga só a operação da própria empresa.

## Como rodar

```bash
npm install
npm run dev
```

O app sobe em `http://127.0.0.1:8080`.

```bash
npm run typecheck
npm run build
```

## Onde mexer

| Pasta | O que tem |
| --- | --- |
| `src/components/zaptos/telas` | Painel, agenda, ordens, conversas, clientes e configurações |
| `src/components/zaptos/formularios` | Formulários de OS, horário e cliente |
| `src/components/zaptos/acesso` | Login, cadastro, confirmação de celular e campos de validação |
| `src/components/zaptos/ordem` | Detalhe da ordem aberta |
| `src/lib/zaptos/store.ts` | Ações da operação (ordens, agenda, conversas) |
| `src/lib/zaptos/instancia.ts` | Dados gravados por e-mail, um negócio por conta |
| `src/lib/zaptos/conta.ts` | Contas, senha, sessão e código do celular |
| `src/lib/zaptos/meta.ts` | Status, conflito de horário e textos |
| `src/lib/zaptos/types.ts` | Tipos do domínio |

A interface chama o store. O store não conhece componentes. A instância não mistura os dados de uma conta com os de outra.

## Contas de demonstração

- `ana@lumeassistencia.com.br` / `lume1234`
- `contato@clinicafachine.com.br` / `fachine123`

Uma conta nova começa vazia. A senha pede 8 caracteres, maiúscula, minúscula, número e símbolo.
