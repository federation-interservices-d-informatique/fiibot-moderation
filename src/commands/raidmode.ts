import { CommandInteraction, WebhookClient } from "discord.js";
import {
    fiiClient,
    Command
} from "@federation-interservices-d-informatique/fiibot-common";
export default class PingCommand extends Command {
    constructor(client: fiiClient) {
        super(
            client,
            {
                name: "raidmode",
                description: "Activer le mode raid",
                options: [
                    {
                        type: "SUB_COMMAND",
                        name: "enable",
                        description: "Activer le raidmode"
                    },
                    {
                        type: "SUB_COMMAND",
                        name: "disable",
                        description: "Désactiver le raimode"
                    }
                ]
            },
            {
                ownerOnly: true
            }
        );
    }
    async run(inter: CommandInteraction): Promise<void> {
        if (inter.options.getSubcommand() === "enable") {
            inter.reply("Le raidmode a été activé!");
            this.data.set("raidmode", true);
            try {
                const raidModeHook = new WebhookClient({
                    id: process.env.RAIDMODE_HOOK_ID,
                    token: process.env.RAIDMODE_HOOK_TOKEN
                });

                await raidModeHook.send({
                    content: `Le raimode a été activé par ${inter.user.tag} (${inter.user.id}) sur ${inter.guildId}`
                });
            } catch (e) {
                this.client.logger.error(
                    `Can't sent raidmode logs: ${e}`,
                    "RAIMODE"
                );
            }
        } else if (inter.options.getSubcommand() === "disable") {
            inter.reply("Le raidmode a été désactivé");
            this.data.set("raidmode", false);
            try {
                const raidModeHook = new WebhookClient({
                    id: process.env.RAIDMODE_HOOK_ID,
                    token: process.env.RAIDMODE_HOOK_TOKEN
                });

                await raidModeHook.send({
                    content: `Le raimode a été désactivé par ${inter.user.tag} (${inter.user.id}) sur ${inter.guildId}`
                });
            } catch (e) {
                this.client.logger.error(
                    `Can't sent raidmode logs: ${e}`,
                    "RAIMODE"
                );
            }
        }
    }
}
