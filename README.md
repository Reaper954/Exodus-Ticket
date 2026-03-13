# Exodus Advanced Ticket Bot

This version adds:
- `/setup` interactive setup wizard
- `/help` help menu
- `/claim`, `/close`, `/reopen`, `/rename`, `/add`, `/remove`, `/close-request`
- ticket creation modal
- deployable ticket panel
- support role access
- logs channel support

## Railway variables

```env
BOT_TOKEN=...
CLIENT_ID=...
GUILD_ID=...
MYSQL_DB_HOST=${{MySQL.MYSQLHOST}}
MYSQL_DB_PORT=${{MySQL.MYSQLPORT}}
MYSQL_DB_USERNAME=${{MySQL.MYSQLUSER}}
MYSQL_DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQL_DB_DATABASE=${{MySQL.MYSQLDATABASE}}
```

## Deploy steps
1. Push to GitHub
2. Set Railway variables
3. Deploy
4. Run `/setup`
5. Choose panel channel, ticket category, logs channel, and support role
6. Press **Edit Panel** if you want custom text
7. Press **Deploy Panel**

## Notes
- Premium commands were not included
- This version is built to mimic the ticket flow you showed, with an interactive setup menu and modal-based ticket creation
