module.exports = {
  apps: [
    {
      name: "frontend-3000",
      cwd: "./frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      interpreter: "node",
      env: { NODE_ENV: "production" },
    },
    {
      name: "backend-3001",
      cwd: "./backend",
      script: "dist/main.js",
      interpreter: "node",
      env: { NODE_ENV: "production", PORT: 3001 },
    },
  ],
};
