@"
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"
  # Add other build-time environment variables here
  # But NOT your API keys - those should only be in Netlify's UI

[dev]
  framework = "vite"
  targetPort = 3000

# Redirects for SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
"@ | Out-File -FilePath "netlify.toml" -Encoding utf8
