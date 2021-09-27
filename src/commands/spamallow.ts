import { CommandInteraction } from "discord.js";
import {
    fiiClient,
    Command
} from "@federation-interservices-d-informatique/fiibot-common";
export default class PingCommand extends Command {
    constructor(client: fiiClient) {
        super(
            client,
            {
                name: "spamallow",
                description: "Autoriser le spam dans un salon",
                options: [
                    {
                        type: "CHANNEL",
                        name: "channel",
                        description: "Le salon à ignorer",
                        required: true
                    }
                ]
            },
            { userPermissions: ["ADMINISTRATOR"] }
        );
    }
    async run(inter: CommandInteraction): Promise<void> {
        const channel = inter.options.get("channel").channel;
        const allowChansStoreKey = `${inter.guild.id}-allowedchannels`;
        if (
            channel.type !== "GUILD_TEXT" &&
            channel.type !== "GUILD_PUBLIC_THREAD" &&
            channel.type !== "GUILD_PRIVATE_THREAD"
        ) {
            return inter.reply({
                content: `Le canal est de type \`${channel.type}\`, qui ne peut pas être ignoré.`,
                ephemeral: true
            });
        }
        const allowedChannels =
            (await this.client.dbclient.get<Array<string>>(
                allowChansStoreKey
            )) || [];

        if (allowedChannels.includes(channel.id))
            return inter.reply({
                ephemeral: true,
                content: "Le canal est déjà ignoré ! "
            });

        allowedChannels.push(channel.id);
        await this.client.dbclient.set(allowChansStoreKey, allowedChannels);
        inter.reply({
            content: `Le canal ${channel.toString()} est maintenant ignoré par l'antispam!`
        });
    }
}
