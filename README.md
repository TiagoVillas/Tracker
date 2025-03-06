# HabitTracker - Aplicativo de Acompanhamento de Hábitos e Produtividade

Um aplicativo completo para acompanhar hábitos, tarefas, finanças, exercícios e mais, desenvolvido com Next.js, Firebase e Tailwind CSS.

## Funcionalidades

- **Autenticação de Usuários**: Login com Google Auth
- **Gestão de Hábitos Diários**: 
  - Adicionar, editar, remover e marcar hábitos como concluídos
  - Visualizar linha do tempo com os dias do mês
  - Navegar entre diferentes datas para gerenciar hábitos passados
  - Acompanhar sequências de dias consecutivos para cada hábito
  - Visualizar histórico de conclusões de cada hábito
- **Gestão de Tarefas**: Criar e acompanhar tarefas com prioridades e datas de vencimento
- **Registro de Notas Diárias**: Interface para adicionar anotações e pensamentos do dia
- **Acompanhamento de Treinos**: Registrar distâncias, tempos e evoluções dos treinos
- **Controle Financeiro**: Registrar despesas e receitas, e visualizar o saldo mensal
- **Acompanhamento de Estudos**: Registrar e monitorar atividades e progresso dos estudos
- **Definição e Acompanhamento de Objetivos**: Criar objetivos e acompanhar seu progresso

## Tecnologias Utilizadas

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Estilização**: Tailwind CSS, Lucide React (ícones)
- **Formatação de Datas**: date-fns

## Configuração do Projeto

### Pré-requisitos

- Node.js 18 ou superior
- Conta no Firebase

### Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative o Authentication com o provedor Google
3. Ative o Firestore Database
4. Ative o Storage (se necessário)
5. Copie as credenciais do seu projeto Firebase

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/habitracker.git
   cd habitracker
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=seu-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=seu-app-id
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Acesse o aplicativo em [http://localhost:3000](http://localhost:3000)

### Configuração das Regras de Segurança do Firestore

Copie as regras do arquivo `firestore.rules` e cole no console do Firebase para garantir a segurança dos dados.

## Estrutura do Projeto

- `/src/app`: Páginas da aplicação (Next.js App Router)
- `/src/components`: Componentes React reutilizáveis
  - `HabitCalendar.tsx`: Componente de calendário para visualizar os dias do mês
  - `HabitStreak.tsx`: Componente para exibir sequências de dias consecutivos
  - `HabitHistory.tsx`: Componente para exibir histórico de conclusões
- `/src/lib`: Utilitários, hooks e contextos
  - `/src/lib/firebase`: Configuração e utilitários do Firebase
  - `/src/lib/hooks`: Hooks personalizados
  - `/src/lib/contexts`: Contextos React

## Solução de Problemas

### Problemas com o Firebase

Se você estiver enfrentando problemas com o Firebase, verifique:

1. Se as credenciais no arquivo `.env.local` estão corretas
2. Se as regras de segurança do Firestore estão configuradas corretamente
3. Se o Authentication está ativado com o provedor Google
4. Se o Firestore Database está ativado

### Problemas com o Next.js

Se você estiver enfrentando problemas com o Next.js, verifique:

1. Se você está usando a versão correta do Node.js
2. Se todas as dependências foram instaladas corretamente
3. Tente limpar o cache com `npm run dev -- --clear-cache`

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## Licença

Este projeto está licenciado sob a licença MIT.