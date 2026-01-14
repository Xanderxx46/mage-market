import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// Configuration - Update with your client role IDs
const PAID_CLIENT_ROLE_ID = '1460533192380518547';
const FREE_CLIENT_ROLE_ID = '1460533192380518546';

export default {
    data: new SlashCommandBuilder()
        .setName('service')
        .setDescription('Service management commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('Claim a service ticket')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('transfer')
                .setDescription('Transfer a service ticket')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('completed')
                .setDescription('Mark a service as completed')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Type of service')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Paid', value: 'paid' },
                            { name: 'Free', value: 'free' }
                        )
                )
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to give the role to')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'claim') {
            const user = interaction.user;
            await interaction.reply(`<:NeonStarGreen:1460538511772876912> Thanks for choosing **mage market**! I am ${user} and I'll be assisting you today.`);
        } else if (subcommand === 'transfer') {
            await interaction.reply(`<:NeonStarRed:1460538443565105175> This ticket is currently being transferred to a different person/department. Please remain patient.`);
        } else if (subcommand === 'completed') {
            const type = interaction.options.getString('type');
            const targetUser = interaction.options.getUser('user');
            const member = interaction.guild.members.cache.get(targetUser.id);

            if (!member) {
                return await interaction.reply({ content: 'User not found in this server.', ephemeral: true });
            }

            try {
                // Determine which role to assign based on type
                const roleId = type === 'paid' ? PAID_CLIENT_ROLE_ID : FREE_CLIENT_ROLE_ID;
                const role = interaction.guild.roles.cache.get(roleId);
                
                if (!role) {
                    const roleName = type === 'paid' ? 'PAID_CLIENT_ROLE_ID' : 'FREE_CLIENT_ROLE_ID';
                    return await interaction.reply({ content: `Role with ID ${roleId} not found. Please update ${roleName} in the command file.`, ephemeral: true });
                }

                await member.roles.add(role);

                // Create and send embed
                const embed = new EmbedBuilder()
                    .setDescription(`<:VDay_TY:1460543230017011865> Thank you for choosing **mage market**! You have now been given your client role. Please make sure to check your dms.`)
                    .setColor(0x8000ff);

                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error in completed subcommand:', error);
                await interaction.reply({ content: 'There was an error completing the service. Please check the bot permissions.', ephemeral: true });
            }
        }
    }
};
