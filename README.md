# Noted - Post-It Notes Webapp

A lightweight post-it notes application for taking notes and sharing them with others, without making accounts. Pick a passphrase, and everyone who knows it shares the same workspace in real time.

## Features

- Create and manage post-it notes, markdown support included
- Notes get a random color on creation
- Marking notes as completed
- Organise your notes into categories
- Workspaces identified by a passphrase, no accounts needed
- Real-time sync between everyone in the same workspace
- Clean and intuitive user interface made with shadcn-svelte
- Light and dark theme
- Persistent storage for your settings!
- Easy Docker deployment

---

## Why Noted?

**No Accounts**  
Enter a passphrase and you are in. Share the passphrase with family, friends or team members and they see the same notes. Lock the workspace with a password if you want to keep it private.

**Real-Time**  
Changes are pushed as they happen, so everyone in a workspace sees new and updated notes instantly.

**Ease of Use**  
Deploy in under a minute with Docker Compose. No database setup, no external dependencies. Just create the compose file and run a single command.

**Lightweight**  
Noted uses minimal system resources, making it a good fit for personal servers, Raspberry Pis, or running alongside other services.

**Privacy First**  
Your notes never leave your machine. All data is stored locally in a Docker volume with no external API calls or telemetry. You have complete control over your information.

**Self-Contained**  
Everything runs in two small Docker containers, one for the server and one for the web page. No need to install Node.js, manage dependencies, or worry about system compatibility. Works the same on Linux, macOS, and Windows.

**Data Portability**  
Your notes are stored in a standard Docker volume that can be easily backed up, migrated, or restored. Take your data with you wherever you go.

**Great for organizations**  
Hosting your own copy that you can use to share workload between the teams!

---

## Quick Start with Docker

Deploy Noted using Docker Compose.

### Prerequisites

- Docker installed on your system
- Docker Compose (usually included with Docker Desktop)

### Deployment

Create a `compose.yaml` file:

```yaml
services:
  server:
    image: ioannispanagi/noted-server:latest

    environment:
      - JWT_SECRET=change-me
      - PWF_SECRET=change-me-too

    volumes:
      - noted-data:/app/data

    restart: unless-stopped

  web:
    image: ioannispanagi/noted-web:latest

    ports:
      - "8080:80"

    depends_on:
      - server

    restart: unless-stopped

volumes:
  noted-data:
```

`server` holds your notes, `web` is the page you open in the browser and the only one that needs a port.

Replace both secrets with your own random values, for example generated with:

```bash
openssl rand -base64 32
```

Run the application:

```bash
docker compose up -d
```

Access at `http://localhost:8080`

### Configuration

Set on the `server` service:

| Environment Variable | Default         | Description                                                                                   |
|----------------------|-----------------|-----------------------------------------------------------------------------------------------|
| `JWT_SECRET`         |                 | **Required.** Secret used to sign logins, must be 256 bits long                               |
| `PWF_SECRET`         |                 | **Required.** Secret used to protect workspace passwords, keep it different from `JWT_SECRET` |
| `JWT_EXPIRY`         | `43200000`      | How long a login lasts, in milliseconds (12 hours by default)                                 |
| `PORT`               | `3000`          | Port the server listens on inside its container                                               |
| `LOG_LEVEL`          | `info`          | How much the server logs: `silent`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`        |
| `DB_FILE_NAME`       | `data/noted.db` | Where the database file lives, keep it under `data/` so it stays in the volume                |

Set on the `web` service:

| Environment Variable | Default              | Description                                                                    |
|----------------------|----------------------|--------------------------------------------------------------------------------|
| `API_UPSTREAM`       | `http://server:3000` | Where the server can be reached, change it if you rename the service or `PORT` |

Changing `JWT_SECRET` or `PWF_SECRET` logs everybody out, so set them once and keep them.

### Data Persistence

Your notes are stored in a Docker volume named `noted-data`. This ensures your data persists even when the container is stopped or removed.

**To back up your data:**
```bash
docker run --rm -v noted-data:/data -v $(pwd):/backup alpine tar czf /backup/noted-backup.tar.gz -C /data .
```

**To restore from backup:**
```bash
docker run --rm -v noted-data:/data -v $(pwd):/backup alpine tar xzf /backup/noted-backup.tar.gz -C /data
```

Stop the container before backing up or restoring to make sure the copy is consistent.

---

## Changing the Port

If you are already using port 8080, you can freely change it on the `web` service in the `compose.yaml` file:

```yaml
ports:
  - "9090:80"  # Change 9090 to your desired port
```

Then access the app at `http://localhost:9090`

---

## Troubleshooting

### Port already in use
If you see an error about port 8080 being in use:
1. Change the port mapping in `compose.yaml` (see "Changing the Port" above)
2. Or stop the service using port 8080

### Container won't start
Check the logs for errors:
```bash
docker compose logs server
```

A missing `JWT_SECRET` or `PWF_SECRET` stops the container from starting.

### Can't get past the workspace gate
Logins are kept in a cookie that browsers only accept over HTTPS or on `localhost`. If you open Noted through another address, such as a local network IP, put it behind HTTPS.

### Everybody got logged out
This happens when `JWT_SECRET` or `PWF_SECRET` changes. Keep them the same between restarts.

### Data not persisting
Ensure the volume is properly created:
```bash
docker volume ls | grep noted-data
```

---

## Using an Existing Database

If you already have a Noted database file, you can hand it to the server by mounting the folder it sits in instead of the `noted-data` volume.

Put the file in a folder next to your `compose.yaml`, for example `./data/noted.db`, together with its `-wal` and `-shm` files if it has them. Then change the `server` service:

```yaml
volumes:
  - ./data:/app/data
```

If the file is not called `noted.db`, point the server at it:

```yaml
environment:
  - DB_FILE_NAME=data/my-notes.db
```

The server runs as a regular user (id `1000`) inside its container, so that user needs to be able to write to the folder:

```bash
sudo chown -R 1000:1000 ./data
```

**On Podman**, add `:Z,U` to the volume instead, otherwise the server fails with `unable to open database file`:

```yaml
volumes:
  - ./data:/app/data:Z,U
```

`Z` lets the container through SELinux and `U` hands the folder over to the user inside the container. The files will then look like they belong to somebody else on your machine, which is expected.

Stop the app before swapping database files, and keep a copy of the original.

---

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

This means you are free to use, modify, and distribute this software, but any derivative works must also be open source under the same license.

---

## Support

For issues, questions, or contributions you are at the right place!
