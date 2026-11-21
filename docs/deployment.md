# Deployment

GitHub Actions runs lint (including formatting) and tests in parallel, then builds
the app after both pass. Pushes to `main` then build an AMD64/ARM64 Docker image,
publish it to `ghcr.io/<owner>/<repository>` with `main` and `sha-<commit>` tags,
and deploy the image by digest over SSH using the `production` environment.
Pull requests and other branches run validation and the app build only.

Configure these Actions settings in the repository or `production` environment:

| Name          | Kind               | Purpose                                 |
| ------------- | ------------------ | --------------------------------------- |
| `HOST`        | Secret or variable | Server hostname or IPv4 address         |
| `USER`        | Secret or variable | SSH user with Docker access             |
| `PORT`        | Variable or secret | SSH port; defaults to `22`              |
| `DEPLOY_PATH` | Variable or secret | Absolute app deployment directory       |
| `SSH_KEY`     | Secret             | SSH private key for the deployment user |

The workflow uses `GITHUB_TOKEN` to publish to GHCR. On the server, install Docker
with Compose v2 and log in to `ghcr.io` as the deployment user with a token that
can read the package if it is private. Create a dedicated directory such as
`/opt/petfinder-app` (separate from the API deployment) and its `.env` file:

```dotenv
API_BASE_URL=https://api.example.com
APP_BIND_ADDRESS=127.0.0.1
APP_PORT=3000
```

`API_BASE_URL` must be reachable from inside the app container. `localhost` refers
to the app container itself; use the backend's reachable URL. The URL is supplied
at runtime and is never baked into the image. Keep the `.env` file on the server;
it is excluded from Docker builds and deployment uploads.

Point your HTTPS reverse proxy at `127.0.0.1:3000`. Production authentication uses
Secure cookies and requires HTTPS in the browser. Each deployment uploads Compose
and the runner to `DEPLOY_PATH/releases/<commit>`, pulls the published image, and
waits for the app health check before writing `DEPLOY_PATH/current-image`.
The app uses its own stable Compose project, `petfinder-app-production`.
