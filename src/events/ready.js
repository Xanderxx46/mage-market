import { Events, EmbedBuilder } from 'discord.js';
import os from 'os';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';

const STARTUP_LOG_CHANNEL_ID = '1373697588959772683';

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));

// Helper function to format memory
function formatMemory(bytes) {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
}

// Helper function to get CPU usage (approximate)
function getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
        for (const type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);
    
    return usage.toFixed(2) + '%';
}

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Bot is ready! Logged in as ${client.user.tag}`);
        
        // Log startup to channel
        try {
            const logChannel = await client.channels.fetch(STARTUP_LOG_CHANNEL_ID).catch(() => null);
            
            if (logChannel && logChannel.isTextBased()) {
                // Calculate bot stats
                const guilds = client.guilds.cache.size;
                let totalUsers = 0;
                let totalTextChannels = 0;
                let totalVoiceChannels = 0;
                
                client.guilds.cache.forEach(guild => {
                    totalUsers += guild.memberCount || 0;
                    guild.channels.cache.forEach(channel => {
                        if (channel.isTextBased() && !channel.isThread()) {
                            totalTextChannels++;
                        } else if (channel.isVoiceBased()) {
                            totalVoiceChannels++;
                        }
                    });
                });
                
                // Get system stats
                const memoryUsage = process.memoryUsage();
                const osType = os.type().toLowerCase();
                const osRelease = os.release();
                const hostname = os.hostname();
                const nodeVersion = process.version;
                const uptime = Math.floor(process.uptime());
                
                const embed = new EmbedBuilder()
                    .setTitle(`🚀 ${client.user.username} is Online!`)
                    .setDescription(`Bot successfully started at <t:${Math.floor(Date.now() / 1000)}:F>`)
                    .addFields(
                        {
                            name: '🖥️ System Stats',
                            value: [
                                `**OS:** ${osType} (${osRelease})`,
                                `**Node.js:** ${nodeVersion}`,
                                `**Memory:** ${formatMemory(memoryUsage.heapUsed)}`,
                                `**CPU Usage:** ${getCPUUsage()}`,
                                `**Uptime:** ${uptime}s`,
                                `**Host:** ${hostname}`
                            ].join('\n\n'),
                            inline: true
                        },
                        {
                            name: '🤖 Bot Stats',
                            value: [
                                `**Version:** ${packageJson.version || '1.0.0'}`,
                                `**Servers:** ${guilds}`,
                                `**Users:** ${totalUsers.toLocaleString()}`,
                                `**Text Channels:** ${totalTextChannels}`,
                                `**Voice Channels:** ${totalVoiceChannels}`,
                                `**Commands:** ${client.commands.size}`
                            ].join('\n\n'),
                            inline: true
                        }
                    )
                    .setColor(0x8000ff)
                    .setFooter({ 
                        text: `Bot ID: ${client.user.id} • ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                        iconURL: client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                
                await logChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error sending startup log:', error);
        }
    }
};
