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
                    },
                    {
                        type: "SUB_COMMAND_GROUP",
                        name: "user",
                        description:
                            "Autoriser/interdir à un utilisateur de passer à travers le raidmode",
                        options: [
                            {
                                type: "SUB_COMMAND",
                                name: "allow",
                                description:
                                    "Autoriser un utilisateur à passer à travers le raidmode",
                                options: [
                                    {
                                        type: "STRING",
                                        name: "user",
                                        description: "L'utilisateur",
                                        required: true
                                    }
                                ]
                            },
                            {
                                type: "SUB_COMMAND",
                                name: "deny",
                                description:
                                    "Interdir à un utilisateur de passer à travers le raidmode",
                                options: [
                                    {
                                        type: "STRING",
                                        name: "user",
                                        description: "L'utilisateur à interdir",
                                        required: true
                                    }
                                ]
                            }
                        ]
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
        } else if (inter.options.getSubcommandGroup() === "user") {
            if (inter.options.getSubcommand() === "allow") {
                const user = inter.options.get("user").value.toString();
                if (isNaN(user as unknown as number)) {
                    inter.reply("Utilisateur invalide!");
                    return;
                }
                const allowed: string[] =
                    (this.data.get("allowedUsers") as string[]) || [];
                allowed.push(user);

                inter.reply(
                    `Utilisateur autorisé!\nListe des utilisateurs autorisés: ${allowed.join(
                        ", "
                    )}`
                );
                this.data.set("allowedUsers", allowed);
            } else if (inter.options.getSubcommand() === "deny") {
                const user = inter.options.get("user").value.toString();
                if (isNaN(user as unknown as number)) {
                    inter.reply("Utilisateur invalide!");
                    return;
                }
                let allowed: string[] =
                    (this.data.get("allowedUsers") as string[]) || [];
                allowed = allowed.filter((f) => f !== user);

                inter.reply(
                    `Utilisateur interdit\nListe des utilisateurs autorisés: ${allowed.join(
                        ", "
                    )}`
                );
                this.data.set("allowedUsers", allowed);
            }
        }
    }
}
