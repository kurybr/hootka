# Shadow login (investigação local)

Ferramenta para admins personificarem outra conta em **desenvolvimento**.

## Pré-requisitos

- `NODE_ENV=development` **ou** em `.env.local`:
  - `ALLOW_SHADOW_LOGIN=true`
  - `NEXT_PUBLIC_ALLOW_SHADOW_LOGIN=true`
- Firebase Admin configurado (`GOOGLE_APPLICATION_CREDENTIALS` ou variáveis `FIREBASE_*`)
- Conta com `role: admin` em `users/{uid}/profile`

## Uso

1. Faça login como admin (Google).
2. Acesse: `/shadow?email=beatriz.abreu@pier.digital`
3. Você será redirecionado para `/host` como a conta alvo.
4. O banner amarelo indica o modo investigação; use **Sair do shadow** para encerrar.

## Checklist manual

- [ ] Sem flag em produção → `/shadow` mostra indisponível; API retorna 404
- [ ] Dev + admin + e-mail existente → entra em `/host` com biblioteca do usuário
- [ ] Dev + usuário não-admin → API 403
- [ ] E-mail inexistente → mensagem clara
- [ ] Banner visível durante shadow; sair faz logout

## Limitações

- Não recupera salas ao vivo antigas (`quiz_hostId` fica no `localStorage` do navegador original).
- Ao sair do shadow, é necessário refazer login como admin.
