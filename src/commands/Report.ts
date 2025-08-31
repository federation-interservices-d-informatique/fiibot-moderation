import {
    ApplicationCommandType,
    MessageContextMenuCommandInteraction,
    WebhookClient,
    Colors,
    MessageFlags
} from "discord.js";
import {
    BotInteraction,
    FiiClient
} from "@federation-interservices-d-informatique/fiibot-common";
export default class PingCommand extends BotInteraction {
    constructor(client: FiiClient) {
        super(client, {
            name: "Report",
            type: ApplicationCommandType.Message,
            dmPermission: false
        });
    }
    async runMessageContextMenuCommand(
        inter: MessageContextMenuCommandInteraction
    ): Promise<void> {
        if (!inter.guild) return;
        const message = await inter.channel?.messages.fetch(inter.targetId);
        if (!message) return;
        if (!process.env.REPORT_HOOK_TOKEN || !process.env.REPORT_HOOK_ID) {
            await inter.reply({
                flags: MessageFlags.Ephemeral,
                content:
                    "Il semblerait que le système de signalement soit incorrectement configuré. Nous vous prions de réessayer plus tard."
            });
            return;
        }

        const webhookClient = new WebhookClient({
            id: process.env.REPORT_HOOK_ID,
            token: process.env.REPORT_HOOK_TOKEN
        });

        try {
            await webhookClient.send({
                embeds: [
                    {
                        title: `Signalement de ${inter.user.username} sur ${inter.guild.name} (${inter.guildId ?? ""})`,
                        description: `[Lien du message](${message.url})`,
                        fields: [
                            {
                                name: "Membre signalé(e)",
                                value: `${message.author.toString()} (${message.author.id})`
                            },
                            {
                                name: "Message signalé",
                                value: `\`${message.content}\``
                            }
                        ],
                        color: Colors.Red,
                        footer: {
                            text: `Signalement de ${message.author.tag}`,
                            icon_url: message.author.displayAvatarURL()
                        },
                        author: {
                            name: inter.user.tag,
                            icon_url: inter.user.displayAvatarURL()
                        }
                    }
                ]
            });
        } catch (e) {
            await inter.reply({
                flags: MessageFlags.Ephemeral,
                content:
                    "Impossible d'envoyer le signalement. Veuillez contacter <@743851266635071710> pour plus de détails."
            });
            if (e instanceof Error)
                this.client.logger.error(
                    `Unable to send report of ${message.author.id} for message ${message.id} in ${message.guild?.name ?? ""}: ${e}`,
                    "REPORTS"
                );
            return;
        }
        await inter.reply({
            flags: MessageFlags.Ephemeral,
            content: `Votre signalement de ${message.author.tag} (${message.url}) a bien été pris en compte!`
        });
    }
}
