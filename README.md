# TenK - Sistema de Gerenciamento com Angular e Ionic

![Badge Angular](https://img.shields.io/badge/Angular-17-DD0031)
![Badge Ionic](https://img.shields.io/badge/Ionic-7-3880FF)
![Badge TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6)
![Badge Standalone Components](https://img.shields.io/badge/Standalone%20Components-Yes-4CAF50)

## 📋 Descrição do Projeto

TenK é um sistema de gerenciamento completo desenvolvido com Angular e Ionic, implementando funcionalidades CRUD (Create, Read, Update, Delete), autenticação de usuários, blog integrado e interface totalmente responsiva para desktop e dispositivos móveis.

Este projeto foi construído com a arquitetura moderna do Angular utilizando componentes standalone, o que facilita a manutenção e escalabilidade do código.

## 🚀 Funcionalidades Principais

O sistema oferece as seguintes funcionalidades:

### 🔐 Sistema de Autenticação
- Login com validação de campos e CAPTCHA de segurança
- Registro de novos usuários com validação de força de senha
- Recuperação de senhas
- Autenticação persistente com "lembrar-me"
- Proteção de rotas para usuários não autenticados

### 👥 Gerenciamento de Usuários
- Visualização de todos os usuários cadastrados
- Cadastro de novos usuários pelo administrador
- Edição de dados de usuários existentes
- Exclusão de usuários com confirmação

### 📝 Blog Integrado
- Visualização de posts para usuários não autenticados
- Criação de novos posts (apenas para usuários logados)
- Edição e exclusão de posts
- Interface moderna e responsiva com seções para notícias e projetos
- Carregamento dinâmico de conteúdo adicional

### 🏠 Página Inicial
- Interface diferenciada para usuários autenticados e não autenticados
- Acesso rápido às principais funcionalidades do sistema
- Design limpo e intuitivo

## 🛠️ Tecnologias Utilizadas

- **Angular 17**: Framework front-end com componentes standalone
- **Ionic 7**: Framework para desenvolvimento de aplicativos híbridos
- **TypeScript**: Linguagem de programação tipada
- **SCSS**: Pré-processador CSS para estilos avançados
- **RxJS**: Programação reativa para manipulação de eventos assíncronos
- **Formulários Reativos**: Validação avançada de formulários
- **Font Awesome**: Biblioteca de ícones
- **Observables**: Padrão de comunicação entre componentes

## 📁 Estrutura do Projeto

O projeto segue uma estrutura organizada para facilitar a manutenção:

```
src/
├── app/
│   ├── blog/               # Componente de blog
│   ├── home/               # Página inicial
│   ├── login/              # Componente de login
│   ├── models/             # Interfaces e tipos
│   ├── register/           # Componente de registro
│   ├── services/           # Serviços compartilhados
│   └── user-crud/          # Gerenciamento de usuários
├── assets/                 # Recursos estáticos
└── environments/           # Configurações de ambiente
```

## 📊 Serviços Principais

### DatabaseService
Este serviço simula um banco de dados oferecendo:
- Gerenciamento de usuários (getUsers, createUser, updateUser, deleteUser)
- Gerenciamento de posts (getPosts, createPost, updatePost, deletePost)
- Autenticação (login, logout, isAuthenticated)

### AuthService
Responsável pela autenticação e segurança:
- Validação de credenciais
- Gerenciamento de tokens
- Verificação de permissões

### CaptchaService
Implementa sistema anti-bot:
- Geração de códigos CAPTCHA
- Validação de códigos inseridos pelo usuário

## 📱 Componentes Principais

### LoginComponent
Interface de login com:
- Formulário de autenticação validado
- Sistema CAPTCHA para segurança
- Opção "Lembrar-me"
- Função de recuperação de senha

### RegisterComponent
Registro de novos usuários com:
- Validação de força de senha
- Verificação de email
- Confirmação de senha
- Aceitação de termos e condições

### UserCrudComponent
Gerenciamento completo de usuários com:
- Listagem paginada
- Formulário para criação/edição
- Confirmação de exclusão

### BlogComponent
Blog completo com:
- Criação de posts para usuários autenticados
- Listagem de posts para todos os usuários
- Edição e exclusão de posts
- Seções de projetos e informações adicionais

## 🔧 Instalação e Execução

### Pré-requisitos
- Node.js (v14 ou superior)
- Angular CLI (v17 ou superior)
- Ionic CLI (v7 ou superior)

### Clonando o repositório
```bash
git clone https://github.com/seu-usuario/tenk.git
cd tenk
```

### Instalando dependências
```bash
npm install
```

### Executando em ambiente de desenvolvimento
```bash
ionic serve
```
ou
```bash
ng serve
```

### Usuários para teste
- Email: teste@email.com / Senha: 123456
- Email: admin@admin.com / Senha: admin123

## 🗄️ Banco de Dados

O sistema utiliza uma simulação de banco de dados com o arquivo `create_database.sql`, que define as tabelas:

- `users`: Armazena informações dos usuários
- `blog_posts`: Armazena posts do blog com relacionamento ao autor

Em ambiente de produção, é possível configurar um banco de dados MySQL ou PostgreSQL.

## 📊 Diferenciais do Projeto

- **Componentes Standalone**: Utiliza a nova abordagem do Angular para componentes mais independentes
- **Design Responsivo**: Adaptável a qualquer tamanho de tela
- **Validação Avançada**: Formulários com validação em tempo real
- **Segurança**: Implementação de CAPTCHA e validação de força de senha
- **UX Aprimorada**: Feedback visual para todas as ações do usuário
- **Estilização Modular**: Uso de SCSS com variáveis e componentes reutilizáveis

## 🌐 Personalização e Configuração

O projeto pode ser facilmente personalizado através das variáveis de ambiente em:
- `src/environments/environment.ts` (desenvolvimento)
- `src/environments/environment.prod.ts` (produção)

Para configurar a conexão com um banco de dados real, edite as configurações em `src/app/services/database.config.ts`.

## 📝 Considerações Finais

Este projeto foi desenvolvido como uma demonstração de habilidades em Angular, Ionic e TypeScript, seguindo as melhores práticas de desenvolvimento e padrões de projeto. A estrutura foi pensada para ser escalável e de fácil manutenção.

---

© 2025 TenK - Desenvolvido por Maria Lina
