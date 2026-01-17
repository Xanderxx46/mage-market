import { Client, GatewayIntentBits, Collection, Events, REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

// Create a collection for commands
client.commands = new Collection();

// Load commands and events
async function loadModules() {
    // Load commands
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await import(`./commands/${file}`);
        
        if ('data' in command.default && 'execute' in command.default) {
            client.commands.set(command.default.data.name, command.default);
            console.log(`Loaded command: ${command.default.data.name}`);
        } else {
            console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    // Load events
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = await import(`./events/${file}`);
        
        if (event.default.once) {
            client.once(event.default.name, (...args) => event.default.execute(...args));
        } else {
            client.on(event.default.name, (...args) => event.default.execute(...args));
        }
        console.log(`Loaded event: ${event.default.name}`);
    }

    // Load handlers
    const handlersPath = path.join(__dirname, 'handlers');
    if (fs.existsSync(handlersPath)) {
        const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

        for (const file of handlerFiles) {
            const filePath = path.join(handlersPath, file);
            try {
                const handler = await import(`./handlers/${file}`);
                
                // Check for common handler initialization functions
                if (typeof handler.initializeModLogs === 'function') {
                    handler.initializeModLogs(client);
                    console.log(`Loaded handler: ${file}`);
                } else if (typeof handler.initializeCategoryTracker === 'function') {
                    handler.initializeCategoryTracker(client);
                    console.log(`Loaded handler: ${file}`);
                } else if (typeof handler.default === 'function') {
                    handler.default(client);
                    console.log(`Loaded handler: ${file}`);
                } else {
                    console.warn(`[WARNING] The handler at ${filePath} does not export a recognized initialization function.`);
                }
            } catch (error) {
                console.error(`Error loading handler ${file}:`, error);
            }
        }
    }
}

// Register commands with Discord
async function registerCommands() {
    const commands = [];
    
    // Prepare command data
    for (const command of client.commands.values()) {
        commands.push(command.data.toJSON());
    }

    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(process.env.BOT_TOKEN);

    try {
        console.log(`Started refreshing ${commands.length} application (/) command(s).`);

        const clientId = client.user.id;
        const guildId = process.env.GUILD_ID;

        // Register commands
        let data;
        if (guildId) {
            // Register guild commands (faster for development - updates instantly)
            data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            );
            console.log(`Successfully reloaded ${data.length} guild command(s).`);
        } else {
            // Register global commands (can take up to 1 hour to update)
            data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );
            console.log(`Successfully reloaded ${data.length} global command(s).`);
        }
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// Handle slash command interactions
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// Initialize bot
(async () => {
    // Load modules first
    await loadModules();
    
    // Register commands when bot is ready
    client.once(Events.ClientReady, async () => {
        await registerCommands();
    });
    
    // Log in to Discord with your client's token
    await client.login(process.env.BOT_TOKEN);
})();
