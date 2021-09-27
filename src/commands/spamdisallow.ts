import { CommandInteraction } from "discord.js";
import {
    fiiClient,
    Command
} from "@federation-interservices-d-informatique/fiibot-common";
export default class PingCommand extends Command {
    constructor(client: fiiClient) {
        super(client, {
            name: "spamdisallow",
            description: "Interdir le spam dans un canal",
            options: [
                {
                    type: "CHANNEL",
                    name: "channel",
                    description: "Le salon ou interdir le spam",
                    required: true
                }
            ]
        });
    }
    async run(inter: CommandInteraction): Promise<void> {
        const channel = inter.options.get("channel").channel;
        const allowChansStoreKey = `${inter.guild.id}-allowedchannels`;
        let allowedChannels =
            (await this.client.dbclient.get<Array<string>>(
                allowChansStoreKey
            )) || [];

        if (!allowedChannels.includes(channel.id))
            return inter.reply({
                ephemeral: true,
                content: `Le canal ${channel.toString()} n'était pas ignoré par l'antispam`
            });

        allowedChannels = allowedChannels.filter((c) => c != channel.id);
        await this.client.dbclient.set(allowChansStoreKey, allowedChannels);
        inter.reply({
            content: `Le canal ${channel.toString()} n'est plus ignoré par l'antispam!`
        });
    }
}
