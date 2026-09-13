# Noted - Post-It Notes Webapp

A modern, lightweight todo notes application built with SvelteKit. Keep track of your tasks with a simple, clean and intuitive interface.

## Features

- Create and manage post-it notes
- The notes will have a random color on creation
- Clean and intuitive user interface made with shadcn-svelte
- Persistent data storage
- Fast and responsive
- Easy Docker deployment

---

## Why Noted?

**Ease of Use**  
Deploy in under a minute with Docker Compose. No complex configuration, no database setup, no external dependencies. Just create the compose file and run a single command.

**Performance**  
Built with SvelteKit, Noted is lightweight and blazingly fast. The entire application uses minimal system resources, making it perfect for running on personal servers, Raspberry Pis, or alongside other services.

**Privacy First**  
Your notes never leave your machine. All data is stored locally in a Docker volume with no external API calls or telemetry. You have complete control over your information.

**Share with Others**  
Host Noted on your network or server and share access with family, friends, or team members. Everyone can manage their own notes through the same instance.

**Self-Contained**  
Everything runs in a single Docker container. No need to install Node.js, manage dependencies, or worry about system compatibility. Works the same on Linux, macOS, and Windows.

**Data Portability**  
Your notes are stored in a standard Docker volume that can be easily backed up, migrated, or restored. Take your data with you wherever you go.

---

## Quick Start with Docker

Deploy Noted using Docker Compose.

### Prerequisites

- Docker installed on your system
- Docker Compose (usually included with Docker Desktop)

### Deployment

Create a `compose.yaml` file:

```yaml
version: '3.8'

services:
  noted-webapp:
    image: ioannispanagi/noted:main

    container_name: todo-notes

    ports:
      - "3000:3000"

    environment:
      - NODE_ENV=production
      - PORT=3000

    volumes:
      - noted-data:/app/data

    restart: unless-stopped

volumes:
  noted-data:
```

Run the application:

```bash
docker-compose up -d
```

Access at `http://localhost:3000`

### Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `NODE_ENV` | `production` | Application environment |
| `PORT` | `3000` | Port the application runs on |

### Data Persistence

Your notes are stored in a Docker volume named `noted-data`. This ensures your data persists even when the container is stopped or removed.

**To backup your data:**
```bash
docker run --rm -v noted-data:/data -v $(pwd):/backup alpine tar czf /backup/noted-backup.tar.gz -C /data .
```

**To restore from backup:**
```bash
docker run --rm -v noted-data:/data -v $(pwd):/backup alpine tar xzf /backup/noted-backup.tar.gz -C /data
```

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
docker-compose logs noted-webapp
```

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
