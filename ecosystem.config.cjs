module.exports = {
  apps: [
    {
      name: "smartdoc-meilisearch-7700",
      cwd: ".",
      script: "./meilisearch.exe",
      args: "--db-path ./data.ms --master-key it_support_master_key",
      watch: false
    },
    {
      name: "smartdoc-backend-3001",
      cwd: "./backend",
      script: "dist/main.js",
      interpreter: "C:/Program Files/nodejs/node.exe",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    },
    {
      name: "smartdoc-frontend-3000",
      cwd: "./frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      interpreter: "C:/Program Files/nodejs/node.exe",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
