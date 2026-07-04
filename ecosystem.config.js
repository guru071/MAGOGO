module.exports = {
  apps: [
    {
      name: 'magogo-frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'magogo-ai-backend',
      script: './venv/bin/uvicorn',
      args: 'main:app --host 0.0.0.0 --port 8000',
      cwd: './src/ai',
      env: {
        PYTHONPATH: '.'
      },
      watch: false,
      max_memory_restart: '8G'
    }
  ]
};
