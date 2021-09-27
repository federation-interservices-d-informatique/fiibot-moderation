import {
    CommandInteraction,
    ContextMenuInteraction,
    WebhookClient
} from "discord.js";
import {
    fiiClient,
    Command
} from "@federation-interservices-d-informatique/fiibot-common";
import { Constants } from "discord.js";
export default class PingCommand extends Command {
    constructor(client: fiiClient) {
        super(
            client,
            {
                type: Constants.ApplicationCommandTypes.MESSAGE,
                name: "Report"
            },
            { guildOnly: true }
        );
    }
    async run(inter: CommandInteraction): Promise<void> {
        if (!inter.guild) return;
        const menu = inter as ContextMenuInteraction;
        const message = await inter.channel.messages.fetch(menu.targetId);
        if (!process.env.REPORT_HOOK_TOKEN || !process.env.REPORT_HOOK_ID)
            return await inter.reply({
                ephemeral: true,
                content:
                    "Il semblerait que le système de signalement soit incorrectement configuré. Nous vous prions de réessayer plus tard."
            });

        const webhookClient = new WebhookClient({
            id: process.env.REPORT_HOOK_ID,
            token: process.env.REPORT_HOOK_TOKEN
        });

        try {
            await webhookClient.send({
                embeds: [
                    {
                        title: `Signalement de ${inter.user.username} sur ${inter.guild.name} (${inter.guildId})`,
                        description: `[Lien du message](${message.url})`,
                        fields: [
                            {
                                name: "Membre signalé(e)",
                                value: `${message.author} (${message.author.id})`
                            },
                            {
                                name: "Message signalé",
                                value: `\`${message.content}\``
                            }
                        ],
                        color: "RANDOM",
                        footer: {
                            text: `Signalement de ${message.author.tag}`,
                            iconURL: message.author.displayAvatarURL()
                        },
                        author: {
                            iconURL: inter.user.displayAvatarURL(),
                            name: inter.user.tag
                        }
                    }
                ]
            });
        } catch (e) {
            inter.reply({
                ephemeral: true,
                content:
                    "Impossible d'envoyer le signalement. Veuillez contacter <@743851266635071710> pour plus de détails."
            });
            this.client.logger.error(
                `Unable to send report of ${message.author.id} for message ${message.id} in ${message.guild.name}: ${e}`,
                "REPORTS"
            );
            return;
        }
        await inter.reply({
            ephemeral: true,
            content: `Votre signalement de ${message.author.tag} (${message.url}) a bien été pris en compte!`
        });
    }
}
