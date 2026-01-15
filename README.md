# Student Management System Backend

## Descrição
Backend para o sistema de gerenciamento de estudantes, desenvolvido com FastAPI.

## Estrutura do Projeto
O projeto segue a arquitetura SOLID e está organizado da seguinte forma:

- **core/**: Configurações centrais (banco de dados, segurança, configurações).
- **models/**: Modelos de banco de dados (SQLAlchemy).
- **schemas/**: Schemas Pydantic para validação de dados.
- **crud/**: Operações de banco de dados (Create, Read, Update, Delete).
- **routers/**: Rotas da API (Endpoints).

---

## 🚀 Quick Start

### 1. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

### 2. Escolha o ambiente

| Ambiente | Comando |
|----------|---------|
| **Desenvolvimento** | `docker compose -f docker-compose.dev.yml up -d` |
| **Produção** | `docker compose -f docker-compose.prod.yml up -d` |

---

## 🛠️ Ambiente de Desenvolvimento (Hot Reload)

O ambiente de desenvolvimento possui **hot reload** habilitado, ou seja, qualquer alteração no código é refletida automaticamente sem precisar reconstruir os containers.

### Arquivos utilizados:
- `docker-compose.dev.yml`
- `Dockerfile.backend.dev`
- `Dockerfile.frontend.dev`

### Comandos:

```bash
# Subir os containers (primeira vez ou após alterar dependências)
docker compose -f docker-compose.dev.yml up -d --build

# Subir os containers (uso normal)
docker compose -f docker-compose.dev.yml up -d

# Ver logs em tempo real
docker compose -f docker-compose.dev.yml logs -f

# Ver logs do backend
docker logs teacher_app_backend_dev -f

# Ver logs do frontend
docker logs teacher_app_frontend_dev -f

# Parar os containers
docker compose -f docker-compose.dev.yml down
```

### Características:
- ✅ **Backend**: Uvicorn com `--reload` (reinicia automaticamente ao alterar arquivos Python)
- ✅ **Frontend**: Vite dev server com HMR (Hot Module Replacement)
- ✅ **Volumes montados**: Código fonte é montado diretamente nos containers
- ⚠️ **Não otimizado para produção**

---

## 🏭 Ambiente de Produção

O ambiente de produção é otimizado para performance e estabilidade.

### Arquivos utilizados:
- `docker-compose.prod.yml`
- `Dockerfile.backend`
- `Dockerfile.frontend`

### Comandos:

```bash
# Subir os containers (com build)
docker compose -f docker-compose.prod.yml up -d --build

# Subir os containers
docker compose -f docker-compose.prod.yml up -d

# Ver logs
docker compose -f docker-compose.prod.yml logs -f

# Parar os containers
docker compose -f docker-compose.prod.yml down

# Reconstruir após alterações no código
docker compose -f docker-compose.prod.yml up -d --build
```

### Características:
- ✅ **Backend**: Uvicorn sem reload (mais performático)
- ✅ **Frontend**: Build estático servido via Nginx
- ✅ **Restart automático**: Containers reiniciam automaticamente se falharem
- ✅ **Otimizado para produção**

---

## 📋 Resumo de Comandos

| Ação | Desenvolvimento | Produção |
|------|-----------------|----------|
| **Subir** | `docker compose -f docker-compose.dev.yml up -d` | `docker compose -f docker-compose.prod.yml up -d` |
| **Parar** | `docker compose -f docker-compose.dev.yml down` | `docker compose -f docker-compose.prod.yml down` |
| **Rebuild** | `docker compose -f docker-compose.dev.yml up -d --build` | `docker compose -f docker-compose.prod.yml up -d --build` |
| **Logs** | `docker compose -f docker-compose.dev.yml logs -f` | `docker compose -f docker-compose.prod.yml logs -f` |

---

## ⚙️ Configuração

### Pré-requisitos
- Python 3.13+
- Docker & Docker Compose
- Node.js 20+ (se rodar localmente)

### Variáveis de Ambiente (.env)

```ini
# Portas
PORT_BACKEND=8001
PORT_FRONTEND=8002

# Segurança
SECRET_KEY=sua-chave-secreta-aqui
```

---

## 💻 Desenvolvimento Local (Sem Docker)

Se preferir rodar sem Docker:

### Backend
```bash
# Crie e ative o ambiente virtual
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate  # Windows

# Instale as dependências
pip install -r requirements.txt

# Rode o servidor
uvicorn backend.server:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testes

```bash
pytest
```

---

## 📖 Documentação da API

Após iniciar o backend, acesse:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc 
