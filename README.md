# Mage Market

A Discord bot for the Mage Magic server built with Discord.js v14.

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- A Discord bot token
- Discord bot with required intents enabled

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Xanderxx46/mage-market
cd mage-market
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
BOT_TOKEN=your_bot_token_here
```

4. Configure role IDs in `src/commands/service.js`:
   - `PAID_CLIENT_ROLE_ID=1460533192380518547`
   - `FREE_CLIENT_ROLE_ID=1460533192380518546`

5. Configure other constants in event files:
   - `src/events/channelCreate.js` - `CATEGORY_ID`

## Running

Start the bot:
```bash
npm start
```

The bot will automatically:
- Load all commands from `src/commands/`
- Load all events from `src/events/`
- Register commands with Discord on startup
- Use guild commands if `GUILD_ID` is set (instant updates)
- Use global commands if `GUILD_ID` is not set (may take up to 1 hour)

## Architecture

### Command System

Commands are automatically discovered from the `src/commands/` directory. Each command must export a default object with:
- `data`: A `SlashCommandBuilder` instance
- `execute`: An async function that handles the interaction

### Event System

Events are automatically loaded from `src/events/`. Each event must export a default object with:
- `name`: The Discord.js event name
- `once`: Boolean indicating if the event should only fire once
- `execute`: Function that handles the event

### Automatic Command Registration

Commands are automatically registered with Discord when the bot starts. The registration system:
- Collects all loaded commands
- Registers them as guild commands if `GUILD_ID` is provided
- Falls back to global commands if `GUILD_ID` is not set
- Logs registration status to the console

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | Yes | Your Discord bot token from the Discord Developer Portal |
| `GUILD_ID` | No | Your Discord server ID for guild command registration (faster updates) |

## Configuration

### Role IDs

Update role IDs directly in the source files:
- Service command roles: `src/commands/service.js`
- Staff role: `src/events/staffMention.js`

### Category and Channel IDs

Update IDs in event files:
- Service category: `src/events/channelCreate.js`
- Support channel: `src/events/staffMention.js`

## Development

The bot uses ES modules (`"type": "module"`), so use `import/export` syntax instead of `require/module.exports`.

### Adding Commands

1. Create a new file in `src/commands/`
2. Export a default object with `data` and `execute` properties
3. Restart the bot - commands are automatically registered

### Adding Events

1. Create a new file in `src/events/`
2. Export a default object with `name`, `once`, and `execute` properties
3. Restart the bot - events are automatically loaded

## Troubleshooting

**Commands not appearing:**
- Ensure `BOT_TOKEN` is correct
- Check bot has `applications.commands` scope
- For guild commands, verify `GUILD_ID` is correct
- Global commands can take up to 1 hour to appear

**Bot not responding:**
- Verify required intents are enabled in Discord Developer Portal
- Check console for error messages
- Ensure bot has necessary permissions in your server

**Role assignment errors:**
- Verify role IDs are correct
- Ensure bot's role is higher than target roles
- Check bot has "Manage Roles" permission
