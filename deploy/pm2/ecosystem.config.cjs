module.exports = {
  apps: [
    {
      name: "tatvivah-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "run start -- -p 3000",
      exec_mode: "cluster",
      instances: "max",
      max_memory_restart: "700M",
      exp_backoff_restart_delay: 100,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "tatvivah-backend",
      cwd: "./backend",
      script: "npm",
      args: "run start:api",
      exec_mode: "cluster",
      instances: "max",
      max_memory_restart: "700M",
      exp_backoff_restart_delay: 100,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production",
        PORT: "4000"
      }
    },
    {
      name: "tatvivah-worker",
      cwd: "./backend",
      script: "npm",
      args: "run start:worker",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "500M",
      exp_backoff_restart_delay: 100,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
