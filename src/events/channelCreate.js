import { Events, ChannelType, EmbedBuilder } from 'discord.js';

// Configuration
const CATEGORY_ID = '1460731373085134989';

export default {
    name: Events.ChannelCreate,
    execute(channel) {
        // Only process text channels and voice channels (skip categories)
        if (channel.type === ChannelType.GuildCategory) return; // Skip category channels
        
        // Check if the channel has a parent (category)
        if (channel.parentId && CATEGORY_ID) {
            // Check if the channel is under the specified category
            if (channel.parentId === CATEGORY_ID) {
                // Only send messages to text-based channels (text, forum, etc.)
                // Voice channels and stage channels cannot receive messages
                if (!channel.isTextBased()) {
                    console.log(`Skipping ${channel.name} - channel type does not support messages`);
                    return;
                }
                
                // Create embed
                const embed = new EmbedBuilder()
                    .setDescription([
                        '## Thanks for opening a Service Request!',
                        'At this time, please write which service and any details about it. Our staff will be with you momentarily.',
                    ].join('\n'))
                    .setColor(0x8000ff);
                
                // Wait 1-2 seconds before sending the message
                const delay = Math.floor(Math.random() * 1000) + 1000; // Random between 1000-2000ms
                (async () => {
                    try {
                        await new Promise(resolve => setTimeout(resolve, delay));
                        await channel.send({ embeds: [embed] });
                        console.log(`Sent welcome message to new channel: ${channel.name}`);
                    } catch (error) {
                        console.error('Error sending message:', error);
                    }
                })();
            }
        }
    }
};
