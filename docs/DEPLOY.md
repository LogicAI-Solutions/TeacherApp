# 🚀 Guia de Deploy para Produção

Este documento descreve como fazer o deploy do TeacherApp em produção.

---

## 📋 Pré-requisitos

### No Servidor
- Ubuntu 20.04+ ou Debian 11+
- Docker e Docker Compose instalados
- Mínimo 2GB RAM, 20GB disco
- Portas 80, 443 e 22 abertas

### No GitHub
- Repositório configurado
- Secrets configurados (ver seção abaixo)

---

## ⚙️ Configuração dos Secrets no GitHub

Vá em **Settings > Secrets and variables > Actions** e configure:

| Secret | Descrição |
|--------|-----------|
| `HOSTINGER_VM_ID` | IP ou hostname do servidor |
| `HOSTINGER_API_KEY` | Chave SSH privada para acesso |

### Como gerar a chave SSH:
```bash
# No seu computador local
ssh-keygen -t ed25519 -C "github-actions-deploy"

# Copie a chave pública para o servidor
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@seu-servidor

# A chave PRIVADA (~/.ssh/id_ed25519) vai no secret HOSTINGER_API_KEY
```

---

## 🖥️ Configuração do Servidor (Primeira vez)

### 1. Execute o script de setup
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/TeacherApp.git
cd TeacherApp

# Torne o script executável e execute
chmod +x scripts/setup-server.sh
sudo ./scripts/setup-server.sh
```

### 2. Configure as variáveis de ambiente
```bash
# Copie o exemplo
cp .env.prod.example .env

# Edite com suas credenciais
nano .env
```

**⚠️ IMPORTANTE:** Altere TODAS as senhas e chaves:
- `POSTGRES_PASSWORD` - senha forte para o banco
- `SECRET_KEY` - gere com: `python -c "import secrets; print(secrets.token_urlsafe(64))"`
- `PGADMIN_PASSWORD` - senha para o PgAdmin

### 3. Primeiro deploy manual
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. Execute as migrações
```bash
docker compose -f docker-compose.prod.yml exec backend python3 database/migrate.py
```

---

## 🔄 Deploy Automático (CI/CD)

Após a configuração inicial, todo push para a branch `main` fará deploy automático:

1. **Testes** - Verifica se o código compila
2. **Deploy** - Conecta via SSH e atualiza o servidor

### Workflow do GitHub Actions:
- Arquivo: `.github/workflows/deploy.yml`
- Trigger: Push na branch `main`
- Também pode ser executado manualmente

---

## 📦 Comandos Úteis no Servidor

```bash
# Ver status dos containers
docker compose -f docker-compose.prod.yml ps

# Ver logs (todos)
docker compose -f docker-compose.prod.yml logs -f

# Ver logs de um serviço específico
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend

# Reiniciar serviços
docker compose -f docker-compose.prod.yml restart

# Parar tudo
docker compose -f docker-compose.prod.yml down

# Reconstruir e reiniciar
docker compose -f docker-compose.prod.yml up -d --build

# Executar comando no container
docker compose -f docker-compose.prod.yml exec backend python3 database/migrate.py

# Acessar shell do container
docker compose -f docker-compose.prod.yml exec backend bash

# Limpar recursos não utilizados
docker system prune -a
```

---

## 🔒 Configuração de SSL/HTTPS (Opcional)

Para habilitar HTTPS, você pode usar Certbot:

```bash
# Instalar certbot
sudo apt install certbot

# Gerar certificado (pare o nginx primeiro)
docker compose -f docker-compose.prod.yml stop frontend
sudo certbot certonly --standalone -d seu-dominio.com -d www.seu-dominio.com

# Reiniciar
docker compose -f docker-compose.prod.yml start frontend
```

Para HTTPS automático, considere usar um proxy reverso como Traefik ou Nginx Proxy Manager.

---

## 🐛 Troubleshooting

### Container não inicia
```bash
# Verificar logs
docker compose -f docker-compose.prod.yml logs backend

# Verificar se .env existe
cat .env
```

### Erro de conexão com banco
```bash
# Verificar se o banco está rodando
docker compose -f docker-compose.prod.yml ps db

# Verificar logs do banco
docker compose -f docker-compose.prod.yml logs db
```

### Porta já em uso
```bash
# Verificar o que está usando a porta 80
sudo lsof -i :80
sudo netstat -tlnp | grep :80

# Parar serviço conflitante (ex: apache)
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Resetar tudo (cuidado: perde dados!)
```bash
docker compose -f docker-compose.prod.yml down -v
docker system prune -a --volumes
```

---

## 📊 Monitoramento

### Verificar saúde dos serviços
```bash
# Health check da API
curl http://localhost/api/health

# Health check do Nginx
curl http://localhost/health
```

### PgAdmin (gerenciador de banco)
- URL: `http://seu-servidor:5050`
- Credenciais: definidas no `.env` (PGADMIN_EMAIL e PGADMIN_PASSWORD)

---

## 📁 Estrutura de Arquivos de Produção

```
TeacherApp/
├── .env                      # Variáveis de ambiente (NÃO commitar!)
├── .env.prod.example         # Exemplo de configuração
├── docker-compose.prod.yml   # Compose para produção
├── nginx.conf                # Configuração do Nginx
├── backend/
│   └── Dockerfile.prod       # Dockerfile do backend
├── frontend/
│   └── Dockerfile.prod       # Dockerfile do frontend
├── scripts/
│   ├── setup-server.sh       # Script de setup do servidor
│   └── deploy-manual.sh      # Script de deploy manual
└── .github/
    └── workflows/
        └── deploy.yml        # GitHub Actions workflow
```
