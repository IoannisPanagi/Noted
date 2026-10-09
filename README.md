# Noted - Post-It Notes Webapp

> **Not available as of right now**

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
Everything runs in a single Docker container. No need to install Node.js, manage dependencies, or worry about system compatibility. Works the same on Linux, macOS, and Windows.

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
  noted:
    image: ioannispanagi/noted:latest

    container_name: noted

    ports:
      - "3000:3000"

    environment:
      - JWT_SECRET=change-me
      - PWF_SECRET=change-me-too

    volumes:
      - noted-data:/app/data

    restart: unless-stopped

volumes:
  noted-data:
```

Replace both secrets with your own random values, for example generated with:

```bash
openssl rand -base64 32
```

Run the application:

```bash
docker compose up -d
```

Access at `http://localhost:3000`

### Configuration

| Environment Variable | Default    | Description                                                                                      |
|----------------------|------------|--------------------------------------------------------------------------------------------------|
| `JWT_SECRET`         |            | **Required.** Secret used to sign logins, must be 256 bits long                                  |
| `PWF_SECRET`         |            | **Required.** Secret used to protect workspace passwords, keep it different from `JWT_SECRET`    |
| `JWT_EXPIRY`         | `43200000` | How long a login lasts, in milliseconds (12 hours by default)                                    |
| `PORT`               | `3000`     | Port the application runs on inside the container                                                |
| `LOG_LEVEL`          | `info`     | How much the server logs: `silent`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`           |
| `DB_FILE_NAME`       | `noted.db` | Name of the database file inside the data volume                                                 |

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

If you are already using port 3000, you can freely change it in the `compose.yaml` file:

```yaml
ports:
  - "8080:3000"  # Change 8080 to your desired port
```

Then access the app at `http://localhost:8080`

---

## Troubleshooting

### Port already in use
If you see an error about port 3000 being in use:
1. Change the port mapping in `compose.yaml` (see "Changing the Port" above)
2. Or stop the service using port 3000

### Container won't start
Check the logs for errors:
```bash
docker compose logs noted
```

A missing `JWT_SECRET` or `PWF_SECRET` stops the container from starting.

### Everybody got logged out
This happens when `JWT_SECRET` or `PWF_SECRET` changes. Keep them the same between restarts.

### Data not persisting
Ensure the volume is properly created:
```bash
docker volume ls | grep noted-data
```

---

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

This means you are free to use, modify, and distribute this software, but any derivative works must also be open source under the same license.

---

## Support

For issues, questions, or contributions you are at the right place!
