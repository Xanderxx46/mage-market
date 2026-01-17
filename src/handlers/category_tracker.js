import { Events } from 'discord.js';

// Configuration
const GUILD_ID = '1460533192380518542';
const OPEN_TICKETS_CATEGORY_ID = '1460533192380518550';
const OPEN_TICKETS_VC_ID = '1461544010375233818';
const OPEN_SERVICES_CATEGORY_ID = '1460731373085134989';
const OPEN_SERVICES_VC_ID = '1461544080193355909';

/**
 * Count channels under a category
 * @param {Guild} guild - The guild to check
 * @param {string} categoryId - The category ID to count channels under
 * @returns {Promise<number>} - Number of channels under the category
 */
async function countChannelsInCategory(guild, categoryId) {
    if (!guild) return 0;
    
    try {
        // Fetch channels to ensure cache is up to date
        await guild.channels.fetch();
        
        const category = guild.channels.cache.get(categoryId);
        if (!category) return 0;
        
        // Count all channels (excluding categories themselves) that have this category as parent
        const channels = guild.channels.cache.filter(channel => 
            String(channel.parentId) === String(categoryId) && 
            String(channel.id) !== String(categoryId) &&
            channel.type !== 4 // Exclude category channels themselves
        );
        
        return channels.size;
    } catch (error) {
        console.error(`[CATEGORY TRACKER] Error counting channels in category ${categoryId}:`, error);
        return 0;
    }
}

/**
 * Update voice channel name with count
 * @param {Guild} guild - The guild
 * @param {string} vcId - The voice channel ID to update
 * @param {string} label - The label (e.g., "Open Tickets" or "Open Service Requests")
 * @param {number} count - The count
 */
async function updateVoiceChannelName(guild, vcId, label, count) {
    if (!guild) return;
    
    try {
        const voiceChannel = await guild.channels.fetch(vcId).catch(() => null);
        if (!voiceChannel) {
            console.warn(`[CATEGORY TRACKER] Voice channel ${vcId} not found`);
            return;
        }
        
        const newName = `${label}: ${count}`;
        
        // Only update if the name is different
        if (voiceChannel.name !== newName) {
            await voiceChannel.edit({ name: newName, reason: `Category tracker: ${count} channels found` });
            console.log(`[CATEGORY TRACKER] Updated ${label} VC to: ${newName}`);
        }
    } catch (error) {
        console.error(`[CATEGORY TRACKER] Error updating ${label} VC:`, error.message);
    }
}

/**
 * Update both voice channels
 * @param {Guild} guild - The guild
 */
async function updateAllCounts(guild) {
    if (!guild || guild.id !== GUILD_ID) return;
    
    const ticketsCount = await countChannelsInCategory(guild, OPEN_TICKETS_CATEGORY_ID);
    const servicesCount = await countChannelsInCategory(guild, OPEN_SERVICES_CATEGORY_ID);
    
    await updateVoiceChannelName(guild, OPEN_TICKETS_VC_ID, 'Open Tickets', ticketsCount);
    await updateVoiceChannelName(guild, OPEN_SERVICES_VC_ID, 'Open Service Requests', servicesCount);
}

/**
 * Initialize category tracker
 * @param {Client} client - The Discord client instance
 */
export function initializeCategoryTracker(client) {
    // Update counts when bot is ready
    client.once(Events.ClientReady, async () => {
        // Wait a bit for all channels to be cached, then update
        setTimeout(async () => {
            const guild = client.guilds.cache.get(GUILD_ID);
            if (guild) {
                await updateAllCounts(guild);
            }
        }, 3000);
    });

    // Update when a channel is created
    client.on(Events.ChannelCreate, async (channel) => {
        if (!channel.guild || channel.guild.id !== GUILD_ID) return;
        
        const parentId = String(channel.parentId || '');
        if (parentId === OPEN_TICKETS_CATEGORY_ID || parentId === OPEN_SERVICES_CATEGORY_ID) {
            await updateAllCounts(channel.guild);
        }
    });

    // Update when a channel is deleted
    client.on(Events.ChannelDelete, async (channel) => {
        if (!channel.guild || channel.guild.id !== GUILD_ID) return;
        
        const parentId = String(channel.parentId || '');
        if (parentId === OPEN_TICKETS_CATEGORY_ID || parentId === OPEN_SERVICES_CATEGORY_ID) {
            await updateAllCounts(channel.guild);
        }
    });

    // Update when a channel is updated (e.g., moved between categories)
    client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
        if (!newChannel.guild || newChannel.guild.id !== GUILD_ID) return;
        
        const oldParent = String(oldChannel.parentId || '');
        const newParent = String(newChannel.parentId || '');
        
        // Only update if the parent category changed and it affects our tracked categories
        if (oldParent !== newParent) {
            if (oldParent === OPEN_TICKETS_CATEGORY_ID || 
                oldParent === OPEN_SERVICES_CATEGORY_ID ||
                newParent === OPEN_TICKETS_CATEGORY_ID || 
                newParent === OPEN_SERVICES_CATEGORY_ID) {
                await updateAllCounts(newChannel.guild);
            }
        }
    });

    console.log('[CATEGORY TRACKER] Category tracking system initialized');
}
