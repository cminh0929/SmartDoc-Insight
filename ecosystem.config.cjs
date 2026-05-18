module.exports = {
  apps: [
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
