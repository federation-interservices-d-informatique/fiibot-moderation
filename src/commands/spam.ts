import {
    ApplicationCommandOptionType,
    ChannelType,
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionsBitField
} from "discord.js";
import {
    FiiClient,
    BotInteraction
} from "@federation-interservices-d-informatique/fiibot-common";
export default class extends BotInteraction {
    constructor(client: FiiClient) {
        super(client, {
            name: "spam",
            description: "Configurer l'antispam",
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "allow",
                    description: "Autoriser le Spam dans un salon",
                    options: [
                        {
                            type: ApplicationCommandOptionType.Channel,
                            name: "salon",
                            description: "Le salon à ignorer",
                            required: true,
                            channelTypes: [
                                ChannelType.GuildText,
                                ChannelType.PublicThread
                            ]
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: "disallow",
                    description: "Interdir le spam dans un salon",
                    options: [
                        {
                            type: ApplicationCommandOptionType.Channel,
                            name: "salon",
                            description:
                                "Le salon dans lequel interdir le spam",
                            required: true,
                            channelTypes: [
                                ChannelType.GuildText,
                                ChannelType.PublicThread
                            ]
                        }
                    ]
                }
            ],
            defaultMemberPermissions: PermissionsBitField.All,
            dmPermission: false
        });
    }
    async runChatInputCommand(
        inter: ChatInputCommandInteraction
    ): Promise<void> {
        const channel = inter.options.getChannel("salon");
        if (!channel) return;
        if (inter.options.getSubcommand() === "allow") {
            const allowChansStoreKey = `${inter.guildId ?? ""}-allowedchannels`;
            const allowedChannels =
                (await this.client.dbClient?.get<string[]>(
                    allowChansStoreKey
                )) ?? [];

            if (allowedChannels.includes(channel.id)) {
                await inter.reply({
                    flags: MessageFlags.Ephemeral,
                    content: "Le canal est déjà ignoré ! "
                });
                return;
            }

            allowedChannels.push(channel.id);
            await this.client.dbClient?.set(
                allowChansStoreKey,
                allowedChannels
            );
            await inter.reply({
                content: `Le canal ${channel.name ?? ""} est maintenant ignoré par l'antispam!`
            });
        } else if (inter.options.getSubcommand() === "disallow") {
            const allowChansStoreKey = `${inter.guildId ?? ""}-allowedchannels`;
            let allowedChannels =
                (await this.client.dbClient?.get<string[]>(
                    allowChansStoreKey
                )) ?? [];

            if (!allowedChannels.includes(channel.id)) {
                await inter.reply({
                    flags: MessageFlags.Ephemeral,
                    content: `Le canal ${channel.name ?? ""} n'était pas ignoré par l'antispam`
                });
                return;
            }

            allowedChannels = allowedChannels.filter((c) => c != channel.id);
            await this.client.dbClient?.set(
                allowChansStoreKey,
                allowedChannels
            );
            await inter.reply({
                content: `Le canal ${channel.name ?? ""} n'est plus ignoré par l'antispam!`
            });
        }
    }
}
